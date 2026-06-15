import Ionicons from "@expo/vector-icons/Ionicons";

import { useUIStore, type ThemeMode } from "@/src/store/useUIStore";
import { useAppTheme } from "@/src/theme/useAppTheme";
import { IconButton } from "./IconButton";

const NEXT: Record<ThemeMode, ThemeMode> = {
  light: "dark",
  dark: "light",
};

const ICON: Record<ThemeMode, keyof typeof Ionicons.glyphMap> = {
  light: "sunny-outline",
  dark: "moon-outline",
};

/** Toggles light <-> dark. Persisted via the UI store. */
export function ThemeToggle() {
  const mode = useUIStore((s) => s.themeMode);
  const setMode = useUIStore((s) => s.setThemeMode);
  const { colors } = useAppTheme();

  // `?? "dark"` is a defensive fallback in case an older persisted value
  // (e.g. the removed "system" mode) is ever loaded.
  return (
    <IconButton onPress={() => setMode(NEXT[mode] ?? "dark")} accessibilityLabel="Toggle theme">
      <Ionicons name={ICON[mode] ?? "moon-outline"} size={20} color={colors.text} />
    </IconButton>
  );
}
