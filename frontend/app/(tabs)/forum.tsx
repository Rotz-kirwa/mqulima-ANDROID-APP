import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter, useIsFocused } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import { ListSkeleton } from "@/src/components/Skeleton";
import { useTabBottom } from "@/src/components/Page";
import { api, ForumFilters } from "@/src/services/api";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { ThreadCard } from "@/src/components/ThreadCard";
import { useApp } from "@/src/store/AppStore";
import { ForumState, ForumToolbar, Guidelines } from "@/src/components/forum/ForumUI";
import { ForumFeedHeader } from "@/src/components/forum/ForumFeedHeader";

const initial: ForumFilters = { q: "", tag: "", sort: "latest", scope: "all" };

export default function Forum() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useTabBottom();
  const focused = useIsFocused();
  const { user, ready } = useApp();
  const [filters, setFilters] = useState<ForumFilters>(initial);
  const [search, setSearch] = useState("");
  const [guidelines, setGuidelines] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setSearch(filters.q), 250); return () => clearTimeout(timer); }, [filters.q]);
  const needsLogin = filters.scope !== "all" && !user;
  const q = useInfiniteQuery({ queryKey: ["forum-feed", user?.id, { ...filters, q: search }], initialPageParam: 1, queryFn: ({ pageParam }) => api.getForumFeed({ ...filters, q: search }, pageParam), getNextPageParam: page => page.next_page ?? undefined, enabled: ready && !needsLogin, retry: 1 });
  const data = needsLogin ? [] : q.data?.pages.flatMap(page => page.items) ?? [];
  const total = needsLogin ? undefined : q.data?.pages[0]?.total;
  const compose = () => router.push(user ? "/create-post" : "/auth/sign-in");
  const filtered = !!(filters.q || filters.tag || filters.sort !== "latest");
  const empty = () => {
    if (needsLogin) return <ForumState testID="forum-sign-in-state" icon={filters.scope === "saved" ? "bookmark" : "user-round"} title={filters.scope === "saved" ? "Your next good idea, saved" : "Your voice belongs here"} description="Sign in to keep your discussions and saved advice in one place." action="Sign in to continue" onPress={() => router.push("/auth/sign-in")} />;
    if (q.isPending) return <View testID="forum-loading"><ListSkeleton count={3} height={220} /></View>;
    if (q.isError) return <ForumState testID="forum-error" icon="wifi-off" title="Let’s try that again" description="We couldn’t load the conversation. Your connection may have dropped." action="Try again" onPress={() => q.refetch()} />;
    return <ForumState testID="forum-empty" icon={filters.scope === "saved" ? "bookmark" : "sprout"} title={filtered ? "No discussions found" : filters.scope === "saved" ? "Keep good advice close" : "Start something worth sharing"} description={filtered ? "Try another topic or search. Someone may be asking the same thing in a different way." : filters.scope === "saved" ? "Tap the bookmark on a discussion to find it here whenever you need it." : "Ask a question or share what’s working on your farm."} action={filtered ? "Clear filters" : filters.scope === "saved" ? "Explore discussions" : "Start a conversation"} onPress={() => filtered ? setFilters({ ...initial, scope: filters.scope }) : filters.scope === "saved" ? setFilters(initial) : compose()} />;
  };
  return <View testID={focused ? "forum-screen" : undefined} style={s.root}>
    {focused && <ForumToolbar onInfo={() => setGuidelines(true)} />}
    <FlatList testID="forum-thread-list" data={data} keyExtractor={item => item.id} contentContainerStyle={[s.list, { paddingBottom: bottom + 16 }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" refreshControl={<RefreshControl refreshing={q.isRefetching && !q.isFetchingNextPage} onRefresh={() => { if (!needsLogin) q.refetch(); }} tintColor={colors.brand} />}
      ListHeaderComponent={<ForumFeedHeader filters={filters} setFilters={patch => setFilters(old => ({ ...old, ...patch }))} total={total} onCompose={compose} />}
      ListEmptyComponent={empty}
      renderItem={({ item }) => <View style={s.item}><ThreadCard t={item} onPress={() => router.push(`/thread/${item.id}`)} /></View>}
      ListFooterComponent={data.length ? <View style={s.footer}>{q.isFetchNextPageError || (q.isRefetchError && !q.isFetching) ? <Pressable testID="forum-load-more-retry" onPress={() => q.isFetchNextPageError ? q.fetchNextPage() : q.refetch()} style={s.loadMore}><Text style={s.footerText}>Connection interrupted. Tap to retry.</Text></Pressable> : q.hasNextPage ? <Pressable testID="forum-load-more" onPress={() => q.fetchNextPage()} disabled={q.isFetchingNextPage} style={s.loadMore}>{q.isFetchingNextPage ? <ActivityIndicator color={colors.brand} /> : <Text style={s.footerText}>More conversations</Text>}</Pressable> : <><Lucide name="sprout" size={20} color={colors.brand} /><Text testID="forum-feed-end" style={s.footerText}>You’re all caught up. Keep growing.</Text></>}</View> : null}
    />
    <Pressable testID="forum-create-post-fab" accessibilityLabel="Start a new discussion" onPress={compose} style={({ pressed }) => [s.fab, { bottom: Math.max(18, bottom - 78) }, pressed && s.pressed]}><Lucide name="plus" size={20} color={colors.onBrand} /><Text style={s.fabText}>New post</Text></Pressable>
    <Guidelines open={guidelines} onClose={() => setGuidelines(false)} />
  </View>;
}

const useStyles = makeStyles(c => ({
  root: { flex: 1, backgroundColor: c.surface },
  list: { gap: 14 },
  item: { paddingHorizontal: 16 },
  footer: { paddingVertical: 24, paddingHorizontal: 16, alignItems: "center", gap: 8 },
  footerText: { fontFamily: fonts.b500, fontSize: 12, color: c.muted },
  loadMore: { minHeight: 48, paddingHorizontal: 20, borderWidth: 1, borderColor: c.border, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  fab: { position: "absolute", right: 18, minHeight: 52, paddingHorizontal: 20, borderRadius: 28, backgroundColor: c.brand, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, elevation: 5, shadowColor: c.forest, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  fabText: { fontFamily: fonts.b700, fontSize: 12, color: c.onBrand },
  pressed: { opacity: 0.9, transform: [{ scale: 0.96 }] },
}));