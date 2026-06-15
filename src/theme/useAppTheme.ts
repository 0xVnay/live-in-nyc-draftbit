import { useColorScheme as useNativewindColorScheme } from "nativewind";
import { useEffect } from "react";

import { useUIStore } from "@/src/store/useUIStore";
import { colorsFor, type ColorScheme } from "./tokens";

/**
 * Bridges our persisted theme preference (system/light/dark) with NativeWind,
 * which owns the actual `dark:` state: "system" follows the OS, light/dark force
 * it. Returns the effective scheme + raw color tokens for imperative styling.
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
