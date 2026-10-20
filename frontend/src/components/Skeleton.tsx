import React, { useEffect } from "react";
import { View, ViewStyle, StyleProp } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from "react-native-reanimated";
import { useTheme } from "@/src/theme";

export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const o = useSharedValue(0.5);
  useEffect(() => {
    o.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [o]);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ backgroundColor: colors.border, borderRadius: 12 }, style, a]} />;
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View testID="grid-skeleton" style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: "47.5%", gap: 8 }}>
          <Skeleton style={{ height: 160, borderRadius: 16 }} />
          <Skeleton style={{ height: 14, width: "80%" }} />
          <Skeleton style={{ height: 14, width: "40%" }} />
        </View>
      ))}
    </View>
  );
}

export function ListSkeleton({ count = 4, height = 120 }: { count?: number; height?: number }) {
  return (
    <View testID="list-skeleton" style={{ gap: 16, paddingHorizontal: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ gap: 8 }}>
          <Skeleton style={{ height, borderRadius: 24 }} />
          <Skeleton style={{ height: 14, width: "70%" }} />
        </View>
      ))}
    </View>
  );
}
