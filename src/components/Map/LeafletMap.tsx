import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";

import { CITY } from "@/src/features/locations/config";
import { palette } from "@/src/theme/tokens";
import type { MapProps } from "./types";

/** Build a teardrop pin as a Leaflet divIcon SVG (avoids the well-known
 *  broken default-marker-asset issue in bundlers). The selected pin is larger
 *  and brand-colored; the tip (iconAnchor) marks the exact spot. */
function makePinIcon(selected: boolean) {
  const w = selected ? 34 : 24;
  const h = selected ? 44 : 31;
  const fill = selected ? palette.brand : "#475569";
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

/** Pans/zooms the map whenever the active location changes (carousel <-> map sync). */
function FlyToActive({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    // Pan to the venue; only zoom IN if the user is zoomed out past minFocusZoom.
    const target = Math.max(map.getZoom(), CITY.minFocusZoom);
    map.flyTo([lat, lng], target, { duration: 0.6 });
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

  return (
    <MapContainer
      center={center}
      zoom={CITY.initialZoom}
      zoomControl={false}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <TileLayer
        url={tile}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {locations.map((loc, index) => {
        const selected = index === activeIndex;
        return (
          <Marker
            // Keying on `selected` forces react-leaflet to swap the icon
            // reliably when selection changes (the source of the "blue pin
            // doesn't update" bug).
            key={`${loc.id}-${selected}`}
            position={[loc.latitude, loc.longitude]}
            icon={makePinIcon(selected)}
            zIndexOffset={selected ? 1000 : 0}
            eventHandlers={{ click: () => onMarkerPress(index) }}
          />
        );
      })}
      {active && <FlyToActive lat={active.latitude} lng={active.longitude} />}
    </MapContainer>
  );
}
