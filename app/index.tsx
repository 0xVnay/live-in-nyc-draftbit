import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Map } from "@/src/components/Map/Map";
import { RefreshButton } from "@/src/components/ui/RefreshButton";
import { StateView } from "@/src/components/ui/StateView";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import { LocationCarousel, type CarouselHandle } from "@/src/features/locations/components/LocationCarousel";
import type { CardPressPayload } from "@/src/features/locations/components/LocationCard";
import { useLocations } from "@/src/features/locations/queries";
import { useUIStore } from "@/src/store/useUIStore";
import { useAppTheme } from "@/src/theme/useAppTheme";

export default function MapScreen() {
  const { data: locations, isLoading, isError, refetch } = useLocations();
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<CarouselHandle>(null);

  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const setTransitionSource = useUIStore((s) => s.setTransitionSource);

  // Pin tapped -> sync the carousel to it (the map itself reacts to activeIndex).
  const handleMarkerPress = (index: number) => {
    setActiveIndex(index);
    carouselRef.current?.scrollToIndex(index);
  };

  // Card swiped -> the map animates to it via the activeIndex prop.
  const handleActiveIndexChange = (index: number) => setActiveIndex(index);

  // Card tapped -> stash the hero rect, then open the detail screen.
  const handleCardPress = ({ location, rect }: CardPressPayload) => {
    setTransitionSource({
      id: location.id,
      ...rect,
      imageUrl: location.imageUrl,
    });
    router.push({ pathname: "/location/[id]", params: { id: location.id } });
  };

  if (isLoading) {
    return <StateView loading message={t("map.loading")} />;
  }
  if (isError || !locations) {
    return (
      <StateView
        message={t("map.error")}
        actionLabel={t("map.retry")}
        onAction={() => refetch()}
      />
    );
  }
  if (locations.length === 0) {
    return <StateView message={t("map.empty")} />;
  }

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <Map
        locations={locations}
        activeIndex={activeIndex}
        onMarkerPress={handleMarkerPress}
        isDark={isDark}
      />

      {/* Header overlay */}
      <View
        pointerEvents="box-none"
        style={{ paddingTop: insets.top + 8 }}
        className="absolute inset-x-0 top-0 flex-row items-start justify-between px-5"
      >
        <View
          className="rounded-2xl bg-white/85 px-4 py-2.5 dark:bg-neutral-900/85"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          }}
        >
          <Text className="text-xl font-extrabold text-neutral-900 dark:text-white">
            {t("map.title")}
          </Text>
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
            {t("map.subtitle", { count: locations.length })}
          </Text>
        </View>
        <View className="gap-2">
          <ThemeToggle />
          <RefreshButton />
        </View>
      </View>

      {/* Carousel overlay */}
      <View
        pointerEvents="box-none"
        style={{ paddingBottom: insets.bottom + 14 }}
        className="absolute inset-x-0 bottom-0"
      >
        <LocationCarousel
          ref={carouselRef}
          locations={locations}
          onActiveIndexChange={handleActiveIndexChange}
          onCardPress={handleCardPress}
        />
      </View>
    </View>
  );
}
