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
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6">
        {/* Floating decorative gradient squares */}
        <div
          className="pointer-events-none absolute top-[15%] left-[10%] w-32 h-40 md:w-48 md:h-56 rounded-lg opacity-60"
          style={{
            background: "linear-gradient(135deg, #FFE600 0%, #FF9100 100%)",
            transform: "rotate(-6deg)",
            animation: "fadeIn 1s ease-out 0.5s both",
          }}
        />
        <div
          className="pointer-events-none absolute top-[25%] right-[8%] w-28 h-36 md:w-40 md:h-48 rounded-lg opacity-50"
          style={{
            background: "linear-gradient(135deg, #4A90FF 0%, #00C853 100%)",
            transform: "rotate(4deg)",
            animation: "fadeIn 1s ease-out 0.8s both",
          }}
        />
        <div
          className="pointer-events-none absolute bottom-[20%] left-[55%] w-24 h-32 md:w-36 md:h-44 rounded-lg opacity-40"
          style={{
            background: "linear-gradient(135deg, #FF2D7B 0%, #FF3D00 100%)",
            transform: "rotate(-3deg)",
            animation: "fadeIn 1s ease-out 1.1s both",
          }}
        />

        {/* Massive typography */}
        <h1
          className="relative z-10 text-center select-none max-w-6xl"
          style={{ animation: "fadeInUp 0.8s ease-out forwards" }}
        >
          <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] font-extrabold leading-[0.9] tracking-tight text-white">
            Galeria de Artistas Urbanos
          </span>
        </h1>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted text-xs tracking-widest"
          style={{ opacity: 0, animation: "fadeInUp 0.6s ease-out 1.5s forwards" }}
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
            {artists.length} Artistas &bull; {totalWorks}+ Obras &bull; Galeria de Artistas Urbanos
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FEATURED ARTISTS — White background section                 */}
      {/* ============================================================ */}
      <section className="bg-white py-24 md:py-32 px-6">
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
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-4 tracking-tight"
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
      className="group relative block rounded-xl overflow-hidden bg-white transition-all duration-500 hover:-translate-y-2 hover:shadow-xl"
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
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />

        {/* Works count badge */}
        <span className="absolute top-4 right-4 bg-white text-black text-xs font-bold px-3 py-1 rounded-full">
          {artist.works.length} {artist.works.length === 1 ? "obra" : "obras"}
        </span>
      </div>

      <div className="p-5 bg-white">
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
      className="group shrink-0 w-64 md:w-72 rounded-xl overflow-hidden bg-surface transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-white/5"
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
        <h4 className="font-extrabold text-base text-white truncate mb-1 tracking-tight">
          {work.title}
        </h4>
        <p className="text-sm text-muted truncate mb-2">{work.artistName}</p>
        <p className="text-sm font-bold text-accent">{formatBRL(applyMarkup(work.value, markupPercentage))}</p>
      </div>
    </div>
  );
}
