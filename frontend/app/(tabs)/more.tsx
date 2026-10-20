import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, { FadeInDown } from "react-native-reanimated";
import { TopBar } from "@/src/components/TopBar";
import { useTabBottom } from "@/src/components/Page";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { useApp } from "@/src/store/AppStore";

const ITEMS = [
  { id: "academy", label: "Academy", icon: "graduation-cap", route: "/academy", badge: "Soon" },
  { id: "tools", label: "Tools", icon: "wrench", route: "/tools" },
  { id: "services", label: "Services", icon: "briefcase", route: "/services" },
  { id: "ai", label: "Mqulima AI", icon: "bot", route: "/ai" },
  { id: "about", label: "About", icon: "info", route: "/about" },
  { id: "contact", label: "Contact", icon: "phone", route: "/contact" },
  { id: "legal", label: "Terms / Privacy", icon: "file-text", route: "/legal" },
  { id: "account", label: "Account", icon: "user", route: "/account" },
];

export default function More() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useTabBottom();
  const { user } = useApp();
  return (
    <View style={s.root} testID="more-screen">
      <TopBar />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottom, gap: 10 }}>
        <Text style={s.h1}>More</Text>
        {ITEMS.map((it, i) => (
          <Animated.View key={it.id} entering={FadeInDown.delay(i * 40)}>
            <Pressable
              testID={`more-item-${it.id}`}
              onPress={() => router.push((it.id === "account" && !user ? "/auth/sign-in" : it.route) as any)}
              style={({ pressed }) => [s.row, { opacity: pressed ? 0.8 : 1 }]}
            >
              <View style={s.icon}><Lucide name={it.icon as any} size={20} color={colors.onBrandTertiary} /></View>
              <Text style={s.label}>{it.label}</Text>
              {it.badge ? <View style={s.badge}><Text style={s.badgeText}>{it.badge}</Text></View> : null}
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
  badge: { backgroundColor: c.orange, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontFamily: fonts.b800, fontSize: 10, color: c.white, textTransform: "uppercase" },
}));
