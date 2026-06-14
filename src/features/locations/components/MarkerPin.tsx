import Ionicons from "@expo/vector-icons/Ionicons";
import { View } from "react-native";

import { palette } from "@/src/theme/tokens";

/**
 * Teardrop map pin (native). Unselected pins are red; the selected pin is larger
 * and blue. The Ionicons "location" glyph has a transparent hole in the middle —
 * we fill it with a white dot so nothing behind the pin (e.g. the idle pin under
 * the selected one) shows through, and so it matches the web pin's white center.
 */
export function MarkerPin({ selected }: { selected: boolean }) {
  const size = selected ? 50 : 32;
  const color = selected ? palette.brand : "#ef4444";
  const dot = size * 0.3;

  return (
    <View style={{ width: size, height: size, alignItems: "center" }}>
      <View
        style={{
          position: "absolute",
          top: size * 0.22,
          left: (size - dot) / 2,
          width: dot,
          height: dot,
          borderRadius: dot / 2,
          backgroundColor: "#ffffff",
        }}
      />
      <Ionicons
        name="location"
        size={size}
        color={color}
        style={{
          textShadowColor: "rgba(0,0,0,0.35)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
        }}
      />
    </View>
  );
}
