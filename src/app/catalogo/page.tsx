"use client";

import { useMemo, useState } from "react";
import { useCatalog } from "@/hooks/useCatalog";
import { formatBRL } from "@/lib/catalog";
import { stringToHSL } from "@/lib/colors";

/* ------------------------------------------------------------------ */
/*  Price range helpers                                                */
/* ------------------------------------------------------------------ */

interface PriceRange {
  label: string;
  min: number | null;
  max: number | null;
}

const PRICE_RANGES: PriceRange[] = [
  { label: "Todos", min: null, max: null },
  { label: "Até R$500", min: 0, max: 500 },
  { label: "R$500–R$1500", min: 500, max: 1500 },
  { label: "R$1500–R$3000", min: 1500, max: 3000 },
  { label: "R$3000+", min: 3000, max: null },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CatalogoPage() {
  const { artists, artworks } = useCatalog();

  /* Filter state */
  const [artistFilter, setArtistFilter] = useState<string>("");
  const [techniqueFilter, setTechniqueFilter] = useState<string>("");
  const [priceRangeIdx, setPriceRangeIdx] = useState<number>(0);

  /* Derived: unique techniques */
  const techniques = useMemo(() => {
    const set = new Set<string>();
    for (const w of artworks) {
      if (w.technique) set.add(w.technique);
    }
    return Array.from(set).sort();
  }, [artworks]);

  /* Filtered artworks */
  const filtered = useMemo(() => {
    const range = PRICE_RANGES[priceRangeIdx];
    return artworks.filter((w) => {
      if (artistFilter && w.artistId !== artistFilter) return false;
      if (techniqueFilter && w.technique !== techniqueFilter) return false;
      if (range.min !== null || range.max !== null) {
        const v = w.value ?? 0;
        if (range.min !== null && v < range.min) return false;
        if (range.max !== null && v > range.max) return false;
      }
      return true;
    });
  }, [artworks, artistFilter, techniqueFilter, priceRangeIdx]);

  const hasActiveFilters =
    artistFilter !== "" || techniqueFilter !== "" || priceRangeIdx !== 0;

  function clearFilters() {
    setArtistFilter("");
    setTechniqueFilter("");
    setPriceRangeIdx(0);
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-16 sm:px-8 lg:px-16">
      {/* ---- Header ---- */}
      <header className="mb-8 text-center">
        <h1 className="font-heading text-4xl font-bold tracking-wide text-gold sm:text-5xl">
          Catálogo
        </h1>
        <p className="mt-3 text-muted">
          {artworks.length} {artworks.length === 1 ? "obra" : "obras"} no acervo
        </p>
      </header>

      {/* ---- Filter bar ---- */}
      <section
        className="sticky top-0 z-20 -mx-4 mb-6 bg-background/90 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-16 lg:px-16"
        style={{
          animationName: "fadeInUp",
          animationDuration: "600ms",
          animationTimingFunction: "ease-out",
          animationFillMode: "both",
          animationDelay: "100ms",
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Artist dropdown */}
          <select
            value={artistFilter}
            onChange={(e) => setArtistFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
          >
            <option value="">Todos os artistas</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Technique dropdown */}
          <select
            value={techniqueFilter}
            onChange={(e) => setTechniqueFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
          >
            <option value="">Todas as técnicas</option>
            {techniques.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Price range buttons */}
          <div className="flex flex-wrap gap-2">
            {PRICE_RANGES.map((range, idx) => (
              <button
                key={range.label}
                onClick={() => setPriceRangeIdx(idx)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  idx === priceRangeIdx
                    ? "border-gold bg-gold/20 text-gold-light"
                    : "border-border bg-surface text-muted hover:border-gold/50 hover:text-foreground"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-gold underline underline-offset-2 transition hover:text-gold-light"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Results count */}
        <p className="mt-3 text-sm text-muted">
          {filtered.length} {filtered.length === 1 ? "obra encontrada" : "obras encontradas"}
        </p>
      </section>

      {/* ---- Grid / Empty state ---- */}
      {filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 text-6xl opacity-30">~</div>
          <p className="font-heading text-2xl text-muted">
            Nenhuma obra encontrada
          </p>
          <p className="mt-2 text-sm text-muted/70">
            Tente ajustar os filtros para explorar o acervo.
          </p>
        </div>
      ) : (
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {filtered.map((work, index) => {
            const color1 = stringToHSL(work.artistName + work.title, 65, 35);
            const color2 = stringToHSL(work.title + work.artistName, 55, 25);
            /* Vary placeholder height based on index for masonry effect */
            const heights = [180, 240, 200, 280, 220, 260];
            const placeholderH = heights[index % heights.length];

            return (
              <article
                key={work.id}
                className={`catalog-card group mb-5 inline-block w-full overflow-hidden rounded-xl border border-border bg-surface transition-all duration-300 hover:border-gold/60 hover:shadow-[0_0_20px_rgba(212,168,83,0.15)]`}
                style={{
                  animationName: "fadeInUp",
                  animationDuration: "500ms",
                  animationTimingFunction: "ease-out",
                  animationFillMode: "both",
                  animationDelay: `${Math.min(index * 80, 800)}ms`,
                  ["--card-rotation" as string]: `${((index * 7 + 3) % 5) - 2}deg`,
                }}
              >
                {/* Gradient placeholder */}
                <div
                  className="w-full"
                  style={{
                    height: placeholderH,
                    background: `linear-gradient(135deg, ${color1}, ${color2})`,
                  }}
                />

                {/* Content */}
                <div className="p-4">
                  <h2 className="font-heading text-lg font-semibold text-foreground">
                    {work.title}
                  </h2>

                  {/* Expanded details on hover */}
                  <div className="mt-1 grid max-h-0 gap-1 overflow-hidden transition-all duration-300 group-hover:mt-3 group-hover:max-h-40">
                    <span className="text-sm text-gold-light">
                      {work.artistName}
                    </span>
                    <span className="text-sm text-muted">{work.technique}</span>
                    <span className="text-sm text-muted">{work.size}</span>
                    <span className="text-sm font-medium text-gold">
                      {formatBRL(work.value)}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Keyframes injected via style tag */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
