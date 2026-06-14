/**
 * Tiny typed fetch wrapper. Centralises JSON parsing + error handling so the
 * data layer never repeats it. Throws a descriptive Error on non-2xx so
 * React Query can surface it to the UI as an error state.
 *
 * Only CORS-safelisted headers are sent (Accept) so browser requests to the
 * Worker don't trigger a preflight.
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
