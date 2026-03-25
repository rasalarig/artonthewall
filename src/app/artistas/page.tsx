"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useCatalog } from "@/hooks/useCatalog";
import { getWorkImages, formatBRL, applyMarkup } from "@/lib/catalog";
import { Loading } from "@/components/Loading";
import { Lightbox } from "@/components/ImageCarousel";
import type { Artwork } from "@/types";
import { type FilterPreset, getCSSFilter } from "@/lib/imageFilter";

/* ------------------------------------------------------------------ */
/*  Types for the inline carousel                                      */
/* ------------------------------------------------------------------ */
interface CarouselSlide {
  image: string;
  title: string;
  technique: string;
  value: number | null;
}

/* ------------------------------------------------------------------ */
/*  ArtistCardCarousel — inline carousel with work info overlay        */
/* ------------------------------------------------------------------ */
function ArtistCardCarousel({ slides, markupPercentage, activeFilter, onFilterChange }: { slides: CarouselSlide[]; markupPercentage: number; activeFilter: FilterPreset; onFilterChange: (preset: FilterPreset) => void }) {
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
              style={{ filter: getCSSFilter(activeFilter) }}
              onClick={openLightbox}
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
                className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors duration-200 backdrop-blur-sm"
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
                className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors duration-200 backdrop-blur-sm"
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
          <p className="text-white text-sm font-bold leading-tight truncate">
            {displayTitle}
          </p>
          <p className="text-white/70 text-xs leading-tight truncate">
            {current.technique}
          </p>
          <p className="text-accent text-xs font-semibold">
            {formatBRL(applyMarkup(current.value, markupPercentage))}
          </p>
        </div>

        {/* Counter indicator */}
        {total > 1 && (
          <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium z-20">
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
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
        />,
        document.body
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: build flat slides array from artist works                  */
/* ------------------------------------------------------------------ */
function buildSlides(works: Artwork[]): CarouselSlide[] {
  const slides: CarouselSlide[] = [];
  for (const work of works) {
    const images = getWorkImages(work);
    for (const image of images) {
      slides.push({
        image,
        title: work.title,
        technique: work.technique,
        value: work.value,
      });
    }
  }
  return slides;
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function ArtistasPage() {
  const { artists, isLoading, markupPercentage, imageFilter, updateImageFilter } = useCatalog();
  const [search, setSearch] = useState("");

  if (isLoading) return <Loading />;

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
              const slides = buildSlides(artist.works);
              const hasImages = slides.length > 0;

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
                  {/* Image area */}
                  <div className="relative transition-all duration-700 group-hover:scale-105">
                    {hasImages ? (
                      <ArtistCardCarousel slides={slides} markupPercentage={markupPercentage} activeFilter={imageFilter as FilterPreset} onFilterChange={(preset) => updateImageFilter(preset)} />
                    ) : (
                      <div className="h-40 md:h-48 w-full bg-surface flex items-center justify-center">
                        <span className="text-muted text-sm font-medium">
                          {artist.name}
                        </span>
                      </div>
                    )}

                    {/* Works count badge */}
                    <span className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full text-white border border-border z-20">
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
