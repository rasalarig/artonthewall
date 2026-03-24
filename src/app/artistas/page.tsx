"use client";

import { useState } from "react";
import Link from "next/link";
import { useCatalog } from "@/hooks/useCatalog";

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
              className="text-4xl md:text-5xl font-heading tracking-wide text-neon-cyan mb-3 text-spray"
              style={{ opacity: 0, animation: "fadeInUp 0.7s ease-out forwards" }}
            >
              ARTISTAS
            </h1>
            <p
              className="text-muted text-lg font-accent"
              style={{ opacity: 0, animation: "fadeInUp 0.7s ease-out 0.15s forwards" }}
            >
              {artists.length} artistas da expo coletiva
            </p>
          </div>

          {/* Spray paint line divider */}
          <div
            className="flex items-center justify-center gap-4 mb-10"
            style={{ opacity: 0, animation: "fadeInUp 0.7s ease-out 0.2s forwards" }}
          >
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-neon-pink/40" />
            <svg width="24" height="24" viewBox="0 0 24 24" className="text-neon-pink/50">
              <circle cx="12" cy="12" r="4" fill="currentColor" />
              <circle cx="5" cy="8" r="2" fill="currentColor" opacity="0.4" />
              <circle cx="19" cy="15" r="2.5" fill="currentColor" opacity="0.3" />
              <circle cx="8" cy="18" r="1.5" fill="currentColor" opacity="0.2" />
              <circle cx="17" cy="6" r="1.5" fill="currentColor" opacity="0.3" />
            </svg>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-neon-cyan/40" />
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
              className="w-full px-5 py-3 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted outline-none transition-colors duration-300 focus:border-neon-cyan focus:shadow-[0_0_10px_rgba(0,240,255,0.15)]"
            />
          </div>

          {/* Artists grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((artist, i) => {
                const delay = 0.3 + i * 0.07;
                const glowColor = neonColor(i);
                return (
                  <Link
                    key={artist.id}
                    href={`/artistas/${artist.slug}`}
                    className="group relative block rounded-xl overflow-hidden border border-border transition-all duration-500 hover:scale-[1.03]"
                    style={{
                      opacity: 0,
                      animation: `fadeInUp 0.6s ease-out ${delay}s forwards`,
                    }}
                  >
                    {/* Hover glow */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none z-10"
                      style={{
                        boxShadow: `0 0 30px ${glowColor}30`,
                      }}
                    />

                    {/* Abstract gradient background */}
                    <div
                      className="h-40 md:h-48 w-full relative transition-all duration-700 group-hover:scale-105"
                      style={{ background: artistGradient(artist.name) }}
                    >
                      {/* Decorative overlay */}
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          background: `radial-gradient(ellipse at ${30 + (hashStr(artist.id) % 40)}% ${20 + (hashStr(artist.id) % 60)}%, ${glowColor}40 0%, transparent 50%)`,
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-surface to-transparent" />

                      {/* Works count badge */}
                      <span
                        className="absolute top-4 right-4 bg-background/70 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full border"
                        style={{ color: glowColor, borderColor: `${glowColor}30` }}
                      >
                        {artist.works.length}{" "}
                        {artist.works.length === 1 ? "obra" : "obras"}
                      </span>
                    </div>

                    <div className="p-5 bg-surface">
                      {/* Artist name */}
                      <h3 className="text-xl font-heading text-foreground mb-3 group-hover:text-neon-cyan transition-colors duration-300">
                        {artist.name}
                      </h3>

                      {/* Characteristics tags — sticker style */}
                      {artist.characteristics.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {artist.characteristics.map((tag, ti) => (
                            <span
                              key={tag}
                              className="sticker text-xs px-2.5 py-1 rounded-full bg-surface-light border border-border font-bold"
                              style={{
                                color: neonColor(ti + i),
                                ["--sticker-rotation" as string]: `${(ti % 3) - 1}deg`,
                              }}
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
              className="inline-flex items-center justify-center px-8 py-4 border border-neon-cyan/40 text-neon-cyan font-bold rounded-lg text-lg uppercase tracking-wider transition-all duration-300 hover:border-neon-cyan hover:bg-neon-cyan/10 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]"
            >
              Cadastrar novo artista
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
