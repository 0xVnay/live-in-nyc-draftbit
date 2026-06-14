import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable } from "react-native";

import { useUIStore, type ThemeMode } from "@/src/store/useUIStore";
import { useAppTheme } from "@/src/theme/useAppTheme";

const NEXT: Record<ThemeMode, ThemeMode> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const ICON: Record<ThemeMode, keyof typeof Ionicons.glyphMap> = {
  system: "phone-portrait-outline",
  light: "sunny-outline",
  dark: "moon-outline",
};

/** Cycles system -> light -> dark. Persisted via the UI store. */
export function ThemeToggle() {
  const mode = useUIStore((s) => s.themeMode);
  const setMode = useUIStore((s) => s.setThemeMode);
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={() => setMode(NEXT[mode])}
      hitSlop={8}
      className="h-11 w-11 items-center justify-center rounded-full bg-white/85 dark:bg-neutral-800/85"
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      }}
    >
      <Ionicons name={ICON[mode]} size={20} color={colors.text} />
    </Pressable>
  );
}
