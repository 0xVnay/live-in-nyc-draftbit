import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRef } from "react";
import { Pressable, Text, View } from "react-native";

import { palette } from "@/src/theme/tokens";
import type { Location } from "../types";

export interface CardPressPayload {
  location: Location;
  /** On-screen rect of the card image, used to drive the hero morph. */
  rect: { x: number; y: number; width: number; height: number };
}

/**
 * Carousel card — the "Spotlight" look: a full-bleed event photo with a strong
 * bottom scrim. The category chip and price pill float at the top; the title,
 * venue and date sit at the bottom.
 */
export function LocationCard({
  location,
  onPress,
}: {
  location: Location;
  onPress: (payload: CardPressPayload) => void;
}) {
  const ref = useRef<View>(null);
  const when = [location.dateText, location.timeText].filter(Boolean).join(" · ");

  const handlePress = () => {
    // Measure where this card is on screen, so the detail hero can animate
    // out of exactly this position.
    ref.current?.measureInWindow((x, y, width, height) => {
      onPress({ location, rect: { x, y, width, height } });
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({ opacity: pressed ? 0.95 : 1 })}
    >
      <View
        ref={ref}
        collapsable={false}
        className="h-44 w-full overflow-hidden rounded-3xl bg-neutral-200 dark:bg-neutral-800"
      >
        {location.imageUrl ? (
          <Image
            source={location.imageUrl}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View
            style={{ flex: 1, backgroundColor: palette.brand, opacity: 0.15 }}
          />
        )}

        {/* Scrim so the text stays legible over any photo. */}
        <LinearGradient
          colors={["rgba(0,0,0,0.45)", "transparent", "rgba(0,0,0,0.85)"]}
          locations={[0, 0.45, 1]}
          style={{ position: "absolute", inset: 0 }}
        />

        {/* Top row: category + price */}
        <View className="absolute inset-x-0 top-0 flex-row items-center justify-between p-3.5">
          <View className="rounded-full bg-white/20 px-2.5 py-1">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-white">
              {location.category}
            </Text>
          </View>
          {location.priceText && (
            <View className="rounded-full bg-white/90 px-2.5 py-1">
              <Text className="text-[11px] font-bold text-neutral-900">
                {location.priceText}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom: title + venue + date */}
        <View className="absolute inset-x-0 bottom-0 p-4">
          <Text numberOfLines={1} className="text-xl font-extrabold text-white">
            {location.name}
          </Text>
          <View className="mt-0.5 flex-row items-center gap-1">
            <Ionicons name="location" size={12} color="rgba(255,255,255,0.85)" />
            <Text numberOfLines={1} className="flex-1 text-sm text-white/85">
              {location.venue}
            </Text>
          </View>
          {when ? (
            <Text className="mt-0.5 text-xs font-medium text-white/70">{when}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
