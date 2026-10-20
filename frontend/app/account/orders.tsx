import React from "react";
import { FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Page, useStackBottom } from "@/src/components/Page";
import { Btn, Body } from "@/src/components/ui";
import { ksh } from "@/src/data/products";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { useApp } from "@/src/store/AppStore";

export default function Orders() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useStackBottom();
  const { orders } = useApp();
  return (
    <Page title="Order History" testID="orders-screen">
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottom }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", gap: 10, paddingTop: 48 }} testID="orders-empty">
            <Lucide name="receipt" size={40} color={colors.subtle} />
            <Text style={s.title}>No orders yet</Text>
            <Body>Your AgroShop orders will appear here.</Body>
            <Btn variant="green" label="Shop Now" onPress={() => router.navigate("/(tabs)/shop")} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card} testID={`order-${item.id}`}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={s.title}>{item.id}</Text>
              <Text style={s.status}>{item.status}</Text>
            </View>
            <Text style={s.meta}>{new Date(item.date).toLocaleString()} • {item.location}, {item.county}</Text>
            {item.items.map((i) => <Text key={i.key} style={s.line} numberOfLines={1}>{i.qty} × {i.name}{i.variant ? ` (${i.variant})` : ""}</Text>)}
            <Text style={s.total}>{ksh(item.total)}</Text>
          </View>
        )}
      />
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  card: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 20, padding: 16, gap: 6 },
  title: { fontFamily: fonts.h800, fontSize: 16, color: c.onSurface },
  status: { fontFamily: fonts.b800, fontSize: 11, color: c.white, backgroundColor: c.orange, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, overflow: "hidden" },
  meta: { fontFamily: fonts.b500, fontSize: 12, color: c.muted },
  line: { fontFamily: fonts.b500, fontSize: 13, color: c.onSurfaceSecondary },
  total: { fontFamily: fonts.h900, fontSize: 18, color: c.brand },
}));
