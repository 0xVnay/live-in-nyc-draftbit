/**
 * Tiny typed fetch wrapper — centralises JSON parsing + error handling. Throws on
 * non-2xx so React Query surfaces an error state. Sends only CORS-safelisted
 * headers (Accept) so browser requests don't trigger a preflight.
 */
export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) for ${url}`);
  }

  return (await res.json()) as T;
}
