import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StateView } from "@/src/components/ui/StateView";
import {
  useLocationDetail,
  useLocationFromList,
} from "@/src/features/locations/queries";
import { useUIStore } from "@/src/store/useUIStore";
import { useAppTheme } from "@/src/theme/useAppTheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_HEIGHT = 380;

const AnimatedImage = Animated.createAnimatedComponent(Image);

const LINK_META: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; label: string }
> = {
  spotify: { icon: "musical-notes", label: "Spotify" },
  youtube: { icon: "logo-youtube", label: "YouTube" },
  instagram: { icon: "logo-instagram", label: "Instagram" },
  itunes: { icon: "logo-apple", label: "Apple Music" },
  facebook: { icon: "logo-facebook", label: "Facebook" },
  twitter: { icon: "logo-twitter", label: "X" },
  wiki: { icon: "book-outline", label: "Wikipedia" },
  homepage: { icon: "globe-outline", label: "Website" },
};

function InfoRow({
  icon,
  text,
  muted,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  muted: string;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <Ionicons name={icon} size={20} color={muted} />
      <Text className="flex-1 text-[15px] leading-6 text-neutral-700 dark:text-neutral-300">
        {text}
      </Text>
    </View>
  );
}

export default function LocationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: base } = useLocationFromList(id);
  const { data: detail } = useLocationDetail(id);
  const place = detail ?? base;

  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();

  const source = useUIStore((s) => s.transitionSource);
  const setTransitionSource = useUIStore((s) => s.setTransitionSource);
  const hasMorph = !!source && source.id === id;

  const progress = useSharedValue(hasMorph ? 0 : 1);
  const scrollY = useSharedValue(0);
  const [morphDone, setMorphDone] = useState(!hasMorph);

  useEffect(() => {
    if (!hasMorph) return;
    progress.value = withTiming(1, { duration: 380 }, (finished) => {
      if (finished) runOnJS(setMorphDone)(true);
    });
  }, [hasMorph, progress]);

  useEffect(() => () => setTransitionSource(null), [setTransitionSource]);

  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const overlayStyle = useAnimatedStyle(() => {
    if (!source) return { opacity: 0 };
    return {
      position: "absolute",
      left: interpolate(progress.value, [0, 1], [source.x, 0]),
      top: interpolate(progress.value, [0, 1], [source.y, 0]),
      width: interpolate(progress.value, [0, 1], [source.width, SCREEN_WIDTH]),
      height: interpolate(progress.value, [0, 1], [source.height, HERO_HEIGHT]),
      borderRadius: interpolate(progress.value, [0, 1], [24, 0]),
    };
  });

  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-200, 0, 200], [0, 0, 60], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [-200, 0], [1.35, 1], Extrapolation.CLAMP) },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.35, 1], [0, 1], Extrapolation.CLAMP),
  }));

  if (!place) {
    return <StateView loading message="…" />;
  }

  const muted = isDark ? "#94a3b8" : "#64748b";
  const when = [place.dateText, place.timeText].filter(Boolean).join(" · ");
  const venueLine = [place.venue, place.address, place.city]
    .filter(Boolean)
    .join(", ");

  const openInMaps = () => {
    const { latitude: lat, longitude: lng, venue } = place;
    const label = encodeURIComponent(venue || place.name);
    const url = Platform.select({
      ios: `http://maps.apple.com/?ll=${lat},${lng}&q=${label}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* Hero */}
        <View style={{ height: HERO_HEIGHT, overflow: "hidden" }}>
          <Animated.View style={[{ flex: 1 }, heroStyle]}>
            {place.imageUrl ? (
              <Image
                source={place.imageUrl}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={0}
              />
            ) : (
              <View className="flex-1 bg-brand/20" />
            )}
          </Animated.View>
          <LinearGradient
            colors={["rgba(0,0,0,0.35)", "transparent", "rgba(0,0,0,0.75)"]}
            locations={[0, 0.4, 1]}
            style={{ position: "absolute", inset: 0 }}
          />
          <View className="absolute inset-x-0 bottom-0 p-5">
            <View className="mb-2 flex-row items-center gap-2">
              <View className="self-start rounded-full bg-brand px-3 py-1">
                <Text className="text-xs font-semibold uppercase tracking-wide text-white">
                  {place.category}
                </Text>
              </View>
              {place.priceText && (
                <View className="rounded-full bg-white/25 px-3 py-1">
                  <Text className="text-xs font-semibold text-white">
                    {place.priceText}
                  </Text>
                </View>
              )}
              {detail?.status === "onsale" && (
                <View className="rounded-full bg-green-500 px-3 py-1">
                  <Text className="text-xs font-semibold text-white">
                    {t("detail.onSale")}
                  </Text>
                </View>
              )}
              {detail?.status === "cancelled" && (
                <View className="rounded-full bg-red-500 px-3 py-1">
                  <Text className="text-xs font-semibold text-white">
                    {t("detail.cancelled")}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-3xl font-extrabold text-white">
              {place.name}
            </Text>
            <Text className="text-base text-white/85">{place.venue}</Text>
          </View>
        </View>

        {/* Body */}
        <Animated.View style={contentStyle}>
          <View className="px-5 pt-6">
            {/* Quick actions */}
            <View className="flex-row gap-3">
              {place.url && (
                <Pressable
                  onPress={() => Linking.openURL(place.url!)}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 active:opacity-90"
                >
                  <Ionicons name="ticket" size={18} color="#fff" />
                  <Text className="font-semibold text-white">
                    {t("detail.getTickets")}
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={openInMaps}
                className="flex-row items-center justify-center gap-2 rounded-2xl border border-neutral-200 px-5 py-3.5 active:opacity-80 dark:border-neutral-700"
              >
                <Ionicons name="navigate" size={18} color={muted} />
                <Text className="font-semibold text-neutral-700 dark:text-neutral-200">
                  {t("detail.directions")}
                </Text>
              </Pressable>
            </View>

            {/* Facts */}
            <View className="mt-6 gap-4">
              {when ? <InfoRow icon="calendar-outline" text={when} muted={muted} /> : null}
              {venueLine ? (
                <InfoRow icon="location-outline" text={venueLine} muted={muted} />
              ) : null}
              {detail?.subGenre ? (
                <InfoRow
                  icon="musical-notes-outline"
                  text={`${place.category} · ${detail.subGenre}`}
                  muted={muted}
                />
              ) : null}
              {detail?.onSaleText ? (
                <InfoRow
                  icon="pricetag-outline"
                  text={t("detail.onSaleOn", { date: detail.onSaleText })}
                  muted={muted}
                />
              ) : null}
            </View>

            {/* Artist + links */}
            {detail?.artist && detail.artist.links.length > 0 && (
              <View className="mt-6">
                <Text className="mb-3 text-lg font-bold text-neutral-900 dark:text-white">
                  {detail.artist.name}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {detail.artist.links
                    .filter((l) => LINK_META[l.type])
                    .map((l) => (
                      <Pressable
                        key={l.type}
                        onPress={() => Linking.openURL(l.url)}
                        className="flex-row items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-2 active:opacity-80 dark:border-neutral-700"
                      >
                        <Ionicons
                          name={LINK_META[l.type].icon}
                          size={15}
                          color={muted}
                        />
                        <Text className="text-sm text-neutral-700 dark:text-neutral-200">
                          {LINK_META[l.type].label}
                        </Text>
                      </Pressable>
                    ))}
                </View>
              </View>
            )}

            {/* Image gallery */}
            {detail?.images && detail.images.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-6"
                contentContainerStyle={{ gap: 10 }}
              >
                {detail.images.map((p) => (
                  <Image
                    key={p}
                    source={p}
                    style={{ width: 220, height: 124, borderRadius: 16 }}
                    contentFit="cover"
                    transition={200}
                  />
                ))}
              </ScrollView>
            )}

            {/* Description */}
            {place.description ? (
              <View className="mt-6">
                <Text className="mb-2 text-lg font-bold text-neutral-900 dark:text-white">
                  {t("detail.about")}
                </Text>
                <Text className="text-[15px] leading-6 text-neutral-600 dark:text-neutral-300">
                  {place.description}
                </Text>
              </View>
            ) : null}

            {/* Good to know */}
            {detail?.pleaseNote ? (
              <View className="mt-6">
                <Text className="mb-2 text-lg font-bold text-neutral-900 dark:text-white">
                  {t("detail.goodToKnow")}
                </Text>
                <Text className="text-[15px] leading-6 text-neutral-600 dark:text-neutral-300">
                  {detail.pleaseNote}
                </Text>
              </View>
            ) : null}
          </View>
        </Animated.View>
      </Animated.ScrollView>

      {/* Morph overlay */}
      {!morphDone && source?.imageUrl && (
        <AnimatedImage
          source={source.imageUrl}
          contentFit="cover"
          style={overlayStyle}
        />
      )}

      {/* Back button */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        style={{ top: insets.top + 8 }}
        className="absolute left-5 h-11 w-11 items-center justify-center rounded-full bg-black/40"
      >
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </Pressable>
    </View>
  );
}
