"use client";

import { useMemo, useState } from "react";
import { useCatalog } from "@/hooks/useCatalog";
import { formatBRL, getWorkImages } from "@/lib/catalog";

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
  { label: "Ate R$500", min: 0, max: 500 },
  { label: "R$500-R$1500", min: 500, max: 1500 },
  { label: "R$1500-R$3000", min: 1500, max: 3000 },
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
    <div className="flex flex-1 flex-col px-4 py-16 sm:px-8 lg:px-16">
      {/* ---- Header ---- */}
      <header className="mb-12 text-center">
        <h1
          className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight text-white lowercase"
          style={{ animation: "fadeInUp 0.7s ease-out both" }}
        >
          catalogo
        </h1>
        <p
          className="mt-4 text-muted text-lg"
          style={{ animation: "fadeInUp 0.7s ease-out 0.15s both" }}
        >
          {artworks.length} {artworks.length === 1 ? "obra" : "obras"} no acervo
        </p>
      </header>

      {/* ---- Filter bar ---- */}
      <section
        className="sticky top-[70px] z-20 -mx-4 mb-8 bg-surface/95 px-4 py-5 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-16 lg:px-16 border-b border-border"
        style={{ animation: "fadeInUp 0.6s ease-out 0.1s both" }}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Artist dropdown */}
          <select
            value={artistFilter}
            onChange={(e) => setArtistFilter(e.target.value)}
            className="rounded-full border border-border bg-surface-light px-4 py-2 text-sm text-white outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
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
            className="rounded-full border border-border bg-surface-light px-4 py-2 text-sm text-white outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
          >
            <option value="">Todas as tecnicas</option>
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
                className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase transition ${
                  idx === priceRangeIdx
                    ? "border-accent bg-accent text-black"
                    : "border-border bg-surface-light text-muted hover:border-white/30 hover:text-white"
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
              className="ml-auto text-xs text-accent underline underline-offset-2 transition hover:text-white font-bold"
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
          <p className="text-2xl font-extrabold text-muted tracking-tight">
            Nenhuma obra encontrada
          </p>
          <p className="mt-2 text-sm text-muted/70">
            Tente ajustar os filtros para explorar o acervo.
          </p>
        </div>
      ) : (
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
          {filtered.map((work, index) => {
            const workImages = getWorkImages(work);
            const firstImage = workImages.length > 0 ? workImages[0] : null;
            /* Vary placeholder height based on index for masonry effect */
            const heights = [180, 240, 200, 280, 220, 260];
            const placeholderH = heights[index % heights.length];

            return (
              <article
                key={work.id}
                className="group mb-6 inline-block w-full overflow-hidden rounded-xl bg-surface transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-white/5"
                style={{
                  opacity: 0,
                  animation: `fadeInUp 0.5s ease-out ${Math.min(index * 80, 800)}ms both`,
                }}
              >
                {/* First image (no gradient placeholder when no photo) */}
                {firstImage && (
                  <img
                    src={firstImage}
                    alt={work.title}
                    className="w-full object-cover"
                    style={{ height: placeholderH }}
                  />
                )}

                {/* Content */}
                <div className="p-4">
                  <h2 className="font-extrabold text-lg text-white tracking-tight">
                    {work.title}
                  </h2>

                  {/* Expanded details on hover */}
                  <div className="mt-1 grid max-h-0 gap-1 overflow-hidden transition-all duration-300 group-hover:mt-3 group-hover:max-h-40">
                    <span className="text-sm text-accent-pink font-bold">
                      {work.artistName}
                    </span>
                    <span className="text-sm text-muted">{work.technique}</span>
                    <span className="text-sm text-muted">{work.size}</span>
                    <span className="text-sm font-bold text-accent">
                      {formatBRL(work.value)}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
