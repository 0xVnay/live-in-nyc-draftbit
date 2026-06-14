import Ionicons from "@expo/vector-icons/Ionicons";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Pressable } from "react-native";

import { fetchLocations } from "@/src/features/locations/api";
import { locationKeys } from "@/src/features/locations/queries";
import { useAppTheme } from "@/src/theme/useAppTheme";

/**
 * Force-refresh: re-fetches with `force` (so the Worker bypasses its KV cache and
 * re-queries Ticketmaster), then writes the result straight into the React Query
 * cache. This is the only path that gets genuinely newer data on demand.
 */
export function RefreshButton() {
  const queryClient = useQueryClient();
  const { colors } = useAppTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const fresh = await fetchLocations(undefined, true);
      queryClient.setQueryData(locationKeys.all, fresh);
    } catch {
      // Keep showing the existing data if the refresh fails.
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Pressable
      onPress={onRefresh}
      hitSlop={8}
      accessibilityLabel="Refresh events"
      className="h-11 w-11 items-center justify-center rounded-full bg-white/85 dark:bg-neutral-800/85"
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      }}
    >
      {refreshing ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <Ionicons name="refresh" size={20} color={colors.text} />
      )}
    </Pressable>
  );
}
