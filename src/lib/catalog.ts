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
 * Convert a work's images to displayable URLs.
 * Base64 data URIs are converted to /api/works/:id/image/:index proxy URLs.
 * Regular URLs (Cloudinary, etc.) are kept as-is.
 */
export function getDisplayImageUrls(work: Artwork): string[] {
  const images = work.images && work.images.length > 0
    ? work.images
    : work.image
      ? [work.image]
      : [];
  return images.map((img, index) => {
    if (img.startsWith("data:")) {
      return `/api/works/${work.id}/image/${index}`;
    }
    return img;
  });
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
 * Convert a data URI to a Blob without using fetch (Safari 13+ compatible).
 */
function dataURItoBlob(dataUri: string): Blob {
  const [header, base64Data] = dataUri.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(base64Data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

/**
 * Compress a base64 data URI image using canvas.
 * Compatible with Safari 13+. Uses createImageBitmap when available
 * (handles EXIF orientation) with fallback to Image element.
 * Targets ~100-200KB output for mobile-friendly storage.
 */
export async function compressImage(
  dataUri: string,
  maxWidth = 800,
  quality = 0.5,
): Promise<string> {
  // Try createImageBitmap first (Safari 15+, Chrome, Firefox)
  // It handles EXIF orientation automatically
  if (typeof createImageBitmap !== "undefined") {
    try {
      const blob = dataURItoBlob(dataUri);
      const bmp = await createImageBitmap(blob);
      const result = drawToCanvas(bmp, bmp.width, bmp.height, maxWidth, quality);
      bmp.close();
      if (result) return result;
    } catch {
      // Fall through to Image fallback
    }
  }

  // Fallback: Image element (works on all browsers including Safari 13+)
  return compressWithImage(dataUri, maxWidth, quality);
}

/** Draw an image source to a canvas and return JPEG data URI */
function drawToCanvas(
  source: ImageBitmap | HTMLImageElement,
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  quality: number,
): string | null {
  let w = srcWidth;
  let h = srcHeight;

  if (w > maxWidth) {
    const ratio = maxWidth / w;
    w = maxWidth;
    h = Math.round(h * ratio);
  }

  // Mobile canvas size safety limit
  const MAX_DIM = 4096;
  if (w > MAX_DIM || h > MAX_DIM) {
    const scale = Math.min(MAX_DIM / w, MAX_DIM / h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Fallback compression using Image element for older Safari */
function compressWithImage(
  dataUri: string,
  maxWidth: number,
  quality: number,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const result = drawToCanvas(img, w, h, maxWidth, quality);
      resolve(result || dataUri);
    };
    img.onerror = () => resolve(dataUri);
    img.src = dataUri;
  });
}
