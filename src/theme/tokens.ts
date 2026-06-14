/**
 * Raw color tokens for contexts where Tailwind classNames don't reach:
 * native map markers, Leaflet, status bar, gradients, etc.
 *
 * Keep these in sync with the Tailwind palette conceptually — this is the
 * single source of truth for imperative colors.
 */
export const palette = {
  brand: "#2563eb",
  brandLight: "#3b82f6",
  light: {
    background: "#ffffff",
    card: "#ffffff",
    text: "#0f172a",
    muted: "#64748b",
    border: "#e2e8f0",
    markerIdle: "#64748b",
  },
  dark: {
    background: "#0b1120",
    card: "#111827",
    text: "#f1f5f9",
    muted: "#94a3b8",
    border: "#1f2937",
    markerIdle: "#94a3b8",
  },
} as const;

export type ColorScheme = "light" | "dark";

export function colorsFor(scheme: ColorScheme) {
  return palette[scheme];
}
