import type { Location } from "@/src/features/locations/types";

/** Shared props contract implemented by both map platforms
 *  (Map.native.tsx → react-native-maps, Map.web.tsx → react-leaflet),
 *  so the Map screen stays platform-agnostic. */
export interface MapProps {
  locations: Location[];
  /** Index of the currently focused location; the map animates to it. */
  activeIndex: number;
  onMarkerPress: (index: number) => void;
  isDark: boolean;
}
