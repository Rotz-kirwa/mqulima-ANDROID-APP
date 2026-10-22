import React, { useEffect } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Page, useStackBottom } from "@/src/components/Page";
import { ListSkeleton } from "@/src/components/Skeleton";
import { Btn, Body } from "@/src/components/ui";
import { ksh } from "@/src/data/products";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { useApp } from "@/src/store/AppStore";
import { api } from "@/src/services/api";

export default function Orders() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useStackBottom();
  const { user, ready } = useApp();
  const q = useQuery({ queryKey: ["orders"], queryFn: api.getOrders, enabled: !!user });

  useEffect(() => {
    if (ready && !user) router.replace("/auth/sign-in");
  }, [ready, user, router]);

  return (
    <Page title="Order History" testID="orders-screen">
      {q.isLoading ? (
        <View style={{ padding: 16 }}><ListSkeleton count={3} height={140} /></View>
      ) : (
        <FlatList
          data={q.data ?? []}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottom }}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={q.refetch} tintColor={colors.brandPrimary} colors={[colors.brandPrimary]} />}
          ListEmptyComponent={
            <View style={{ alignItems: "center", gap: 10, paddingTop: 48 }} testID="orders-empty">
              <Lucide name="receipt" size={40} color={colors.subtle} />
              <Text style={s.title}>{q.isError ? "Could not load orders" : "No orders yet"}</Text>
              <Body>{q.isError ? "Pull down to try again." : "Your AgroShop orders will appear here."}</Body>
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
              {item.delivery ? <Text style={s.meta}>Delivery {ksh(item.delivery)}</Text> : <Text style={s.meta}>Free delivery</Text>}
              <Text style={s.total}>{ksh(item.total)}</Text>
            </View>
          )}
        />
      )}
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
