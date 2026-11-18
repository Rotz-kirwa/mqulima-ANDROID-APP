import React, { useEffect } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useNetInfo } from "@react-native-community/netinfo";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Page, useStackBottom } from "@/src/components/Page";
import { ListSkeleton } from "@/src/components/Skeleton";
import { Btn, Body } from "@/src/components/ui";
import { ksh } from "@/src/data/products";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { useAuth } from "@/src/store/AppStore";
import { QUERY_STALE_TIMES } from "@/src/query-client";
import { api } from "@/src/services/api";

export default function Orders() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useStackBottom();
  const { user, ready } = useAuth();
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false || netInfo.isInternetReachable === false;
  const q = useQuery({
    queryKey: ["orders"],
    queryFn: ({ signal }) => api.getOrders(signal),
    enabled: !!user,
    staleTime: QUERY_STALE_TIMES.ORDERS,
  });
  const isLiveVerified = !isOffline && !q.isError && !q.isPaused && q.isFetchedAfterMount;

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
          ListHeaderComponent={
            (q.data?.length ?? 0) > 0 && !isLiveVerified ? (
              <View
                testID="orders-stale-warning"
                style={{
                  backgroundColor: "#FEF3C7",
                  borderWidth: 1,
                  borderColor: "#F59E0B",
                  borderRadius: 14,
                  padding: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Lucide name="wifi-off" size={16} color="#92400E" />
                <Text style={{ flex: 1, fontFamily: fonts.b600, fontSize: 12, color: "#92400E" }}>
                  Showing cached order snapshot — reconnect and pull down to verify live payment and delivery status.
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", gap: 10, paddingTop: 48 }} testID="orders-empty">
              <Lucide name="receipt" size={40} color={colors.subtle} />
              <Text style={s.title}>{q.isError || isOffline ? "Could not verify live orders" : "No orders yet"}</Text>
              <Body>{q.isError || isOffline ? "Check your connection and pull down to load live order status." : "Your AgroShop orders will appear here."}</Body>
              <Btn variant="green" label="Shop Now" onPress={() => router.navigate("/(tabs)/shop")} />
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.card} testID={`order-${item.id}`}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={s.title}>{item.id}</Text>
                <Text style={s.status}>{isLiveVerified ? item.status : `${item.status} (Cached)`}</Text>
              </View>
              <Text style={s.meta}>
                {new Date(item.date).toLocaleString()}
                {[item.location, item.county].filter(Boolean).length
                  ? ` • ${[item.location, item.county].filter(Boolean).join(", ")}`
                  : ""}
              </Text>
              {item.items.map((i, idx) => (
                <Text key={i.key || `${i.productId || i.name}-${idx}`} style={s.line} numberOfLines={1}>
                  {(i.qty ?? (i as any).quantity ?? 1)} × {i.name}{i.variant ? ` (${i.variant})` : ""}
                </Text>
              ))}
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
