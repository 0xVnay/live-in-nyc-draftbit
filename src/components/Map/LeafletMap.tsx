import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";

import { CITY } from "@/src/features/locations/config";
import { palette } from "@/src/theme/tokens";
import type { MapProps } from "./types";

/** Build a teardrop pin as a Leaflet divIcon SVG (avoids the well-known
 *  broken default-marker-asset issue in bundlers). The selected pin is larger
 *  and brand-colored; the tip (iconAnchor) marks the exact spot. */
function makePinIcon(selected: boolean) {
  // Idle pins are red (visible on light + dark tiles); the selected pin is blue
  // and a bit larger so it clearly stands out.
  const w = selected ? 38 : 24;
  const h = selected ? 48 : 31;
  const fill = selected ? palette.brand : palette.markerPin;
  const svg = `<svg width="${w}" height="${h}" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 8.5 12 20 12 20s12-11.5 12-20C24 5.37 18.63 0 12 0z" fill="${fill}" stroke="#ffffff" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="4.4" fill="#ffffff"/>
  </svg>`;
  return L.divIcon({
    className: "",
    html: svg,
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
  });
}

/** Keeps the active venue centered as the carousel scrolls. Pans smoothly (which
 *  keeps the selected pin in frame); only does a one-off zoom-in if the user is
 *  zoomed out past minFocusZoom — so fast scrolling doesn't re-zoom every tick. */
function FollowActive({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (map.getZoom() < CITY.minFocusZoom) {
      map.flyTo([lat, lng], CITY.minFocusZoom, { duration: 0.5 });
    } else {
      map.panTo([lat, lng], { animate: true, duration: 0.4 });
    }
  }, [lat, lng, map]);
  return null;
}

export default function LeafletMap({
  locations,
  activeIndex,
  onMarkerPress,
  isDark,
}: MapProps) {
  const active = locations[activeIndex];
  const center: [number, number] = active
    ? [active.latitude, active.longitude]
    : [CITY.center.latitude, CITY.center.longitude];

  // Free, no-token CARTO basemaps — light/dark to match the app theme.
  const tile = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  // Icons are created ONCE (stable refs). Each marker keeps a stable key, so
  // react-leaflet never remounts them — it just calls setIcon() in place on the
  // two markers whose selected state changed. No overlay, no remount, no flicker.
  const idleIcon = useMemo(() => makePinIcon(false), []);
  const selectedIcon = useMemo(() => makePinIcon(true), []);

  return (
    <MapContainer
      center={center}
      zoom={CITY.initialZoom}
      zoomControl={false}
      // zIndex:0 makes the map its own stacking context so Leaflet's internal
      // panes (z-index 400+) stay trapped inside it instead of painting over the
      // app's absolutely-positioned overlays (header, carousel) that sit on top.
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }}
    >
      <TileLayer
        url={tile}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {locations.map((loc, index) => {
        const selected = index === activeIndex;
        return (
          <Marker
            key={loc.id}
            position={[loc.latitude, loc.longitude]}
            icon={selected ? selectedIcon : idleIcon}
            zIndexOffset={selected ? 1000 : 0}
            eventHandlers={{ click: () => onMarkerPress(index) }}
          />
        );
      })}
      {active && <FollowActive lat={active.latitude} lng={active.longitude} />}
    </MapContainer>
  );
}
