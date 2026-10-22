import React from "react";
import { Platform, Pressable, Share, Text, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Image } from "@/src/components/Img";
import { Article } from "@/src/data/articles";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { useApp } from "@/src/store/AppStore";

export function newsDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function ReadArticleButton({ onPress, testID, title, primary = false, label = "Read article" }: { onPress: () => void; testID: string; title: string; primary?: boolean; label?: string }) {
  const s = useStyles(); const { colors } = useTheme();
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={`${label}: ${title}`} onPress={onPress} style={({ pressed }) => [s.readButton, primary && s.primaryButton, pressed && s.pressed]}><Text style={[s.readLabel, primary && s.primaryLabel]}>{label}</Text><View style={[s.arrowBox, primary && s.primaryArrow]}><Lucide name="arrow-up-right" size={20} color={primary ? colors.onBrand : colors.brand} /></View></Pressable>;
}

export function NewsImage({ article, featured = false, testID }: { article: Article; featured?: boolean; testID: string }) {
  const s = useStyles(); const { colors } = useTheme(); const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [article.image]);
  return <View style={featured ? s.featureImage : s.thumbnail} testID={`${testID}-frame`}>
    {article.image && !failed ? <Image testID={testID} source={{ uri: article.image }} style={s.imageFill} contentFit="cover" transition={180} accessibilityLabel={article.title} onError={() => setFailed(true)} /> : <View style={s.imagePlaceholder} testID={`${testID}-placeholder`}><Lucide name="newspaper" size={featured ? 40 : 24} color={colors.brand} /><Text style={s.placeholderText}>MQULIMA JOURNAL</Text></View>}
  </View>;
}

export function FeaturedStory({ article }: { article: Article }) {
  const s = useStyles(); const router = useRouter(); const open = () => router.push(`/article/${article.id}`);
  return <View style={s.featured} testID="news-featured-story">
    <Pressable testID="news-featured-image-link" accessibilityRole="button" accessibilityLabel={`Open featured article: ${article.title}`} onPress={open} style={({ pressed }) => pressed && s.pressed}><NewsImage article={article} featured testID="news-featured-image" /><View style={s.featureFlag}><Text testID="news-featured-label" style={s.flagText}>IN FOCUS</Text></View></Pressable>
    <View style={s.featureBody}>
      <Text testID="news-featured-category" style={s.featureCategory}>{article.category}</Text>
      <Pressable testID="news-featured-title-link" onPress={open} accessibilityRole="button"><Text testID="news-featured-title" style={s.featureTitle}>{article.title}</Text></Pressable>
      {article.excerpt.trim() !== article.title.trim() && <Text testID="news-featured-excerpt" style={s.featureExcerpt} numberOfLines={2}>{article.excerpt}</Text>}
      <View style={s.featureMeta}><Text testID="news-featured-date" style={s.featureMetaText}>{newsDate(article.date)}</Text><View style={s.metaDot} /><Text testID="news-featured-read-time" style={s.featureMetaText}>{article.readTime}</Text></View>
      <ReadArticleButton testID="news-featured-read-button" title={article.title} onPress={open} primary />
    </View>
  </View>;
}

export function NewsStoryCard({ article, index, prefix = "news" }: { article: Article; index: number; prefix?: string }) {
  const s = useStyles(); const router = useRouter(); const open = () => router.push(`/article/${article.id}`);
  const id = `${prefix}-${article.id}`;
  return <View style={s.story} testID={`${prefix}-card-${article.id}`}>
    <Pressable testID={`${prefix}-item-${index}`} accessibilityRole="button" accessibilityLabel={`Open article: ${article.title}`} onPress={open} style={({ pressed }) => [s.storyBody, pressed && s.pressed]}>
      <View style={s.storyText}><Text testID={`${id}-category`} style={s.category}>{article.category}</Text><Text testID={`${id}-title`} style={s.title} numberOfLines={4}>{article.title}</Text><Text testID={`${id}-read-time`} style={s.meta}>{article.readTime}</Text></View>
      <NewsImage article={article} testID={`${id}-image`} />
    </Pressable>
    <View style={s.storyFooter}><Text testID={`${id}-date`} style={s.meta}>{newsDate(article.date)}</Text><ReadArticleButton testID={`${prefix}-read-${article.id}`} title={article.title} onPress={open} /></View>
  </View>;
}

export function NewsState({ kind, title, text, onPress, label = "Try again", testID }: { kind: "error" | "empty"; title: string; text: string; onPress?: () => void; label?: string; testID: string }) {
  const s = useStyles(); const { colors } = useTheme();
  return <View testID={testID} style={s.state}><View style={s.stateIcon}><Lucide name={kind === "error" ? "wifi-off" : "book-open"} size={27} color={colors.brand} /></View><Text testID={`${testID}-title`} style={s.stateTitle}>{title}</Text><Text testID={`${testID}-description`} style={s.stateText}>{text}</Text>{onPress && <ReadArticleButton testID={`${testID}-action`} label={label} title={title} onPress={onPress} primary />}</View>;
}

export function useShareArticle() {
  const { toast } = useApp();
  return async (article: Article) => {
    const url = `${process.env.EXPO_PUBLIC_BACKEND_URL?.replace(/\/$/, "")}/article/${encodeURIComponent(article.id)}`;
    try { if (Platform.OS === "web") { await Clipboard.setStringAsync(url); toast("Article link copied"); } else await Share.share({ message: `${article.title}\n${url}`, ...(Platform.OS === "ios" ? { url } : {}) }); }
    catch { toast("Could not share this article. Please try again."); }
  };
}

const useStyles = makeStyles(c => ({
  featured: { borderRadius: 0, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, overflow: "hidden" },
  featureImage: { width: "100%", aspectRatio: 1.85, borderRadius: 0, backgroundColor: c.heroBg, overflow: "hidden" },
  thumbnail: { width: 96, height: 112, borderRadius: 0, backgroundColor: c.heroBg, overflow: "hidden", flexShrink: 0 },
  imageFill: { width: "100%", height: "100%", borderRadius: 0 },
  imagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 9 },
  placeholderText: { fontFamily: fonts.b700, fontSize: 7, letterSpacing: 0.5, color: c.brand, textAlign: "center" },
  featureFlag: { position: "absolute", left: 0, bottom: 0, backgroundColor: c.brandSecondary, paddingHorizontal: 14, paddingVertical: 9 },
  flagText: { fontFamily: fonts.b800, fontSize: 9, letterSpacing: 1.7, color: c.onBrandSecondary },
  featureBody: { padding: 20, gap: 12 },
  featureCategory: { fontFamily: fonts.b800, fontSize: 10, letterSpacing: 1.15, color: c.brand, textTransform: "uppercase" },
  featureTitle: { fontFamily: fonts.h800, fontSize: 25, lineHeight: 30, letterSpacing: -0.5, color: c.onSurface },
  featureExcerpt: { fontFamily: fonts.b400, fontSize: 13, lineHeight: 21, color: c.onSurfaceTertiary },
  featureMeta: { flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 },
  featureMetaText: { fontFamily: fonts.b500, fontSize: 11, lineHeight: 17, color: c.muted },
  metaDot: { width: 3, height: 3, borderRadius: 0, backgroundColor: c.borderStrong },
  readButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 0, gap: 12 },
  primaryButton: { backgroundColor: c.brand, paddingLeft: 16 },
  readLabel: { fontFamily: fonts.b700, fontSize: 12, color: c.brand },
  primaryLabel: { color: c.onBrand },
  arrowBox: { width: 36, minHeight: 44, alignItems: "center", justifyContent: "center" },
  primaryArrow: { width: 48, minHeight: 48, borderLeftWidth: 1, borderLeftColor: c.whiteA20 },
  story: { borderRadius: 0, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16, paddingTop: 16 },
  storyBody: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingBottom: 16 },
  storyText: { flex: 1, minWidth: 0, gap: 8 },
  category: { fontFamily: fonts.b700, fontSize: 9, lineHeight: 14, letterSpacing: 0.5, textTransform: "uppercase", color: c.brand },
  title: { fontFamily: fonts.h700, fontSize: 18, lineHeight: 24, color: c.onSurface, letterSpacing: -0.25 },
  meta: { fontFamily: fonts.b500, fontSize: 10, lineHeight: 17, color: c.muted },
  storyFooter: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: c.border, columnGap: 6, minHeight: 52 },
  state: { paddingVertical: 32, paddingHorizontal: 24, gap: 16 },
  stateIcon: { width: 58, height: 58, alignItems: "center", justifyContent: "center", backgroundColor: c.heroBg },
  stateTitle: { fontFamily: fonts.h700, fontSize: 23, lineHeight: 28, color: c.onSurface },
  stateText: { fontFamily: fonts.b400, fontSize: 14, lineHeight: 23, color: c.muted },
  pressed: { opacity: 0.78 },
}));