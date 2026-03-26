"use client";

import Link from "next/link";
import { useCatalog } from "@/hooks/useCatalog";
import { formatBRL, getDisplayImageUrls, applyMarkup, handleImageError } from "@/lib/catalog";
import { Loading } from "@/components/Loading";
import type { Artist, Artwork } from "@/types";

/* ------------------------------------------------------------------ */
/*  Helper: deterministic hash from string -> unique gradient colors   */
/* ------------------------------------------------------------------ */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function artistGradient(name: string): string {
  const h = hashStr(name);
  const hue1 = h % 360;
  const hue2 = (h * 7 + 120) % 360;
  const hue3 = (h * 13 + 240) % 360;
  return `linear-gradient(135deg, hsl(${hue1} 85% 25%) 0%, hsl(${hue2} 75% 30%) 50%, hsl(${hue3} 65% 20%) 100%)`;
}

function artworkGradient(id: string): string {
  const h = hashStr(id);
  const hue1 = (h * 3) % 360;
  const hue2 = (h * 11 + 90) % 360;
  return `linear-gradient(160deg, hsl(${hue1} 80% 28%) 0%, hsl(${hue2} 70% 35%) 100%)`;
}

/* Accent color cycle for variety */
const ACCENT_COLORS = ["#FFE600", "#4A90FF", "#00C853", "#FF3D00", "#FF9100", "#FF2D7B"];
function accentColor(index: number): string {
  return ACCENT_COLORS[index % ACCENT_COLORS.length];
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function Home() {
  const { artists, artworks, isLoading, markupPercentage } = useCatalog();

  if (isLoading) return <Loading />;

  // Featured artists: those marked with the star, or fallback to top 6 by works count
  const featuredArtists = artists.filter((a) => (a as any).featured);
  const featured = featuredArtists.length > 0
    ? featuredArtists
    : [...artists].sort((a, b) => b.works.length - a.works.length).slice(0, 6);

  const totalWorks = artworks.length;

  return (
    <>
      {/* ============================================================ */}
      {/*  HERO — STRAAT-style massive typography                      */}
      {/* ============================================================ */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 30%, rgba(160,150,140,0.4) 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 75% 70%, rgba(140,130,120,0.35) 0%, transparent 50%),
            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(170,160,150,0.25) 0%, transparent 45%),
            radial-gradient(circle at 30% 80%, rgba(130,120,110,0.3) 0%, transparent 30%),
            radial-gradient(circle at 80% 20%, rgba(150,140,130,0.25) 0%, transparent 25%),
            radial-gradient(circle at 10% 10%, rgba(180,170,160,0.2) 0%, transparent 20%),
            radial-gradient(circle at 90% 90%, rgba(120,112,105,0.3) 0%, transparent 20%),
            linear-gradient(180deg, #C4BBB2 0%, #B8AFA6 30%, #ADA49B 60%, #B8AFA6 80%, #D4CCC4 100%)
          `,
        }}
      >
        {/* Subtle grain overlay for cement texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />
        {/* Secondary texture layer — subtle cracks/variation */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(90deg, transparent, transparent 100px, rgba(100,90,80,0.15) 100px, transparent 101px),
              repeating-linear-gradient(0deg, transparent, transparent 80px, rgba(100,90,80,0.1) 80px, transparent 81px)
            `,
          }}
        />

        {/* Banner image */}
        <img
          src="/Banner_Catalogo.png"
          alt="Expo Coletiva Art on The Wall"
          className="relative z-10 w-full max-w-[700px] h-auto drop-shadow-2xl"
          style={{ animation: "fadeInUp 0.8s ease-out forwards" }}
        />

        {/* Scroll indicator */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-xs tracking-widest"
          style={{ opacity: 0, animation: "fadeInUp 0.6s ease-out 1.5s forwards", color: "#6B6460" }}
        >
          <span className="uppercase">Scroll</span>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* Yellow accent line separator */}
      <div className="h-1 bg-accent" />

      {/* ============================================================ */}
      {/*  STATS BAR — Yellow background                               */}
      {/* ============================================================ */}
      <section className="bg-accent py-10 md:py-14">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-2xl md:text-4xl font-extrabold text-black tracking-tight">
            {artists.length} Artistas &bull; {totalWorks}+ Obras &bull; Expo Coletiva Art on The Wall
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FEATURED ARTISTS — White background section                 */}
      {/* ============================================================ */}
      <section className="bg-[#D4CCC4] py-24 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-black mb-4 tracking-tight"
            style={{ animation: "fadeInUp 0.7s ease-out 0.1s both" }}
          >
            artistas em destaque
          </h2>
          <p
            className="text-black/60 mb-16 text-lg"
            style={{ animation: "fadeInUp 0.7s ease-out 0.25s both" }}
          >
            Os talentos que transformam paredes em galerias
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featured.map((artist, i) => (
              <ArtistCard key={artist.id} artist={artist} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  WORKS PREVIEW - horizontal scroll, black bg                 */}
      {/* ============================================================ */}
      <section className="py-24 md:py-32 bg-black">
        <div className="max-w-6xl mx-auto px-6 mb-12">
          <h2
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-4 tracking-tight"
            style={{ animation: "fadeInUp 0.7s ease-out 0.1s both" }}
          >
            obras da exposicao
          </h2>
          <p
            className="text-muted text-lg"
            style={{ animation: "fadeInUp 0.7s ease-out 0.25s both" }}
          >
            Arraste para explorar
          </p>
        </div>

        <div
          className="flex gap-5 overflow-x-auto px-6 pb-4 cursor-grab active:cursor-grabbing"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* left spacer to center content on wide screens */}
          <div className="shrink-0 w-[max(0px,calc((100vw-72rem)/2))]" />

          {artworks.slice(0, 20).map((work, i) => (
            <WorkCard key={work.id} work={work} index={i} markupPercentage={markupPercentage} />
          ))}

          {/* right spacer */}
          <div className="shrink-0 w-[max(0px,calc((100vw-72rem)/2))]" />
        </div>
      </section>

      {/* ============================================================ */}
      {/*  CTA — Yellow background                                     */}
      {/* ============================================================ */}
      <section className="bg-accent py-24 md:py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-black mb-10 tracking-tight"
            style={{ animation: "fadeInUp 0.7s ease-out 0.1s both" }}
          >
            explore o catalogo completo
          </h2>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            style={{ animation: "fadeInUp 0.7s ease-out 0.3s both" }}
          >
            <Link
              href="/catalogo"
              className="btn-pill btn-white text-lg"
            >
              Ver Catalogo
            </Link>
            <Link
              href="/cadastrar"
              className="btn-pill bg-black text-accent text-lg hover:bg-black/80"
            >
              Cadastrar Artista
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ArtistCard({ artist, index }: { artist: Artist; index: number }) {
  const delay = 0.3 + index * 0.1;

  return (
    <Link
      href={`/artistas/${artist.slug}`}
      className="group relative block rounded-xl overflow-hidden bg-[#D4CCC4] transition-all duration-500 hover:-translate-y-2 hover:shadow-xl"
      style={{
        opacity: 0,
        animation: `fadeInUp 0.7s ease-out ${delay}s forwards`,
      }}
    >
      {/* Artist image or gradient fallback */}
      <div
        className="h-44 md:h-52 w-full relative"
        style={{ background: artistGradient(artist.name) }}
      >
        {(() => {
          const firstWork = artist.works[0];
          const firstImage = firstWork ? getDisplayImageUrls(firstWork)[0] : null;
          return firstImage ? (
            <img
              src={firstImage}
              alt={artist.name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : null;
        })()}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#D4CCC4] to-transparent" />

        {/* Works count badge */}
        <span className="absolute top-4 right-4 bg-[#D4CCC4] text-black text-xs font-bold px-3 py-1 rounded-full">
          {artist.works.length} {artist.works.length === 1 ? "obra" : "obras"}
        </span>
      </div>

      <div className="p-5 bg-[#D4CCC4]">
        <h3 className="text-xl font-extrabold text-black mb-3 group-hover:text-accent-pink transition-colors duration-300 tracking-tight">
          {artist.name}
        </h3>
        <div className="flex flex-wrap gap-2">
          {artist.characteristics.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-black/70 font-medium"
            >
              {tag}
            </span>
          ))}
          {artist.characteristics.length > 3 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-black/50">
              +{artist.characteristics.length - 3}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function WorkCard({
  work,
  index,
  markupPercentage,
}: {
  work: Artwork & { artistName: string };
  index: number;
  markupPercentage: number;
}) {
  const delay = 0.15 + index * 0.05;

  return (
    <div
      className="group shrink-0 w-64 md:w-72 rounded-xl overflow-hidden bg-surface transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-foreground/5"
      style={{
        opacity: 0,
        animation: `fadeInUp 0.6s ease-out ${delay}s forwards`,
      }}
    >
      {/* Artwork image or gradient fallback */}
      <div
        className="relative h-48 md:h-56 w-full overflow-hidden"
        style={{ background: artworkGradient(work.id) }}
      >
        {(() => {
          const images = getDisplayImageUrls(work);
          return images.length > 0 ? (
            <img
              src={images[0]}
              alt={work.title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : null;
        })()}
        {/* Hover overlay with details */}
        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center">
          <span className="text-accent text-sm font-bold mb-1">{work.technique}</span>
          <span className="text-muted text-xs">{work.size}</span>
        </div>
      </div>

      <div className="p-4">
        <h4 className="font-extrabold text-base text-foreground truncate mb-1 tracking-tight">
          {work.title}
        </h4>
        <p className="text-sm text-muted truncate mb-2">{work.artistName}</p>
        <p className="text-sm font-bold text-accent">{formatBRL(applyMarkup(work.value, markupPercentage))}</p>
      </div>
    </div>
  );
}
