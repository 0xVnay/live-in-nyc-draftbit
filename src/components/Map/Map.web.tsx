import { lazy, Suspense, useEffect, useState } from "react";
import { View } from "react-native";

import { palette } from "@/src/theme/tokens";
import type { MapProps } from "./types";

/**
 * Web map (react-leaflet + free CARTO/OSM tiles).
 *
 * Leaflet touches `window` on import, which would crash Expo's static web
 * export (rendered in Node). So we (a) lazy-load the Leaflet module so it never
 * evaluates during SSR, and (b) only mount it once on the client.
 */
const LeafletMap = lazy(() => import("./LeafletMap"));

export function Map(props: MapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const placeholder = (
    <View
      style={{
        flex: 1,
        backgroundColor: props.isDark
          ? palette.dark.background
          : palette.light.border,
      }}
    />
  );

  if (!mounted) return placeholder;

  return (
    <Suspense fallback={placeholder}>
      <LeafletMap {...props} />
    </Suspense>
  );
}
