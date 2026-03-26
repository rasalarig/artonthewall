"use client";

import { useState } from "react";
import { mutate as globalMutate } from "swr";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useCatalog } from "@/hooks/useCatalog";
import { getDisplayImageUrls, formatBRL, applyMarkup, handleImageError } from "@/lib/catalog";
import { Loading } from "@/components/Loading";
import { Lightbox } from "@/components/ImageCarousel";
import { DraggableList } from "@/components/DraggableList";
import type { Artist, Artwork } from "@/types";

/* ------------------------------------------------------------------ */
/*  Types for the inline carousel                                      */
/* ------------------------------------------------------------------ */
interface CarouselSlide {
  image: string;
  title: string;
  technique: string;
  value: number | null;
  sold: boolean;
}

/* ------------------------------------------------------------------ */
/*  ArtistCardCarousel — inline carousel with work info overlay        */
/* ------------------------------------------------------------------ */
function ArtistCardCarousel({ slides, markupPercentage }: { slides: CarouselSlide[]; markupPercentage: number }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const total = slides.length;

  if (total === 0) return null;

  const current = slides[currentIndex];
  const displayTitle =
    current.title === "Sem titulo" ? "-" : current.title;

  function goPrev(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((i) => (i - 1 + total) % total);
  }

  function goNext(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((i) => (i + 1) % total);
  }

  function openLightbox(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLightboxOpen(true);
  }

  return (
    <>
      <div className="relative w-full h-40 md:h-48 overflow-hidden">
        {/* Image strip */}
        <div
          className="flex h-full transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide, idx) => (
            <img
              key={idx}
              src={slide.image}
              alt={slide.title}
              className="h-full w-full flex-shrink-0 object-cover cursor-pointer"
              onClick={openLightbox}
              onError={handleImageError}
            />
          ))}
        </div>

        {/* Navigation arrows */}
        {total > 1 && (
          <>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
              <button
                type="button"
                onClick={goPrev}
                className="w-8 h-8 rounded-full bg-black/60 text-foreground flex items-center justify-center hover:bg-black/80 transition-colors duration-200 backdrop-blur-sm"
                aria-label="Anterior"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
              <button
                type="button"
                onClick={goNext}
                className="w-8 h-8 rounded-full bg-black/60 text-foreground flex items-center justify-center hover:bg-black/80 transition-colors duration-200 backdrop-blur-sm"
                aria-label="Proxima"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 6 15 12 9 18" />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* Work info overlay at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-3 pb-2 pt-8 z-10">
          <p className="text-foreground text-sm font-bold leading-tight truncate">
            {displayTitle}
          </p>
          <p className="text-foreground/70 text-xs leading-tight truncate">
            {current.technique}
          </p>
          <p className={`text-xs font-semibold ${current.sold ? "text-red-400" : "text-accent"}`}>
            {current.sold ? "Indisponivel" : formatBRL(applyMarkup(current.value, markupPercentage))}
          </p>
        </div>

        {/* Counter indicator */}
        {total > 1 && (
          <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-foreground text-xs font-medium z-20">
            {currentIndex + 1} / {total}
          </div>
        )}
      </div>

      {/* Lightbox modal — portal to body */}
      {lightboxOpen && createPortal(
        <Lightbox
          images={slides.map((s) => s.image)}
          initialIndex={currentIndex}
          onClose={() => setLightboxOpen(false)}
        />,
        document.body
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: build flat slides array from artist works                  */
/* ------------------------------------------------------------------ */
function buildSlides(works: Artwork[], coverWorkId?: string): CarouselSlide[] {
  const slides: CarouselSlide[] = [];
  // Put cover work first if specified
  const sorted = coverWorkId
    ? [...works].sort((a, b) => (a.id === coverWorkId ? -1 : b.id === coverWorkId ? 1 : 0))
    : works;
  for (const work of sorted) {
    const images = getDisplayImageUrls(work);
    for (const image of images) {
      slides.push({
        image,
        title: work.title,
        technique: work.technique,
        value: work.value,
        sold: work.sold ?? false,
      });
    }
  }
  return slides;
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function ArtistasPage() {
  const { artists, isLoading, markupPercentage } = useCatalog();
  const [search, setSearch] = useState("");
  const [featuredMap, setFeaturedMap] = useState<Record<string, boolean>>({});
  const [hiddenMap, setHiddenMap] = useState<Record<string, boolean>>({});
  const [showHidden, setShowHidden] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  // Initialize featuredMap and hiddenMap from artists data once loaded
  if (!initialized && artists.length > 0) {
    const fMap: Record<string, boolean> = {};
    const hMap: Record<string, boolean> = {};
    for (const a of artists) {
      fMap[a.id] = a.featured ?? false;
      hMap[a.id] = a.hidden ?? false;
    }
    setFeaturedMap(fMap);
    setHiddenMap(hMap);
    setInitialized(true);
  }

  async function toggleFeatured(e: React.MouseEvent, artistId: string) {
    e.preventDefault();
    e.stopPropagation();
    const current = featuredMap[artistId] ?? false;
    const next = !current;
    setFeaturedMap((prev) => ({ ...prev, [artistId]: next }));
    try {
      await fetch(`/api/artists/${artistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: next }),
      });
      await globalMutate("/api/artists?all=true");
    } catch {
      setFeaturedMap((prev) => ({ ...prev, [artistId]: current }));
    }
  }

  async function toggleHidden(e: React.MouseEvent, artistId: string) {
    e.preventDefault();
    e.stopPropagation();
    const current = hiddenMap[artistId] ?? false;
    const next = !current;
    setHiddenMap((prev) => ({ ...prev, [artistId]: next }));
    try {
      await fetch(`/api/artists/${artistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: next }),
      });
      await globalMutate("/api/artists?all=true");
    } catch {
      setHiddenMap((prev) => ({ ...prev, [artistId]: current }));
    }
  }

  async function handleReorder(reordered: Artist[]) {
    setSavingOrder(true);
    const items = reordered.map((a, index) => ({ id: a.id, sortOrder: index }));
    try {
      await fetch("/api/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "artist", items }),
      });
      await globalMutate("/api/artists?all=true");
    } catch {
      // ignore
    } finally {
      setSavingOrder(false);
    }
  }

  if (isLoading) return <Loading />;

  const filtered = artists.filter((a) => {
    if (!showHidden && (hiddenMap[a.id] ?? a.hidden)) return false;
    return a.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="min-h-screen px-6 py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1
            className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight text-foreground mb-4"
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
          className="max-w-md mx-auto mb-8"
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

        {/* Show/hide hidden toggle + Reorder toggle */}
        <div
          className="flex justify-center gap-3 mb-16 flex-wrap"
          style={{ animation: "fadeInUp 0.7s ease-out 0.35s both" }}
        >
          <button
            onClick={() => setShowHidden((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-bold transition-all duration-300 ${
              showHidden
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface-light text-muted hover:border-accent hover:text-accent"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              {showHidden ? (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              ) : (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              )}
            </svg>
            {showHidden ? "Mostrando ocultos" : "Ocultos escondidos"}
          </button>
          <button
            onClick={() => setReorderMode((v) => !v)}
            disabled={savingOrder}
            className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-bold transition-all duration-300 ${
              reorderMode
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-surface-light text-muted hover:border-accent hover:text-accent"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
              <polyline points="7 4 5 6 7 8" />
              <polyline points="17 10 19 12 17 14" />
              <polyline points="7 16 5 18 7 20" />
            </svg>
            {savingOrder ? "Salvando..." : reorderMode ? "Reordenando" : "Reordenar"}
          </button>
        </div>

        {/* Artists grid */}
        {filtered.length > 0 ? (
          reorderMode ? (
            <DraggableList
              items={filtered}
              keyExtractor={(a) => a.id}
              onReorder={handleReorder}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              renderItem={(artist, _i, dragProps) => {
                const slides = buildSlides(artist.works, artist.coverWorkId);
                const hasImages = slides.length > 0;
                const isHidden = hiddenMap[artist.id] ?? artist.hidden ?? false;

                return (
                  <div
                    {...dragProps}
                    className={`group relative block rounded-xl overflow-hidden border border-border bg-black cursor-grab active:cursor-grabbing transition-all duration-300${isHidden ? " opacity-50" : ""}`}
                  >
                    {/* Drag handle bar */}
                    <div className="flex items-center justify-center gap-1.5 py-2 bg-surface-light border-b border-border select-none">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex gap-0.5">
                          <div className="w-1 h-1 rounded-full bg-muted" />
                          <div className="w-1 h-1 rounded-full bg-muted" />
                        </div>
                        <div className="flex gap-0.5">
                          <div className="w-1 h-1 rounded-full bg-muted" />
                          <div className="w-1 h-1 rounded-full bg-muted" />
                        </div>
                        <div className="flex gap-0.5">
                          <div className="w-1 h-1 rounded-full bg-muted" />
                          <div className="w-1 h-1 rounded-full bg-muted" />
                        </div>
                      </div>
                      <span className="text-xs text-muted font-bold ml-1">Arrastar</span>
                    </div>

                    {/* Image area */}
                    <div className="relative pointer-events-none">
                      {hasImages ? (
                        <ArtistCardCarousel slides={slides} markupPercentage={markupPercentage} />
                      ) : (
                        <div className="h-40 md:h-48 w-full bg-surface flex items-center justify-center">
                          <span className="text-muted text-sm font-medium">
                            {artist.name}
                          </span>
                        </div>
                      )}

                      {/* Works count badge */}
                      <span className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full text-foreground border border-border z-20">
                        {artist.works.length}{" "}
                        {artist.works.length === 1 ? "obra" : "obras"}
                      </span>
                    </div>

                    <div className="p-5">
                      <h3 className="text-xl font-extrabold text-foreground mb-3 tracking-tight">
                        {artist.name}
                      </h3>
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
                    </div>
                  </div>
                );
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((artist, i) => {
                const delay = 0.3 + i * 0.07;
                const slides = buildSlides(artist.works, artist.coverWorkId);
                const hasImages = slides.length > 0;
                const isHidden = hiddenMap[artist.id] ?? artist.hidden ?? false;

                return (
                  <Link
                    key={artist.id}
                    href={`/artistas/${artist.slug}`}
                    className={`group relative block rounded-xl overflow-hidden border border-border bg-black transition-all duration-500 hover:border-accent hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/10${isHidden ? " opacity-50" : ""}`}
                    style={{
                      opacity: 0,
                      animation: `fadeInUp 0.6s ease-out ${delay}s forwards`,
                    }}
                  >
                    {/* Image area */}
                    <div className="relative transition-all duration-700 group-hover:scale-105">
                      {hasImages ? (
                        <ArtistCardCarousel slides={slides} markupPercentage={markupPercentage} />
                      ) : (
                        <div className="h-40 md:h-48 w-full bg-surface flex items-center justify-center">
                          <span className="text-muted text-sm font-medium">
                            {artist.name}
                          </span>
                        </div>
                      )}

                      {/* Featured star button */}
                      <button
                        type="button"
                        onClick={(e) => toggleFeatured(e, artist.id)}
                        className="absolute top-4 left-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/70 backdrop-blur-sm border border-border hover:bg-black/90 transition-colors duration-200"
                        aria-label={featuredMap[artist.id] ? "Remover destaque" : "Marcar como destaque"}
                      >
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill={featuredMap[artist.id] ? "#FFE600" : "none"}
                          stroke={featuredMap[artist.id] ? "#FFE600" : "#999"}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </button>

                      {/* Hide/show eye button */}
                      <button
                        type="button"
                        onClick={(e) => toggleHidden(e, artist.id)}
                        className="absolute top-14 left-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/70 backdrop-blur-sm border border-border hover:bg-black/90 transition-colors duration-200"
                        aria-label={isHidden ? "Tornar visivel" : "Ocultar artista"}
                      >
                        <svg className="w-5 h-5" fill="none" stroke={isHidden ? "#ef4444" : "#999"} viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          {isHidden ? (
                            <>
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </>
                          ) : (
                            <>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </>
                          )}
                        </svg>
                      </button>

                      {/* Oculto badge */}
                      {isHidden && (
                        <span className="absolute top-4 left-16 z-20 bg-red-600/80 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full text-white border border-red-500/50">
                          Oculto
                        </span>
                      )}

                      {/* Works count badge */}
                      <span className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full text-foreground border border-border z-20">
                        {artist.works.length}{" "}
                        {artist.works.length === 1 ? "obra" : "obras"}
                      </span>
                    </div>

                    <div className="p-5">
                      {/* Artist name */}
                      <h3 className="text-xl font-extrabold text-foreground mb-3 group-hover:text-accent transition-colors duration-300 tracking-tight">
                        {artist.name}
                      </h3>

                      {/* Characteristics tags -- clean pills */}
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
          )
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
