import type { ReactNode } from "react";
import { Pressable, type PressableProps } from "react-native";

const SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.15,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
} as const;

export function IconButton({
  children,
  ...props
}: PressableProps & { children: ReactNode }) {
  return (
    <Pressable
      hitSlop={8}
      className="h-11 w-11 items-center justify-center rounded-full bg-white/85 dark:bg-neutral-800/85"
      style={SHADOW}
      {...props}
    >
      {children}
    </Pressable>
  );
}
