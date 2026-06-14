/**
 * The app's own Location model — mirrors the NORMALIZED shape served by our
 * Cloudflare Worker (`/api/places`), not Ticketmaster's raw response. The Worker
 * owns the provider mapping, so the app is fully decoupled from the data source.
 *
 * A "Location" here is a live event pinned at its venue.
 */
export interface Location {
  id: string;
  name: string;
  /** Genre / segment label, e.g. "Rock". */
  category: string;
  latitude: number;
  longitude: number;
  venue: string;
  city: string;
  address: string;
  imageUrl: string | null;
  /** Pre-formatted by the Worker, e.g. "Jun 14, 2026". */
  dateText: string | null;
  /** Pre-formatted, e.g. "7:00 PM". */
  timeText: string | null;
  /** Pre-formatted price band, e.g. "$24–$150". */
  priceText: string | null;
  /** Ticket purchase link (Ticketmaster). */
  url: string | null;
  description: string;
}

export interface ArtistLink {
  /** e.g. "spotify" | "youtube" | "instagram" | "wiki" | "homepage" | "itunes" */
  type: string;
  url: string;
}

/** Richer payload from `/api/places/:id`. */
export interface LocationDetail extends Location {
  /** Distinct images (event + artist), already de-duped by the Worker. */
  images: string[];
  /** Ticket status, e.g. "onsale" | "offsale" | "cancelled". */
  status: string | null;
  /** Pre-formatted on-sale date, e.g. "Mar 3, 2026". */
  onSaleText: string | null;
  subGenre: string | null;
  pleaseNote: string | null;
  artist: { name: string; links: ArtistLink[] } | null;
}
