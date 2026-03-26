"use client";

import { useMemo, useState } from "react";
import { useCatalog } from "@/hooks/useCatalog";
import { formatBRL, getDisplayImageUrls, applyMarkup } from "@/lib/catalog";
import { Loading } from "@/components/Loading";
import { ImageCarousel } from "@/components/ImageCarousel";


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

export default function CatalogoPublicoPage() {
  const { artists, artworks, isLoading, markupPercentage } = useCatalog();

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
        const v = applyMarkup(w.value, markupPercentage) ?? 0;
        if (range.min !== null && v < range.min) return false;
        if (range.max !== null && v > range.max) return false;
      }
      return true;
    });
  }, [artworks, artistFilter, techniqueFilter, priceRangeIdx, markupPercentage]);

  const hasActiveFilters =
    artistFilter !== "" || techniqueFilter !== "" || priceRangeIdx !== 0;

  function clearFilters() {
    setArtistFilter("");
    setTechniqueFilter("");
    setPriceRangeIdx(0);
  }

  if (isLoading) return <Loading />;

  return (
    <div className="flex flex-1 flex-col min-h-screen">
      {/* ---- Minimal public header ---- */}
      <header className="bg-accent py-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black uppercase">
          Art on the Wall
        </h1>
        <p className="mt-1 text-sm font-bold text-black/70 uppercase tracking-widest">
          Catalogo Digital
        </p>
      </header>

      <div className="flex flex-1 flex-col px-4 py-12 sm:px-8 lg:px-16">
        {/* ---- Sub-header ---- */}
        <div className="mb-10 text-center">
          <p className="text-muted text-lg">
            {artworks.length} {artworks.length === 1 ? "obra" : "obras"} no acervo
          </p>
        </div>

        {/* ---- Filter bar ---- */}
        <section
          className="sticky top-0 z-20 -mx-4 mb-8 bg-surface/95 px-4 py-5 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-16 lg:px-16 border-b border-border"
        >
          <div className="flex flex-wrap items-center gap-3">
            {/* Artist dropdown */}
            <select
              value={artistFilter}
              onChange={(e) => setArtistFilter(e.target.value)}
              className="rounded-full border border-border bg-surface-light px-4 py-2 text-sm text-foreground outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
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
              className="rounded-full border border-border bg-surface-light px-4 py-2 text-sm text-foreground outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
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
                      : "border-border bg-surface-light text-muted hover:border-[#B8AFA6]/30 hover:text-foreground"
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
                className="ml-auto text-xs text-accent underline underline-offset-2 transition hover:text-foreground font-bold"
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
              const workImages = getDisplayImageUrls(work);
              const placeholderH = 260;

              return (
                <article
                  key={work.id}
                  className="group mb-6 inline-block w-full overflow-hidden rounded-xl bg-surface transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-foreground/5"
                  style={{
                    opacity: 0,
                    animation: `fadeInUp 0.5s ease-out ${Math.min(index * 80, 800)}ms both`,
                  }}
                >
                  {/* Image carousel */}
                  {workImages.length > 0 && (
                    <ImageCarousel
                      images={workImages}
                      alt={work.title}
                      height={placeholderH}
                    />
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <h2 className="font-extrabold text-lg text-foreground tracking-tight">
                      {work.title}
                    </h2>

                    {/* Expanded details on hover */}
                    <div className="mt-3 grid gap-1 sm:mt-1 sm:max-h-0 sm:overflow-hidden sm:transition-all sm:duration-300 sm:group-hover:mt-3 sm:group-hover:max-h-40">
                      <span className="text-sm text-accent-pink font-bold">
                        {work.artistName}
                      </span>
                      <span className="text-sm text-muted">{work.technique}</span>
                      <span className="text-sm text-muted">{work.size}</span>
                      <span className="text-sm font-bold text-accent">
                        {formatBRL(applyMarkup(work.value, markupPercentage))}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Public footer ---- */}
      <footer className="mt-auto border-t border-border bg-black py-8 text-center">
        <p className="text-sm text-muted">
          Art on the Wall &bull; Galeria de Artistas Urbanos
        </p>
      </footer>
    </div>
  );
}
