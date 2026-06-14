import { useQuery } from "@tanstack/react-query";
import { fetchLocation, fetchLocations } from "./api";
import type { Location } from "./types";

export const locationKeys = {
  all: ["locations"] as const,
  detail: (id: string) => ["locations", "detail", id] as const,
};

/** The full list for the map + carousel. */
export function useLocations() {
  return useQuery({
    queryKey: locationKeys.all,
    queryFn: ({ signal }) => fetchLocations(signal),
  });
}

/**
 * The base Location for a detail screen, read instantly from the list cache so
 * the hero can render immediately (no second round-trip needed for the basics).
 */
export function useLocationFromList(id: string | undefined) {
  return useQuery({
    queryKey: locationKeys.all,
    queryFn: ({ signal }) => fetchLocations(signal),
    select: (locations: Location[]) => locations.find((l) => l.id === id),
    enabled: !!id,
  });
}

/** The richer detail payload (photos + hours) from `/api/places/:id`. */
export function useLocationDetail(id: string | undefined) {
  return useQuery({
    queryKey: id ? locationKeys.detail(id) : locationKeys.all,
    queryFn: ({ signal }) => fetchLocation(id!, signal),
    enabled: !!id,
  });
}
