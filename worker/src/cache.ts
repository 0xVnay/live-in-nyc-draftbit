import { STALE_RETENTION_SECONDS } from "./config";
import type { Env } from "./types";

/**
 * Read-through KV cache: fresh → stale-on-error → throw.
 *
 * Returns the cached payload while it's fresh; otherwise re-produces and stores
 * it. If producing fails, falls back to the last good (stale) entry so the demo
 * never goes blank. `force` skips the freshness check (the app's manual refresh)
 * but still falls back to stale on error.
 */
export async function cached<T>(
  env: Env,
  key: string,
  ttlSeconds: number,
  produce: () => Promise<T>,
  force = false,
): Promise<T> {
  const entry = await env.CACHE.get(key, "json");
  const now = Date.now();
  if (!force && entry && now - entry.ts < ttlSeconds * 1000) return entry.data as T;
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
