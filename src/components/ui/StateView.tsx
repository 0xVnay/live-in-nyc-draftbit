import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { palette } from "@/src/theme/tokens";

/** Centered loading / error / empty state with an optional retry action. */
export function StateView({
  loading = false,
  message,
  actionLabel,
  onAction,
}: {
  loading?: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-white px-8 dark:bg-neutral-950">
      {loading && <ActivityIndicator size="large" color={palette.brand} />}
      <Text className="text-center text-base text-neutral-500 dark:text-neutral-400">
        {message}
      </Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="rounded-full bg-brand px-5 py-2.5 active:opacity-80"
        >
          <Text className="font-semibold text-white">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
