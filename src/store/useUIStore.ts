import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark";

/** First launch follows the OS once; after that it's whatever the user picks. */
const initialMode: ThemeMode =
  Appearance.getColorScheme() === "dark" ? "dark" : "light";

/** The on-screen rectangle + image of the tapped card, handed to the detail
 *  screen to drive the shared-element ("hero") morph. */
export interface TransitionSource {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl: string | null;
}

interface UIState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;

  /** Non-persisted: lives only for the duration of a card -> detail transition. */
  transitionSource: TransitionSource | null;
  setTransitionSource: (source: TransitionSource | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      themeMode: initialMode,
      setThemeMode: (themeMode) => set({ themeMode }),

      transitionSource: null,
      setTransitionSource: (transitionSource) => set({ transitionSource }),
    }),
    {
      name: "ui-store",
      storage: createJSONStorage(() => AsyncStorage),
      // Only the theme preference is worth persisting.
      partialize: (state) => ({ themeMode: state.themeMode }),
    },
  ),
);
