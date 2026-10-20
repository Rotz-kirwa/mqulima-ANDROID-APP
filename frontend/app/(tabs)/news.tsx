import React, { useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { Image } from "@/src/components/Img";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { TopBar } from "@/src/components/TopBar";
import { ListSkeleton } from "@/src/components/Skeleton";
import { Chip, Btn } from "@/src/components/ui";
import { useTabBottom } from "@/src/components/Page";
import { api } from "@/src/services/api";
import { articleFilters, articles } from "@/src/data/articles";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function News() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useTabBottom();
  const [group, setGroup] = useState("All");
  const q = useQuery({ queryKey: ["articles", group], queryFn: () => api.getArticles(group) });
  const featured = articles[0];

  return (
    <View style={s.root} testID="news-screen">
      <TopBar />
      <View style={s.chipRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, alignItems: "center" }}>
          {articleFilters.map((f) => <Chip key={f} testID={`news-filter-${f.replace(/\W+/g, "-").toLowerCase()}`} label={f} active={group === f} onPress={() => setGroup(f)} />)}
        </ScrollView>
      </View>
      <FlatList
        testID="news-list"
        data={q.isLoading ? [] : q.data}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ paddingBottom: bottom, gap: 16 }}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={q.refetch} tintColor={colors.brandPrimary} colors={[colors.brandPrimary]} />}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            {group === "All" ? (
              <Pressable testID="news-featured-story" onPress={() => router.push(`/article/${featured.id}`)} style={s.featured}>
                <Image source={{ uri: featured.image }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} contentFit="cover" transition={300} />
                <LinearGradient colors={["rgba(11,33,23,0.2)", colors.overlay]} style={{ flex: 1, justifyContent: "flex-end", padding: 20, gap: 8 }}>
                  <Text style={s.featKicker}>FEATURED STORY • {featured.category}</Text>
                  <Text style={s.featTitle}>{featured.title}</Text>
                  <Text style={s.featMeta}>{featured.date} • {featured.readTime}</Text>
                  <Btn small label="Read Full Story" onPress={() => router.push(`/article/${featured.id}`)} />
                </LinearGradient>
              </Pressable>
            ) : null}
            <View style={{ paddingHorizontal: 16 }}>
              <Text style={s.h2}>Latest Agricultural Posts</Text>
              <Text style={s.sub}>In-depth crop management guides, soil science, and live Kenyan commodity intelligence.</Text>
            </View>
            {q.isLoading ? <ListSkeleton count={4} height={90} /> : null}
          </View>
        }
        ListEmptyComponent={q.isLoading ? null : <Text style={[s.sub, { textAlign: "center", padding: 24 }]} testID="news-empty">No articles in this category yet.</Text>}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 60)} style={{ paddingHorizontal: 16 }}>
            <Pressable testID={`news-item-${index}`} onPress={() => router.push(`/article/${item.id}`)} style={({ pressed }) => [s.row, { opacity: pressed ? 0.85 : 1 }]}>
              <Image source={{ uri: item.image }} style={s.thumb} contentFit="cover" transition={250} />
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <Text style={s.cat}>{item.category}</Text>
                  <Text style={s.read}>{item.readTime}</Text>
                </View>
                <Text style={s.title} numberOfLines={3}>{item.title}</Text>
                <Text style={s.meta}>{item.date} • {item.reads} reads</Text>
                <Text style={s.author}>Mqulima Desk • Editorial Desk</Text>
              </View>
            </Pressable>
          </Animated.View>
        )}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  chipRow: { height: 56, justifyContent: "center", backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border },
  featured: { height: 380, margin: 16, marginBottom: 0, borderRadius: 28, overflow: "hidden" },
  featKicker: { fontFamily: fonts.b800, fontSize: 10, letterSpacing: 1, color: c.brandSecondary, textTransform: "uppercase" },
  featTitle: { fontFamily: fonts.h900, fontSize: 24, lineHeight: 28, color: c.white },
  featMeta: { fontFamily: fonts.b500, fontSize: 12, color: c.whiteA85 },
  h2: { fontFamily: fonts.h900, fontSize: 24, color: c.onSurface },
  sub: { fontFamily: fonts.b400, fontSize: 13, color: c.onSurfaceTertiary, marginTop: 4 },
  row: { flexDirection: "row", gap: 12, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 20, padding: 10 },
  thumb: { width: 104, height: 104, borderRadius: 14 },
  cat: { fontFamily: fonts.b700, fontSize: 10, color: c.onBrandTertiary, backgroundColor: c.brandTertiary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: "hidden" },
  read: { fontFamily: fonts.b700, fontSize: 10, color: c.subtle, textTransform: "uppercase" },
  title: { fontFamily: fonts.h700, fontSize: 14, lineHeight: 18, color: c.onSurface },
  meta: { fontFamily: fonts.b500, fontSize: 11, color: c.muted },
  author: { fontFamily: fonts.b600, fontSize: 11, color: c.onSurfaceTertiary },
}));
