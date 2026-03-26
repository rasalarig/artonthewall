import type { Artist, Artwork } from "@/types";

const BASE = "/api";

// ---- Artists ----

export async function fetchArtists(): Promise<Artist[]> {
  const res = await fetch(`${BASE}/artists?all=true`);
  if (!res.ok) throw new Error("Failed to fetch artists");
  return res.json();
}

export async function fetchArtistById(id: string): Promise<Artist> {
  const res = await fetch(`${BASE}/artists/${id}`);
  if (!res.ok) throw new Error("Artist not found");
  return res.json();
}

export async function createArtist(data: {
  name: string;
  characteristics: string[];
}): Promise<Artist> {
  const res = await fetch(`${BASE}/artists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create artist");
  return res.json();
}

export async function updateArtist(
  id: string,
  data: Partial<{ name: string; characteristics: string[] }>,
): Promise<Artist> {
  const res = await fetch(`${BASE}/artists/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update artist");
  return res.json();
}

export async function deleteArtistApi(id: string): Promise<void> {
  const res = await fetch(`${BASE}/artists/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete artist");
}

// ---- Works ----

export async function createWork(data: {
  artistId: string;
  title?: string;
  technique: string;
  size: string;
  value?: number | null;
  description?: string;
  images?: string[];
}): Promise<Artwork> {
  const res = await fetch(`${BASE}/works`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to create work" }));
    throw new Error(err.error || "Failed to create work");
  }
  return res.json();
}

export async function updateWork(
  id: string,
  data: Partial<Artwork>,
): Promise<Artwork> {
  const res = await fetch(`${BASE}/works/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to update work" }));
    throw new Error(err.error || "Failed to update work");
  }
  return res.json();
}

export async function deleteWorkApi(id: string): Promise<void> {
  const res = await fetch(`${BASE}/works/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete work");
}

// ---- Settings ----

export async function fetchSettings(): Promise<{ markupPercentage: number; imageFilter: string }> {
  const res = await fetch(`${BASE}/settings`);
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export async function updateSettings(data: {
  markupPercentage?: number;
  imageFilter?: string;
}): Promise<{ markupPercentage: number; imageFilter: string }> {
  const res = await fetch(`${BASE}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
}
