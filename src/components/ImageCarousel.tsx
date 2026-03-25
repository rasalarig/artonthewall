"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/* ------------------------------------------------------------------ */
/*  Image Enhancement via Canvas API                                    */
/* ------------------------------------------------------------------ */

/** Cache of enhanced image data URLs keyed by original src */
const enhancedCache = new Map<string, string>();

/**
 * Apply a 3x3 convolution kernel to ImageData (single-pass, works on luminance-weighted channels).
 * Used for blur step of unsharp mask.
 */
function applyConvolution(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  kernel: number[],
  kernelSize: number,
): Uint8ClampedArray {
  const half = Math.floor(kernelSize / 2);
  const output = new Uint8ClampedArray(pixels.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx));
          const py = Math.min(height - 1, Math.max(0, y + ky));
          const idx = (py * width + px) * 4;
          const weight = kernel[(ky + half) * kernelSize + (kx + half)];
          r += pixels[idx] * weight;
          g += pixels[idx + 1] * weight;
          b += pixels[idx + 2] * weight;
        }
      }
      const outIdx = (y * width + x) * 4;
      output[outIdx] = r;
      output[outIdx + 1] = g;
      output[outIdx + 2] = b;
      output[outIdx + 3] = pixels[outIdx + 3];
    }
  }
  return output;
}

/**
 * Professional-grade image enhancement for street art / graffiti photos.
 * Processes at the image's natural resolution via an offscreen canvas.
 */
async function enhanceImage(imageSrc: string): Promise<string> {
  if (enhancedCache.has(imageSrc)) {
    return enhancedCache.get(imageSrc)!;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, w, h);
      const d = imageData.data;

      /* ---- Pixel-by-pixel adjustments ---- */
      for (let i = 0; i < d.length; i += 4) {
        let r = d[i];
        let g = d[i + 1];
        let b = d[i + 2];

        // 1. Shadow recovery: lift dark areas without blowing highlights
        // Use a gentle curve that lifts shadows more than highlights
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const shadowLift = Math.max(0, 1 - lum / 80) * 18; // up to +18 for very dark pixels
        r = Math.min(255, r + shadowLift);
        g = Math.min(255, g + shadowLift);
        b = Math.min(255, b + shadowLift);

        // 2. Brightness boost (+12%)
        r = Math.min(255, r * 1.12);
        g = Math.min(255, g * 1.12);
        b = Math.min(255, b * 1.12);

        // 3. Contrast enhancement (~22%) via S-curve around midpoint
        const contrastFactor = 1.22;
        r = Math.min(255, Math.max(0, (r - 128) * contrastFactor + 128));
        g = Math.min(255, Math.max(0, (g - 128) * contrastFactor + 128));
        b = Math.min(255, Math.max(0, (b - 128) * contrastFactor + 128));

        // 4. Vibrance boost (boost less-saturated colors more, ~25%)
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const sat = maxC > 0 ? (maxC - minC) / maxC : 0;
        // Vibrance: less saturated pixels get a bigger boost
        const vibranceAmount = 0.25 * (1 - sat); // 0-25% depending on current saturation
        const avg = (r + g + b) / 3;
        r = Math.min(255, Math.max(0, r + (r - avg) * vibranceAmount));
        g = Math.min(255, Math.max(0, g + (g - avg) * vibranceAmount));
        b = Math.min(255, Math.max(0, b + (b - avg) * vibranceAmount));

        // 5. Additional saturation boost (~20%)
        const gray2 = 0.299 * r + 0.587 * g + 0.114 * b;
        const satBoost = 1.20;
        r = Math.min(255, Math.max(0, gray2 + (r - gray2) * satBoost));
        g = Math.min(255, Math.max(0, gray2 + (g - gray2) * satBoost));
        b = Math.min(255, Math.max(0, gray2 + (b - gray2) * satBoost));

        // 6. Warmth: very slight warm tone shift (boost red/green slightly, reduce blue)
        r = Math.min(255, r + 3);
        g = Math.min(255, g + 1);
        b = Math.max(0, b - 3);

        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
      }

      ctx.putImageData(imageData, 0, 0);

      /* ---- Unsharp Mask for sharpness ---- */
      const sharpData = ctx.getImageData(0, 0, w, h);
      // Gaussian blur kernel (3x3, sigma ~0.8)
      const blurKernel = [
        1 / 16, 2 / 16, 1 / 16,
        2 / 16, 4 / 16, 2 / 16,
        1 / 16, 2 / 16, 1 / 16,
      ];
      const blurred = applyConvolution(sharpData.data, w, h, blurKernel, 3);

      // Unsharp mask: original + amount * (original - blurred)
      const amount = 0.5; // moderate sharpening
      const sd = sharpData.data;
      for (let i = 0; i < sd.length; i += 4) {
        sd[i] = Math.min(255, Math.max(0, sd[i] + amount * (sd[i] - blurred[i])));
        sd[i + 1] = Math.min(255, Math.max(0, sd[i + 1] + amount * (sd[i + 1] - blurred[i + 1])));
        sd[i + 2] = Math.min(255, Math.max(0, sd[i + 2] + amount * (sd[i + 2] - blurred[i + 2])));
      }
      ctx.putImageData(sharpData, 0, 0);

      const result = canvas.toDataURL("image/jpeg", 0.95);
      enhancedCache.set(imageSrc, result);
      resolve(result);
    };
    img.onerror = () => reject(new Error("Failed to load image for enhancement"));
    img.src = imageSrc;
  });
}

/* ------------------------------------------------------------------ */
/*  Sparkle Icon (magic wand style)                                     */
/* ------------------------------------------------------------------ */

function SparkleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" />
    </svg>
  );
}

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
      className={`${sizeClasses} rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors duration-200 backdrop-blur-sm`}
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
  const [compareMode, setCompareMode] = useState(false);
  const [enhancedSrc, setEnhancedSrc] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const enhancedCacheRef = useRef<Map<number, string>>(new Map());
  const total = images.length;

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % total);
    setCompareMode(false);
    setEnhancedSrc(null);
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + total) % total);
    setCompareMode(false);
    setEnhancedSrc(null);
  }, [total]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (compareMode) {
          setCompareMode(false);
        } else {
          onClose();
        }
      }
      if (e.key === "ArrowRight" && total > 1 && !compareMode) goNext();
      if (e.key === "ArrowLeft" && total > 1 && !compareMode) goPrev();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev, total, compareMode]);

  const handleEnhance = useCallback(async () => {
    // Check local component cache first
    if (enhancedCacheRef.current.has(currentIndex)) {
      setEnhancedSrc(enhancedCacheRef.current.get(currentIndex)!);
      setCompareMode(true);
      return;
    }

    setIsEnhancing(true);
    try {
      const result = await enhanceImage(images[currentIndex]);
      enhancedCacheRef.current.set(currentIndex, result);
      setEnhancedSrc(result);
      setCompareMode(true);
    } catch (err) {
      console.error("Image enhancement failed:", err);
    } finally {
      setIsEnhancing(false);
    }
  }, [currentIndex, images]);

  const handleBack = useCallback(() => {
    setCompareMode(false);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors duration-200"
        aria-label="Fechar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Enhance / Back button */}
      <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
        {!compareMode ? (
          <button
            type="button"
            onClick={handleEnhance}
            disabled={isEnhancing}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
          >
            {isEnhancing ? (
              <>
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm font-medium">Processando...</span>
              </>
            ) : (
              <>
                <SparkleIcon className="w-5 h-5 text-[#FFE600]" />
                <span className="text-sm font-medium">Melhorar Imagem</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-medium">Voltar</span>
          </button>
        )}
      </div>

      {/* Navigation arrows (only in single view mode) */}
      {total > 1 && !compareMode && (
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
      {!compareMode ? (
        /* Single image view */
        <div className="flex items-center justify-center w-[95vw] h-[90vh]" onClick={(e) => e.stopPropagation()}>
          <img
            src={images[currentIndex]}
            alt={`Imagem ${currentIndex + 1} de ${total}`}
            className="max-w-[95vw] max-h-[90vh] object-contain transition-opacity duration-300"
          />
        </div>
      ) : (
        /* Before / After comparison view */
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-[95vw] h-[90vh] px-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Before (Original) */}
          <div className="relative flex items-center justify-center sm:w-[47vw] w-[95vw] sm:h-[90vh] h-[43vh]">
            <img
              src={images[currentIndex]}
              alt={`Original - Imagem ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            <span className="absolute top-3 left-3 bg-black/60 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
              Antes
            </span>
          </div>

          {/* After (Enhanced) */}
          <div className="relative flex items-center justify-center sm:w-[47vw] w-[95vw] sm:h-[90vh] h-[43vh]">
            {enhancedSrc && (
              <img
                src={enhancedSrc}
                alt={`Melhorada - Imagem ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            )}
            <span className="absolute top-3 left-3 bg-black/60 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
              Depois
            </span>
          </div>
        </div>
      )}

      {/* Counter */}
      {total > 1 && !compareMode && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-sm font-medium">
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
          <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
            {currentIndex + 1} / {total}
          </div>
        )}
      </div>

      {/* Lightbox modal — portal to body so fixed positioning works */}
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
