import { useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

import { CITY } from "@/src/features/locations/config";
import { MarkerPin } from "@/src/features/locations/components/MarkerPin";
import type { MapProps } from "./types";

/**
 * Native map (iOS: Apple Maps, Android: Google Maps) via react-native-maps.
 *
 * When `activeIndex` changes (from a pin tap OR a carousel swipe) we animate the
 * camera to that location — this is half of the two-way map <-> carousel sync.
 */
export function Map({ locations, activeIndex, onMarkerPress }: MapProps) {
  const mapRef = useRef<MapView>(null);
  const active = locations[activeIndex];

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
        { duration: 600 },
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
      {locations.map((loc, index) => (
        <Marker
          key={loc.id}
          coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
          onPress={() => onMarkerPress(index)}
          anchor={{ x: 0.5, y: 1 }}
          // Keep the selected pin visually on top.
          zIndex={index === activeIndex ? 10 : 1}
        >
          <MarkerPin selected={index === activeIndex} />
        </Marker>
      ))}
    </MapView>
  );
}
