import React from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { Image } from "@/src/components/Img";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import { TopBar } from "@/src/components/TopBar";
import { ListSkeleton } from "@/src/components/Skeleton";
import { Avatar, Btn, Body, Pill } from "@/src/components/ui";
import { useTabBottom } from "@/src/components/Page";
import { api } from "@/src/services/api";
import { forumHero, network } from "@/src/data/forum";
import { avatar } from "@/src/data/home";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { ThreadCard } from "@/src/components/ThreadCard";
import { useApp } from "@/src/store/AppStore";

export default function Forum() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useTabBottom();
  const { myThreads, user } = useApp();
  const q = useQuery({ queryKey: ["threads"], queryFn: api.getThreads });
  const data = [...myThreads, ...(q.data ?? [])];

  return (
    <View style={s.root} testID="forum-screen">
      <TopBar />
      <FlatList
        testID="forum-thread-list"
        data={q.isLoading ? [] : data}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingBottom: bottom, gap: 12 }}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={q.refetch} tintColor={colors.brandPrimary} colors={[colors.brandPrimary]} />}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            <View style={s.hero}>
              <Pill label={forumHero.badge} />
              <Text style={s.h1}>{forumHero.title}</Text>
              <Body style={{ fontSize: 13 }}>{forumHero.text}</Body>
              <Btn testID="forum-create-profile-btn" variant="green" label={user ? "Create Post" : forumHero.cta} onPress={() => router.push(user ? "/create-post" : "/auth/sign-up")} />
              <Text style={s.handle}>{forumHero.ctaSub}</Text>
              <Image source={{ uri: forumHero.image }} style={{ width: "100%", aspectRatio: 16 / 10, borderRadius: 20 }} contentFit="cover" transition={300} />
              <View style={{ flexDirection: "row", gap: 8 }}>
                {forumHero.stats.map((st) => <Pill key={st} label={st} />)}
              </View>
              {forumHero.steps.map((st) => (
                <View key={st.n} style={{ flexDirection: "row", gap: 12 }}>
                  <Text style={s.stepN}>{st.n}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.author}>{st.title}</Text>
                    <Body style={{ fontSize: 12 }}>{st.text}</Body>
                  </View>
                </View>
              ))}
            </View>
            <Pressable testID="forum-composer-btn" onPress={() => router.push("/create-post")} style={s.composer}>
              <Avatar uri={avatar(user?.name ?? "Mqulima Farmer")} size={36} />
              <Text style={s.composerText}>Share your farm progress...</Text>
              <Lucide name="image" size={20} color={colors.brandPrimary} />
            </Pressable>
            <View style={{ paddingHorizontal: 16 }}>
              <Text style={s.h2}>Community Discussion & Posts</Text>
              <Text style={s.handle}>{data.length} posts</Text>
            </View>
            {q.isLoading ? <ListSkeleton count={3} height={140} /> : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <ThreadCard t={item} onPress={() => router.push(`/thread/${item.id}`)} />
          </View>
        )}
        ListFooterComponent={
          <View style={[s.card, { marginHorizontal: 16, marginTop: 4 }]}>
            <Text style={s.h3}>Agri Network</Text>
            {network.map((n) => (
              <View key={n.name} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Avatar uri={avatar(n.name)} size={32} />
                <Text style={s.author}>{n.name}</Text>
                <Text style={s.handle}>📍 {n.county}</Text>
              </View>
            ))}
          </View>
        }
      />
      <Pressable testID="forum-create-post-fab" onPress={() => router.push("/create-post")} style={[s.fab, { bottom: bottom - 96 + 84 }]}>
        <Lucide name="plus" size={24} color={colors.white} />
      </Pressable>
    </View>
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
