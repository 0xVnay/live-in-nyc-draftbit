/**
 * Draftbit Map — Cloudflare Worker (Backend-for-Frontend).
 *
 * One public Worker does two jobs:
 *  1. Serves the Expo web export (../dist) as a static site (ASSETS binding).
 *  2. Exposes a normalized API backed by the Ticketmaster Discovery API:
 *       GET /api/places      → live events near the configured city
 *       GET /api/places/:id  → one event with extra images
 *
 * Why a BFF: the API key stays a server secret; the app consumes OUR stable
 * shape (so the provider is swappable — see ticketmaster.ts); responses are
 * cached in KV (under quota, and serves the last good payload on upstream error).
 */
import { cached } from "./cache";
import {
  cacheKey,
  CORS_HEADERS,
  REFRESH_PARAM,
  ROUTES,
  TM_ENDPOINTS,
} from "./config";
import { normalize, tmFetch } from "./ticketmaster";
import type { Env, TMEvent } from "./types";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

const ttlOf = (env: Env) => Number(env.CACHE_TTL_SECONDS) || 21600;

async function handlePlaces(env: Env, force: boolean): Promise<Response> {
  const data = await cached(env, cacheKey.list, ttlOf(env), async () => {
    const res = await tmFetch<{ _embedded?: { events?: TMEvent[] } }>(env, TM_ENDPOINTS.search, {
      city: env.SEARCH_CITY,
      classificationName: env.SEARCH_CLASSIFICATION || "music",
      size: env.SEARCH_SIZE || "60",
      sort: "date,asc",
    });
    const events = res._embedded?.events ?? [];
    const seen = new Set<string>();
    return events
      .map(normalize)
      // need coords for a pin + an image for the card
      .filter((e) => Number.isFinite(e.latitude) && Number.isFinite(e.longitude) && e.imageUrl)
      // de-dupe near-identical listings by name
      .filter((e) => {
        const k = e.name.toLowerCase();
        return seen.has(k) ? false : (seen.add(k), true);
      })
      .slice(0, 20);
  }, force);
  return json(data);
}

async function handlePlaceDetail(env: Env, id: string): Promise<Response> {
  try {
    const data = await cached(env, cacheKey.detail(id), ttlOf(env), () =>
      tmFetch<TMEvent>(env, TM_ENDPOINTS.event(id), {}).then(normalize),
    );
    return json(data);
  } catch {
    return json({ error: "Not found" }, 404);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }
    if (url.pathname.startsWith(ROUTES.apiPrefix)) {
      if (url.pathname === ROUTES.places) {
        return handlePlaces(env, url.searchParams.get(REFRESH_PARAM) === "1");
      }
      const match = url.pathname.match(ROUTES.placeDetail);
      if (match) return handlePlaceDetail(env, decodeURIComponent(match[1]));
      return json({ error: "Unknown endpoint" }, 404);
    }
    // Everything else: serve the static Expo web build.
    return env.ASSETS.fetch(request);
  },
};
