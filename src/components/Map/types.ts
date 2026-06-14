import type { Location } from "@/src/features/locations/types";

/**
 * Shared contract for the map across platforms.
 *
 * `index.native.tsx` (react-native-maps) and `index.web.tsx` (react-leaflet)
 * both implement this exact interface, so the Map screen is platform-agnostic.
 */
export interface MapProps {
  locations: Location[];
  /** Index of the currently focused location; the map animates to it. */
  activeIndex: number;
  /** Fired when a pin is tapped. */
  onMarkerPress: (index: number) => void;
  isDark: boolean;
}
