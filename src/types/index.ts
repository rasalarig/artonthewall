export interface Artwork {
  id: string;
  artistId: string;
  title: string;
  technique: string;
  size: string;
  value: number | null;
  description?: string;
  image?: string; // base64 data URI for uploaded photos
}

export interface Artist {
  id: string;
  name: string;
  slug: string;
  characteristics: string[];
  works: Artwork[];
}
