import React, { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import { TopBar } from "@/src/components/TopBar";
import { ProductCard } from "@/src/components/Cards";
import { Footer } from "@/src/components/Footer";
import { GridSkeleton } from "@/src/components/Skeleton";
import { Btn, Body } from "@/src/components/ui";
import { usesNativeTabs } from "@/src/navigation";
import { api, PAGE_SIZE } from "@/src/services/api";
import { PRODUCT_TAXONOMY, SubcategoryItem, ProductCategory } from "@/src/data/products";
import { fonts, makeStyles, useTheme } from "@/src/theme";

// Top search suggestions for fast 1-tap customer discovery
const POPULAR_SEARCHES = [
  "DAP 50KG",
  "Maize Seeds",
  "Tomato Seeds",
  "Knapsack 16L",
  "CAN Fertilizer",
  "Dairy Meal",
  "Foliar Feed",
  "Duduthrin",
];

// Exactly 6 main product categories arranged into 2 rows of 3 columns
const GRID_CATEGORIES_ROW_1: { id: ProductCategory; label: string; shortLabel: string; icon: string }[] = [
  { id: "Inputs & Agrochemicals", label: "Inputs & Agrochemicals", shortLabel: "Agrochemicals", icon: "flask-conical" },
  { id: "Seeds", label: "Seeds", shortLabel: "Seeds", icon: "sprout" },
  { id: "Fertilizers", label: "Fertilizers", shortLabel: "Fertilizers", icon: "leaf" },
];

const GRID_CATEGORIES_ROW_2: { id: ProductCategory; label: string; shortLabel: string; icon: string }[] = [
  { id: "Animal Feeds", label: "Animal Feeds", shortLabel: "Animal Feeds", icon: "wheat" },
  { id: "Animal Health", label: "Animal Health", shortLabel: "Animal Health", icon: "heart-pulse" },
  { id: "Farm Equipment", label: "Farm Equipment", shortLabel: "Equipment", icon: "tractor" },
];

export default function Shop() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [cat, setCat] = useState("All");
  const [subcat, setSubcat] = useState("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [page, setPage] = useState(1);

  // Debounce search query by 250ms for instantaneous typing & optimal performance
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(q.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [q]);

  const [subcatModalOpen, setSubcatModalOpen] = useState(false);

  const listRef = useRef<FlatList>(null);

  const query = useQuery({
    queryKey: ["products", cat, subcat, debouncedQ, page],
    queryFn: () => api.getProducts(cat, debouncedQ, page, subcat),
  });

  const res = query.data;

  const totalCountQuery = useQuery({
    queryKey: ["products-catalog-total-count"],
    queryFn: async () => {
      const allRes = await api.getProducts("All", "", 1);
      return allRes.total;
    },
    staleTime: 60_000,
  });
  const totalCatalogCount = totalCountQuery.data ?? (cat === "All" && !debouncedQ ? res?.total : undefined) ?? 0;
  const goPage = (p: number) => {
    setPage(p);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };
  const from = res ? (res.page - 1) * PAGE_SIZE + 1 : 0;
  const to = res ? Math.min(res.page * PAGE_SIZE, res.total) : 0;

  const currentCatDef = useMemo(
    () => PRODUCT_TAXONOMY.find((c) => c.id === cat) || PRODUCT_TAXONOMY[0],
    [cat]
  );

  const availableSubcats = useMemo(() => {
    if (cat !== "All") {
      return currentCatDef.subcategories;
    }
    return PRODUCT_TAXONOMY.flatMap((c) =>
      c.subcategories.map((s) => ({
        ...s,
        parentCat: c.id,
        parentLabel: c.label,
      }))
    );
  }, [cat, currentCatDef]);

  const currentSubcatDef = useMemo(() => {
    if (subcat === "all") return null;
    return availableSubcats.find((s) => s.id === subcat);
  }, [subcat, availableSubcats]);

  const toggleCategory = (selectedCategory: string) => {
    if (cat === selectedCategory) {
      // Tapping the active category toggles back to All
      setCat("All");
      setSubcat("all");
    } else {
      setCat(selectedCategory);
      setSubcat("all");
    }
    setPage(1);
  };

  const onSelectSubcategory = (subItem: SubcategoryItem & { parentCat?: string }) => {
    if (subItem.parentCat && subItem.parentCat !== "All") {
      setCat(subItem.parentCat);
    }
    setSubcat(subItem.id);
    setPage(1);
    setSubcatModalOpen(false);
  };

  const clearSearch = () => {
    setQ("");
    setDebouncedQ("");
    setPage(1);
  };

  const isFiltered = cat !== "All" || subcat !== "all" || !!debouncedQ;

  const resetAll = () => {
    setCat("All");
    setSubcat("all");
    setQ("");
    setDebouncedQ("");
    setPage(1);
  };

  return (
    <View style={s.root} testID="shop-screen">
      <TopBar />
      <View style={s.header}>
        <View style={s.titleRow}>
          <Text style={s.title}>AgroShop</Text>
          <Text style={s.sub} numberOfLines={1}>• Certified inputs & feeds</Text>
        </View>
        <View style={[s.search, isSearchFocused && s.searchFocused]}>
          <Lucide
            name="search"
            size={16}
            color={isSearchFocused ? colors.brandPrimary : colors.muted}
          />
          <TextInput
            testID="shop-search-input"
            value={q}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onChangeText={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="Search shop items..."
            placeholderTextColor={colors.subtle}
            style={s.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => setDebouncedQ(q.trim())}
          />
          {q ? (
            <Pressable
              onPress={clearSearch}
              hitSlop={10}
              testID="shop-search-clear"
              accessibilityLabel="Clear search"
            >
              <Lucide name="x" size={16} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        {/* Popular Quick Search Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.quickSearchRow}
        >
          <Text style={s.quickSearchPrefix}>Popular:</Text>
          {POPULAR_SEARCHES.map((item) => {
            const isSelected = debouncedQ.toLowerCase() === item.toLowerCase();
            return (
              <Pressable
                key={item}
                testID={`shop-quick-search-${item.toLowerCase().replace(/\s+/g, "-")}`}
                onPress={() => {
                  setQ(item);
                  setDebouncedQ(item);
                  setPage(1);
                }}
                style={[s.quickSearchChip, isSelected && s.quickSearchChipActive]}
              >
                <Text style={[s.quickSearchChipText, isSelected && s.quickSearchChipTextActive]}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Category Navigation Panel: 2 Rows, each having 3 items (2x3 Grid) */}
      <View style={s.navSection}>
        <View style={s.navHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={s.navHeaderIcon}>
              <Lucide name="layout-grid" size={13} color={colors.forest} />
            </View>
            <Text style={s.navHeaderTitle}>Shop by Category</Text>
            {cat !== "All" && (
              <View style={s.activeBadge}>
                <Text style={s.activeBadgeText}>{cat}</Text>
              </View>
            )}
          </View>

          {/* All Items Button */}
          <Pressable
            testID="shop-filter-all"
            onPress={() => {
              setCat("All");
              setSubcat("all");
              setPage(1);
            }}
            style={[s.allBtn, cat === "All" && s.allBtnActive]}
          >
            <Lucide
              name="sparkles"
              size={12}
              color={cat === "All" ? colors.brandSecondary : colors.muted}
            />
            <Text style={[s.allBtnText, cat === "All" && s.allBtnTextActive]}>
              All ({totalCatalogCount})
            </Text>
          </Pressable>
        </View>

        {/* 2 Rows × 3 Columns Grid */}
        <View style={s.grid}>
          {/* Row 1 (3 items) */}
          <View style={s.gridRow}>
            {GRID_CATEGORIES_ROW_1.map((item) => {
              const active = cat === item.id;
              return (
                <Pressable
                  key={item.id}
                  testID={`shop-filter-${item.id.replace(/\W+/g, "-").toLowerCase()}`}
                  onPress={() => toggleCategory(item.id)}
                  style={({ pressed }) => [
                    s.gridBtn,
                    active && s.gridBtnActive,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <Lucide
                    name={(item.icon as any) ?? "package"}
                    size={16}
                    color={active ? colors.brandSecondary : colors.forest}
                  />
                  <Text
                    style={[s.gridBtnText, active && s.gridBtnTextActive]}
                    numberOfLines={1}
                  >
                    {item.shortLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Row 2 (3 items) */}
          <View style={s.gridRow}>
            {GRID_CATEGORIES_ROW_2.map((item) => {
              const active = cat === item.id;
              return (
                <Pressable
                  key={item.id}
                  testID={`shop-filter-${item.id.replace(/\W+/g, "-").toLowerCase()}`}
                  onPress={() => toggleCategory(item.id)}
                  style={({ pressed }) => [
                    s.gridBtn,
                    active && s.gridBtnActive,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <Lucide
                    name={(item.icon as any) ?? "package"}
                    size={16}
                    color={active ? colors.brandSecondary : colors.forest}
                  />
                  <Text
                    style={[s.gridBtnText, active && s.gridBtnTextActive]}
                    numberOfLines={1}
                  >
                    {item.shortLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Sub-Category Dropdown / Active Filter Bar */}
        {cat !== "All" && availableSubcats.length > 1 && (
          <View style={s.subcatBar}>
            <Pressable
              testID="shop-subcategory-select"
              onPress={() => setSubcatModalOpen(true)}
              style={({ pressed }) => [
                s.subcatBtn,
                subcat !== "all" && s.subcatBtnActive,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={s.subcatLeft}>
                <Lucide
                  name="layers"
                  size={14}
                  color={subcat !== "all" ? colors.brandPrimary : colors.muted}
                />
                <Text style={s.subcatLabel}>SUB-CATEGORY:</Text>
                <Text style={[s.subcatValue, subcat !== "all" && s.subcatValueActive]} numberOfLines={1}>
                  {currentSubcatDef?.label ?? `All ${cat}`}
                </Text>
              </View>
              <Lucide name="chevron-down" size={15} color={colors.muted} />
            </Pressable>

            {isFiltered && (
              <Pressable
                testID="shop-reset-filters"
                onPress={resetAll}
                style={s.resetBtn}
                hitSlop={8}
              >
                <Lucide name="rotate-ccw" size={11} color={colors.brandPrimary} />
                <Text style={s.resetText}>Reset</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Sub-Category Dropdown Selection Modal */}
      <Modal
        visible={subcatModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSubcatModalOpen(false)}
      >
        <Pressable style={s.modalScrim} onPress={() => setSubcatModalOpen(false)} />
        <View style={[s.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={s.sheetHandle} />
          <View style={s.sheetHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={s.sheetHeaderIconWrap}>
                <Lucide name="layers" size={16} color={colors.forest} />
              </View>
              <View>
                <Text style={s.sheetTitle}>{`${cat} Sub-Categories`}</Text>
                <Text style={s.sheetSub}>Filter down to specific product types</Text>
              </View>
            </View>
            <Pressable onPress={() => setSubcatModalOpen(false)} hitSlop={10} style={s.sheetCloseBtn}>
              <Lucide name="x" size={18} color={colors.onSurface} />
            </Pressable>
          </View>

          <ScrollView style={s.sheetList} showsVerticalScrollIndicator={false}>
            {availableSubcats.map((sub: any) => {
              const active = subcat === sub.id;
              return (
                <Pressable
                  key={sub.id}
                  testID={`shop-subfilter-${sub.id}`}
                  onPress={() => onSelectSubcategory(sub)}
                  style={({ pressed }) => [
                    s.sheetItem,
                    active && s.sheetItemActive,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <View style={{ flex: 1, paddingVertical: 2 }}>
                    <Text style={[s.itemTitle, active && s.itemTitleActive]}>{sub.label}</Text>
                    {sub.hint ? (
                      <Text style={s.itemSubtitle} numberOfLines={2}>
                        {sub.hint}
                      </Text>
                    ) : null}
                  </View>
                  <View style={[s.checkRadio, active && s.checkRadioActive]}>
                    {active ? <View style={s.checkRadioDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

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
          contentContainerStyle={{ gap: 12, paddingTop: 10, paddingBottom: usesNativeTabs ? insets.bottom + 24 : 0 }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={query.refetch}
              tintColor={colors.brandPrimary}
              colors={[colors.brandPrimary]}
            />
          }
          ListHeaderComponent={
            <View>
              <View style={s.resultHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={s.count} testID="shop-count">
                    {debouncedQ ? (
                      `Results for "${debouncedQ}" (${res?.total ?? 0})`
                    ) : cat === "All" && subcat === "all" ? (
                      `All Shop Items (${res?.total ?? totalCatalogCount})`
                    ) : subcat !== "all" ? (
                      `${currentSubcatDef?.label || subcat} (${res?.total ?? 0})`
                    ) : (
                      `${cat} (${res?.total ?? 0})`
                    )}
                  </Text>
                  {Boolean(debouncedQ && cat !== "All") && (
                    <Pressable
                      onPress={() => {
                        setCat("All");
                        setSubcat("all");
                        setPage(1);
                      }}
                      style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}
                    >
                      <Text style={s.searchInAllPrompt}>
                        Filtered in {cat}. <Text style={{ textDecorationLine: "underline", color: colors.brandPrimary, fontFamily: fonts.b700 }}>Search all items</Text>
                      </Text>
                    </Pressable>
                  )}
                </View>
                {isFiltered && (
                  <Pressable onPress={resetAll} hitSlop={6} style={s.clearTag}>
                    <Text style={s.clearTagText}>Clear</Text>
                    <Lucide name="x" size={11} color={colors.forest} />
                  </Pressable>
                )}
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={s.emptyWrap} testID="shop-empty">
              <View style={s.emptyIconCircle}>
                <Lucide name="search-x" size={28} color={colors.forest} />
              </View>
              <Text style={s.emptyTitle}>
                {debouncedQ ? `No products found for "${debouncedQ}"` : "No items found"}
              </Text>
              <Body style={{ textAlign: "center", maxWidth: 290 }}>
                {debouncedQ && cat !== "All"
                  ? `No matching items found inside ${cat}. Tap below to search all catalog categories.`
                  : debouncedQ
                  ? "Check spelling, try fewer keywords, or tap one of the suggested products below."
                  : "Try another search, category, or subcategory."}
              </Body>

              {debouncedQ && cat !== "All" ? (
                <Btn
                  small
                  label={`Search All Categories for "${debouncedQ}"`}
                  onPress={() => {
                    setCat("All");
                    setSubcat("all");
                    setPage(1);
                  }}
                  style={{ marginTop: 8 }}
                />
              ) : null}

              {/* Suggestions chips in empty state */}
              <View style={{ marginTop: 12, width: "100%", alignItems: "center" }}>
                <Text style={s.emptySuggestionsTitle}>Popular search terms:</Text>
                <View style={s.emptySuggestionsRow}>
                  {POPULAR_SEARCHES.slice(0, 4).map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => {
                        setQ(item);
                        setDebouncedQ(item);
                        setCat("All");
                        setSubcat("all");
                        setPage(1);
                      }}
                      style={s.emptySuggestionPill}
                    >
                      <Lucide name="search" size={11} color={colors.forest} />
                      <Text style={s.emptySuggestionPillText}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {isFiltered ? (
                <Btn
                  small
                  variant="outline"
                  label="Clear Search & Show All"
                  onPress={resetAll}
                  style={{ marginTop: 12 }}
                />
              ) : null}
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={{ flex: 1, maxWidth: "50%" }}>
              <ProductCard p={item} index={index} />
            </View>
          )}
          ListFooterComponent={
            <View style={{ gap: 16, marginTop: 12 }}>
              <View style={{ paddingHorizontal: 16, gap: 12 }}>
              {res && res.total > 0 ? (
                <View style={{ gap: 10, alignItems: "center" }} testID="shop-pagination">
                  <Text style={s.count} testID="shop-showing">
                    Showing {from}–{to} of {res.total} items
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                    <Pressable
                      testID="shop-page-prev"
                      disabled={res.page <= 1}
                      onPress={() => goPage(res.page - 1)}
                      style={[s.pageBtn, res.page <= 1 && { opacity: 0.4 }]}
                    >
                      <Lucide name="chevron-left" size={18} color={colors.onSurface} />
                    </Pressable>
                    {Array.from({ length: res.pages }, (_, i) => i + 1)
                      .filter((n) => n === 1 || n === res.pages || Math.abs(n - res.page) <= 1)
                      .map((n, i, arr) => (
                        <React.Fragment key={n}>
                          {i > 0 && n - arr[i - 1] > 1 ? <Text style={s.count}>…</Text> : null}
                          <Pressable
                            testID={`shop-page-${n}`}
                            onPress={() => goPage(n)}
                            style={[s.pageBtn, n === res.page && s.pageActive]}
                          >
                            <Text style={[s.pageText, n === res.page && { color: colors.white }]}>{n}</Text>
                          </Pressable>
                        </React.Fragment>
                      ))}
                    <Pressable
                      testID="shop-page-next"
                      disabled={res.page >= res.pages}
                      onPress={() => goPage(res.page + 1)}
                      style={[s.pageBtn, res.page >= res.pages && { opacity: 0.4 }]}
                    >
                      <Lucide name="chevron-right" size={18} color={colors.onSurface} />
                    </Pressable>
                  </View>
                </View>
              ) : null}
              <View style={s.promo}>
                <Text style={s.promoKicker}>SEASONAL SPECIAL OFFER</Text>
                <Text style={s.promoTitle}>Get Free Delivery on orders above KSh 5,000</Text>
                <Body dark style={{ fontSize: 13 }}>
                  Stock up on premium top-dressing fertilizers and certified seeds for the planting season. Includes agronomist phone guidance.
                </Body>
                <Btn
                  testID="shop-promo-btn"
                  small
                  label="Shop Fertilizers"
                  onPress={() => {
                    setCat("Fertilizers");
                    setSubcat("all");
                    setPage(1);
                  }}
                />
              </View>
              <View style={s.source}>
                <Text style={s.sourceTitle}>Can&apos;t Find a Particular Item?</Text>
                <Body style={{ fontSize: 13 }}>
                  Submit a quick stock inquiry request. Our agro-sourcing network will locate it and notify you within 24 hours.
                </Body>
                <Btn
                  testID="shop-sourcing-btn"
                  small
                  variant="green"
                  label="Submit Sourcing Request"
                  onPress={() => router.push({ pathname: "/contact", params: { subject: "Sourcing Request" } })}
                />
              </View>
              </View>
              <Footer />
            </View>
          }
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 2, gap: 5, backgroundColor: c.surface },
  titleRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  title: { fontFamily: fonts.h900, fontSize: 20, color: c.onSurface },
  sub: { fontFamily: fonts.b500, fontSize: 12, color: c.onSurfaceTertiary, flex: 1 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.white,
    paddingHorizontal: 12,
    marginTop: 2,
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.02)",
    elevation: 1,
  },
  searchFocused: {
    borderColor: c.brandPrimary,
    borderWidth: 1.5,
  },
  searchInput: { flex: 1, fontFamily: fonts.b500, fontSize: 13, color: c.onSurface, height: 40 },
  quickSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
    paddingBottom: 2,
  },
  quickSearchPrefix: {
    fontFamily: fonts.b700,
    fontSize: 10.5,
    color: c.onSurfaceTertiary,
    marginRight: 2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  quickSearchChip: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 0,
    backgroundColor: c.white,
    borderWidth: 1,
    borderColor: c.border,
  },
  quickSearchChipActive: {
    backgroundColor: "#F4F9F5",
    borderColor: c.forest,
  },
  quickSearchChipText: {
    fontFamily: fonts.b600,
    fontSize: 11,
    color: c.onSurfaceSecondary,
  },
  quickSearchChipTextActive: {
    color: c.forest,
    fontFamily: fonts.b700,
  },

  // Category Navigation Section (2 Rows × 3 Columns Grid)
  navSection: {
    backgroundColor: c.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    gap: 8,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navHeaderIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: c.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  navHeaderTitle: {
    fontFamily: fonts.b700,
    fontSize: 13,
    color: c.onSurface,
  },
  activeBadge: {
    backgroundColor: c.forest,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 999,
  },
  activeBadgeText: {
    fontFamily: fonts.b700,
    fontSize: 10,
    color: c.brandSecondary,
  },
  allBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 0,
    backgroundColor: c.white,
    borderWidth: 1,
    borderColor: c.border,
  },
  allBtnActive: {
    backgroundColor: c.forest,
    borderColor: c.forest,
  },
  allBtnText: {
    fontFamily: fonts.b700,
    fontSize: 11,
    color: c.onSurfaceTertiary,
  },
  allBtnTextActive: {
    color: c.white,
  },

  // Grid: 2 Rows, each having 3 items
  grid: {
    gap: 8,
  },
  gridRow: {
    flexDirection: "row",
    gap: 8,
  },
  gridBtn: {
    flex: 1,
    height: 44,
    backgroundColor: c.white,
    borderWidth: 1.5,
    borderColor: c.border,
    borderRadius: 0,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.03)",
    elevation: 1,
  },
  gridBtnActive: {
    backgroundColor: c.forest,
    borderColor: c.brandPrimary,
    boxShadow: "0px 2px 6px rgba(15, 41, 30, 0.25)",
    elevation: 3,
  },
  gridBtnText: {
    fontFamily: fonts.b700,
    fontSize: 11.5,
    color: c.onSurfaceSecondary,
    letterSpacing: -0.2,
  },
  gridBtnTextActive: {
    color: c.white,
  },

  // Sub-Category Bar
  subcatBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  subcatBtn: {
    flex: 1,
    height: 38,
    backgroundColor: c.white,
    borderWidth: 1.5,
    borderColor: c.border,
    borderRadius: 0,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subcatBtnActive: {
    borderColor: c.brandPrimary,
    backgroundColor: "#F4F9F5",
  },
  subcatLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  subcatLabel: {
    fontFamily: fonts.b800,
    fontSize: 9.5,
    letterSpacing: 0.6,
    color: c.muted,
  },
  subcatValue: {
    fontFamily: fonts.b700,
    fontSize: 11.5,
    color: c.onSurface,
  },
  subcatValueActive: {
    color: c.forest,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 0,
    backgroundColor: c.white,
    borderWidth: 1,
    borderColor: c.border,
  },
  resetText: {
    fontFamily: fonts.b700,
    fontSize: 11,
    color: c.brandPrimary,
  },

  // Modal Bottom Sheet Styles
  modalScrim: {
    flex: 1,
    backgroundColor: "rgba(11,33,23,0.55)",
  },
  modalSheet: {
    backgroundColor: c.surfaceSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: "80%",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.border,
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
  },
  sheetHeaderIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: c.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    fontFamily: fonts.h800,
    fontSize: 17,
    color: c.onSurface,
  },
  sheetSub: {
    fontFamily: fonts.b400,
    fontSize: 12,
    color: c.onSurfaceTertiary,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetList: {
    paddingVertical: 8,
  },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
  },
  sheetItemActive: {
    backgroundColor: "#F4F9F5",
  },
  itemTitle: {
    fontFamily: fonts.b600,
    fontSize: 14,
    color: c.onSurface,
  },
  itemTitleActive: {
    fontFamily: fonts.b700,
    color: c.forest,
  },
  itemSubtitle: {
    fontFamily: fonts.b400,
    fontSize: 11.5,
    color: c.onSurfaceTertiary,
    marginTop: 2,
  },
  checkRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkRadioActive: {
    borderColor: c.brandPrimary,
    backgroundColor: c.white,
  },
  checkRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: c.brandPrimary,
  },

  // Results & Product Grid
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 2,
  },
  count: { fontFamily: fonts.b700, fontSize: 13, color: c.onSurfaceTertiary },
  clearTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: c.brandTertiary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  clearTagText: {
    fontFamily: fonts.b700,
    fontSize: 10.5,
    color: c.forest,
  },

  searchInAllPrompt: {
    fontFamily: fonts.b500,
    fontSize: 11,
    color: c.onSurfaceTertiary,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F4F9F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptySuggestionsTitle: {
    fontFamily: fonts.b600,
    fontSize: 12,
    color: c.onSurfaceTertiary,
    marginBottom: 8,
  },
  emptySuggestionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },
  emptySuggestionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: c.white,
    borderWidth: 1,
    borderColor: c.border,
  },
  emptySuggestionPillText: {
    fontFamily: fonts.b600,
    fontSize: 11.5,
    color: c.forest,
  },

  pageBtn: { minWidth: 44, height: 44, borderRadius: 0, borderWidth: 1, borderColor: c.border, backgroundColor: c.white, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  pageActive: { backgroundColor: c.forest, borderColor: c.forest },
  pageText: { fontFamily: fonts.b700, fontSize: 14, color: c.onSurface },
  emptyTitle: { fontFamily: fonts.h800, fontSize: 18, color: c.onSurface },
  promo: { backgroundColor: c.forest, borderRadius: 24, padding: 20, gap: 10 },
  promoKicker: { fontFamily: fonts.b800, fontSize: 11, letterSpacing: 1, color: c.brandSecondary },
  promoTitle: { fontFamily: fonts.h800, fontSize: 20, color: c.white },
  source: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 24, padding: 20, gap: 10 },
  sourceTitle: { fontFamily: fonts.h800, fontSize: 18, color: c.onSurface },
}));
