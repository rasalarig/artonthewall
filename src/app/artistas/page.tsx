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
  return `linear-gradient(135deg, hsl(${hue1} 85% 25%) 0%, hsl(${hue2} 75% 30%) 50%, hsl(${hue3} 65% 20%) 100%)`;
}

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
    <div className="min-h-screen px-6 py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight text-white lowercase mb-4"
            style={{ animation: "fadeInUp 0.7s ease-out both" }}
          >
            artistas
          </h1>
          <p
            className="text-muted text-lg"
            style={{ animation: "fadeInUp 0.7s ease-out 0.15s both" }}
          >
            {artists.length} artistas da expo coletiva
          </p>
        </div>

        {/* Search bar */}
        <div
          className="max-w-md mx-auto mb-16"
          style={{ animation: "fadeInUp 0.7s ease-out 0.3s both" }}
        >
          <input
            type="text"
            placeholder="Buscar artista..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-6 py-4 rounded-full bg-white text-black placeholder:text-black/40 outline-none transition-all duration-300 focus:ring-2 focus:ring-accent font-medium"
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
                  className="group relative block rounded-xl overflow-hidden border border-border bg-black transition-all duration-500 hover:border-accent hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/10"
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
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent" />

                    {/* Works count badge */}
                    <span className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full text-white border border-border">
                      {artist.works.length}{" "}
                      {artist.works.length === 1 ? "obra" : "obras"}
                    </span>
                  </div>

                  <div className="p-5">
                    {/* Artist name */}
                    <h3 className="text-xl font-extrabold text-white mb-3 group-hover:text-accent transition-colors duration-300 tracking-tight">
                      {artist.name}
                    </h3>

                    {/* Characteristics tags — clean pills */}
                    {artist.characteristics.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {artist.characteristics.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2.5 py-1 rounded-full bg-surface-light text-muted font-medium"
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
            style={{ animation: "fadeInUp 0.5s ease-out both" }}
          >
            <p className="text-muted text-lg">Nenhum artista encontrado</p>
          </div>
        )}

        {/* CTA */}
        <div
          className="text-center mt-20"
          style={{
            opacity: 0,
            animation: `fadeInUp 0.7s ease-out ${0.3 + filtered.length * 0.07 + 0.2}s forwards`,
          }}
        >
          <Link
            href="/cadastrar"
            className="btn-pill btn-yellow text-lg"
          >
            Cadastrar novo artista
          </Link>
        </div>
      </div>
    </div>
  );
}
