import { Artist, Artwork } from "@/types";
import { artists as seedArtists } from "@/data/artists";

const STORAGE_KEY = "artes-dan-artists";

/** Platform markup percentage applied to catalog/public-facing prices. */
export const PLATFORM_MARKUP = 0.30; // 30% markup

/**
 * Apply the platform markup to a value.
 * Returns null if the input is null, otherwise rounds to the nearest integer.
 */
export function applyMarkup(value: number | null): number | null {
  if (value === null) return null;
  return Math.round(value * (1 + PLATFORM_MARKUP));
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
 * Save artists to localStorage (client-side only).
 */
function saveArtists(artists: Artist[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(artists));
  } catch {
    // Storage full or unavailable
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
export function saveArtist(artist: Artist): void {
  const all = getAllArtists();
  const idx = all.findIndex((a) => a.id === artist.id);
  if (idx >= 0) {
    all[idx] = artist;
  } else {
    all.push(artist);
  }
  saveArtists(all);
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
