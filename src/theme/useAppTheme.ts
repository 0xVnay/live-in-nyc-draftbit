import { useColorScheme as useNativewindColorScheme } from "nativewind";
import { useEffect } from "react";

import { useUIStore } from "@/src/store/useUIStore";
import { colorsFor, type ColorScheme } from "./tokens";

/**
 * Bridges our persisted theme preference (system/light/dark) with NativeWind.
 *
 * - NativeWind owns the actual `dark:` class state.
 * - When the user picks "system" we let NativeWind follow the OS.
 * - When they pick light/dark we force it.
 *
 * Returns the effective scheme + raw color tokens for imperative styling.
 */
export function useAppTheme() {
  const themeMode = useUIStore((s) => s.themeMode);
  const { colorScheme, setColorScheme } = useNativewindColorScheme();

  useEffect(() => {
    setColorScheme(themeMode);
  }, [themeMode, setColorScheme]);

  const scheme: ColorScheme = colorScheme === "dark" ? "dark" : "light";

  return {
    scheme,
    isDark: scheme === "dark",
    colors: colorsFor(scheme),
  };
}
