import React, { useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import { TopBar } from "@/src/components/TopBar";
import { ProductCard } from "@/src/components/Cards";
import { GridSkeleton } from "@/src/components/Skeleton";
import { Chip, Btn, Body } from "@/src/components/ui";
import { useTabBottom } from "@/src/components/Page";
import { api, PAGE_SIZE } from "@/src/services/api";
import { productCategories } from "@/src/data/products";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function Shop() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useTabBottom();
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const listRef = useRef<FlatList>(null);
  const query = useQuery({ queryKey: ["products", cat, q, page], queryFn: () => api.getProducts(cat, q, page) });
  const res = query.data;
  const goPage = (p: number) => { setPage(p); listRef.current?.scrollToOffset({ offset: 0, animated: true }); };
  const from = res ? (res.page - 1) * PAGE_SIZE + 1 : 0;
  const to = res ? Math.min(res.page * PAGE_SIZE, res.total) : 0;

  return (
    <View style={s.root} testID="shop-screen">
      <TopBar />
      <View style={s.header}>
        <Text style={s.title}>AgroShop</Text>
        <Text style={s.sub}>Certified premium seeds, crop protection, and feeds with expert support</Text>
        <View style={s.search}>
          <Lucide name="search" size={18} color={colors.muted} />
          <TextInput testID="shop-search-input" value={q} onChangeText={(v) => { setQ(v); setPage(1); }} placeholder="Search shop items..." placeholderTextColor={colors.subtle} style={s.searchInput} returnKeyType="search" />
          {q ? <Lucide name="x" size={18} color={colors.muted} onPress={() => { setQ(""); setPage(1); }} /> : null}
        </View>
      </View>
      <View style={s.chipRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, alignItems: "center" }}>
          {productCategories.map((c) => (
            <Chip key={c} testID={`shop-filter-${c.replace(/\W+/g, "-").toLowerCase()}`} label={c} active={cat === c} onPress={() => { setCat(c); setPage(1); }} />
          ))}
        </ScrollView>
      </View>
      {query.isLoading ? (
        <View style={{ paddingTop: 12 }}><GridSkeleton /></View>
      ) : (
        <FlatList
          ref={listRef}
          testID="shop-product-grid"
          data={res?.items}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 12, paddingTop: 12, paddingBottom: bottom }}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} tintColor={colors.brandPrimary} colors={[colors.brandPrimary]} />}
          ListHeaderComponent={<Text style={s.count} testID="shop-count">All Shop Items ({res?.total ?? 0} items found)</Text>}
          ListEmptyComponent={
            <View style={{ alignItems: "center", padding: 32, gap: 8 }} testID="shop-empty">
              <Lucide name="package-search" size={40} color={colors.subtle} />
              <Text style={s.emptyTitle}>No items found</Text>
              <Body style={{ textAlign: "center" }}>Try another search or category.</Body>
            </View>
          }
          renderItem={({ item, index }) => <View style={{ flex: 1, maxWidth: "50%" }}><ProductCard p={item} index={index} /></View>}
          ListFooterComponent={
            <View style={{ paddingHorizontal: 16, gap: 12, marginTop: 12 }}>
              {res && res.total > 0 ? (
                <View style={{ gap: 10, alignItems: "center" }} testID="shop-pagination">
                  <Text style={s.count} testID="shop-showing">Showing {from}–{to} of {res.total} items</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                    <Pressable testID="shop-page-prev" disabled={res.page <= 1} onPress={() => goPage(res.page - 1)} style={[s.pageBtn, res.page <= 1 && { opacity: 0.4 }]}>
                      <Lucide name="chevron-left" size={18} color={colors.onSurface} />
                    </Pressable>
                    {Array.from({ length: res.pages }, (_, i) => i + 1)
                      .filter((n) => n === 1 || n === res.pages || Math.abs(n - res.page) <= 1)
                      .map((n, i, arr) => (
                        <React.Fragment key={n}>
                          {i > 0 && n - arr[i - 1] > 1 ? <Text style={s.count}>…</Text> : null}
                          <Pressable testID={`shop-page-${n}`} onPress={() => goPage(n)} style={[s.pageBtn, n === res.page && s.pageActive]}>
                            <Text style={[s.pageText, n === res.page && { color: colors.white }]}>{n}</Text>
                          </Pressable>
                        </React.Fragment>
                      ))}
                    <Pressable testID="shop-page-next" disabled={res.page >= res.pages} onPress={() => goPage(res.page + 1)} style={[s.pageBtn, res.page >= res.pages && { opacity: 0.4 }]}>
                      <Lucide name="chevron-right" size={18} color={colors.onSurface} />
                    </Pressable>
                  </View>
                </View>
              ) : null}
              <View style={s.promo}>
                <Text style={s.promoKicker}>SEASONAL SPECIAL OFFER</Text>
                <Text style={s.promoTitle}>Get Free Delivery on orders above KSh 5,000</Text>
                <Body dark style={{ fontSize: 13 }}>Stock up on premium top-dressing fertilizers and certified seeds for the planting season. Includes agronomist phone guidance.</Body>
                <Btn testID="shop-promo-btn" small label="Shop Now" onPress={() => { setCat("Fertilizers"); setPage(1); }} />
              </View>
              <View style={s.source}>
                <Text style={s.sourceTitle}>Can&apos;t Find a Particular Item?</Text>
                <Body style={{ fontSize: 13 }}>Submit a quick stock inquiry request. Our agro-sourcing network will locate it and notify you within 24 hours.</Body>
                <Btn testID="shop-sourcing-btn" small variant="green" label="Submit Sourcing Request" onPress={() => router.push({ pathname: "/contact", params: { subject: "Sourcing Request" } })} />
              </View>
            </View>
          }
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { paddingHorizontal: 16, paddingTop: 16, gap: 6, backgroundColor: c.surface },
  title: { fontFamily: fonts.h900, fontSize: 28, color: c.onSurface },
  sub: { fontFamily: fonts.b400, fontSize: 13, color: c.onSurfaceTertiary },
  search: { flexDirection: "row", alignItems: "center", gap: 8, height: 48, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.white, paddingHorizontal: 14, marginTop: 8 },
  searchInput: { flex: 1, fontFamily: fonts.b500, fontSize: 14, color: c.onSurface, height: 48 },
  chipRow: { height: 56, justifyContent: "center", backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border },
  count: { fontFamily: fonts.b700, fontSize: 13, color: c.onSurfaceTertiary, paddingHorizontal: 16 },
  pageBtn: { minWidth: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.white, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  pageActive: { backgroundColor: c.forest, borderColor: c.forest },
  pageText: { fontFamily: fonts.b700, fontSize: 14, color: c.onSurface },
  emptyTitle: { fontFamily: fonts.h800, fontSize: 18, color: c.onSurface },
  promo: { backgroundColor: c.forest, borderRadius: 24, padding: 20, gap: 10 },
  promoKicker: { fontFamily: fonts.b800, fontSize: 11, letterSpacing: 1, color: c.brandSecondary },
  promoTitle: { fontFamily: fonts.h800, fontSize: 20, color: c.white },
  source: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 24, padding: 20, gap: 10 },
  sourceTitle: { fontFamily: fonts.h800, fontSize: 18, color: c.onSurface },
}));
