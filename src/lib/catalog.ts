import { Artist, Artwork } from "@/types";
import { artists as seedArtists } from "@/data/artists";

const STORAGE_KEY = "artes-dan-artists";

/** Key used to persist the platform markup percentage in localStorage. */
const MARKUP_STORAGE_KEY = "artes-dan-markup";

/** Default markup when nothing is stored (30%). */
const DEFAULT_MARKUP = 0.30;

/**
 * Read the current platform markup percentage from localStorage.
 * Returns DEFAULT_MARKUP on the server or when nothing is stored.
 */
export function getMarkupPercentage(): number {
  if (typeof window === "undefined") return DEFAULT_MARKUP;
  const stored = localStorage.getItem(MARKUP_STORAGE_KEY);
  if (stored !== null) {
    const parsed = parseFloat(stored);
    if (!isNaN(parsed)) return parsed;
  }
  return DEFAULT_MARKUP;
}

/**
 * Persist a new platform markup percentage to localStorage.
 * @param value The markup as a decimal (e.g. 0.30 for 30%).
 */
export function setMarkupPercentage(value: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MARKUP_STORAGE_KEY, String(value));
}

/**
 * Apply the platform markup to a value.
 * Returns null if the input is null, otherwise rounds to the nearest integer.
 */
export function applyMarkup(value: number | null): number | null {
  if (value === null) return null;
  return Math.round(value * (1 + getMarkupPercentage()));
}

/**
 * Migrate a single artwork from legacy `image` (string) to `images` (string[]).
 * If the artwork already has `images`, returns it unchanged.
 * If it has the legacy `image` string, converts to a single-element array.
 */
export function migrateArtworkImages(work: Artwork): Artwork {
  if (work.images && work.images.length > 0) return work;
  if (work.image) {
    return { ...work, images: [work.image] };
  }
  return work;
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
 * Get artists from localStorage (client-side only).
 * Returns null if not available (SSR or no stored data).
 */
function getStoredArtists(): Artist[] | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as Artist[];
  } catch {
    return null;
  }
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

/**
 * Save artists to localStorage (client-side only).
 * Returns true on success, false if storage is full or unavailable.
 */
function saveArtists(artists: Artist[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(artists));
    return true;
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
    return false;
  }
}

/**
 * Get all artists, merging seed data with any localStorage overrides.
 * Seed data serves as the base; localStorage data can add new artists
 * or override existing ones (matched by id).
 */
export function getAllArtists(): Artist[] {
  const stored = getStoredArtists();
  if (!stored) return seedArtists;

  // Build a map of stored artists by id
  const storedMap = new Map<string, Artist>();
  for (const artist of stored) {
    storedMap.set(artist.id, artist);
  }

  // Start with seed data, override with stored versions
  const merged: Artist[] = seedArtists.map((seed) => {
    return storedMap.get(seed.id) ?? seed;
  });

  // Add any artists that exist in storage but not in seed data
  for (const artist of stored) {
    if (!seedArtists.find((s) => s.id === artist.id)) {
      merged.push(artist);
    }
  }

  return merged;
}

/**
 * Get a single artist by slug.
 */
export function getArtistBySlug(slug: string): Artist | undefined {
  return getAllArtists().find((a) => a.slug === slug);
}

/**
 * Get a single artist by id.
 */
export function getArtistById(id: string): Artist | undefined {
  return getAllArtists().find((a) => a.id === id);
}

/**
 * Get all artworks across all artists.
 */
export function getAllArtworks(): (Artwork & { artistName: string })[] {
  const artists = getAllArtists();
  const artworks: (Artwork & { artistName: string })[] = [];
  for (const artist of artists) {
    for (const work of artist.works) {
      artworks.push({ ...work, artistName: artist.name });
    }
  }
  return artworks;
}

/**
 * Save a new or updated artist. Persists to localStorage.
 */
export function saveArtist(artist: Artist): boolean {
  const all = getAllArtists();
  const idx = all.findIndex((a) => a.id === artist.id);
  if (idx >= 0) {
    all[idx] = artist;
  } else {
    all.push(artist);
  }
  return saveArtists(all);
}

/**
 * Delete an artist by id. Persists to localStorage.
 */
export function deleteArtist(id: string): void {
  const all = getAllArtists().filter((a) => a.id !== id);
  saveArtists(all);
}

/**
 * Reset localStorage data back to seed data.
 */
export function resetToSeedData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Format a BRL value for display.
 */
export function formatBRL(value: number | null): string {
  if (value === null || value === 0) return "Consultar";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
