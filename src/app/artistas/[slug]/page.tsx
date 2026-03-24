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
  return `linear-gradient(135deg, hsl(${hue1} 60% 15%) 0%, hsl(${hue2} 50% 20%) 50%, hsl(${hue3} 40% 12%) 100%)`;
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
            <h1 className="text-3xl font-heading font-bold text-foreground mb-4">
              Artista nao encontrado
            </h1>
            <p className="text-muted mb-8">
              O artista que voce procura nao existe no catalogo.
            </p>
            <Link
              href="/artistas"
              className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors duration-300"
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
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-gold transition-colors duration-300"
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
            {/* Decorative radial overlay */}
            <div
              className="absolute inset-0 opacity-25"
              style={{
                background: `radial-gradient(ellipse at ${30 + (hashStr(artist.id) % 40)}% ${20 + (hashStr(artist.id) % 60)}%, rgba(212,168,83,0.4) 0%, transparent 60%)`,
              }}
            />
            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
          </div>

          {/* Artist info overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-8 pb-8">
            <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-wide text-gold mb-3">
              {artist.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              {/* Characteristics tags */}
              {artist.characteristics.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-full bg-surface/80 backdrop-blur-sm text-gold-light border border-gold/20"
                >
                  {tag}
                </span>
              ))}

              {/* Works count */}
              <span className="text-sm text-muted ml-2">
                {works.length} {works.length === 1 ? "obra" : "obras"}
              </span>
            </div>
          </div>
        </section>

        {/* Artistic decorative quote */}
        <div
          className="max-w-6xl mx-auto px-6 mt-8 flex items-center justify-center gap-3"
          style={{ opacity: 0, animation: "fadeIn 0.8s ease-out 0.4s forwards" }}
        >
          <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-gold/30" />
          <p className="text-sm italic text-muted/60 font-heading tracking-wide">
            &ldquo;A arte existe para que a realidade nao nos destrua&rdquo;
          </p>
          <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-gold/30" />
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
                className="text-2xl font-heading font-semibold text-foreground mb-8"
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
                    65,
                    35,
                  );
                  const color2 = stringToHSL(
                    work.title + artist.name,
                    55,
                    25,
                  );
                  const heights = [200, 260, 220, 280];
                  const placeholderH = heights[index % heights.length];
                  const delay = 0.3 + index * 0.08;

                  return (
                    <article
                      key={work.id}
                      className="group overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300 hover:border-gold/60 hover:shadow-[0_0_24px_rgba(212,168,83,0.15)] hover:scale-[1.02]"
                      style={{
                        opacity: 0,
                        animation: `fadeInUp 0.6s ease-out ${delay}s forwards`,
                      }}
                    >
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
                        <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-gold transition-colors duration-300">
                          {work.title}
                        </h3>

                        <div className="mt-3 space-y-1.5">
                          <p className="text-sm text-muted">
                            <span className="text-gold-light">
                              {work.technique}
                            </span>
                          </p>
                          <p className="text-sm text-muted">{work.size}</p>
                          {work.description && (
                            <p className="text-sm text-muted/80 mt-2">
                              {work.description}
                            </p>
                          )}
                          <p className="text-base font-semibold text-gold mt-2">
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
              className="inline-flex items-center justify-center px-8 py-4 border border-gold/40 text-gold font-semibold rounded-lg text-lg transition-all duration-300 hover:border-gold hover:bg-gold/10 hover:scale-105"
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
                <span className="text-xs text-muted group-hover:text-gold transition-colors duration-300">
                  &larr; Anterior
                </span>
                <span className="text-sm font-heading text-foreground group-hover:text-gold transition-colors duration-300">
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
                <span className="text-xs text-muted group-hover:text-gold transition-colors duration-300">
                  Proximo &rarr;
                </span>
                <span className="text-sm font-heading text-foreground group-hover:text-gold transition-colors duration-300">
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
