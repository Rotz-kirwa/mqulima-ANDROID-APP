import React, { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  FadeInDown,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { TopBar } from "@/src/components/TopBar";
import { useTabBottom } from "@/src/components/Page";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { useAuth } from "@/src/store/AppStore";

function SpecialSoonBadge({ label }: { label: string }) {
  const s = useStyles();
  const pulse = useSharedValue(0);
  const shimmer = useSharedValue(-40);
  const sparkle = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    shimmer.value = withRepeat(
      withSequence(
        withTiming(-40, { duration: 0 }),
        withDelay(900, withTiming(110, { duration: 1000, easing: Easing.inOut(Easing.quad) }))
      ),
      -1,
      false
    );
    sparkle.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(shimmer);
      cancelAnimation(sparkle);
    };
  }, [pulse, shimmer, sparkle]);

  const pillAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.045 }],
  }));

  const haloAnimStyle = useAnimatedStyle(() => ({
    opacity: 0.45 - pulse.value * 0.3,
    transform: [{ scaleX: 1 + pulse.value * 0.16 }, { scaleY: 1 + pulse.value * 0.28 }],
  }));

  const shimmerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmer.value }, { rotate: "22deg" }],
  }));

  const sparkleAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${-10 + sparkle.value * 20}deg` },
      { scale: 0.9 + sparkle.value * 0.22 },
    ],
  }));

  return (
    <View style={s.badgeWrap}>
      <Animated.View pointerEvents="none" style={[s.badgeHalo, haloAnimStyle]} />
      <Animated.View style={[s.badgeOuter, pillAnimStyle]}>
        <LinearGradient
          colors={["#F59E0B", "#EA580C", "#D97706"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.badgeGradient}
        >
          <Animated.View pointerEvents="none" style={[s.badgeShimmer, shimmerAnimStyle]} />
          <Animated.View style={sparkleAnimStyle}>
            <Lucide name="sparkles" size={11} color="#FEF08A" />
          </Animated.View>
          <Text style={s.badgeText}>{label}</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const ITEMS = [
  { id: "academy", label: "Academy", icon: "graduation-cap", route: "/academy", badge: "Soon", bg: "#15803D", fg: "#FFFFFF" },
  { id: "tools", label: "Tools", icon: "wrench", route: "/tools", bg: "#2563EB", fg: "#FFFFFF" },
  { id: "services", label: "Services", icon: "briefcase", route: "/services", bg: "#EA580C", fg: "#FFFFFF" },
  { id: "ai", label: "Mqulima AI", icon: "bot", route: "/ai", bg: "#7C3AED", fg: "#FFFFFF" },
  { id: "onboarding", label: "Welcome Tour", icon: "sparkles", route: "/onboarding", bg: "#FACC15", fg: "#0B2117" },
  { id: "about", label: "About", icon: "info", route: "/about", bg: "#0891B2", fg: "#FFFFFF" },
  { id: "contact", label: "Contact", icon: "phone", route: "/contact", bg: "#16A34A", fg: "#FFFFFF" },
  { id: "legal", label: "Terms / Privacy", icon: "file-text", route: "/legal", bg: "#4F46E5", fg: "#FFFFFF" },
  { id: "account", label: "Account", icon: "user", route: "/account", bg: "#E11D48", fg: "#FFFFFF" },
];

export default function More() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useTabBottom();
  const { user, resetOnboarding } = useAuth();
  return (
    <View style={s.root} testID="more-screen">
      <TopBar />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottom, gap: 10 }}>
        <Text style={s.h1}>More</Text>
        {ITEMS.map((it, i) => (
          <Animated.View key={it.id} entering={FadeInDown.delay(i * 40)}>
            <Pressable
              testID={`more-item-${it.id}`}
              onPress={() => {
                if (it.id === "onboarding") {
                  resetOnboarding();
                  return;
                }
                router.push((it.id === "account" && !user ? "/auth/sign-in" : it.route) as any);
              }}
              style={({ pressed }) => [s.row, { opacity: pressed ? 0.8 : 1 }]}
            >
              <View style={[s.icon, { backgroundColor: it.bg }]}><Lucide name={it.icon as any} size={20} color={it.fg} /></View>
              <Text style={s.label}>{it.label}</Text>
              {it.badge ? <SpecialSoonBadge label={it.badge} /> : null}
              <View style={{ flex: 1 }} />
              <Lucide name="chevron-right" size={20} color={colors.subtle} />
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  h1: { fontFamily: fonts.h900, fontSize: 28, color: c.onSurface, marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 18, paddingHorizontal: 14 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: fonts.h700, fontSize: 16, color: c.onSurface },
  badgeWrap: { position: "relative", alignItems: "center", justifyContent: "center" },
  badgeHalo: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, borderRadius: 999, backgroundColor: "#FACC15" },
  badgeOuter: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FDE047",
    overflow: "hidden",
    shadowColor: "#EA580C",
    shadowOpacity: 0.28,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  badgeGradient: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, overflow: "hidden" },
  badgeShimmer: { position: "absolute", top: -8, bottom: -8, width: 18, backgroundColor: "rgba(255,255,255,0.42)" },
  badgeText: { fontFamily: fonts.b800, fontSize: 10.5, letterSpacing: 0.8, color: c.white, textTransform: "uppercase" },
}));
