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
 * Uses createImageBitmap (handles EXIF orientation automatically) with
 * fallback to Image() for older browsers. Limits canvas size for mobile.
 */
export async function compressImage(
  dataUri: string,
  maxWidth = 1200,
  quality = 0.7,
): Promise<string> {
  try {
    // Convert data URI to blob for createImageBitmap
    const response = await fetch(dataUri);
    const blob = await response.blob();

    // createImageBitmap automatically handles EXIF orientation
    // and is more reliable on mobile browsers
    let bmp: ImageBitmap;
    try {
      bmp = await createImageBitmap(blob);
    } catch {
      // Fallback: try with Image element
      return compressWithImage(dataUri, maxWidth, quality);
    }

    const canvas = document.createElement("canvas");
    let w = bmp.width;
    let h = bmp.height;

    if (w > maxWidth) {
      const ratio = maxWidth / w;
      w = maxWidth;
      h = Math.round(h * ratio);
    }

    // Mobile canvas size safety limit (some browsers cap at ~4096x4096)
    const MAX_DIM = 4096;
    if (w > MAX_DIM || h > MAX_DIM) {
      const scale = Math.min(MAX_DIM / w, MAX_DIM / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bmp.close();
      return dataUri;
    }
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();

    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    // Ultimate fallback — return original
    return dataUri;
  }
}

/** Fallback compression using Image element for browsers without createImageBitmap */
function compressWithImage(
  dataUri: string,
  maxWidth: number,
  quality: number,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;

      if (w > maxWidth) {
        const ratio = maxWidth / w;
        w = maxWidth;
        h = Math.round(h * ratio);
      }

      // Mobile canvas size safety
      const MAX_DIM = 4096;
      if (w > MAX_DIM || h > MAX_DIM) {
        const scale = Math.min(MAX_DIM / w, MAX_DIM / h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUri);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUri);
    img.src = dataUri;
  });
}
