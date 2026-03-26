import type React from "react";
import type { Artwork } from "@/types";

/**
 * Convert a HEIC/HEIF file to JPEG Blob using heic2any.
 * Returns the original file if it's not HEIC or if conversion fails.
 */
export async function convertHeicIfNeeded(file: File): Promise<File> {
  const isHeic = file.type === 'image/heic' || file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');

  if (!isHeic) return file;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const heic2any = ((await import('heic2any')) as any).default;
    const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 }) as Blob;
    const newName = file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch (err) {
    console.error('HEIC conversion failed:', err);
    return file; // fallback: return original
  }
}

/**
 * Fallback SVG placeholder shown when an artwork image fails to load.
 * Used as a data URI to avoid external dependencies.
 */
export const IMAGE_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23333' width='400' height='300'/%3E%3Ctext fill='%23666' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='16'%3EImagem indispon%C3%ADvel%3C/text%3E%3C/svg%3E";

/**
 * onError handler for <img> tags that shows the fallback placeholder.
 * Usage: <img onError={handleImageError} ... />
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement>) {
  const target = e.currentTarget;
  target.onerror = null;
  target.src = IMAGE_FALLBACK;
}

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
  return images
    .filter((img): img is string => typeof img === "string" && img.length > 0)
    .map((img, index) => {
      if (img.startsWith("data:")) {
        return `/api/works/${work.id}/image/${index}`;
      }
      return img;
    });
}

/**
 * Get the cover image URL for an artwork, respecting coverImageIndex.
 */
export function getCoverImageUrl(work: Artwork): string | null {
  const images = getDisplayImageUrls(work);
  if (images.length === 0) return null;
  const idx = work.coverImageIndex ?? 0;
  return images[Math.min(idx, images.length - 1)] ?? images[0];
}

/**
 * Check if a promotional price is currently active.
 */
export function isPromoActive(work: Artwork): boolean {
  if (!work.promoPrice || !work.promoUntil) return false;
  return new Date(work.promoUntil) >= new Date();
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
 * Get the object-position CSS string for an artwork image.
 * Returns "50% 50%" (center) if no custom position is set.
 */
export function getImagePosition(
  work: { imagePositions?: Record<string, { x: number; y: number }> } | null | undefined,
  imageIndex: number = 0,
): string {
  const pos = work?.imagePositions?.[String(imageIndex)];
  return pos ? `${pos.x}% ${pos.y}%` : "50% 50%";
}

/**
 * Convert a data URI to a Blob without using fetch (Safari 13+ compatible).
 * Handles edge cases: malformed data URIs, missing comma, empty data.
 */
function dataURItoBlob(dataUri: string): Blob {
  const commaIndex = dataUri.indexOf(",");
  if (commaIndex === -1) {
    // Malformed data URI — return empty JPEG blob as fallback
    return new Blob([], { type: "image/jpeg" });
  }
  const header = dataUri.slice(0, commaIndex);
  const base64Data = dataUri.slice(commaIndex + 1);
  if (!base64Data) {
    return new Blob([], { type: "image/jpeg" });
  }
  const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
  try {
    const binary = atob(base64Data);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
  } catch {
    // Invalid base64 — return empty blob
    return new Blob([], { type: mime });
  }
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
  // Validate input is a data URI
  if (!dataUri || !dataUri.startsWith("data:image/")) {
    // Return as-is if it's a URL, or a fallback placeholder if truly invalid
    if (dataUri && (dataUri.startsWith("http") || dataUri.startsWith("/"))) {
      return dataUri;
    }
    return dataUri || "";
  }

  // Handle HEIC/HEIF data URIs by converting to JPEG first
  if (dataUri.startsWith("data:image/heic") || dataUri.startsWith("data:image/heif")) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const heic2any = ((await import('heic2any')) as any).default;
      const response = await fetch(dataUri);
      const blob = await response.blob();
      const jpegBlob = await heic2any({ blob, toType: 'image/jpeg', quality: 0.85 }) as Blob;
      // Convert back to data URI
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(dataUri);
        reader.readAsDataURL(jpegBlob);
      });
    } catch {
      return dataUri;
    }
  }

  try {
    // Try createImageBitmap first (Safari 15+, Chrome, Firefox)
    // It handles EXIF orientation automatically
    if (typeof createImageBitmap !== "undefined") {
      try {
        const blob = dataURItoBlob(dataUri);
        if (blob.size > 0) {
          const bmp = await createImageBitmap(blob);
          const result = drawToCanvas(bmp, bmp.width, bmp.height, maxWidth, quality);
          bmp.close();
          if (result && result.startsWith("data:image/")) return result;
        }
      } catch {
        // Fall through to Image fallback
      }
    }

    // Fallback: Image element (works on all browsers including Safari 13+)
    const result = await compressWithImage(dataUri, maxWidth, quality);
    return result && result.startsWith("data:image/") ? result : dataUri;
  } catch {
    // If all compression fails, return original
    return dataUri;
  }
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
