"use client";

import Link from "next/link";
import { useCatalog } from "@/hooks/useCatalog";
import { formatBRL } from "@/lib/catalog";
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
  return `linear-gradient(135deg, hsl(${hue1} 80% 18%) 0%, hsl(${hue2} 70% 22%) 50%, hsl(${hue3} 60% 15%) 100%)`;
}

function artworkGradient(id: string): string {
  const h = hashStr(id);
  const hue1 = (h * 3) % 360;
  const hue2 = (h * 11 + 90) % 360;
  return `linear-gradient(160deg, hsl(${hue1} 75% 20%) 0%, hsl(${hue2} 65% 28%) 100%)`;
}

/* Neon color cycle for variety */
const NEON_COLORS = ["#ff2d7b", "#00f0ff", "#39ff14", "#ffe600", "#ff6b00", "#bf5af2"];
function neonColor(index: number): string {
  return NEON_COLORS[index % NEON_COLORS.length];
}

/* ------------------------------------------------------------------ */
/*  CSS Keyframes (injected once via <style>)                          */
/* ------------------------------------------------------------------ */
const keyframes = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes letterReveal {
  0%   { opacity: 0; transform: translateY(40px) scale(0.8); filter: blur(8px); }
  60%  { opacity: 1; filter: blur(0); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(0,240,255,0.15); }
  50%      { box-shadow: 0 0 40px rgba(255,45,123,0.35); }
}
@keyframes drift {
  0%   { transform: translate(0, 0) rotate(0deg); }
  33%  { transform: translate(30px, -20px) rotate(2deg); }
  66%  { transform: translate(-20px, 15px) rotate(-1deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}
@keyframes scroll-hint {
  0%, 100% { opacity: 1; transform: translateY(0); }
  50%      { opacity: 0.4; transform: translateY(12px); }
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-40px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes scaleReveal {
  0%   { opacity: 0; transform: scale(0.6); }
  60%  { opacity: 1; transform: scale(1.08); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes neonPulse {
  0%, 100% { text-shadow: 0 0 7px currentColor, 0 0 10px currentColor, 0 0 21px currentColor; }
  50%      { text-shadow: 0 0 14px currentColor, 0 0 28px currentColor, 0 0 42px currentColor; }
}
`;

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function Home() {
  const { artists, artworks } = useCatalog();

  // Top 6 artists by number of works
  const featured = [...artists]
    .sort((a, b) => b.works.length - a.works.length)
    .slice(0, 6);

  const totalWorks = artworks.length;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />

      {/* ============================================================ */}
      {/*  HERO                                                        */}
      {/* ============================================================ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Abstract background — neon splashes on concrete */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Dark concrete base */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-concrete to-background" />

          {/* Neon spray paint splashes */}
          <div
            className="absolute top-[10%] left-[15%] w-64 h-64 rounded-full opacity-10"
            style={{
              background: "radial-gradient(circle, #ff2d7b 0%, transparent 70%)",
              animation: "drift 20s ease-in-out infinite",
            }}
          />
          <div
            className="absolute top-[60%] right-[10%] w-96 h-96 rounded-full"
            style={{
              background: "radial-gradient(circle, #00f0ff 0%, transparent 70%)",
              animation: "drift 30s ease-in-out infinite reverse",
              opacity: 0.08,
            }}
          />
          <div
            className="absolute top-[30%] right-[30%] w-48 h-48 opacity-10"
            style={{
              background: "linear-gradient(45deg, transparent 30%, #39ff1420 50%, transparent 70%)",
              animation: "drift 15s ease-in-out infinite 3s",
              transform: "rotate(45deg)",
            }}
          />
          <div
            className="absolute top-[50%] left-[60%] w-72 h-72 rounded-full"
            style={{
              background: "radial-gradient(circle, #bf5af2 0%, transparent 70%)",
              animation: "drift 35s ease-in-out infinite 5s",
              opacity: 0.06,
            }}
          />
          {/* Extra neon green splash */}
          <div
            className="absolute top-[20%] left-[70%] w-56 h-56 rounded-full"
            style={{
              background: "radial-gradient(circle, #39ff14 0%, transparent 70%)",
              animation: "drift 25s ease-in-out infinite 2s",
              opacity: 0.05,
            }}
          />

          {/* Horizontal accent lines - neon */}
          <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-neon-pink/10 to-transparent" />
          <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-neon-cyan/10 to-transparent" />

          {/* Diagonal decorative lines */}
          <div
            className="absolute top-0 right-[20%] w-px h-[140%] bg-gradient-to-b from-transparent via-neon-cyan/10 to-transparent"
            style={{ transform: "rotate(15deg)", transformOrigin: "top center" }}
          />
          <div
            className="absolute top-0 left-[25%] w-px h-[130%] bg-gradient-to-b from-transparent via-neon-pink/5 to-transparent"
            style={{ transform: "rotate(-12deg)", transformOrigin: "top center" }}
          />
        </div>

        {/* Title with staggered letter animation */}
        <h1 className="relative z-10 text-center select-none">
          <span className="block text-sm md:text-base tracking-[0.4em] uppercase text-neon-pink/70 font-body mb-4"
            style={{ animation: "fadeInUp 0.8s ease-out forwards" }}
          >
            Expo Coletiva
          </span>
          <span className="flex flex-wrap justify-center gap-x-[0.15em] text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-heading tracking-tight">
            {"ART ON THE WALL".split("").map((char, i) => (
              <span
                key={i}
                className={char === " " ? "w-[0.3em]" : "inline-block text-foreground"}
                style={
                  char !== " "
                    ? {
                        opacity: 0,
                        animation: `letterReveal 0.7s ease-out forwards`,
                        animationDelay: `${0.3 + i * 0.05}s`,
                        textShadow: "0 0 20px rgba(0,240,255,0.3), 2px 2px 0px rgba(0,0,0,0.8)",
                      }
                    : undefined
                }
              >
                {char}
              </span>
            ))}
          </span>
          <span
            className="block mt-6 text-lg md:text-xl tracking-widest text-neon-cyan font-body"
            style={{ opacity: 0, animation: "fadeInUp 0.8s ease-out 1.2s forwards" }}
          >
            Expo Coletiva &bull; Arte Urbana &bull; Maio 2024
          </span>
        </h1>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted text-xs tracking-widest"
          style={{ opacity: 0, animation: "fadeInUp 0.6s ease-out 2s forwards" }}
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
            style={{ animation: "scroll-hint 2s ease-in-out infinite" }}
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  STATS BAR                                                   */}
      {/* ============================================================ */}
      <section
        className="relative py-8 border-y border-neon-cyan/20 bg-concrete"
        style={{
          opacity: 0,
          animation: "fadeInUp 0.8s ease-out 0.2s forwards",
          animationTimeline: undefined,
        }}
      >
        <div
          className="absolute inset-0"
          style={{ animation: "pulse-glow 4s ease-in-out infinite" }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6 flex justify-center items-center gap-8 md:gap-14">
          <div className="text-center" style={{ opacity: 0, animation: "scaleReveal 0.6s ease-out 0.5s forwards" }}>
            <span className="block text-3xl md:text-4xl font-heading text-neon-pink">{artists.length}</span>
            <span className="text-xs md:text-sm uppercase tracking-widest text-muted font-body">Artistas</span>
          </div>
          <span className="text-neon-cyan/30 text-2xl font-thin select-none">/</span>
          <div className="text-center" style={{ opacity: 0, animation: "scaleReveal 0.6s ease-out 0.7s forwards" }}>
            <span className="block text-3xl md:text-4xl font-heading text-neon-cyan">{totalWorks}+</span>
            <span className="text-xs md:text-sm uppercase tracking-widest text-muted font-body">Obras</span>
          </div>
          <span className="text-neon-cyan/30 text-2xl font-thin select-none">/</span>
          <div className="text-center" style={{ opacity: 0, animation: "scaleReveal 0.6s ease-out 0.9s forwards" }}>
            <span className="block text-lg md:text-xl font-heading text-neon-green">Graffiti</span>
            <span className="text-xs md:text-sm uppercase tracking-widest text-muted font-body">Arte Urbana</span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FEATURED ARTISTS                                            */}
      {/* ============================================================ */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="relative inline-flex flex-col items-center w-full">
            {/* Decorative spray paint blob */}
            <svg
              className="absolute -top-8 -left-4 md:-left-8 w-24 h-24 md:w-32 md:h-32 opacity-[0.07] pointer-events-none"
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
              style={{ animation: "drift 12s ease-in-out infinite" }}
            >
              <path
                fill="#ff2d7b"
                d="M45.3,-62.5C57.1,-53.8,64.1,-37.6,68.8,-21.1C73.5,-4.5,75.9,12.3,70.1,26.1C64.3,39.9,50.3,50.6,35.4,57.8C20.5,64.9,4.6,68.5,-12.2,68.1C-29,67.7,-46.7,63.3,-57.1,52.1C-67.5,40.9,-70.5,22.8,-71.6,5C-72.7,-12.7,-71.8,-30.2,-62.5,-41.5C-53.2,-52.9,-35.4,-58.1,-19.1,-63.1C-2.9,-68.1,11.8,-72.8,26.1,-70.5C40.5,-68.2,54.5,-59,45.3,-62.5Z"
                transform="translate(100 100)"
              />
            </svg>
            <h2
              className="text-3xl md:text-5xl font-heading text-center mb-4 text-foreground text-spray"
              style={{ opacity: 0, animation: "fadeInUp 0.7s ease-out 0.1s forwards" }}
            >
              Artistas em Destaque
            </h2>
            <p
              className="text-center text-muted mb-14 text-sm md:text-base font-body"
              style={{ opacity: 0, animation: "fadeInUp 0.7s ease-out 0.25s forwards" }}
            >
              Os talentos que transformam paredes em galerias
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((artist, i) => (
              <ArtistCard key={artist.id} artist={artist} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  WORKS PREVIEW - horizontal scroll                           */}
      {/* ============================================================ */}
      <section className="py-20 md:py-28 bg-concrete/50">
        <div className="max-w-6xl mx-auto px-6 mb-10 relative">
          {/* Decorative spray paint blob */}
          <svg
            className="absolute -top-6 right-0 md:right-12 w-20 h-20 md:w-28 md:h-28 opacity-[0.06] pointer-events-none"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            style={{ animation: "drift 15s ease-in-out infinite reverse" }}
          >
            <path
              fill="#00f0ff"
              d="M39.5,-51.1C50.9,-44.3,59.5,-31.8,63.8,-17.8C68.1,-3.9,68.1,11.6,62.1,24C56.1,36.3,44.1,45.6,31.1,52.4C18.1,59.2,4.2,63.6,-10.9,62.8C-26,62,-42.3,56.1,-52.7,44.6C-63.1,33.1,-67.6,16,-66.4,0.7C-65.2,-14.7,-58.2,-28.4,-47.7,-35.3C-37.2,-42.3,-23.1,-42.5,-10.1,-45.4C2.9,-48.3,28.1,-57.9,39.5,-51.1Z"
              transform="translate(100 100)"
            />
          </svg>
          <h2
            className="text-3xl md:text-5xl font-heading text-center mb-4 text-spray"
            style={{ opacity: 0, animation: "fadeInUp 0.7s ease-out 0.1s forwards" }}
          >
            Obras da Exposi&ccedil;&atilde;o
          </h2>
          <p
            className="text-center text-muted text-sm md:text-base font-body"
            style={{ opacity: 0, animation: "fadeInUp 0.7s ease-out 0.25s forwards" }}
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
            <WorkCard key={work.id} work={work} index={i} />
          ))}

          {/* right spacer */}
          <div className="shrink-0 w-[max(0px,calc((100vw-72rem)/2))]" />
        </div>
      </section>

      {/* ============================================================ */}
      {/*  CTA                                                         */}
      {/* ============================================================ */}
      <section className="relative py-28 md:py-36 px-6 overflow-hidden">
        {/* Background glow effects */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(0,240,255,0.08) 0%, transparent 60%)",
              animation: "pulse-glow 5s ease-in-out infinite",
            }}
          />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2
            className="text-3xl md:text-5xl font-heading mb-6 text-spray"
            style={{ opacity: 0, animation: "fadeInUp 0.7s ease-out 0.1s forwards" }}
          >
            Explore o Muro
          </h2>
          <p
            className="text-muted mb-12 text-lg font-body"
            style={{ opacity: 0, animation: "fadeInUp 0.7s ease-out 0.25s forwards" }}
          >
            Navegue por todos os artistas e obras da exposi&ccedil;&atilde;o
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            style={{ opacity: 0, animation: "fadeInUp 0.7s ease-out 0.4s forwards" }}
          >
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center px-8 py-4 bg-neon-pink text-background font-bold rounded-lg text-lg uppercase tracking-wider transition-all duration-300 hover:bg-neon-pink/80 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,45,123,0.4)]"
            >
              Ver Cat&aacute;logo
            </Link>
            <Link
              href="/cadastrar"
              className="inline-flex items-center justify-center px-8 py-4 border border-neon-cyan/40 text-neon-cyan font-bold rounded-lg text-lg uppercase tracking-wider transition-all duration-300 hover:border-neon-cyan hover:bg-neon-cyan/10 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]"
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
  const glowColor = neonColor(index);

  return (
    <Link
      href={`/artistas/${artist.slug}`}
      className="group relative block rounded-xl overflow-hidden border border-border transition-all duration-500 hover:scale-[1.03]"
      style={{
        opacity: 0,
        animation: `fadeInUp 0.7s ease-out ${delay}s forwards`,
      }}
    >
      {/* Hover glow - uses neon color */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none z-10"
        style={{
          boxShadow: `0 0 30px ${glowColor}30, inset 0 0 30px ${glowColor}10`,
        }}
      />

      {/* Abstract gradient background */}
      <div
        className="h-44 md:h-52 w-full relative"
        style={{ background: artistGradient(artist.name) }}
      >
        {/* Decorative overlay shapes — neon */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at ${30 + (hashStr(artist.id) % 40)}% ${20 + (hashStr(artist.id) % 60)}%, ${glowColor}40 0%, transparent 50%)`,
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-surface to-transparent" />

        {/* Works count badge */}
        <span
          className="absolute top-4 right-4 bg-background/70 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full border"
          style={{ color: glowColor, borderColor: `${glowColor}30` }}
        >
          {artist.works.length} {artist.works.length === 1 ? "obra" : "obras"}
        </span>
      </div>

      <div className="p-5 bg-surface">
        <h3 className="text-xl font-heading text-foreground mb-3 group-hover:text-neon-cyan transition-colors duration-300">
          {artist.name}
        </h3>
        <div className="flex flex-wrap gap-2">
          {artist.characteristics.slice(0, 3).map((tag, ti) => (
            <span
              key={tag}
              className="sticker text-xs px-2.5 py-1 rounded-full bg-surface-light border border-border font-bold"
              style={{
                color: neonColor(ti + index),
                ["--sticker-rotation" as string]: `${(ti % 3) - 1}deg`,
              }}
            >
              {tag}
            </span>
          ))}
          {artist.characteristics.length > 3 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-surface-light text-muted border border-border">
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
}: {
  work: Artwork & { artistName: string };
  index: number;
}) {
  const delay = 0.15 + index * 0.05;
  const glowColor = neonColor(index);

  return (
    <div
      className="group shrink-0 w-64 md:w-72 rounded-xl overflow-hidden border border-border bg-surface transition-all duration-500"
      style={{
        opacity: 0,
        animation: `slideInLeft 0.6s ease-out ${delay}s forwards`,
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none z-10"
        style={{
          boxShadow: `0 0 25px ${glowColor}20`,
        }}
      />

      {/* Abstract artwork placeholder */}
      <div
        className="relative h-48 md:h-56 w-full overflow-hidden"
        style={{ background: artworkGradient(work.id) }}
      >
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background: `conic-gradient(from ${hashStr(work.id) % 360}deg at 50% 50%, ${glowColor}30 0%, transparent 30%, ${neonColor(index + 2)}15 60%, transparent 100%)`,
          }}
        />

        {/* Hover overlay with details */}
        <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center">
          <span className="text-neon-cyan text-sm font-bold mb-1">{work.technique}</span>
          <span className="text-muted text-xs">{work.size}</span>
        </div>
      </div>

      <div className="p-4">
        <h4 className="font-heading text-base text-foreground truncate mb-1 group-hover:text-neon-pink transition-colors">
          {work.title}
        </h4>
        <p className="text-sm text-muted truncate mb-2">{work.artistName}</p>
        <p className="text-sm font-bold text-neon-cyan">{formatBRL(work.value)}</p>
      </div>
    </div>
  );
}
