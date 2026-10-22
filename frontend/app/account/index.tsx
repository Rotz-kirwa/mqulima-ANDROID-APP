import React, { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Page, useStackBottom } from "@/src/components/Page";
import { Avatar, Btn } from "@/src/components/ui";
import { avatar } from "@/src/data/home";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { cartCount, useApp } from "@/src/store/AppStore";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/services/api";

export default function Account() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useStackBottom();
  const { user, signOut, saved, cart, ready } = useApp();
  const orders = useQuery({ queryKey: ["orders"], queryFn: api.getOrders, enabled: !!user });
  const myThreads = useQuery({ queryKey: ["my-threads"], queryFn: api.getMyThreads, enabled: !!user });

  useEffect(() => {
    if (ready && !user) router.replace("/auth/sign-in");
  }, [ready, user, router]);
  if (!user) return <Page title="Account"><View /></Page>;

  const links = [
    { id: "orders", icon: "receipt", label: "Order History", count: orders.data?.length ?? 0, route: "/account/orders" },
    { id: "saved", icon: "heart", label: "Saved Items", count: saved.length, route: "/account/saved" },
    { id: "cart", icon: "shopping-cart", label: "My Cart", count: cartCount(cart), route: "/cart" },
    { id: "posts", icon: "messages-square", label: "My Forum Posts", count: myThreads.data?.length ?? 0, route: "/(tabs)/forum" },
    { id: "services", icon: "briefcase", label: "Request a Service", route: "/services" },
  ];
  return (
    <Page title="My Account" testID="account-screen">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottom }}>
        <View style={s.profile}>
          <Avatar uri={avatar(user.name)} size={64} />
          <View style={{ flex: 1 }}>
            <Text style={s.name} testID="account-name">{user.name}</Text>
            <Text style={s.meta}>{user.email}</Text>
            {user.phone ? <Text style={s.meta}>{user.phone}{user.county ? ` • ${user.county}` : ""}</Text> : null}
          </View>
        </View>
        {links.map((l) => (
          <Pressable key={l.id} testID={`account-link-${l.id}`} onPress={() => router.push(l.route as any)} style={s.row}>
            <View style={s.icon}><Lucide name={l.icon as any} size={18} color={colors.onBrandTertiary} /></View>
            <Text style={s.label}>{l.label}</Text>
            <View style={{ flex: 1 }} />
            {l.count !== undefined ? <Text style={s.count}>{l.count}</Text> : null}
            <Lucide name="chevron-right" size={18} color={colors.subtle} />
          </Pressable>
        ))}
        <Btn testID="account-sign-out-btn" full variant="outline" icon="log-out" label="Sign Out" onPress={async () => { await signOut(); router.replace("/"); }} style={{ marginTop: 8 }} />
      </ScrollView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  profile: { flexDirection: "row", gap: 14, alignItems: "center", backgroundColor: c.forest, borderRadius: 24, padding: 20 },
  name: { fontFamily: fonts.h900, fontSize: 20, color: c.white },
  meta: { fontFamily: fonts.b500, fontSize: 12, color: c.whiteA85 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 60, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 18, paddingHorizontal: 14 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: fonts.h700, fontSize: 15, color: c.onSurface },
  count: { fontFamily: fonts.b800, fontSize: 12, color: c.onBrandTertiary, backgroundColor: c.brandTertiary, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, overflow: "hidden" },
}));
