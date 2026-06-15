/**
 * Our Location model — the NORMALIZED shape served by the Worker (`/api/places`),
 * not Ticketmaster's raw response, so the app is decoupled from the provider.
 * The list returns these fully populated, so the detail screen is instant.
 */
export interface ArtistLink {
  /** "spotify" | "youtube" | "instagram" | "wiki" | "homepage" | "itunes" */
  type: string;
  url: string;
}

export interface Location {
  id: string;
  name: string;
  category: string; // genre / segment, e.g. "Rock"
  latitude: number;
  longitude: number;
  venue: string;
  city: string;
  address: string;
  imageUrl: string | null;
  // Pre-formatted display strings from the Worker (not Date / number).
  dateText: string | null;
  timeText: string | null;
  priceText: string | null;
  url: string | null;
  description: string;

  // Richer fields — also on the list, so the detail screen is instant.
  images: string[]; // distinct, de-duped by the Worker
  status: string | null; // "onsale" | "offsale" | "cancelled"
  onSaleText: string | null;
  subGenre: string | null;
  pleaseNote: string | null;
  artist: { name: string; links: ArtistLink[] } | null;
}

export type LocationDetail = Location;
