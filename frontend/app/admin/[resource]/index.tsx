import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Lucide } from "@react-native-vector-icons/lucide";
import { adminApi } from "@/src/admin/api";
import { modules, labelFor, dateLabel } from "@/src/admin/config";
import { AdminFeedback, AdminHeading, FilterStrip, StatusBadge, useAdminStyles } from "@/src/admin/UI";
import { Image } from "@/src/components/Img";
import { ksh } from "@/src/data/products";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function ResourceList() {
  const { resource, status: initialStatus } = useLocalSearchParams<{ resource: string; status?: string }>();
  const s = useStyles(); const shared = useAdminStyles(); const { colors } = useTheme(); const router = useRouter(); const module = modules[resource];
  const [search, setSearch] = useState(""); const [term, setTerm] = useState(""); const [status, setStatus] = useState(initialStatus || "all"); const [page, setPage] = useState(1);
  useEffect(() => { const timer = setTimeout(() => { setTerm(search); setPage(1); }, 250); return () => clearTimeout(timer); }, [search]);
  const q = useQuery({ queryKey: ["admin", resource, term, status, page], queryFn: () => adminApi.list(resource, term, status, page), enabled: !!module });
  if (!module) return <AdminFeedback empty="Module not found" description="Choose a module from Manage." />;
  return <View testID={`admin-list-${resource}`} style={shared.root}><AdminHeading title={module.title} subtitle={module.description} action={module.editable ? <Pressable testID="admin-create-record" accessibilityLabel={`Create ${module.singular}`} onPress={() => router.push(`/admin/${resource}/new` as any)} style={s.add}><Lucide name="plus" size={23} color={colors.onBrand} /></Pressable> : undefined} />
    <View style={s.search}><Lucide name="search" size={19} color={colors.muted} /><TextInput testID="admin-search-input" accessibilityLabel={`Search ${module.title}`} value={search} onChangeText={setSearch} placeholder={`Search ${module.title.toLowerCase()}…`} placeholderTextColor={colors.muted} style={s.input} />{search.length > 0 && <Pressable testID="admin-search-clear" accessibilityLabel="Clear search" onPress={() => setSearch("")} style={shared.iconButton}><Lucide name="x" size={17} color={colors.muted} /></Pressable>}</View>
    {module.statuses.length > 0 && <View><FilterStrip statuses={module.statuses} value={status} onChange={value => { setStatus(value); setPage(1); }} /></View>}
    <FlatList testID="admin-record-list" data={q.data?.items ?? []} keyExtractor={item => item.id} contentContainerStyle={s.list} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.brand} />}
      ListHeaderComponent={q.data ? <Text testID="admin-record-count" style={shared.eyebrow}>{q.data.total} {q.data.total === 1 ? "record" : "records"} · Page {q.data.page} of {q.data.pages}</Text> : null}
      ListEmptyComponent={q.isPending ? <ActivityIndicator testID="admin-list-loading" color={colors.brand} /> : q.isError ? <AdminFeedback error={q.error.message} retry={() => q.refetch()} /> : <AdminFeedback empty={search || status !== "all" ? "No matching records" : "Nothing here yet"} description={search || status !== "all" ? "Try a different search or filter." : "New records will appear here as your community grows."} />}
      renderItem={({ item }) => <Pressable testID={`admin-record-${item.id}`} onPress={() => router.push(`/admin/${resource}/${item.id}` as any)} style={({ pressed }) => [s.record, pressed && shared.pressed]}><View style={s.topRow}>{!!item.image && <Image source={{ uri: item.image }} style={s.thumbnail} contentFit="cover" />}<View style={shared.flex}><Text testID={`admin-record-title-${item.id}`} style={shared.h3} numberOfLines={2}>{labelFor(item, resource)}</Text><Text style={shared.caption} numberOfLines={2}>{resource === "orders" ? `${item.name} · ${item.county}` : resource === "forum" ? `${item.author} · ${item.tag}` : item.category || item.email || item.service || item.subject || item.level || item.actor || dateLabel(item.created_at)}</Text></View><Lucide name="chevron-right" size={17} color={colors.muted} /></View><View style={s.recordBottom}>{item.status ? <StatusBadge status={item.status} testID={`admin-record-status-${item.id}`} /> : <Text style={shared.caption}>{item.action}</Text>}<Text testID={`admin-record-meta-${item.id}`} style={s.meta}>{resource === "products" ? `${ksh(item.price)} · ${item.stock} units` : resource === "orders" ? ksh(item.total) : resource === "forum" ? `${item.comments?.length ?? 0} replies` : dateLabel(item.created_at)}</Text></View></Pressable>}
      ListFooterComponent={q.data && q.data.pages > 1 ? <View style={s.pagination}><Pressable testID="admin-previous-page" disabled={page === 1} onPress={() => setPage(page - 1)} style={[s.pageButton, page === 1 && s.disabled]}><Text style={shared.body}>Previous</Text></Pressable><Pressable testID="admin-next-page" disabled={page >= q.data.pages} onPress={() => setPage(page + 1)} style={[s.pageButton, page >= q.data.pages && s.disabled]}><Text style={shared.body}>Next page</Text><Lucide name="arrow-right" size={17} color={colors.brand} /></Pressable></View> : null}
    />
  </View>;
}

const useStyles = makeStyles(c => ({
  add: { width: 44, height: 44, borderRadius: 13, backgroundColor: c.brand, alignItems: "center", justifyContent: "center" },
  search: { marginHorizontal: 20, marginBottom: 16, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, borderRadius: 13, flexDirection: "row", alignItems: "center", paddingLeft: 14 },
  input: { flex: 1, minWidth: 0, height: 48, paddingHorizontal: 10, fontFamily: fonts.b400, fontSize: 12, color: c.onSurface },
  list: { padding: 20, paddingTop: 0, gap: 12, paddingBottom: 32 },
  record: { backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, borderRadius: 17, padding: 15, gap: 14 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12 }, thumbnail: { width: 52, height: 52, borderRadius: 11, backgroundColor: c.heroBg },
  recordBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: c.divider, paddingTop: 12 },
  meta: { fontFamily: fonts.b600, fontSize: 10, color: c.onSurfaceTertiary, flexShrink: 1 },
  pagination: { flexDirection: "row", justifyContent: "space-between", gap: 16 }, pageButton: { flexDirection: "row", minHeight: 48, gap: 10, alignItems: "center", paddingHorizontal: 16, borderWidth: 1, borderColor: c.border, borderRadius: 12 }, disabled: { opacity: 0.3 },
}));