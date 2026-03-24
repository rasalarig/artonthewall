"use client";

import { useState } from "react";
import Link from "next/link";
import { useCatalog } from "@/hooks/useCatalog";
import { stringToHSL } from "@/lib/colors";

/* ------------------------------------------------------------------ */
/*  Helper: deterministic gradient from artist name                    */
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
`;

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function ArtistasPage() {
  const { artists } = useCatalog();
  const [search, setSearch] = useState("");

  const filtered = artists.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />

      <main className="min-h-screen px-6 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1
              className="text-4xl md:text-5xl font-heading font-bold tracking-wide text-gold mb-3"
              style={{ opacity: 0, animation: "fadeInUp 0.7s ease-out forwards" }}
            >
              Artistas
            </h1>
            <p
              className="text-muted text-lg"
              style={{ opacity: 0, animation: "fadeInUp 0.7s ease-out 0.15s forwards" }}
            >
              {artists.length} artistas da expo coletiva
            </p>
          </div>

          {/* Artistic divider */}
          <div
            className="flex items-center justify-center gap-4 mb-10"
            style={{ opacity: 0, animation: "fadeInUp 0.7s ease-out 0.2s forwards" }}
          >
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold/40" />
            <svg width="20" height="20" viewBox="0 0 20 20" className="text-gold/40">
              <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill="currentColor" />
            </svg>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold/40" />
          </div>

          {/* Search bar */}
          <div
            className="max-w-md mx-auto mb-14"
            style={{ opacity: 0, animation: "fadeInUp 0.7s ease-out 0.3s forwards" }}
          >
            <input
              type="text"
              placeholder="Buscar artista..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-5 py-3 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted outline-none transition-colors duration-300 focus:border-gold"
            />
          </div>

          {/* Artists grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((artist, i) => {
                const delay = 0.3 + i * 0.07;
                return (
                  <Link
                    key={artist.id}
                    href={`/artistas/${artist.slug}`}
                    className="group relative block rounded-xl overflow-hidden border border-border transition-all duration-500 hover:border-gold/60 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(212,168,83,0.2)]"
                    style={{
                      opacity: 0,
                      animation: `fadeInUp 0.6s ease-out ${delay}s forwards`,
                    }}
                  >
                    {/* Abstract gradient background */}
                    <div
                      className="h-40 md:h-48 w-full relative transition-all duration-700 group-hover:scale-105"
                      style={{ background: artistGradient(artist.name) }}
                    >
                      {/* Decorative overlay */}
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          background: `radial-gradient(ellipse at ${30 + (hashStr(artist.id) % 40)}% ${20 + (hashStr(artist.id) % 60)}%, rgba(212,168,83,0.3) 0%, transparent 50%)`,
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-surface to-transparent" />

                      {/* Works count badge */}
                      <span className="absolute top-4 right-4 bg-background/70 backdrop-blur-sm text-gold text-xs font-semibold px-3 py-1 rounded-full border border-gold/20">
                        {artist.works.length}{" "}
                        {artist.works.length === 1 ? "obra" : "obras"}
                      </span>
                    </div>

                    <div className="p-5 bg-surface">
                      {/* Artist name */}
                      <h3 className="text-xl font-heading text-foreground mb-3 group-hover:text-gold transition-colors duration-300">
                        {artist.name}
                      </h3>

                      {/* Characteristics tags */}
                      {artist.characteristics.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {artist.characteristics.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2.5 py-1 rounded-full bg-surface-light text-gold border border-border"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {/* No works message */}
                      {artist.works.length === 0 && (
                        <p className="text-sm text-muted mt-1">
                          Sem obras cadastradas
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* Empty search state */
            <div
              className="text-center py-20"
              style={{ opacity: 0, animation: "fadeInUp 0.5s ease-out forwards" }}
            >
              <p className="text-muted text-lg">Nenhum artista encontrado</p>
            </div>
          )}

          {/* CTA */}
          <div
            className="text-center mt-16"
            style={{
              opacity: 0,
              animation: `fadeInUp 0.7s ease-out ${0.3 + filtered.length * 0.07 + 0.2}s forwards`,
            }}
          >
            <Link
              href="/cadastrar"
              className="inline-flex items-center justify-center px-8 py-4 border border-gold/40 text-gold font-semibold rounded-lg text-lg transition-all duration-300 hover:border-gold hover:bg-gold/10 hover:scale-105"
            >
              Cadastrar novo artista
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
