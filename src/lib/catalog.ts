import type { Artwork } from "@/types";

/**
 * Get the images array for an artwork, handling legacy `image` field.
 */
export function getWorkImages(work: Artwork): string[] {
  if (work.images && work.images.length > 0) return work.images;
  if (work.image) return [work.image];
  return [];
}

/**
 * Apply a markup percentage to a value.
 * @param value - base price
 * @param markup - decimal markup (e.g. 0.30 for 30%)
 */
export function applyMarkup(
  value: number | null,
  markup: number,
): number | null {
  if (value === null) return null;
  return Math.round(value * (1 + markup));
}

/**
 * Format a BRL value for display.
 */
export function formatBRL(value: number | null): string {
  if (value === null || value === 0) return "Consultar";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Compress a base64 data URI image using canvas.
 * Resizes to maxWidth (default 1200px) and re-encodes as JPEG at the given quality.
 * Must be called client-side only (uses Image, canvas).
 */
export function compressImage(
  dataUri: string,
  maxWidth = 1200,
  quality = 0.7,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      if (img.width <= maxWidth) {
        canvas.width = img.width;
        canvas.height = img.height;
      } else {
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = Math.round(img.height * ratio);
      }
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      // If decoding fails, return original
      resolve(dataUri);
    };
    img.src = dataUri;
  });
}
