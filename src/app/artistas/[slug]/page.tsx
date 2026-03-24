"use client";

import React from "react";
import Link from "next/link";
import { useCatalog } from "@/hooks/useCatalog";
import { formatBRL } from "@/lib/catalog";
import { stringToHSL } from "@/lib/colors";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
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

/* Neon color cycle */
const NEON_COLORS = ["#ff2d7b", "#00f0ff", "#39ff14", "#ffe600", "#ff6b00", "#bf5af2"];
function neonColor(index: number): string {
  return NEON_COLORS[index % NEON_COLORS.length];
}

/* ------------------------------------------------------------------ */
/*  CSS Keyframes                                                      */
/* ------------------------------------------------------------------ */

const keyframes = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes bannerShift {
  0%   { transform: translate(0, 0); }
  100% { transform: translate(-16px, -8px); }
}
`;

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ArtistDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(params);
  const { artists, getArtistBySlug } = useCatalog();
  const artist = getArtistBySlug(slug);

  /* Compute previous / next artists for navigation */
  const currentIndex = artists.findIndex((a) => a.slug === slug);
  const prevArtist = currentIndex > 0 ? artists[currentIndex - 1] : null;
  const nextArtist =
    currentIndex >= 0 && currentIndex < artists.length - 1
      ? artists[currentIndex + 1]
      : null;

  /* ---- 404: artist not found ---- */
  if (!artist) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: keyframes }} />
        <main className="min-h-screen flex flex-col items-center justify-center px-6 py-24">
          <div
            className="text-center"
            style={{ opacity: 0, animation: "fadeInUp 0.6s ease-out forwards" }}
          >
            <div className="text-6xl mb-6 opacity-30">~</div>
            <h1 className="text-3xl font-heading text-foreground mb-4">
              Artista nao encontrado
            </h1>
            <p className="text-muted mb-8">
              O artista que voce procura nao existe no catalogo.
            </p>
            <Link
              href="/artistas"
              className="inline-flex items-center gap-2 text-neon-cyan hover:text-neon-pink transition-colors duration-300 font-bold"
            >
              <span aria-hidden="true">&larr;</span> Voltar para artistas
            </Link>
          </div>
        </main>
      </>
    );
  }

  const works = artist.works;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />

      <main className="min-h-screen">
        {/* ---- Back link ---- */}
        <div className="max-w-6xl mx-auto px-6 pt-8">
          <Link
            href="/artistas"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-neon-cyan transition-colors duration-300 font-bold"
            style={{ opacity: 0, animation: "fadeIn 0.5s ease-out forwards" }}
          >
            <span aria-hidden="true">&larr;</span> Voltar para artistas
          </Link>
        </div>

        {/* ---- Banner / Header ---- */}
        <section
          className="relative mt-6 mx-6 rounded-2xl overflow-hidden"
          style={{ opacity: 0, animation: "fadeInUp 0.7s ease-out 0.1s forwards" }}
        >
          {/* Gradient banner - enlarged for parallax-like shift */}
          <div
            className="h-48 md:h-64 w-full relative overflow-hidden"
          >
            <div
              className="absolute -inset-8 w-[calc(100%+64px)] h-[calc(100%+64px)]"
              style={{
                background: artistGradient(artist.name),
                animation: "bannerShift 8s ease-in-out infinite alternate",
              }}
            />
            {/* Spray paint overlay */}
            <div
              className="absolute inset-0 opacity-25"
              style={{
                background: `radial-gradient(ellipse at ${30 + (hashStr(artist.id) % 40)}% ${20 + (hashStr(artist.id) % 60)}%, #ff2d7b40 0%, transparent 40%), radial-gradient(ellipse at ${60 + (hashStr(artist.id) % 20)}% ${50 + (hashStr(artist.id) % 30)}%, #00f0ff30 0%, transparent 50%)`,
              }}
            />
            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
          </div>

          {/* Artist info overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-8 pb-8">
            <h1 className="text-4xl md:text-5xl font-heading tracking-wide text-neon-cyan mb-3 text-spray">
              {artist.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              {/* Characteristics tags — sticker style with varying neon colors */}
              {artist.characteristics.map((tag, ti) => (
                <span
                  key={tag}
                  className="sticker text-xs px-3 py-1 rounded-full bg-surface/80 backdrop-blur-sm border border-border font-bold"
                  style={{
                    color: neonColor(ti),
                    borderColor: `${neonColor(ti)}30`,
                    ["--sticker-rotation" as string]: `${(ti % 5) - 2}deg`,
                  }}
                >
                  {tag}
                </span>
              ))}

              {/* Works count */}
              <span className="text-sm text-muted ml-2 font-accent">
                {works.length} {works.length === 1 ? "obra" : "obras"}
              </span>
            </div>
          </div>
        </section>

        {/* Urban decorative quote */}
        <div
          className="max-w-6xl mx-auto px-6 mt-8 flex items-center justify-center gap-3"
          style={{ opacity: 0, animation: "fadeIn 0.8s ease-out 0.4s forwards" }}
        >
          <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-neon-pink/30" />
          <p className="text-sm text-muted/60 font-heading tracking-wide">
            &ldquo;A rua e a galeria&rdquo;
          </p>
          <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-neon-cyan/30" />
        </div>

        {/* ---- Works Grid ---- */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          {works.length === 0 ? (
            /* Empty state */
            <div
              className="text-center py-20"
              style={{
                opacity: 0,
                animation: "fadeInUp 0.6s ease-out 0.3s forwards",
              }}
            >
              <div className="text-5xl mb-6 opacity-30">~</div>
              <p className="font-heading text-xl text-muted">
                Este artista ainda nao tem obras cadastradas
              </p>
            </div>
          ) : (
            <>
              <h2
                className="text-2xl font-heading text-foreground mb-8"
                style={{
                  opacity: 0,
                  animation: "fadeInUp 0.6s ease-out 0.25s forwards",
                }}
              >
                Obras
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {works.map((work, index) => {
                  const color1 = stringToHSL(
                    artist.name + work.title,
                    85,
                    35,
                  );
                  const color2 = stringToHSL(
                    work.title + artist.name,
                    75,
                    25,
                  );
                  const heights = [200, 260, 220, 280];
                  const placeholderH = heights[index % heights.length];
                  const delay = 0.3 + index * 0.08;
                  const glowColor = neonColor(index);

                  return (
                    <article
                      key={work.id}
                      className="group overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300 hover:scale-[1.02]"
                      style={{
                        opacity: 0,
                        animation: `fadeInUp 0.6s ease-out ${delay}s forwards`,
                      }}
                    >
                      {/* Hover glow */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none z-10"
                        style={{
                          boxShadow: `0 0 24px ${glowColor}25`,
                        }}
                      />

                      {/* Gradient placeholder */}
                      <div
                        className="w-full transition-transform duration-700 group-hover:scale-105"
                        style={{
                          height: placeholderH,
                          background: `linear-gradient(135deg, ${color1}, ${color2})`,
                        }}
                      />

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="font-heading text-lg text-foreground group-hover:text-neon-cyan transition-colors duration-300">
                          {work.title}
                        </h3>

                        <div className="mt-3 space-y-1.5">
                          <p className="text-sm text-muted">
                            <span className="text-neon-pink font-bold">
                              {work.technique}
                            </span>
                          </p>
                          <p className="text-sm text-muted">{work.size}</p>
                          {work.description && (
                            <p className="text-sm text-muted/80 mt-2">
                              {work.description}
                            </p>
                          )}
                          <p className="text-base font-bold text-neon-cyan mt-2">
                            {formatBRL(work.value)}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {/* ---- CTA: Add work ---- */}
          <div
            className="text-center mt-14"
            style={{
              opacity: 0,
              animation: `fadeInUp 0.7s ease-out ${0.4 + works.length * 0.08}s forwards`,
            }}
          >
            <Link
              href={`/cadastrar?artistId=${artist.id}`}
              className="inline-flex items-center justify-center px-8 py-4 border border-neon-pink/40 text-neon-pink font-bold rounded-lg text-lg uppercase tracking-wider transition-all duration-300 hover:border-neon-pink hover:bg-neon-pink/10 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,45,123,0.2)]"
            >
              Adicionar obra para {artist.name}
            </Link>
          </div>

          {/* ---- Previous / Next navigation ---- */}
          <nav
            className="mt-16 flex items-center justify-between border-t border-border pt-8"
            style={{
              opacity: 0,
              animation: `fadeIn 0.6s ease-out ${0.5 + works.length * 0.08}s forwards`,
            }}
          >
            {prevArtist ? (
              <Link
                href={`/artistas/${prevArtist.slug}`}
                className="group flex flex-col items-start gap-1 text-left transition-colors duration-300"
              >
                <span className="text-xs text-muted group-hover:text-neon-cyan transition-colors duration-300 font-bold">
                  &larr; Anterior
                </span>
                <span className="text-sm font-heading text-foreground group-hover:text-neon-cyan transition-colors duration-300">
                  {prevArtist.name}
                </span>
              </Link>
            ) : (
              <div />
            )}

            {nextArtist ? (
              <Link
                href={`/artistas/${nextArtist.slug}`}
                className="group flex flex-col items-end gap-1 text-right transition-colors duration-300"
              >
                <span className="text-xs text-muted group-hover:text-neon-pink transition-colors duration-300 font-bold">
                  Proximo &rarr;
                </span>
                <span className="text-sm font-heading text-foreground group-hover:text-neon-pink transition-colors duration-300">
                  {nextArtist.name}
                </span>
              </Link>
            ) : (
              <div />
            )}
          </nav>
        </section>
      </main>
    </>
  );
}
