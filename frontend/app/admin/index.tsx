import React from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import { adminApi } from "@/src/admin/api";
import { AdminFeedback, StatusBadge, useAdminStyles } from "@/src/admin/UI";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { ksh } from "@/src/data/products";
import { timeAgo } from "@/src/components/forum/ForumUI";

export default function AdminOverview() {
  const s = useStyles(); const shared = useAdminStyles(); const { colors } = useTheme(); const router = useRouter();
  const q = useQuery({ queryKey: ["admin", "overview"], queryFn: adminApi.overview, refetchInterval: 30000 }); const data = q.data;
  if (q.isPending) return <View style={s.loading}><ActivityIndicator color={colors.brand} testID="admin-overview-loading" /></View>;
  if (q.isError || !data) return <AdminFeedback error={q.error?.message || "Could not load your overview."} retry={() => q.refetch()} />;
  const metrics = [{ key: "open_orders", label: "Open orders", icon: "package-check", route: "orders" }, { key: "open_requests", label: "Service requests", icon: "clipboard-list", route: "requests" }, { key: "published_products", label: "Live products", icon: "package", route: "products" }, { key: "customers", label: "Registered people", icon: "users", route: "users" }];
  const queue = [{ key: "open_orders", label: "Orders to fulfil", note: "Confirm, dispatch, and deliver", route: "orders", icon: "truck" }, { key: "low_stock", label: "Low-stock products", note: "5 units or fewer available", route: "products?status=low-stock", icon: "package-open" }, { key: "open_messages", label: "Open customer enquiries", note: "Keep the conversation moving", route: "inbox", icon: "inbox" }];
  return <ScrollView testID="admin-overview-screen" style={shared.root} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.brand} />}>
    <View style={s.greeting}><View><Text style={s.eyebrow} testID="admin-overview-date">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}</Text><Text style={s.h1}>Your ecosystem,{`\n`}at a glance.</Text></View><View style={s.live}><View style={s.dot} /><Text style={s.liveText}>Live data</Text></View></View>
    <View style={s.hero}><View style={s.heroTop}><Text style={s.heroLabel}>TOTAL ORDER VALUE</Text><Lucide name="chart-no-axes-combined" size={21} color={colors.brandSecondary} /></View><Text testID="admin-order-value" style={s.heroValue}>{ksh(data.order_value)}</Text><Text style={s.heroNote}>All non-cancelled orders · not collected revenue</Text><View style={s.heroDivider} /><Pressable testID="admin-overview-orders" onPress={() => router.push("/admin/orders")} style={s.heroLink}><Text style={s.heroLinkText}>View order book</Text><Lucide name="arrow-up-right" size={18} color={colors.brandSecondary} /></Pressable></View>
    <View style={s.metrics}>{metrics.map(metric => <Pressable key={metric.key} testID={`admin-metric-${metric.key}`} onPress={() => router.push(`/admin/${metric.route}` as any)} style={({ pressed }) => [s.metric, pressed && shared.pressed]}><View style={s.metricTop}><Lucide name={metric.icon as any} size={19} color={colors.brand} /><Lucide name="arrow-up-right" size={14} color={colors.subtle} /></View><Text testID={`admin-count-${metric.key}`} style={s.metricValue}>{data[metric.key]}</Text><Text style={s.metricLabel}>{metric.label}</Text></Pressable>)}</View>
    <View style={s.sectionHead}><Text style={shared.h2}>Needs attention</Text><Text style={shared.caption}>Your daily checklist</Text></View><View style={s.queue}>{queue.map((item, index) => <Pressable key={item.key} testID={`admin-queue-${item.key}`} onPress={() => router.push(`/admin/${item.route}` as any)} style={[s.queueRow, index > 0 && s.rowBorder]}><View style={s.queueIcon}><Lucide name={item.icon as any} size={19} color={colors.brand} /></View><View style={shared.flex}><Text style={shared.h3}>{item.label}</Text><Text style={shared.caption}>{item.note}</Text></View><Text testID={`admin-queue-count-${item.key}`} style={s.queueCount}>{data[item.key]}</Text><Lucide name="chevron-right" size={15} color={colors.muted} /></Pressable>)}</View>
    <View style={s.sectionHead}><Text style={shared.h2}>Latest open orders</Text><Pressable testID="admin-all-orders" onPress={() => router.push("/admin/orders")} style={s.textLink}><Text style={s.linkText}>View all</Text><Lucide name="arrow-right" size={14} color={colors.brand} /></Pressable></View>
    {data.recent_orders.length ? data.recent_orders.map((order: any) => <Pressable key={order.id} testID={`admin-recent-order-${order.id}`} onPress={() => router.push(`/admin/orders/${order.id}`)} style={shared.card}><View style={s.sectionHead}><Text style={shared.h3}>{order.id}</Text><StatusBadge status={order.status} testID={`admin-order-status-${order.id}`} /></View><View style={s.sectionHead}><Text style={shared.caption}>{order.name} · {order.county}</Text><Text style={s.linkText}>{ksh(order.total)}</Text></View></Pressable>) : <Text testID="admin-no-open-orders" style={shared.body}>No open orders. New orders will appear here.</Text>}
    <View style={s.sectionHead}><Text style={shared.h2}>Recent activity</Text><Pressable testID="admin-all-activity" onPress={() => router.push("/admin/audit")} style={s.textLink}><Text style={s.linkText}>View log</Text><Lucide name="arrow-right" size={14} color={colors.brand} /></Pressable></View>
    {data.recent_activity.length ? data.recent_activity.map((event: any) => <View key={event.id} testID={`admin-activity-${event.id}`} style={s.activity}><View style={s.activityDot} /><View style={shared.flex}><Text style={shared.body}>{event.action} · {event.resource}</Text><Text style={shared.caption} numberOfLines={1}>{event.label}</Text></View><Text style={shared.caption}>{timeAgo(event.created_at)}</Text></View>) : <Text testID="admin-no-activity" style={shared.body}>Staff changes will be recorded here.</Text>}
    <Text testID="admin-overview-updated" style={s.updated}>Updated {timeAgo(data.updated_at)} · Pull down to refresh</Text>
  </ScrollView>;
}

const useStyles = makeStyles(c => ({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" }, content: { padding: 20, gap: 18, paddingBottom: 32 },
  greeting: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10, paddingVertical: 4 },
  eyebrow: { fontFamily: fonts.b700, fontSize: 8, letterSpacing: 1.3, color: c.muted, marginBottom: 9 },
  h1: { fontFamily: fonts.h700, fontSize: 29, lineHeight: 34, color: c.onSurface, letterSpacing: -0.7 },
  live: { flexDirection: "row", gap: 5, alignItems: "center", borderWidth: 1, borderColor: c.border, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 5 },
  dot: { width: 4, height: 4, backgroundColor: c.brandPrimary, borderRadius: 2 }, liveText: { fontFamily: fonts.b600, fontSize: 9, color: c.brand },
  hero: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, backgroundColor: c.forest, borderRadius: 20 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, heroLabel: { fontFamily: fonts.b700, fontSize: 9, color: c.whiteA70, letterSpacing: 1.4 },
  heroValue: { fontFamily: fonts.h600, fontSize: 36, color: c.brandSecondary, letterSpacing: -1, marginTop: 10 },
  heroNote: { fontFamily: fonts.b400, fontSize: 9, color: c.whiteA70, marginTop: 5 },
  heroDivider: { height: 1, backgroundColor: c.whiteA10, marginTop: 15 },
  heroLink: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 44 }, heroLinkText: { fontFamily: fonts.b600, fontSize: 11, color: c.onBrand },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 12 }, metric: { width: "47%", flexGrow: 1, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  metricTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, metricValue: { fontFamily: fonts.h700, fontSize: 28, color: c.onSurface, marginTop: 10 }, metricLabel: { fontFamily: fonts.b500, fontSize: 10, color: c.muted, marginTop: 3 },
  sectionHead: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "space-between" },
  queue: { borderWidth: 1, borderColor: c.border, borderRadius: 18, backgroundColor: c.surfaceSecondary, paddingHorizontal: 14 },
  queueRow: { flexDirection: "row", gap: 10, alignItems: "center", minHeight: 80 }, queueIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: c.heroBg, alignItems: "center", justifyContent: "center" },
  rowBorder: { borderTopWidth: 1, borderTopColor: c.divider }, queueCount: { fontFamily: fonts.b700, color: c.brand, fontSize: 13 },
  textLink: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 6 }, linkText: { fontFamily: fonts.b700, fontSize: 11, color: c.brand },
  activity: { flexDirection: "row", gap: 10, alignItems: "center" }, activityDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: c.brandTertiary, borderWidth: 1, borderColor: c.brand },
  updated: { fontFamily: fonts.b400, fontSize: 10, color: c.muted, textAlign: "center", marginTop: 12 },
}));