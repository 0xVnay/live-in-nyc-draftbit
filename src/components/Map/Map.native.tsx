import { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

import { CITY } from "@/src/features/locations/config";
import { MarkerPin } from "@/src/features/locations/components/MarkerPin";
import type { Location } from "@/src/features/locations/types";
import type { MapProps } from "./types";

/**
 * A single marker whose view is captured once and then frozen.
 *
 * react-native-maps re-rasterizes a custom marker's view whenever
 * `tracksViewChanges` is true — and that re-rasterization is what makes markers
 * flicker/vanish on iOS while updating. We track changes only briefly (long
 * enough to capture the pin image) and then turn it off, so the marker never
 * re-renders natively again. Its view never changes — only its coordinate moves.
 */
function PinMarker({
  coordinate,
  selected,
  onPress,
}: {
  coordinate: { latitude: number; longitude: number };
  selected: boolean;
  onPress?: () => void;
}) {
  const [tracks, setTracks] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setTracks(false), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={tracks}
      zIndex={selected ? 999 : 1}
    >
      <MarkerPin selected={selected} />
    </Marker>
  );
}

/**
 * Native map (iOS: Apple Maps, Android: Google Maps) via react-native-maps.
 *
 * Two-way sync: tapping a pin or scrolling the carousel changes `activeIndex`,
 * which (a) moves the camera here and (b) moves the single blue "selected"
 * marker. The red idle pins are rendered ONCE and never change, so they never
 * re-rasterize (the source of the vanishing-pin bug on iOS).
 */
export function Map({ locations, activeIndex, onMarkerPress }: MapProps) {
  const mapRef = useRef<MapView>(null);
  const active: Location | undefined = locations[activeIndex];

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    (async () => {
      const cam = await mapRef.current?.getCamera();
      if (cancelled) return;
      // Pan to the venue; only zoom in if currently zoomed out past minFocusZoom.
      const target = Math.max(cam?.zoom ?? CITY.initialZoom, CITY.minFocusZoom);
      mapRef.current?.animateCamera(
        {
          center: { latitude: active.latitude, longitude: active.longitude },
          zoom: target,
        },
        { duration: 500 },
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_DEFAULT}
      style={StyleSheet.absoluteFill}
      initialRegion={{
        latitude: CITY.center.latitude,
        longitude: CITY.center.longitude,
        latitudeDelta: CITY.initialDelta,
        longitudeDelta: CITY.initialDelta,
      }}
    >
      {/* Static red idle pins — rendered once, never change → never flicker. */}
      {locations.map((loc, index) => (
        <PinMarker
          key={loc.id}
          coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
          selected={false}
          onPress={() => onMarkerPress(index)}
        />
      ))}

      {/* One blue selected pin that simply MOVES to the active venue. Its view
          never changes, so it never re-rasterizes — it just slides over. */}
      {active && (
        <PinMarker
          key="__selected__"
          coordinate={{ latitude: active.latitude, longitude: active.longitude }}
          selected
        />
      )}
    </MapView>
  );
}
