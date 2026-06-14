import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { Dimensions, FlatList, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import type { Location } from "../types";
import { LocationCard, type CardPressPayload } from "./LocationCard";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 420);
const SPACING = 12;
const ITEM_SIZE = CARD_WIDTH + SPACING;
const SIDE_INSET = (SCREEN_WIDTH - CARD_WIDTH) / 2;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Location>);

export interface CarouselHandle {
  scrollToIndex: (index: number) => void;
}

interface Props {
  locations: Location[];
  onActiveIndexChange: (index: number) => void;
  onCardPress: (payload: CardPressPayload) => void;
}

/** A single card that scales/fades based on its distance from the center. */
function CarouselItem({
  index,
  scrollX,
  children,
}: {
  index: number;
  scrollX: SharedValue<number>;
  children: React.ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * ITEM_SIZE,
      index * ITEM_SIZE,
      (index + 1) * ITEM_SIZE,
    ];
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.9, 1, 0.9],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.55, 1, 0.55],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }], opacity };
  });

  return (
    <Animated.View style={[{ width: CARD_WIDTH, marginRight: SPACING }, style]}>
      {children}
    </Animated.View>
  );
}

export const LocationCarousel = forwardRef<CarouselHandle, Props>(
  function LocationCarousel({ locations, onActiveIndexChange, onCardPress }, ref) {
    const listRef = useRef<FlatList<Location>>(null);
    const scrollX = useSharedValue(0);
    // -1 when idle; otherwise the index a tap-driven scroll is gliding toward.
    const programmaticTarget = useSharedValue(-1);

    useImperativeHandle(ref, () => ({
      scrollToIndex: (index: number) => {
        const current = Math.round(scrollX.value / ITEM_SIZE);
        if (index !== current) programmaticTarget.value = index;
        listRef.current?.scrollToOffset({
          offset: index * ITEM_SIZE,
          animated: true,
        });
      },
    }));

    // Keep the latest callback in a ref so the reaction below has STABLE deps
    // and isn't torn down / recreated on every parent re-render (which was
    // causing it to intermittently miss index changes while scrolling).
    const notifyRef = useRef(onActiveIndexChange);
    notifyRef.current = onActiveIndexChange;
    const notify = useCallback((i: number) => notifyRef.current(i), []);

    const onScroll = useAnimatedScrollHandler({
      onScroll: (e) => {
        scrollX.value = e.contentOffset.x;
      },
    });

    // Derive the centered card index from scroll position and notify the parent
    // whenever it changes. Works identically on web + native (unlike
    // onMomentumScrollEnd, which RN-Web fires unreliably). This is the
    // carousel -> map half of the two-way sync.
    useAnimatedReaction(
      () => Math.round(scrollX.value / ITEM_SIZE),
      (curr, prev) => {
        if (curr === prev || curr < 0 || curr >= locations.length) return;
        // While a tap-driven scroll glides to a far card, don't ripple the map
        // through every intermediate pin — resume only once it reaches the target.
        if (programmaticTarget.value !== -1) {
          if (curr === programmaticTarget.value) programmaticTarget.value = -1;
          return;
        }
        runOnJS(notify)(curr);
      },
      [locations.length],
    );

    return (
      <AnimatedFlatList
        ref={listRef}
        data={locations}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_SIZE}
        decelerationRate="fast"
        disableIntervalMomentum
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          // User grabbed the carousel — stop suppressing map updates.
          programmaticTarget.value = -1;
        }}
        contentContainerStyle={{ paddingHorizontal: SIDE_INSET }}
        renderItem={({ item, index }) => (
          <CarouselItem index={index} scrollX={scrollX}>
            <LocationCard location={item} onPress={onCardPress} />
          </CarouselItem>
        )}
        ListFooterComponent={<View />}
      />
    );
  },
);
