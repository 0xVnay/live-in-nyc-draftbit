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

export function LocationCard({
  location,
  onPress,
}: {
  location: Location;
  onPress: (payload: CardPressPayload) => void;
}) {
  const ref = useRef<View>(null);

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
          colors={["transparent", "rgba(0,0,0,0.15)", "rgba(0,0,0,0.8)"]}
          locations={[0, 0.5, 1]}
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "78%" }}
        />

        <View className="absolute inset-x-0 bottom-0 p-4">
          <View className="mb-1.5 flex-row items-center gap-2">
            <View className="self-start rounded-full bg-white/25 px-2.5 py-0.5">
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-white">
                {location.category}
              </Text>
            </View>
            {location.dateText && (
              <Text className="text-xs font-medium text-white/90">
                {location.dateText}
              </Text>
            )}
          </View>
          <Text numberOfLines={1} className="text-lg font-bold text-white">
            {location.name}
          </Text>
          <View className="flex-row items-center gap-1">
            <Ionicons name="location" size={12} color="rgba(255,255,255,0.85)" />
            <Text numberOfLines={1} className="flex-1 text-sm text-white/80">
              {location.venue}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
