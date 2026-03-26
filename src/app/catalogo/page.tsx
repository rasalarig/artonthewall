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

export default function CatalogoPage() {
  const { artists: allArtists, artworks: allArtworks, isLoading, markupPercentage } = useCatalog();

  // Filter out hidden artists and works for public display
  const artists = allArtists.filter((a) => !a.hidden);
  const artworks = allArtworks.filter((w) => !w.hidden && artists.some((a) => a.id === w.artistId));

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

  const [pdfLoading, setPdfLoading] = useState(false);

  async function handleExportPDF() {
    setPdfLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);
      const res = await fetch("/api/catalog-pdf", { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error("Erro ao gerar PDF");

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/pdf")) {
        // Direct PDF download
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "catalogo-art-on-the-wall.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        // HTML fallback - open in new tab for printing
        const html = await res.text();
        const w = window.open("", "_blank");
        if (w) {
          w.document.write(html);
          w.document.close();
        }
      }
    } catch (e: any) {
      alert(e.message || "Erro ao exportar PDF");
    } finally {
      setPdfLoading(false);
    }
  }

  if (isLoading) return <Loading />;

  return (
    <div className="flex flex-1 flex-col px-4 py-16 sm:px-8 lg:px-16">
      {/* ---- Header ---- */}
      <header className="mb-12 text-center">
        <h1
          className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight text-foreground"
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
        <div
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
          style={{ animation: "fadeInUp 0.7s ease-out 0.3s both" }}
        >
          <button
            onClick={handleExportPDF}
            disabled={pdfLoading}
            className="inline-flex items-center gap-2 rounded-full border border-accent text-accent hover:bg-accent hover:text-black font-bold px-6 py-2 text-sm transition disabled:opacity-60 disabled:cursor-wait"
          >
            {pdfLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                </svg>
                Gerando PDF...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Exportar PDF
              </>
            )}
          </button>
          <button
            onClick={() => window.open("/catalogo-publico", "_blank")}
            className="inline-flex items-center gap-2 rounded-full border border-foreground text-foreground hover:bg-[#D4CCC4] hover:text-black font-bold px-6 py-2 text-sm transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Catalogo Web
          </button>
        </div>
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
                <div className="relative">
                  {workImages.length > 0 && (
                    <ImageCarousel
                      images={workImages}
                      alt={work.title}
                      height={placeholderH}
                      imagePositions={work.imagePositions as Record<string, { x: number; y: number }> | undefined}
                    />
                  )}
                  {work.sold && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="bg-red-700/90 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full text-white border border-red-600/50">
                        Vendido
                      </span>
                    </div>
                  )}
                </div>

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
                    <span className={`text-sm font-bold ${work.sold ? "text-red-400" : "text-accent"}`}>
                      {work.sold ? "Indisponivel" : formatBRL(applyMarkup(work.value, markupPercentage))}
                    </span>
                    {!work.sold && work.value !== null && work.value !== 0 && (
                      <span className="text-[10px] text-muted/50 italic">
                        (valor de catalogo)
                      </span>
                    )}
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
