// The only provider-specific code in the Worker: fetching from the Ticketmaster
// Discovery API and mapping its raw events into our own Location shape. Swapping
// data providers means rewriting (just) this file.

import { TM_BASE } from "./config";
import type { Env, TMAttraction, TMEvent, TMImage } from "./types";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CURRENCY: Record<string, string> = { USD: "$", CAD: "$", AUD: "$", GBP: "£", EUR: "€" };
const LINK_TYPES = ["spotify","youtube","instagram","wiki","homepage","itunes","facebook","twitter"];

function bestImage(images?: TMImage[]): string | null {
  if (!images?.length) return null;
  const wide = images.filter((i) => i.ratio === "16_9");
  const pool = wide.length ? wide : images;
  return pool.slice().sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0].url;
}
const uuidOf = (u: string) =>
  u.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0] ?? u;

/**
 * Distinct images only. Ticketmaster returns one photo in many crops/sizes (same
 * underlying id), so we group by id and keep the best 16:9 crop of each, merging
 * the event photo with the artist's so the gallery has genuinely different shots.
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
function formatSaleDate(iso?: string): string | null {
  return iso ? formatDate(iso.slice(0, 10)) : null;
}

/** Map a raw Ticketmaster event to our Location shape — fully populated, so the
 *  list and detail endpoints return the same rich object. */
export function normalize(e: TMEvent) {
  const v = e._embedded?.venues?.[0];
  const att = e._embedded?.attractions?.[0];
  const cls = e.classifications?.[0];
  const start = e.dates?.start;
  // Ticketmaster sometimes returns the literal "Undefined" for a missing name.
  const usable = (s?: string) => (s && s !== "Undefined" ? s : undefined);
  return {
    id: e.id,
    name: e.name,
    category: usable(cls?.genre?.name) ?? usable(cls?.segment?.name) ?? "Live Music",
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
    images: distinctImages(e.images, att?.images),
    status: e.dates?.status?.code ?? null,
    onSaleText: formatSaleDate(e.sales?.public?.startDateTime),
    subGenre: usable(cls?.subGenre?.name) ?? null,
    pleaseNote: e.pleaseNote ?? null,
    artist: att?.name ? { name: att.name, links: artistLinks(att) } : null,
  };
}

/** Fetch JSON from the Ticketmaster Discovery API with our key attached. */
export async function tmFetch<T>(
  env: Env,
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const qs = new URLSearchParams({ ...params, apikey: env.TICKETMASTER_API_KEY });
  const res = await fetch(`${TM_BASE}${path}?${qs}`);
  if (!res.ok) throw new Error(`Ticketmaster ${res.status} for ${path}`);
  return (await res.json()) as T;
}
