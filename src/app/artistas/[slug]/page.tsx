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
  return `linear-gradient(135deg, hsl(${hue1} 85% 25%) 0%, hsl(${hue2} 75% 30%) 50%, hsl(${hue3} 65% 20%) 100%)`;
}

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
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-24">
        <div
          className="text-center"
          style={{ animation: "fadeInUp 0.6s ease-out both" }}
        >
          <div className="text-6xl mb-6 opacity-30">~</div>
          <h1 className="text-3xl font-extrabold text-white mb-4 tracking-tight">
            Artista nao encontrado
          </h1>
          <p className="text-muted mb-8">
            O artista que voce procura nao existe no catalogo.
          </p>
          <Link
            href="/artistas"
            className="btn-pill btn-white"
          >
            &larr; Voltar para artistas
          </Link>
        </div>
      </div>
    );
  }

  const works = artist.works;

  return (
    <div className="min-h-screen">
      {/* ---- Back link ---- */}
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <Link
          href="/artistas"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors duration-300 font-bold"
          style={{ animation: "fadeIn 0.5s ease-out both" }}
        >
          <span aria-hidden="true">&larr;</span> Voltar para artistas
        </Link>
      </div>

      {/* ---- Banner / Header ---- */}
      <section
        className="relative mt-6 mx-6 rounded-2xl overflow-hidden"
        style={{ animation: "fadeInUp 0.7s ease-out 0.1s both" }}
      >
        {/* Gradient banner */}
        <div
          className="h-48 md:h-64 w-full relative overflow-hidden"
          style={{ background: artistGradient(artist.name) }}
        >
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
        </div>

        {/* Artist info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-8">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-4 lowercase">
            {artist.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            {/* Characteristics tags — clean white pills */}
            {artist.characteristics.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white font-medium"
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

      {/* Quote */}
      <div
        className="max-w-6xl mx-auto px-6 mt-8 flex items-center justify-center gap-3"
        style={{ animation: "fadeIn 0.8s ease-out 0.4s both" }}
      >
        <div className="h-px flex-1 max-w-16 bg-border" />
        <p className="text-sm text-muted/60 italic tracking-wide">
          &ldquo;A rua e a galeria&rdquo;
        </p>
        <div className="h-px flex-1 max-w-16 bg-border" />
      </div>

      {/* ---- Works Grid ---- */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        {works.length === 0 ? (
          /* Empty state */
          <div
            className="text-center py-20"
            style={{ animation: "fadeInUp 0.6s ease-out 0.3s both" }}
          >
            <div className="text-5xl mb-6 opacity-30">~</div>
            <p className="text-xl font-extrabold text-muted tracking-tight">
              Este artista ainda nao tem obras cadastradas
            </p>
          </div>
        ) : (
          <>
            <h2
              className="text-2xl font-extrabold text-white mb-8 tracking-tight"
              style={{ animation: "fadeInUp 0.6s ease-out 0.25s both" }}
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

                return (
                  <article
                    key={work.id}
                    className="group overflow-hidden rounded-xl bg-surface transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-white/5"
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
                      <h3 className="font-extrabold text-lg text-white group-hover:text-accent transition-colors duration-300 tracking-tight">
                        {work.title}
                      </h3>

                      <div className="mt-3 space-y-1.5">
                        <p className="text-sm">
                          <span className="text-accent-pink font-bold">
                            {work.technique}
                          </span>
                        </p>
                        <p className="text-sm text-muted">{work.size}</p>
                        {work.description && (
                          <p className="text-sm text-muted/80 mt-2">
                            {work.description}
                          </p>
                        )}
                        <p className="text-base font-bold text-accent mt-2">
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
            className="btn-pill btn-yellow text-lg"
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
              <span className="text-xs text-muted group-hover:text-accent transition-colors duration-300 font-bold">
                &larr; Anterior
              </span>
              <span className="text-sm font-extrabold text-white group-hover:text-accent transition-colors duration-300 tracking-tight">
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
              <span className="text-xs text-muted group-hover:text-accent transition-colors duration-300 font-bold">
                Proximo &rarr;
              </span>
              <span className="text-sm font-extrabold text-white group-hover:text-accent transition-colors duration-300 tracking-tight">
                {nextArtist.name}
              </span>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </section>
    </div>
  );
}
