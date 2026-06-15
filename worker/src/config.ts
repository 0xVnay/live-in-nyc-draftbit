// Every constant the Worker needs, in one place: our routes, the upstream
// endpoints, cache keys, and CORS. Magic strings live here and nowhere else.

export const STALE_RETENTION_SECONDS = 60 * 24 * 60 * 60; // keep stale entries 60 days

// Cache keys — versioned so bumping CACHE_VERSION invalidates old payloads
// after a normalized-shape change.
export const CACHE_VERSION = "v3";
export const cacheKey = {
  list: `${CACHE_VERSION}:places:list`,
  detail: (id: string) => `${CACHE_VERSION}:places:${id}`,
};

// Our public API surface (what the app calls).
export const ROUTES = {
  apiPrefix: "/api/",
  places: "/api/places",
  placeDetail: /^\/api\/places\/(.+)$/, // /api/places/:id
};
export const REFRESH_PARAM = "refresh"; // ?refresh=1 → bypass the KV cache, re-fetch upstream

// Upstream Ticketmaster Discovery API (what the Worker calls).
export const TM_BASE = "https://app.ticketmaster.com/discovery/v2";
export const TM_ENDPOINTS = {
  search: "/events.json",
  event: (id: string) => `/events/${encodeURIComponent(id)}.json`,
};

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
