import Ionicons from "@expo/vector-icons/Ionicons";

import { useUIStore, type ThemeMode } from "@/src/store/useUIStore";
import { useAppTheme } from "@/src/theme/useAppTheme";
import { IconButton } from "./IconButton";

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
    <IconButton onPress={() => setMode(NEXT[mode])} accessibilityLabel="Toggle theme">
      <Ionicons name={ICON[mode]} size={20} color={colors.text} />
    </IconButton>
  );
}
