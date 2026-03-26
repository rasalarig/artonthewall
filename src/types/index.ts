export interface Artwork {
  id: string;
  artistId: string;
  title: string;
  technique: string;
  size: string;
  value: number | null;
  description?: string;
  image?: string; // LEGACY: single base64 data URI — use `images` instead
  images?: string[]; // base64 data URIs for uploaded photos
}

export interface Artist {
  id: string;
  name: string;
  slug: string;
  characteristics: string[];
  featured?: boolean;
  works: Artwork[];
}
