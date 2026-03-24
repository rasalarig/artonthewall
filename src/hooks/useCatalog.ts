"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Artist } from "@/types";
import {
  getAllArtists,
  getArtistBySlug,
  getArtistById,
  getAllArtworks,
  saveArtist,
  deleteArtist,
  resetToSeedData,
} from "@/lib/catalog";

const STORAGE_KEY = "artes-dan-artists";

/**
 * Subscribe to localStorage changes so the catalog re-renders
 * when data is updated (including from other tabs).
 */
function subscribe(callback: () => void): () => void {
  // Listen for storage events from other tabs
  window.addEventListener("storage", callback);

  // Listen for custom events from same-tab mutations
  window.addEventListener("catalog-updated", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("catalog-updated", callback);
  };
}

function getSnapshot(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

function getServerSnapshot(): string {
  return "";
}

/** Dispatch a custom event so same-tab listeners are notified. */
function notifyUpdate(): void {
  window.dispatchEvent(new Event("catalog-updated"));
}

/**
 * React hook that provides reactive access to the art catalog.
 * Automatically re-renders when localStorage data changes.
 */
export function useCatalog() {
  // This triggers re-renders when localStorage changes
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const artists = getAllArtists();
  const artworks = getAllArtworks();

  const upsertArtist = useCallback((artist: Artist) => {
    saveArtist(artist);
    notifyUpdate();
  }, []);

  const removeArtist = useCallback((id: string) => {
    deleteArtist(id);
    notifyUpdate();
  }, []);

  const reset = useCallback(() => {
    resetToSeedData();
    notifyUpdate();
  }, []);

  return {
    artists,
    artworks,
    getArtistBySlug,
    getArtistById,
    upsertArtist,
    removeArtist,
    reset,
  };
}
