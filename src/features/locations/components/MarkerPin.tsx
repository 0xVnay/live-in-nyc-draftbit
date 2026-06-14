import Ionicons from "@expo/vector-icons/Ionicons";
import { View } from "react-native";

import { palette } from "@/src/theme/tokens";

/**
 * Teardrop map pin (native). Unselected pins are small and slate; the selected
 * pin is larger and brand-colored so it clearly stands out. The glyph's tip sits
 * at the bottom — the Marker uses anchor {x:0.5, y:1} so the tip marks the spot.
 */
export function MarkerPin({ selected }: { selected: boolean }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Ionicons
        name="location"
        size={selected ? 46 : 32}
        color={selected ? palette.brand : "#475569"}
        style={{
          textShadowColor: "rgba(0,0,0,0.35)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3,
        }}
      />
    </View>
  );
}
