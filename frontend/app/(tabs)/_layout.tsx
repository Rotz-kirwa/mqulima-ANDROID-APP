import React from "react";
import { Platform } from "react-native";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Lucide } from "@react-native-vector-icons/lucide";
import { usesNativeTabs } from "@/src/navigation";
import { colors, fonts } from "@/src/theme";

const TABS = [
  { name: "index", label: "Home", icon: "house", sf: "house.fill" },
  { name: "shop", label: "AgroShop", icon: "shopping-bag", sf: "bag.fill" },
  { name: "news", label: "News", icon: "newspaper", sf: "newspaper.fill" },
  { name: "forum", label: "Forum", icon: "messages-square", sf: "bubble.left.and.bubble.right.fill" },
  { name: "more", label: "More", icon: "menu", sf: "line.3.horizontal" },
] as const;

export default function TabsLayout() {
  if (usesNativeTabs) {
    return (
      <NativeTabs tintColor={colors.brand}>
        {TABS.map((t) => (
          <NativeTabs.Trigger key={t.name} name={t.name}>
            <NativeTabs.Trigger.Icon sf={t.sf as any} />
            <NativeTabs.Trigger.Label>{t.label}</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        ))}
      </NativeTabs>
    );
  }
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.subtle,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border, ...(Platform.OS === "web" ? { height: 64 } : {}) },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarLabelStyle: { fontFamily: fonts.b700, fontSize: 11 },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.label,
            tabBarButtonTestID: `tab-${t.name}`,
            tabBarIcon: ({ color }: { color: string }) => <Lucide name={t.icon as any} size={22} color={color} />,
          } as any}
        />
      ))}
    </Tabs>
  );
}
