import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useRouter } from "expo-router";
import { Image } from "@/src/components/Img";
import { ApiThread } from "@/src/services/api";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { FarmerAvatar, TopicBadge, timeAgo } from "./forum/ForumUI";
import { useThreadActions } from "./forum/useThreadActions";

export function ThreadCard({ t, onPress, full = false, onReply }: { t: ApiThread; onPress?: () => void; full?: boolean; onReply?: () => void }) {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { like, bookmark, withUser, share } = useThreadActions(t);
  const prefix = full ? "detail" : "feed";
  const open = onPress ?? (() => router.push(`/thread/${t.id}`));
  const replies = t.comments.length;
  return <View testID={`thread-card-${t.id}`} style={[s.card, full && s.full]}>
    <View style={s.authorRow}><FarmerAvatar name={t.author} testID={`${prefix}-avatar-${t.id}`} /><View style={s.authorInfo}><Text testID={`${prefix}-author-${t.id}`} numberOfLines={1} style={s.author}>{t.author}</Text><Text testID={`${prefix}-meta-${t.id}`} style={s.meta} numberOfLines={1}>{t.county || t.location || "Mqulima community"} · {timeAgo(t.created_at || t.date)}</Text></View><Pressable testID={`thread-save-${t.id}`} accessibilityLabel={t.saved ? "Unsave discussion" : "Save discussion"} accessibilityState={{ selected: !!t.saved, disabled: bookmark.isPending }} disabled={bookmark.isPending} onPress={() => withUser(() => bookmark.mutate())} style={s.iconButton}>{bookmark.isPending ? <ActivityIndicator size="small" color={colors.brand} /> : <Lucide name={t.saved ? "bookmark-check" : "bookmark"} size={20} color={t.saved ? colors.brand : colors.muted} />}</Pressable></View>
    <Pressable testID={`thread-open-${t.id}`} onPress={full ? undefined : open} accessibilityRole={full ? undefined : "button"} style={({ pressed }) => [s.content, !full && pressed && s.pressed]}>
      <View style={s.topicRow}><TopicBadge tag={t.tag} resolved={t.resolved} testID={`${prefix}-topic-${t.id}`} />{!t.comments.length && !t.resolved && <Text style={s.waiting} testID={`${prefix}-unanswered-${t.id}`}>Start the conversation</Text>}</View>
      <Text testID={`${prefix}-title-${t.id}`} style={[s.title, full && s.fullTitle]} numberOfLines={full ? undefined : 3}>{t.title || t.text}</Text>
      {!!t.title && <Text testID={`${prefix}-body-${t.id}`} style={s.body} numberOfLines={full ? undefined : 3}>{t.text}</Text>}
      {!!t.image && <Image testID={`${prefix}-image-${t.id}`} source={{ uri: t.image }} accessibilityLabel="Photo shared in this discussion" style={[s.image, full && s.fullImage]} contentFit={full ? "contain" : "cover"} transition={200} />}
    </Pressable>
    <View style={s.actions}>
      <Pressable testID={`thread-like-${t.id}`} accessibilityLabel={t.liked ? "Unlike discussion" : "Like discussion"} accessibilityState={{ selected: t.liked, disabled: like.isPending }} disabled={like.isPending} onPress={() => withUser(() => like.mutate())} style={({ pressed }) => [s.action, t.liked && s.liked, pressed && s.pressed]}>{like.isPending ? <ActivityIndicator size="small" color={colors.brand} /> : <Lucide name="heart" size={18} color={t.liked ? colors.brand : colors.muted} />}<Text testID={`thread-like-count-${t.id}`} style={[s.actionText, t.liked && s.activeText]}>{t.likes}</Text></Pressable>
      <Pressable testID={`thread-replies-${t.id}`} accessibilityLabel={`${replies} replies, open conversation`} onPress={onReply ?? open} style={({ pressed }) => [s.action, pressed && s.pressed]}><Lucide name="message-circle" size={18} color={colors.muted} /><Text testID={`${prefix}-reply-count-${t.id}`} style={s.actionText}>{replies} {replies === 1 ? "reply" : "replies"}</Text></Pressable>
      <View style={s.spacer} /><Pressable testID={`thread-share-${t.id}`} accessibilityLabel="Share discussion" onPress={share} style={({ pressed }) => [s.iconButton, pressed && s.pressed]}><Lucide name="share-2" size={18} color={colors.muted} /></Pressable>
    </View>
  </View>;
}

const useStyles = makeStyles(c => ({
  card: { backgroundColor: c.surfaceSecondary, borderRadius: 20, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16, paddingTop: 14, overflow: "hidden" },
  full: { borderWidth: 0, borderRadius: 0, paddingHorizontal: 20, paddingTop: 20 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  authorInfo: { flex: 1, minWidth: 0 },
  author: { fontFamily: fonts.b700, fontSize: 12, color: c.onSurface, lineHeight: 20 },
  meta: { fontFamily: fonts.b400, fontSize: 10, color: c.muted, lineHeight: 17 },
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  content: { paddingTop: 12, paddingBottom: 14, gap: 10 },
  topicRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  waiting: { fontFamily: fonts.b500, fontSize: 10, color: c.muted },
  title: { fontFamily: fonts.h600, fontSize: 19, lineHeight: 26, color: c.onSurface, letterSpacing: -0.2 },
  fullTitle: { fontFamily: fonts.h700, fontSize: 25, lineHeight: 32 },
  body: { fontFamily: fonts.b400, fontSize: 13, lineHeight: 22, color: c.onSurfaceSecondary },
  image: { width: "100%", aspectRatio: 1.85, borderRadius: 12, backgroundColor: c.heroBg },
  fullImage: { aspectRatio: 1.3 },
  actions: { flexDirection: "row", alignItems: "center", gap: 6, borderTopWidth: 1, borderTopColor: c.divider, paddingVertical: 4 },
  action: { flexDirection: "row", gap: 6, alignItems: "center", paddingHorizontal: 10, minHeight: 44, borderRadius: 24 },
  liked: { backgroundColor: c.heroBg },
  actionText: { fontFamily: fonts.b600, fontSize: 11, color: c.muted },
  activeText: { color: c.brand },
  spacer: { flex: 1 },
  pressed: { opacity: 0.75 },
}));