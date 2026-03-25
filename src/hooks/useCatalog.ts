"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { useCallback } from "react";
import type { Artist, Artwork } from "@/types";
import {
  fetchArtists,
  createArtist,
  updateArtist,
  deleteArtistApi,
  createWork,
  updateWork,
  deleteWorkApi,
  fetchSettings,
  updateSettings,
} from "@/lib/api";

const ARTISTS_KEY = "/api/artists";
const SETTINGS_KEY = "/api/settings";

export function useCatalog() {
  const { data: artists = [], isLoading: loadingArtists } = useSWR<Artist[]>(
    ARTISTS_KEY,
    fetchArtists,
  );

  const { data: settings, isLoading: loadingSettings } = useSWR<{
    markupPercentage: number;
  }>(SETTINGS_KEY, fetchSettings);

  // Flatten all artworks from all artists
  const artworks = artists.flatMap((a) =>
    a.works.map((w: Artwork) => ({ ...w, artistName: a.name })),
  );

  // ---- Artist mutations ----
  const addArtist = useCallback(
    async (data: { name: string; characteristics: string[] }) => {
      const result = await createArtist(data);
      await globalMutate(ARTISTS_KEY);
      return result;
    },
    [],
  );

  const upsertArtist = useCallback(
    async (
      id: string,
      data: Partial<{ name: string; characteristics: string[] }>,
    ) => {
      const result = await updateArtist(id, data);
      await globalMutate(ARTISTS_KEY);
      return result;
    },
    [],
  );

  const removeArtist = useCallback(async (id: string) => {
    await deleteArtistApi(id);
    await globalMutate(ARTISTS_KEY);
  }, []);

  // ---- Work mutations ----
  const addWork = useCallback(
    async (data: Parameters<typeof createWork>[0]) => {
      const result = await createWork(data);
      await globalMutate(ARTISTS_KEY);
      return result;
    },
    [],
  );

  const editWork = useCallback(
    async (id: string, data: Partial<Artwork>) => {
      const result = await updateWork(id, data);
      await globalMutate(ARTISTS_KEY);
      return result;
    },
    [],
  );

  const removeWork = useCallback(async (id: string) => {
    await deleteWorkApi(id);
    await globalMutate(ARTISTS_KEY);
  }, []);

  // ---- Settings ----
  const markupPercentage = settings?.markupPercentage ?? 0.3;

  const updateMarkup = useCallback(async (value: number) => {
    await updateSettings({ markupPercentage: value });
    await globalMutate(SETTINGS_KEY);
  }, []);

  // Helper: find artist by slug from cached data
  const getArtistBySlug = useCallback(
    (slug: string) => artists.find((a) => a.slug === slug),
    [artists],
  );

  const getArtistById = useCallback(
    (id: string) => artists.find((a) => a.id === id),
    [artists],
  );

  return {
    artists,
    artworks,
    isLoading: loadingArtists || loadingSettings,
    // Artist operations
    addArtist,
    upsertArtist,
    removeArtist,
    getArtistBySlug,
    getArtistById,
    // Work operations
    addWork,
    editWork,
    removeWork,
    // Settings
    markupPercentage,
    updateMarkup,
  };
}
