import React from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Page } from "@/src/components/Page";
import { Skeleton } from "@/src/components/Skeleton";
import { NewsImage, NewsState, NewsStoryCard, ReadArticleButton, newsDate, useShareArticle } from "@/src/components/news/NewsUI";
import { api } from "@/src/services/api";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function ArticleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(); const s = useStyles(); const router = useRouter(); const { colors } = useTheme(); const insets = useSafeAreaInsets();
  const share = useShareArticle();
  const q = useQuery({ queryKey: ["article", id], queryFn: () => api.getArticle(id), retry: 1 }); const article = q.data;
  const others = useQuery({ queryKey: ["articles", "All"], queryFn: () => api.getArticles("All"), enabled: !!article, retry: 1 });
  const related = (others.data ?? []).filter(item => item.id !== id).sort((a, b) => Number(b.group === article?.group) - Number(a.group === article?.group)).slice(0, 2);
  return <Page title="Mqulima Journal" testID="article-detail-screen">
    {q.isPending ? <View style={s.loading} testID="article-loading"><Skeleton style={s.titleSkeleton} /><Skeleton style={s.imageSkeleton} /><Skeleton style={s.lineSkeleton} /><Skeleton style={s.lineSkeleton} /></View> : q.isError ? <NewsState testID="article-error" kind="error" title="We couldn’t load this story" text="Check your connection and try again." onPress={() => q.refetch()} /> : !article ? <NewsState testID="article-not-found" kind="empty" title="This story isn’t available" text="It may have been unpublished. There’s more to explore in the journal." label="Back to news" onPress={() => router.navigate("/(tabs)/news")} /> : <ScrollView testID="article-scroll" showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]} refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.brand} />}>
      <View style={s.articleHeader}><View style={s.categoryRow}><View style={s.categoryMark} /><Text testID="article-category" style={s.category}>{article.category}</Text></View><Text testID="article-title" style={s.title}>{article.title}</Text><View style={s.metadata}><Text testID="article-date" style={s.meta}>{newsDate(article.date)}</Text><View style={s.dot} /><Lucide name="clock-3" size={13} color={colors.muted} /><Text testID="article-read-time" style={s.meta}>{article.readTime}</Text></View></View>
      <View style={s.imageWrap}><NewsImage article={article} featured testID="article-cover-image" /></View>
      <View style={s.byline}><View style={s.deskMark}><Lucide name="sprout" size={21} color={colors.brand} /></View><View style={s.authorDetails}><Text testID="article-author" style={s.author}>Mqulima Desk</Text><Text testID="article-reads" style={s.meta}>Editorial · {article.reads ?? 0} reads</Text></View><Pressable testID="article-share-button" accessibilityLabel="Share article" onPress={() => share(article)} style={({ pressed }) => [s.shareButton, pressed && s.pressed]}><Lucide name="share-2" size={18} color={colors.brand} /><Text style={s.shareLabel}>Share</Text></Pressable></View>
      <View style={s.articleBody}>
        {article.excerpt.trim() !== article.title.trim() && <Text testID="article-lead" style={s.lead}>{article.excerpt}</Text>}
        {article.body.map((paragraph, index) => <Text testID={`article-paragraph-${index}`} key={`${article.id}-${index}`} selectable style={s.paragraph}>{paragraph}</Text>)}
        {q.isRefetchError && <Text testID="article-refresh-error" style={s.meta}>Couldn’t refresh this story. Showing the last loaded version.</Text>}
      </View>
      <View style={s.endRule}><View style={s.rule} /><Lucide name="sprout" size={20} color={colors.brand} /><View style={s.rule} /></View>
      <View style={s.expertCard}><View style={s.expertHeader}><Text testID="article-service-label" style={s.expertEyebrow}>PUT KNOWLEDGE INTO PRACTICE</Text><Lucide name="arrow-up-right" size={21} color={colors.brandSecondary} /></View><Text testID="article-service-title" style={s.expertTitle}>A little guidance.{`\n`}A lot of growth.</Text><Text testID="article-service-description" style={s.expertText}>Find the right agricultural service for your farm and take the next step with confidence.</Text><ReadArticleButton testID="article-request-service-btn" label="Explore services" title="Agricultural services" onPress={() => router.push("/services")} primary /></View>
      {!!related.length && <View style={s.related}><View style={s.relatedHeader}><Text testID="article-related-heading" style={s.h2}>Keep reading</Text><Text style={s.meta}>From the journal</Text></View>{related.map((item, index) => <NewsStoryCard key={item.id} article={item} index={index} prefix={`related-${id}`} />)}</View>}
      {others.isError && <View style={s.relatedError}><Text style={s.meta}>More stories couldn’t load.</Text><Pressable testID="article-related-retry" onPress={() => others.refetch()} style={s.shareButton}><Text style={s.shareLabel}>Try again</Text></Pressable></View>}
      <Pressable testID="article-back-to-news" onPress={() => router.navigate("/(tabs)/news")} style={({ pressed }) => [s.back, pressed && s.pressed]}><Lucide name="arrow-left" size={18} color={colors.brand} /><Text style={s.backText}>Back to all stories</Text></Pressable>
    </ScrollView>}
  </Page>;
}

const useStyles = makeStyles(c => ({
  content: { width: "100%", maxWidth: 720, alignSelf: "center" },
  articleHeader: { paddingHorizontal: 20, paddingTop: 25, paddingBottom: 24, gap: 16 },
  categoryRow: { flexDirection: "row", gap: 8, alignItems: "center" }, categoryMark: { width: 20, height: 2, backgroundColor: c.brand },
  category: { fontFamily: fonts.b800, fontSize: 10, lineHeight: 16, letterSpacing: 1, textTransform: "uppercase", color: c.brand, flex: 1 },
  title: { fontFamily: fonts.h800, fontSize: 30, lineHeight: 36, color: c.onSurface, letterSpacing: -0.6 },
  metadata: { flexDirection: "row", gap: 6, alignItems: "center", flexWrap: "wrap" }, meta: { fontFamily: fonts.b500, fontSize: 11, lineHeight: 18, color: c.muted }, dot: { width: 3, height: 3, backgroundColor: c.borderStrong, marginHorizontal: 2 },
  imageWrap: { marginHorizontal: 16, borderWidth: 1, borderColor: c.border, borderRadius: 0 },
  byline: { marginHorizontal: 20, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: c.border, flexDirection: "row", gap: 10, alignItems: "center" },
  deskMark: { width: 40, height: 40, borderRadius: 0, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" }, authorDetails: { flex: 1, gap: 3 }, author: { fontFamily: fonts.b700, fontSize: 12, color: c.onSurface },
  shareButton: { minHeight: 44, minWidth: 44, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 8 }, shareLabel: { fontFamily: fonts.b700, fontSize: 11, color: c.brand },
  articleBody: { paddingHorizontal: 20, paddingTop: 24, gap: 24 }, lead: { fontFamily: fonts.b600, fontSize: 17, lineHeight: 28, color: c.onSurface }, paragraph: { fontFamily: fonts.b400, fontSize: 16, lineHeight: 28, color: c.onSurfaceSecondary },
  endRule: { paddingHorizontal: 20, paddingVertical: 30, flexDirection: "row", alignItems: "center", gap: 15 }, rule: { flex: 1, height: 1, backgroundColor: c.border },
  expertCard: { marginHorizontal: 16, padding: 22, backgroundColor: c.forest, borderRadius: 0, gap: 16 }, expertHeader: { flexDirection: "row", alignItems: "center", gap: 12 }, expertEyebrow: { fontFamily: fonts.b700, fontSize: 8, letterSpacing: 1.15, color: c.brandSecondary, flex: 1 }, expertTitle: { fontFamily: fonts.h700, fontSize: 28, lineHeight: 33, color: c.onSurfaceInverse }, expertText: { fontFamily: fonts.b400, fontSize: 13, lineHeight: 22, color: c.whiteA85 },
  related: { paddingHorizontal: 16, marginTop: 32, gap: 16 }, relatedHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 10 }, h2: { fontFamily: fonts.h700, fontSize: 24, color: c.onSurface }, relatedError: { padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { minHeight: 48, flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center", marginTop: 24 }, backText: { fontFamily: fonts.b700, fontSize: 12, color: c.brand },
  loading: { padding: 20, gap: 18 }, titleSkeleton: { height: 100, borderRadius: 0 }, imageSkeleton: { height: 200, borderRadius: 0 }, lineSkeleton: { height: 18, borderRadius: 0 },
  pressed: { opacity: 0.75 },
}));