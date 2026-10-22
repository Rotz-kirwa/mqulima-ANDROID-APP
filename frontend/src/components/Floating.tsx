import React, { useEffect } from "react";
import { Linking, Platform, Pressable, Text, View } from "react-native";
import { usePathname, useRouter, useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, FadeInDown, FadeOutDown } from "react-native-reanimated";
import { contactInfo } from "@/src/data/home";
import { colors, fonts } from "@/src/theme";
import { useApp } from "@/src/store/AppStore";
import { usesNativeTabs } from "@/src/navigation";
import { AiLogo } from "./Logo";

function useBottomOffset() {
  const insets = useSafeAreaInsets();
  const segments = useSegments() as string[];
  const inTabs = segments[0] === "(tabs)";
  if (!inTabs) return insets.bottom + 16;
  if (usesNativeTabs) return insets.bottom + 49 + 16;
  return (Platform.OS === "web" ? 64 : 49 + insets.bottom) + 16;
}

export function FloatingButtons() {
  const bottom = useBottomOffset();
  const pathname = usePathname();
  const router = useRouter();
  const ring = useSharedValue(1);
  useEffect(() => {
    ring.value = withRepeat(withTiming(1.5, { duration: 1200 }), -1, false);
  }, [ring]);
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: ring.value }], opacity: 1.5 - ring.value }));
  const hideAi = pathname === "/ai";
  const hideAll = pathname.startsWith("/checkout") || pathname === "/cart" || pathname.startsWith("/product") || pathname.startsWith("/service/");
  // Chat-style screens have their own bottom input bar; floating buttons would cover it.
  if (pathname.startsWith("/admin") || pathname === "/academy" || pathname.startsWith("/course/") || pathname === "/news" || pathname.startsWith("/article/") || pathname === "/ai" || pathname === "/forum" || pathname === "/create-post" || pathname.startsWith("/thread")) return null;
  return (
    <>
      <View pointerEvents="box-none" style={{ position: "absolute", right: 16, bottom: hideAll ? bottom + 72 : bottom, alignItems: "center", justifyContent: "center" }}>
        <Animated.View style={[{ position: "absolute", width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(37,211,102,0.5)" }, ringStyle]} />
        <Pressable
          testID="whatsapp-fab"
          accessibilityLabel="Chat on WhatsApp"
          onPress={() => Linking.openURL(contactInfo.whatsapp)}
          style={({ pressed }) => ({
            width: 52, height: 52, borderRadius: 26, backgroundColor: colors.whatsapp, alignItems: "center", justifyContent: "center",
            transform: [{ scale: pressed ? 0.92 : 1 }], shadowColor: colors.whatsapp, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
          })}
        >
          <FontAwesome6 name="whatsapp" iconStyle="brand" size={26} color={colors.white} />
        </Pressable>
      </View>
      {!hideAi && !hideAll ? (
        <Pressable testID="ai-fab" accessibilityLabel="Mqulima AI Assistant" onPress={() => router.push("/ai")} style={({ pressed }) => ({ position: "absolute", left: 12, bottom: bottom - 2, transform: [{ scale: pressed ? 0.9 : 1 }] })}>
          <AiLogo size={52} />
        </Pressable>
      ) : null}
    </>
  );
}

export function Toast() {
  const { toastMsg } = useApp();
  const insets = useSafeAreaInsets();
  if (!toastMsg) return null;
  return (
    <Animated.View entering={FadeInDown} exiting={FadeOutDown} pointerEvents="none" style={{ position: "absolute", left: 16, right: 16, top: insets.top + 70, alignItems: "center" }}>
      <View testID="toast" style={{ backgroundColor: colors.forest, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, borderWidth: 1, borderColor: colors.limeA30 }}>
        <Text style={{ color: colors.white, fontFamily: fonts.b700, fontSize: 13 }}>{toastMsg}</Text>
      </View>
    </Animated.View>
  );
}
