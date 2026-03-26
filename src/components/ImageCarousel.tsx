"use client";

import React, { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { handleImageError } from "@/lib/catalog";

/* ------------------------------------------------------------------ */
/*  Chevron Arrow Button                                               */
/* ------------------------------------------------------------------ */

function ArrowButton({
  direction,
  onClick,
  size = "md",
}: {
  direction: "left" | "right";
  onClick: (e: React.MouseEvent) => void;
  size?: "md" | "lg";
}) {
  const sizeClasses = size === "lg" ? "w-10 h-10" : "w-8 h-8";
  const iconSize = size === "lg" ? "w-5 h-5" : "w-4 h-4";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${sizeClasses} rounded-full bg-black/60 text-foreground flex items-center justify-center hover:bg-black/80 transition-colors duration-200 backdrop-blur-sm`}
      aria-label={direction === "left" ? "Anterior" : "Proxima"}
    >
      <svg
        className={iconSize}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {direction === "left" ? (
          <polyline points="15 18 9 12 15 6" />
        ) : (
          <polyline points="9 6 15 12 9 18" />
        )}
      </svg>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Lightbox Modal                                                     */
/* ------------------------------------------------------------------ */

export function Lightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const total = images.length;

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && total > 1) goNext();
      if (e.key === "ArrowLeft" && total > 1) goPrev();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev, total]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-[#B8AFA6]/10 text-foreground flex items-center justify-center hover:bg-[#B8AFA6]/20 transition-colors duration-200"
        aria-label="Fechar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Navigation arrows */}
      {total > 1 && (
        <>
          <div className="absolute left-4 z-10" onClick={(e) => e.stopPropagation()}>
            <ArrowButton direction="left" onClick={(e) => { e.stopPropagation(); goPrev(); }} size="lg" />
          </div>
          <div className="absolute right-4 z-10" onClick={(e) => e.stopPropagation()}>
            <ArrowButton direction="right" onClick={(e) => { e.stopPropagation(); goNext(); }} size="lg" />
          </div>
        </>
      )}

      {/* Image area */}
      <div className="flex items-center justify-center w-[95vw] h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <img
          src={images[currentIndex]}
          alt={`Imagem ${currentIndex + 1} de ${total}`}
          className="max-w-[95vw] max-h-[90vh] object-contain transition-opacity duration-300"
          onError={handleImageError}
        />
      </div>

      {/* Counter */}
      {total > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-foreground text-sm font-medium">
          {currentIndex + 1} / {total}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Image Carousel                                                     */
/* ------------------------------------------------------------------ */

export function ImageCarousel({
  images,
  alt,
  height,
  className,
}: {
  images: string[];
  alt: string;
  height: number;
  className?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const total = images.length;

  if (total === 0) return null;

  function goNext(e: React.MouseEvent) {
    e.stopPropagation();
    setCurrentIndex((i) => (i + 1) % total);
  }

  function goPrev(e: React.MouseEvent) {
    e.stopPropagation();
    setCurrentIndex((i) => (i - 1 + total) % total);
  }

  return (
    <>
      <div
        className={`relative w-full overflow-hidden cursor-pointer ${className ?? ""}`}
        style={{ height }}
      >
        {/* Image strip with smooth transition */}
        <div
          className="flex h-full transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`${alt} ${idx + 1}`}
              className="h-full w-full flex-shrink-0 object-cover"
              onClick={() => setLightboxOpen(true)}
              onError={handleImageError}
            />
          ))}
        </div>

        {/* Navigation arrows (only if multiple images) */}
        {total > 1 && (
          <>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ArrowButton direction="left" onClick={goPrev} />
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ArrowButton direction="right" onClick={goNext} />
            </div>
          </>
        )}

        {/* Counter indicator */}
        {total > 1 && (
          <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-foreground text-xs font-medium">
            {currentIndex + 1} / {total}
          </div>
        )}
      </div>

      {/* Lightbox modal -- portal to body so fixed positioning works */}
      {lightboxOpen && createPortal(
        <Lightbox
          images={images}
          initialIndex={currentIndex}
          onClose={() => setLightboxOpen(false)}
        />,
        document.body
      )}
    </>
  );
}
