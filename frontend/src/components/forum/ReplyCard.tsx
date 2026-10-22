import React from "react";
import { Pressable, Text, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Comment } from "@/src/data/forum";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { FarmerAvatar, timeAgo } from "./ForumUI";

export function ReplyCard({ comment, authorId, onReply, nested = false }: { comment: Comment; authorId?: string | null; onReply: () => void; nested?: boolean }) {
  const s = useStyles();
  const { colors } = useTheme();
  return <View testID={`comment-${comment.id}`} style={[s.card, nested && s.nested]}>
    <FarmerAvatar name={comment.author} size={nested ? 28 : 34} testID={`comment-avatar-${comment.id}`} />
    <View style={s.body}><View style={s.header}><Text testID={`comment-author-${comment.id}`} style={s.author}>{comment.author}</Text>{!!authorId && authorId === comment.user_id && <Text testID={`comment-op-${comment.id}`} style={s.op}>Author</Text>}</View><Text testID={`comment-time-${comment.id}`} style={s.time}>{timeAgo(comment.time)}</Text><Text testID={`comment-text-${comment.id}`} style={s.text}>{comment.text}</Text><Pressable testID={`comment-reply-${comment.id}`} accessibilityLabel={`Reply to ${comment.author}`} onPress={onReply} style={({ pressed }) => [s.reply, pressed && s.pressed]}><Lucide name="corner-down-right" size={14} color={colors.brand} /><Text style={s.replyText}>Reply</Text></Pressable></View>
  </View>;
}

const useStyles = makeStyles(c => ({
  card: { flexDirection: "row", gap: 10, paddingTop: 16, paddingHorizontal: 16 },
  nested: { marginLeft: 30, borderLeftWidth: 2, borderLeftColor: c.brandTertiary, paddingLeft: 12, paddingRight: 12, paddingTop: 8 },
  body: { flex: 1, minWidth: 0 },
  header: { flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" },
  author: { fontFamily: fonts.b700, fontSize: 12, lineHeight: 20, color: c.onSurface },
  op: { fontFamily: fonts.b700, fontSize: 9, color: c.onBrandTertiary, backgroundColor: c.brandTertiary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  time: { fontFamily: fonts.b400, fontSize: 10, color: c.muted, marginTop: 2 },
  text: { fontFamily: fonts.b400, fontSize: 13, lineHeight: 22, color: c.onSurfaceSecondary, marginTop: 8 },
  reply: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 5, minHeight: 44, paddingRight: 15 },
  replyText: { fontFamily: fonts.b700, fontSize: 11, color: c.brand },
  pressed: { opacity: 0.7 },
}));