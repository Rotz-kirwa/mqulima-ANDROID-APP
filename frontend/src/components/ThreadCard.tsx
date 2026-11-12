import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useRouter } from "expo-router";
import { Image } from "@/src/components/Img";
import { ApiThread } from "@/src/services/api";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { FarmerAvatar, TopicBadge, timeAgo } from "./forum/ForumUI";
import { SharePostModal } from "./forum/ShareModal";
import { useThreadActions } from "./forum/useThreadActions";

export function ThreadCard({ t, onPress, full = false, onReply }: { t: ApiThread; onPress?: () => void; full?: boolean; onReply?: () => void }) {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { like, bookmark, withUser, share, shareOpen, setShareOpen } = useThreadActions(t);
  const prefix = full ? "detail" : "feed";
  const open = onPress ?? (() => router.push(`/thread/${t.id}`));
  const replies = t.comments?.length ?? 0;
  const hasTitle = Boolean(t.title && t.title.trim().length > 0);
  const showBody = Boolean(t.text && t.text.trim().length > 0 && (!hasTitle || t.title!.trim() !== t.text.trim()));

  return (
    <View testID={`thread-card-${t.id}`} style={[s.card, full && s.full]}>
      <View style={s.authorRow}>
        <FarmerAvatar name={t.author} testID={`${prefix}-avatar-${t.id}`} />
        <View style={s.authorInfo}>
          <View style={s.authorNameRow}>
            <Text testID={`${prefix}-author-${t.id}`} numberOfLines={1} style={s.author}>
              {t.author}
            </Text>
            {!!t.handle && (
              <Text numberOfLines={1} style={s.handleText}>
                {t.handle}
              </Text>
            )}
          </View>
          <Text testID={`${prefix}-meta-${t.id}`} style={s.meta} numberOfLines={1}>
            📍 {t.location || t.county || "Kenya"} · {timeAgo(t.created_at || t.date)}
          </Text>
        </View>
        <Pressable
          testID={`thread-save-${t.id}`}
          accessibilityLabel={t.saved ? "Unsave discussion" : "Save discussion"}
          accessibilityState={{ selected: !!t.saved, disabled: bookmark.isPending }}
          disabled={bookmark.isPending}
          onPress={() => withUser(() => bookmark.mutate())}
          style={s.iconButton}
        >
          {bookmark.isPending ? (
            <ActivityIndicator size="small" color={colors.brand} />
          ) : (
            <Lucide
              name={t.saved ? "bookmark-check" : "bookmark"}
              size={20}
              color={t.saved ? colors.brand : colors.muted}
            />
          )}
        </Pressable>
      </View>

      <Pressable
        testID={`thread-open-${t.id}`}
        onPress={full ? undefined : open}
        accessibilityRole={full ? undefined : "button"}
        style={({ pressed }) => [s.content, !full && pressed && s.pressed]}
      >
        <View style={s.topicRow}>
          <TopicBadge tag={t.tag} resolved={t.resolved} testID={`${prefix}-topic-${t.id}`} />
          {!replies && !t.resolved && (
            <Text style={s.waiting} testID={`${prefix}-unanswered-${t.id}`}>
              Start the conversation
            </Text>
          )}
        </View>
        {hasTitle && (
          <Text
            testID={`${prefix}-title-${t.id}`}
            style={[s.title, full && s.fullTitle]}
            numberOfLines={full ? undefined : 3}
          >
            {t.title}
          </Text>
        )}
        {showBody && (
          <Text
            testID={`${prefix}-body-${t.id}`}
            style={s.body}
            numberOfLines={full ? undefined : 4}
          >
            {t.text}
          </Text>
        )}
        {t.images && t.images.length > 1 ? (
          <View style={s.galleryGrid}>
            {t.images.map((uri, idx) => (
              <Image
                key={`${uri}-${idx}`}
                testID={`${prefix}-image-${t.id}-${idx}`}
                source={{ uri }}
                accessibilityLabel={`Photo ${idx + 1} shared in this discussion`}
                style={[s.image, full && s.fullImage]}
                contentFit={full ? "contain" : "cover"}
                transition={200}
              />
            ))}
          </View>
        ) : !!t.image ? (
          <Image
            testID={`${prefix}-image-${t.id}`}
            source={{ uri: t.image }}
            accessibilityLabel="Photo shared in this discussion"
            style={[s.image, full && s.fullImage]}
            contentFit={full ? "contain" : "cover"}
            transition={200}
          />
        ) : null}
      </Pressable>

      {/* Preview first comment on feed cards when available */}
      {!full && replies > 0 && t.comments[0] && (
        <Pressable onPress={open} style={s.commentPreviewBox}>
          <View style={s.commentPreviewDot} />
          <Text style={s.commentPreviewText} numberOfLines={2}>
            <Text style={s.commentPreviewAuthor}>{t.comments[0].author}: </Text>
            {t.comments[0].text}
          </Text>
        </Pressable>
      )}

      <View style={s.actions}>
        <Pressable
          testID={`thread-like-${t.id}`}
          accessibilityLabel={t.liked ? "Unlike discussion" : "Like discussion"}
          accessibilityState={{ selected: t.liked, disabled: like.isPending }}
          disabled={like.isPending}
          onPress={() => withUser(() => like.mutate())}
          style={({ pressed }) => [s.action, t.liked && s.liked, pressed && s.pressed]}
        >
          {like.isPending ? (
            <ActivityIndicator size="small" color={colors.brand} />
          ) : (
            <Lucide name="heart" size={18} color={t.liked ? colors.brand : colors.muted} />
          )}
          <Text testID={`thread-like-count-${t.id}`} style={[s.actionText, t.liked && s.activeText]}>
            {t.likes}
          </Text>
        </Pressable>

        <Pressable
          testID={`thread-replies-${t.id}`}
          accessibilityLabel={`${replies} replies, open conversation`}
          onPress={onReply ?? open}
          style={({ pressed }) => [s.action, pressed && s.pressed]}
        >
          <Lucide name="message-circle" size={18} color={colors.muted} />
          <Text testID={`${prefix}-reply-count-${t.id}`} style={s.actionText}>
            {replies} {replies === 1 ? "reply" : "replies"}
          </Text>
        </Pressable>

        <View style={s.spacer} />

        <Pressable
          testID={`thread-share-${t.id}`}
          accessibilityLabel="Share discussion"
          onPress={share}
          style={({ pressed }) => [s.action, pressed && s.pressed]}
        >
          <Lucide name="share-2" size={18} color={colors.muted} />
          <Text style={s.actionText}>Share</Text>
        </Pressable>
      </View>

      <SharePostModal visible={shareOpen} onClose={() => setShareOpen(false)} thread={t} />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  card: {
    backgroundColor: c.surfaceSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 16,
    paddingTop: 14,
    overflow: "hidden",
  },
  full: {
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  authorInfo: {
    flex: 1,
    minWidth: 0,
  },
  authorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  author: {
    fontFamily: fonts.b700,
    fontSize: 13,
    color: c.onSurface,
    lineHeight: 20,
  },
  handleText: {
    fontFamily: fonts.b600,
    fontSize: 11,
    color: c.brand,
  },
  meta: {
    fontFamily: fonts.b500,
    fontSize: 11,
    color: c.muted,
    lineHeight: 17,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  waiting: {
    fontFamily: fonts.b500,
    fontSize: 10,
    color: c.muted,
  },
  title: {
    fontFamily: fonts.h700,
    fontSize: 17,
    lineHeight: 24,
    color: c.onSurface,
    letterSpacing: -0.2,
  },
  fullTitle: {
    fontFamily: fonts.h700,
    fontSize: 24,
    lineHeight: 31,
  },
  body: {
    fontFamily: fonts.b400,
    fontSize: 13.5,
    lineHeight: 21,
    color: c.onSurfaceSecondary,
  },
  image: {
    width: "100%",
    aspectRatio: 16 / 10,
    borderRadius: 0,
    backgroundColor: c.heroBg,
  },
  fullImage: {
    aspectRatio: 1.3,
  },
  galleryGrid: {
    gap: 8,
  },
  commentPreviewBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: c.heroBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
  },
  commentPreviewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: c.brand,
    marginTop: 6,
  },
  commentPreviewText: {
    flex: 1,
    fontFamily: fonts.b400,
    fontSize: 12,
    lineHeight: 18,
    color: c.onSurfaceSecondary,
  },
  commentPreviewAuthor: {
    fontFamily: fonts.b700,
    color: c.onSurface,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: c.divider,
    paddingVertical: 4,
  },
  action: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingHorizontal: 10,
    minHeight: 44,
    borderRadius: 0,
  },
  liked: {
    backgroundColor: c.heroBg,
  },
  actionText: {
    fontFamily: fonts.b600,
    fontSize: 11.5,
    color: c.muted,
  },
  activeText: {
    color: c.brand,
  },
  spacer: {
    flex: 1,
  },
  pressed: {
    opacity: 0.75,
  },
}));
