/**
 * Map framing for the showcased city. The Worker decides WHICH events to fetch;
 * this only controls how the client frames the map — keep them roughly aligned.
 */
export const CITY = {
  name: "New York",
  center: { latitude: 40.7308, longitude: -73.9973 },
  /** Initial city view: Leaflet zoom + native region delta. */
  initialZoom: 12,
  initialDelta: 0.12,
  /**
   * Focusing a venue PANS to it, zooming in only if currently zoomed out past
   * this — so switching venues doesn't yank the zoom and nearby pins stay visible.
   */
  minFocusZoom: 14,
} as const;
