/**
 * Map framing for the city the app showcases (New York City).
 *
 * The Worker decides WHICH events to fetch (city + classification); this just
 * controls how the map is framed on the client. Keep them roughly aligned.
 */
export const CITY = {
  name: "New York",
  center: { latitude: 40.7308, longitude: -73.9973 },
  /** Leaflet zoom + native region delta for the initial city view. */
  initialZoom: 12,
  initialDelta: 0.12,
  /**
   * When focusing a venue we PAN to it and only zoom in if the user is currently
   * zoomed out past this level — so switching venues doesn't yank the zoom around
   * and nearby pins stay visible. (target = max(currentZoom, minFocusZoom))
   */
  minFocusZoom: 14,
} as const;
