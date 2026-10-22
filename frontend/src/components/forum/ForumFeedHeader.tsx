import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { ForumFilters } from "@/src/services/api";
import { topics } from "./ForumUI";

type Props = { filters: ForumFilters; setFilters: (patch: Partial<ForumFilters>) => void; total?: number; onCompose: () => void };

export function ForumFeedHeader({ filters, setFilters, total, onCompose }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  return <View style={s.root}>
    <View style={s.hero} testID="forum-welcome-card">
      <View pointerEvents="none" style={s.heroArt}><Lucide name="sprout" size={94} color={colors.whiteA20} /></View>
      <View style={s.eyebrowRow}><View style={s.dot} /><Text testID="forum-welcome-eyebrow" style={s.eyebrow}>ROOTED IN COMMUNITY</Text></View>
      <Text testID="forum-welcome-title" style={s.heroTitle}>Better farming. <Text style={s.heroAccent}>Together.</Text></Text>
      <Text testID="forum-welcome-description" style={s.heroText}>Real questions. Shared experience. Room to grow.</Text>
      <Pressable testID="forum-composer-btn" onPress={onCompose} style={({ pressed }) => [s.heroButton, pressed && s.pressed]}><Text style={s.heroButtonText}>Start a conversation</Text><Lucide name="arrow-up-right" size={17} color={colors.brandSecondary} /></Pressable>
    </View>
    <View style={s.scopeTabs}>
      {([{ key: "all", label: "Discover", icon: "compass" }, { key: "mine", label: "My posts", icon: "user-round" }, { key: "saved", label: "Saved", icon: "bookmark" }] as const).map(item => <Pressable key={item.key} testID={`forum-scope-${item.key}`} accessibilityRole="tab" accessibilityState={{ selected: filters.scope === item.key }} onPress={() => setFilters({ scope: item.key })} style={[s.scopeTab, filters.scope === item.key && s.scopeActive]}><Lucide name={item.icon} size={16} color={filters.scope === item.key ? colors.brand : colors.muted} /><Text style={[s.scopeText, filters.scope === item.key && s.scopeActiveText]}>{item.label}</Text></Pressable>)}
    </View>
    <View style={s.search}><Lucide name="search" size={19} color={colors.muted} /><TextInput testID="forum-search-input" accessibilityLabel="Search discussions" value={filters.q} maxLength={120} onChangeText={q => setFilters({ q })} placeholder="Search questions, crops, or farmers" placeholderTextColor={colors.muted} returnKeyType="search" style={s.searchInput} />{filters.q.length > 0 && <Pressable testID="forum-search-clear" accessibilityLabel="Clear search" onPress={() => setFilters({ q: "" })} style={s.clear}><Lucide name="x" size={18} color={colors.muted} /></Pressable>}</View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.topicScroll} keyboardShouldPersistTaps="handled">
      {topics.map((topic, index) => <Pressable key={topic.value} testID={`forum-topic-${index}`} accessibilityRole="button" accessibilityState={{ selected: filters.tag === topic.value }} onPress={() => setFilters({ tag: topic.value })} style={({ pressed }) => [s.topic, filters.tag === topic.value && s.topicActive, pressed && s.pressed]}><Lucide name={topic.icon} size={15} color={filters.tag === topic.value ? colors.onBrand : colors.onSurfaceTertiary} /><Text style={[s.topicText, filters.tag === topic.value && s.topicActiveText]}>{topic.label}</Text></Pressable>)}
    </ScrollView>
    <View style={s.feedHeading}><Text testID="forum-feed-heading" style={s.feedTitle}>{filters.scope === "saved" ? "Saved for later" : filters.scope === "mine" ? "Your discussions" : "The conversation"}</Text>{total !== undefined && <Text testID="forum-result-count" accessibilityLiveRegion="polite" style={s.count}>{total} {total === 1 ? "post" : "posts"}</Text>}</View>
    <View style={s.sortRow}>
      {([{ key: "latest", label: "Latest", icon: "clock-3" }, { key: "popular", label: "Popular", icon: "flame" }, { key: "unanswered", label: "Unanswered", icon: "message-circle" }] as const).map(item => <Pressable key={item.key} testID={`forum-sort-${item.key}`} accessibilityRole="tab" accessibilityState={{ selected: filters.sort === item.key }} onPress={() => setFilters({ sort: item.key })} style={[s.sort, filters.sort === item.key && s.sortActive]}><Lucide name={item.icon} size={14} color={filters.sort === item.key ? colors.brand : colors.muted} /><Text style={[s.sortText, filters.sort === item.key && s.sortActiveText]}>{item.label}</Text></Pressable>)}
    </View>
  </View>;
}

const useStyles = makeStyles(c => ({
  root: { gap: 14, paddingTop: 16, paddingBottom: 4 },
  hero: { marginHorizontal: 16, paddingHorizontal: 20, paddingTop: 19, paddingBottom: 9, borderRadius: 22, backgroundColor: c.brand, overflow: "hidden" },
  heroArt: { position: "absolute", right: -18, top: -18, width: 150, height: 150, borderRadius: 75, borderWidth: 1, borderColor: c.whiteA10, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-20deg" }] },
  eyebrowRow: { flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 8 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: c.brandSecondary },
  eyebrow: { fontFamily: fonts.b700, fontSize: 8, letterSpacing: 1.7, color: c.whiteA85 },
  heroTitle: { fontFamily: fonts.h700, color: c.onBrand, fontSize: 27, lineHeight: 33, letterSpacing: -0.8, maxWidth: 265 },
  heroAccent: { color: c.brandSecondary },
  heroText: { fontFamily: fonts.b400, color: c.whiteA85, fontSize: 11, lineHeight: 18, marginTop: 7, maxWidth: 270 },
  heroButton: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44, alignSelf: "flex-start" },
  heroButtonText: { fontFamily: fonts.b700, fontSize: 11, color: c.brandSecondary },
  scopeTabs: { flexDirection: "row", marginHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.border },
  scopeTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 44, borderBottomWidth: 2, borderBottomColor: c.surface },
  scopeActive: { borderBottomColor: c.brand },
  scopeText: { fontFamily: fonts.b600, fontSize: 12, color: c.muted },
  scopeActiveText: { color: c.brand, fontFamily: fonts.b800 },
  search: { marginHorizontal: 16, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: c.border, borderRadius: 13, paddingLeft: 14, backgroundColor: c.surfaceSecondary },
  searchInput: { flex: 1, minWidth: 0, height: 48, paddingHorizontal: 10, fontFamily: fonts.b400, fontSize: 12, color: c.onSurface },
  clear: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  topicScroll: { paddingHorizontal: 16, gap: 8 },
  topic: { minHeight: 44, flexDirection: "row", gap: 6, alignItems: "center", borderRadius: 24, paddingHorizontal: 13, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  topicActive: { backgroundColor: c.brand, borderColor: c.brand },
  topicText: { fontFamily: fonts.b600, fontSize: 11, color: c.onSurfaceTertiary },
  topicActiveText: { color: c.onBrand },
  feedHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginTop: 5 },
  feedTitle: { fontFamily: fonts.h700, fontSize: 21, color: c.onSurface, letterSpacing: -0.4 },
  count: { fontFamily: fonts.b500, fontSize: 11, color: c.muted },
  sortRow: { flexDirection: "row", gap: 3, paddingHorizontal: 16, marginTop: -8 },
  sort: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 5, borderRadius: 12 },
  sortActive: { backgroundColor: c.brandTertiary },
  sortText: { fontFamily: fonts.b500, fontSize: 11, color: c.muted },
  sortActiveText: { fontFamily: fonts.b700, color: c.onBrandTertiary },
  pressed: { opacity: 0.75 },
}));