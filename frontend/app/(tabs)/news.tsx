import React, { useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useIsFocused } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, { FadeInDown } from "react-native-reanimated";
import { TopBar } from "@/src/components/TopBar";
import { Skeleton } from "@/src/components/Skeleton";
import { FeaturedStory, NewsState, NewsStoryCard } from "@/src/components/news/NewsUI";
import { api } from "@/src/services/api";
import { Article, articleFilters } from "@/src/data/articles";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usesNativeTabs } from "@/src/navigation";

export default function News() {
  const s = useStyles(); const { colors } = useTheme(); const focused = useIsFocused(); const insets = useSafeAreaInsets();
  const [group, setGroup] = useState("All"); const list = useRef<FlatList<Article>>(null);
  const q = useQuery({ queryKey: ["articles", group], queryFn: () => api.getArticles(group), retry: 1 });
  const featured = group === "All" ? q.data?.find(article => article.featured) ?? q.data?.[0] : undefined;
  const stories = q.data?.filter(article => article.id !== featured?.id) ?? [];
  const select = (value: string) => { setGroup(value); list.current?.scrollToOffset({ offset: 0, animated: true }); };
  return <View style={s.root} testID={focused ? "news-screen" : undefined}><TopBar />
    <FlatList ref={list} testID="news-list" data={stories} keyExtractor={article => article.id} showsVerticalScrollIndicator={false} contentContainerStyle={[s.list, { paddingBottom: (usesNativeTabs ? insets.bottom + 60 : 0) + 28 }]} refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.brand} />}
      ListHeaderComponent={<View style={s.header}>
        <View style={s.masthead}><View style={s.eyebrowRow}><View style={s.rule} /><Text testID="news-journal-label" style={s.eyebrow}>THE MQULIMA JOURNAL</Text></View><Text testID="news-page-title" style={s.h1}>News & insights<Text style={s.accent}>.</Text></Text><Text testID="news-page-description" style={s.description}>A fresh perspective on the things that grow.</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters} testID="news-category-filters">{articleFilters.map(filter => <Pressable key={filter} testID={`news-filter-${filter.replace(/\W+/g, "-").toLowerCase()}`} accessibilityRole="tab" accessibilityState={{ selected: group === filter }} onPress={() => select(filter)} style={({ pressed }) => [s.filter, group === filter && s.selectedFilter, pressed && s.pressed]}><Text style={[s.filterText, group === filter && s.selectedText]}>{filter === "All" ? "All stories" : filter}</Text></Pressable>)}</ScrollView>
        {q.isPending ? <View style={s.skeleton} testID="news-loading"><Skeleton style={s.imageSkeleton} /><Skeleton style={s.titleSkeleton} /><Skeleton style={s.lineSkeleton} /><Skeleton style={s.buttonSkeleton} /></View> : null}
        {q.isRefetchError && q.data ? <View style={s.refreshError} testID="news-refresh-error"><Text style={s.refreshText}>Couldn’t refresh. Showing the last loaded stories.</Text><Pressable testID="news-refresh-retry" onPress={() => q.refetch()} style={s.retry}><Text style={s.retryText}>Retry</Text></Pressable></View> : null}
        {featured && <View style={s.inset}><FeaturedStory article={featured} /></View>}
        {!q.isPending && !q.isError && !!stories.length && <View style={s.sectionHeader}><Text testID="news-section-title" style={s.h2}>{group === "All" ? "Latest stories" : group}</Text><Text testID="news-story-count" style={s.count}>{stories.length} {stories.length === 1 ? "story" : "stories"}</Text></View>}
      </View>}
      ListEmptyComponent={q.isPending || featured ? null : q.isError ? <NewsState testID="news-error" kind="error" title="The journal couldn’t load" text="Check your connection, then try again. Your next good read is worth the wait." onPress={() => q.refetch()} /> : <NewsState testID="news-empty" kind="empty" title="More stories are growing" text={group === "All" ? "There are no published articles yet. Check back for new perspectives from the field." : "No published stories in this category just yet. Explore the rest of the journal in the meantime."} label={group === "All" ? "Refresh journal" : "Browse all stories"} onPress={() => group === "All" ? q.refetch() : select("All")} />}
      renderItem={({ item, index }) => <Animated.View entering={FadeInDown.duration(240).delay(Math.min(index, 3) * 40)} style={s.inset}><NewsStoryCard article={item} index={index} /></Animated.View>}
      ListFooterComponent={q.data?.length ? <View style={s.footer}><Lucide name="sprout" size={23} color={colors.brand} /><Text testID="news-end-message" style={s.endText}>Good ideas take root here.</Text><Pressable testID="news-back-to-top" onPress={() => list.current?.scrollToOffset({ offset: 0, animated: true })} style={s.backTop}><Text style={s.backTopText}>Back to top</Text><Lucide name="arrow-up" size={16} color={colors.brand} /></Pressable></View> : null}
    />
  </View>;
}

const useStyles = makeStyles(c => ({
  root: { flex: 1, backgroundColor: c.surface },
  list: { gap: 16, width: "100%", maxWidth: 720, alignSelf: "center" },
  header: { gap: 20 }, inset: { paddingHorizontal: 16 },
  masthead: { paddingHorizontal: 20, paddingTop: 24, gap: 8 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 8 }, rule: { width: 22, height: 2, backgroundColor: c.brand },
  eyebrow: { fontFamily: fonts.b800, fontSize: 9, letterSpacing: 1.6, color: c.brand },
  h1: { fontFamily: fonts.h800, fontSize: 34, lineHeight: 41, color: c.onSurface, letterSpacing: -1 }, accent: { color: c.limeText },
  description: { fontFamily: fonts.b400, fontSize: 12, lineHeight: 19, color: c.muted },
  filters: { paddingHorizontal: 16, gap: 8 },
  filter: { minHeight: 44, paddingHorizontal: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: c.border, borderRadius: 0, backgroundColor: c.surfaceSecondary },
  selectedFilter: { backgroundColor: c.brand, borderColor: c.brand }, filterText: { fontFamily: fonts.b600, fontSize: 11, color: c.onSurfaceTertiary }, selectedText: { color: c.onBrand },
  sectionHeader: { marginHorizontal: 16, borderTopWidth: 1, borderTopColor: c.borderStrong, paddingTop: 20, marginTop: 4, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12 },
  h2: { fontFamily: fonts.h700, fontSize: 23, lineHeight: 29, color: c.onSurface, letterSpacing: -0.4, flex: 1 }, count: { fontFamily: fonts.b500, fontSize: 10, color: c.muted },
  skeleton: { marginHorizontal: 16, gap: 16 }, imageSkeleton: { height: 190, borderRadius: 0 }, titleSkeleton: { height: 75, borderRadius: 0 }, lineSkeleton: { height: 14, width: "60%", borderRadius: 0 }, buttonSkeleton: { height: 48, borderRadius: 0 },
  refreshError: { paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10 }, refreshText: { flex: 1, fontFamily: fonts.b400, fontSize: 12, color: c.muted }, retry: { minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" }, retryText: { fontFamily: fonts.b700, fontSize: 12, color: c.brand },
  footer: { alignItems: "center", paddingTop: 24, paddingBottom: 8, gap: 10 }, endText: { fontFamily: fonts.b500, fontSize: 12, color: c.muted }, backTop: { flexDirection: "row", alignItems: "center", minHeight: 44, gap: 8 }, backTopText: { fontFamily: fonts.b700, fontSize: 12, color: c.brand },
  pressed: { opacity: 0.8 },
}));