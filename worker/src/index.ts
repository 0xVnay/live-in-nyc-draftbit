/**
 * Draftbit Map — Cloudflare Worker (Backend-for-Frontend).
 *
 * One public Worker does two jobs:
 *  1. Serves the Expo web export (../dist) as a static site (ASSETS binding).
 *  2. Exposes a normalized API backed by the Ticketmaster Discovery API:
 *       GET /api/places         -> live events near the configured city
 *       GET /api/places/:id      -> one event with extra images
 *
 * Why a BFF:
 *  - The Ticketmaster key lives here as a server secret, never on the client.
 *  - The client consumes OUR stable shape, so the data provider is swappable.
 *  - Responses are cached in KV: stays well under the 5k/day quota and serves the
 *    last good payload if the upstream errors (the demo never goes blank).
 */

// --- Minimal ambient types (esbuild strips these; avoids a types dep) ---------
interface KVNamespace {
  get(key: string, type: "json"): Promise<{ data: unknown; ts: number } | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}
interface Fetcher {
  fetch(request: Request): Promise<Response>;
}
interface Env {
  ASSETS: Fetcher;
  CACHE: KVNamespace;
  TICKETMASTER_API_KEY: string;
  SEARCH_CITY: string;
  SEARCH_CLASSIFICATION: string;
  SEARCH_SIZE: string;
  CACHE_TTL_SECONDS: string;
}

const STALE_RETENTION_SECONDS = 60 * 24 * 60 * 60; // keep stale 60 days
const TM_BASE = "https://app.ticketmaster.com/discovery/v2";
// Bump when the normalized shape changes, to invalidate old cached payloads.
const CACHE_VERSION = "v2";

// --- CORS ---------------------------------------------------------------------
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// --- Cache helper: fresh -> stale-on-error -> throw ---------------------------
async function cached<T>(
  env: Env,
  key: string,
  ttlSeconds: number,
  produce: () => Promise<T>,
): Promise<T> {
  const entry = await env.CACHE.get(key, "json");
  const now = Date.now();
  if (entry && now - entry.ts < ttlSeconds * 1000) return entry.data as T;
  try {
    const data = await produce();
    await env.CACHE.put(key, JSON.stringify({ data, ts: now }), {
      expirationTtl: STALE_RETENTION_SECONDS,
    });
    return data;
  } catch (err) {
    if (entry) return entry.data as T;
    throw err;
  }
}

// --- Ticketmaster types (only what we use) ------------------------------------
interface TMImage { url: string; ratio?: string; width?: number; height?: number }
interface TMEvent {
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

// --- Formatting helpers -------------------------------------------------------
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CURRENCY: Record<string, string> = { USD: "$", CAD: "$", AUD: "$", GBP: "£", EUR: "€" };

function bestImage(images?: TMImage[]): string | null {
  if (!images?.length) return null;
  const wide = images.filter((i) => i.ratio === "16_9");
  const pool = wide.length ? wide : images;
  return pool.slice().sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0].url;
}
const uuidOf = (u: string) =>
  u.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0] ?? u;

/**
 * Distinct images only. Ticketmaster returns ONE photo in many crops/sizes
 * (same underlying image id), so we group by that id and keep the best 16:9
 * crop of each. We merge the event photo + the artist's photos so the gallery
 * has genuinely different pictures (or stays empty when there's only one).
 */
function distinctImages(...lists: (TMImage[] | undefined)[]): string[] {
  const groups = new Map<string, TMImage>();
  const score = (i: TMImage) => (i.ratio === "16_9" ? 100000 : 0) + (i.width ?? 0);
  for (const list of lists) {
    for (const img of list ?? []) {
      const id = uuidOf(img.url);
      const cur = groups.get(id);
      if (!cur || score(img) > score(cur)) groups.set(id, img);
    }
  }
  return [...groups.values()].map((i) => i.url).slice(0, 6);
}

const LINK_TYPES = [
  "spotify",
  "youtube",
  "instagram",
  "wiki",
  "homepage",
  "itunes",
  "facebook",
  "twitter",
];
type TMAttraction = NonNullable<
  NonNullable<TMEvent["_embedded"]>["attractions"]
>[number];
function artistLinks(att?: TMAttraction): { type: string; url: string }[] {
  const ext = att?.externalLinks ?? {};
  const out: { type: string; url: string }[] = [];
  for (const t of LINK_TYPES) {
    const url = ext[t]?.[0]?.url;
    if (url) out.push({ type: t, url });
  }
  return out;
}
function formatDate(d?: string): string | null {
  if (!d) return null;
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return null;
  return `${MONTHS[m - 1]} ${day}, ${y}`;
}
function formatTime(t?: string): string | null {
  if (!t) return null;
  const [hStr, min] = t.split(":");
  let h = Number(hStr);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${min} ${ampm}`;
}
function formatPrice(pr?: TMEvent["priceRanges"]): string | null {
  const p = pr?.[0];
  if (!p || p.min == null) return null;
  const sym = CURRENCY[p.currency ?? ""] ?? `${p.currency} `;
  const min = Math.round(p.min);
  const max = p.max != null ? Math.round(p.max) : min;
  return min === max ? `${sym}${min}` : `${sym}${min}–${sym}${max}`;
}

// --- Normalizers --------------------------------------------------------------
function normalizeBase(e: TMEvent) {
  const v = e._embedded?.venues?.[0];
  const cls = e.classifications?.[0];
  const genre = cls?.genre?.name;
  const segment = cls?.segment?.name;
  const usable = (s?: string) => (s && s !== "Undefined" ? s : undefined);
  const start = e.dates?.start;
  return {
    id: e.id,
    name: e.name,
    category: usable(genre) ?? usable(segment) ?? "Live Music",
    latitude: Number(v?.location?.latitude),
    longitude: Number(v?.location?.longitude),
    venue: v?.name ?? "",
    city: v?.city?.name ?? "",
    address: v?.address?.line1 ?? "",
    imageUrl: bestImage(e.images),
    dateText: formatDate(start?.localDate),
    timeText: formatTime(start?.localTime),
    priceText: formatPrice(e.priceRanges),
    url: e.url ?? null,
    description: e.info ?? "",
  };
}
function formatSaleDate(iso?: string): string | null {
  return iso ? formatDate(iso.slice(0, 10)) : null;
}

function normalizeDetail(e: TMEvent) {
  const att = e._embedded?.attractions?.[0];
  const cls = e.classifications?.[0];
  const usable = (s?: string) => (s && s !== "Undefined" ? s : undefined);
  return {
    ...normalizeBase(e),
    images: distinctImages(e.images, att?.images),
    status: e.dates?.status?.code ?? null,
    onSaleText: formatSaleDate(e.sales?.public?.startDateTime),
    subGenre: usable(cls?.subGenre?.name) ?? null,
    pleaseNote: e.pleaseNote ?? null,
    artist: att?.name ? { name: att.name, links: artistLinks(att) } : null,
  };
}

async function tmFetch<T>(env: Env, path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ ...params, apikey: env.TICKETMASTER_API_KEY });
  const res = await fetch(`${TM_BASE}${path}?${qs}`);
  if (!res.ok) throw new Error(`Ticketmaster ${res.status} for ${path}`);
  return (await res.json()) as T;
}

// --- Route handlers -----------------------------------------------------------
async function handlePlaces(env: Env): Promise<Response> {
  const ttl = Number(env.CACHE_TTL_SECONDS) || 21600;
  const data = await cached(env, `${CACHE_VERSION}:places:list`, ttl, async () => {
    const res = await tmFetch<{ _embedded?: { events?: TMEvent[] } }>(env, "/events.json", {
      city: env.SEARCH_CITY,
      classificationName: env.SEARCH_CLASSIFICATION || "music",
      size: env.SEARCH_SIZE || "60",
      sort: "date,asc",
    });
    const events = res._embedded?.events ?? [];
    const seen = new Set<string>();
    return events
      .map(normalizeBase)
      // need coords for a pin + an image for the card
      .filter((e) => Number.isFinite(e.latitude) && Number.isFinite(e.longitude) && e.imageUrl)
      // de-dupe near-identical listings by name
      .filter((e) => {
        const k = e.name.toLowerCase();
        return seen.has(k) ? false : (seen.add(k), true);
      })
      .slice(0, 20);
  });
  return json(data);
}

async function handlePlaceDetail(env: Env, id: string): Promise<Response> {
  const ttl = Number(env.CACHE_TTL_SECONDS) || 21600;
  try {
    const data = await cached(env, `${CACHE_VERSION}:places:${id}`, ttl, () =>
      tmFetch<TMEvent>(env, `/events/${encodeURIComponent(id)}.json`, {}).then(normalizeDetail),
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
    if (url.pathname.startsWith("/api/")) {
      if (url.pathname === "/api/places") return handlePlaces(env);
      const match = url.pathname.match(/^\/api\/places\/(.+)$/);
      if (match) return handlePlaceDetail(env, decodeURIComponent(match[1]));
      return json({ error: "Unknown endpoint" }, 404);
    }
    return env.ASSETS.fetch(request);
  },
};
