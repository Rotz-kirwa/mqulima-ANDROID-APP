import React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "@/src/components/Img";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Avatar, Pill } from "@/src/components/ui";
import { Thread } from "@/src/data/forum";
import { avatar } from "@/src/data/home";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { useApp } from "@/src/store/AppStore";

export function ThreadCard({ t, onPress, full }: { t: Thread; onPress?: () => void; full?: boolean }) {
  const s = useStyles();
  const { colors } = useTheme();
  const { liked, toggleLike, extraComments, toast } = useApp();
  const isLiked = liked.includes(t.id);
  const comments = t.comments.length + (extraComments[t.id]?.length ?? 0);
  return (
    <Pressable testID={`thread-card-${t.id}`} onPress={onPress} disabled={!onPress} style={s.card}>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <Avatar uri={avatar(t.author)} />
        <View style={{ flex: 1 }}>
          <Text style={s.author}>{t.author}</Text>
          <Text style={s.handle} numberOfLines={1}>{t.handle} · {t.date}</Text>
        </View>
        <Pill label={t.tag} />
      </View>
      <Text style={s.text} numberOfLines={full ? undefined : 4}>{t.text}</Text>
      {t.image ? <Image source={{ uri: t.image }} style={s.media} contentFit="cover" transition={300} /> : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Lucide name="map-pin" size={13} color={colors.muted} />
        <Text style={s.handle}>{t.location}</Text>
      </View>
      <View style={s.actions}>
        <Pressable testID={`thread-like-${t.id}`} onPress={() => toggleLike(t.id)} style={s.action}>
          <Lucide name="heart" size={18} color={isLiked ? colors.error : colors.muted} />
          <Text style={[s.actionText, isLiked && { color: colors.error }]} testID={`thread-like-count-${t.id}`}>{t.likes + (isLiked ? 1 : 0)}</Text>
        </Pressable>
        <View style={s.action}>
          <Lucide name="message-circle" size={18} color={colors.muted} />
          <Text style={s.actionText}>{comments}</Text>
        </View>
        <Pressable testID={`thread-share-${t.id}`} onPress={() => toast("Link copied to share")} style={s.action}>
          <Lucide name="share-2" size={18} color={colors.muted} />
          <Text style={s.actionText}>Share</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  hero: { padding: 16, paddingTop: 24, gap: 12 },
  h1: { fontFamily: fonts.h900, fontSize: 28, lineHeight: 32, color: c.onSurface },
  h2: { fontFamily: fonts.h900, fontSize: 22, color: c.onSurface },
  h3: { fontFamily: fonts.h800, fontSize: 16, color: c.onSurface },
  stepN: { fontFamily: fonts.h900, fontSize: 20, color: c.limeText },
  card: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 24, padding: 16, gap: 12 },
  author: { fontFamily: fonts.h700, fontSize: 14, color: c.onSurface },
  handle: { fontFamily: fonts.b500, fontSize: 12, color: c.muted },
  text: { fontFamily: fonts.b400, fontSize: 14, lineHeight: 21, color: c.onSurfaceSecondary },
  media: { width: "100%", aspectRatio: 4 / 3, borderRadius: 16, backgroundColor: c.surfaceTertiary },
  actions: { flexDirection: "row", gap: 8, borderTopWidth: 1, borderTopColor: c.divider, paddingTop: 4 },
  action: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: 8 },
  actionText: { fontFamily: fonts.b600, fontSize: 13, color: c.muted },
  composer: { marginHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 999, padding: 8, paddingRight: 16, minHeight: 52 },
  composerText: { flex: 1, fontFamily: fonts.b500, fontSize: 14, color: c.subtle },
  fab: { position: "absolute", right: 18, width: 48, height: 48, borderRadius: 24, backgroundColor: c.brand, alignItems: "center", justifyContent: "center", elevation: 4, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
}));
