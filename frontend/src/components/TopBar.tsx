import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo } from "./Logo";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { cartCount, useApp } from "@/src/store/AppStore";

export function TopBar({ back, title }: { back?: boolean; title?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const s = useStyles();
  const { cart, user } = useApp();
  const count = cartCount(cart);
  return (
    <View style={[s.bar, { paddingTop: insets.top + 8 }]} testID="top-bar">
      {back ? (
        <Pressable testID="top-bar-back" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={s.iconBtn} hitSlop={6}>
          <Lucide name="arrow-left" size={22} color={colors.onSurface} />
        </Pressable>
      ) : null}
      {title ? (
        <Text style={s.title} numberOfLines={1}>{title}</Text>
      ) : (
        <Pressable testID="top-bar-logo" onPress={() => router.navigate("/")} style={s.brand}>
          <Logo size={38} />
          <View>
            <Text style={s.word}>MQULIMA</Text>
            <Text style={s.tag}>...taking you first class</Text>
          </View>
        </Pressable>
      )}
      <View style={{ flex: 1 }} />
      <Pressable testID="top-bar-search" onPress={() => router.push("/search")} style={s.iconBtn}>
        <Lucide name="search" size={21} color={colors.onSurface} />
      </Pressable>
      <Pressable testID="top-bar-cart" onPress={() => router.push("/cart")} style={s.iconBtn}>
        <Lucide name="shopping-cart" size={21} color={colors.onSurface} />
        {count > 0 ? (
          <View style={s.badge}><Text testID="cart-badge-count" style={s.badgeText}>{count}</Text></View>
        ) : null}
      </Pressable>
      <Pressable testID="top-bar-account" onPress={() => router.push(user ? "/account" : "/auth/sign-in")} style={s.iconBtn}>
        <Lucide name="user" size={21} color={colors.onSurface} />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  bar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 8, backgroundColor: c.surfaceSecondary, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" },
  brand: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 48 },
  word: { fontFamily: fonts.wordmark, fontSize: 19, letterSpacing: 1.5, color: c.forestDeep, lineHeight: 22 },
  tag: { fontFamily: fonts.b500, fontStyle: "italic", fontSize: 9, color: c.brandPrimary },
  title: { fontFamily: fonts.h800, fontSize: 18, color: c.onSurface, flexShrink: 1 },
  iconBtn: { width: 44, height: 48, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: 6, right: 4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: c.orange, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { color: c.white, fontFamily: fonts.b800, fontSize: 10 },
}));
