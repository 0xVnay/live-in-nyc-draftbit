import { API_BASE_URL } from "@/src/lib/env";
import { getJson } from "@/src/lib/http";
import type { Location, LocationDetail } from "./types";

/**
 * Data access — talks to OUR Cloudflare Worker, never to Ticketmaster directly.
 * The Worker hides the API key, normalizes the response, and caches it.
 */

export function fetchLocations(
  signal?: AbortSignal,
  force = false,
): Promise<Location[]> {
  // `force` adds ?refresh=1 so the Worker bypasses its KV cache and re-fetches
  // upstream — used by the app's manual refresh.
  const url = `${API_BASE_URL}/api/places${force ? "?refresh=1" : ""}`;
  return getJson<Location[]>(url, signal);
}

export function fetchLocation(
  id: string,
  signal?: AbortSignal,
): Promise<LocationDetail> {
  return getJson<LocationDetail>(
    `${API_BASE_URL}/api/places/${encodeURIComponent(id)}`,
    signal,
  );
}
