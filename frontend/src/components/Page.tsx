import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TopBar } from "./TopBar";
import { useTheme } from "@/src/theme";
import { usesNativeTabs } from "@/src/navigation";
import { useIsFocused } from "expo-router";

export function Page({ children, title, back = true, testID }: { children: React.ReactNode; title?: string; back?: boolean; testID?: string }) {
  const { colors } = useTheme();
  const focused = useIsFocused();
  return (
    <View testID={focused ? testID : undefined} style={{ flex: 1, backgroundColor: colors.surface }}>
      <TopBar back={back} title={title} />
      {children}
    </View>
  );
}

/** Bottom padding for scroll content inside tab screens (clears floating buttons too). */
export function useTabBottom() {
  const insets = useSafeAreaInsets();
  return (usesNativeTabs ? insets.bottom : 0) + 96;
}

/** Bottom padding for stack screens. */
export function useStackBottom() {
  const insets = useSafeAreaInsets();
  return insets.bottom + 96;
}
