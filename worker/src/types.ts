// Cloudflare bindings + the slice of the Ticketmaster Discovery API we consume.
// (esbuild strips these at build time, so there's no runtime types dependency.)

export interface KVNamespace {
  get(key: string, type: "json"): Promise<{ data: unknown; ts: number } | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}
export interface Fetcher {
  fetch(request: Request): Promise<Response>;
}
export interface Env {
  ASSETS: Fetcher;
  CACHE: KVNamespace;
  TICKETMASTER_API_KEY: string;
  SEARCH_CITY: string;
  SEARCH_CLASSIFICATION: string;
  SEARCH_SIZE: string;
  CACHE_TTL_SECONDS: string;
}

// --- Ticketmaster types (only the fields we use) ---
export interface TMImage {
  url: string;
  ratio?: string;
  width?: number;
  height?: number;
}
export interface TMEvent {
  id: string;
  name: string;
  url?: string;
  info?: string;
  pleaseNote?: string;
  images?: TMImage[];
  dates?: {
    start?: { localDate?: string; localTime?: string };
    status?: { code?: string };
  };
  sales?: { public?: { startDateTime?: string } };
  priceRanges?: { min?: number; max?: number; currency?: string }[];
  classifications?: {
    segment?: { name?: string };
    genre?: { name?: string };
    subGenre?: { name?: string };
  }[];
  _embedded?: {
    venues?: {
      name?: string;
      city?: { name?: string };
      address?: { line1?: string };
      location?: { latitude?: string; longitude?: string };
    }[];
    attractions?: {
      name?: string;
      images?: TMImage[];
      externalLinks?: Record<string, { url?: string }[]>;
    }[];
  };
}
export type TMAttraction = NonNullable<
  NonNullable<TMEvent["_embedded"]>["attractions"]
>[number];
