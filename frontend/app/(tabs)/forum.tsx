import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
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
import {
  AnimatedFeedEndCard,
  CommunityNavigationCard,
  CommunitySubpage,
  CommunityWidgetsFooter,
  ConsultSubpageView,
  FarmerRecord,
  MessagesSubpageView,
  NetworkSubpageView,
  ProfileSubpageView,
  SokoSubpageView,
} from "@/src/components/forum/CommunitySections";
import { Footer } from "@/src/components/Footer";

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
  const [subpage, setSubpage] = useState<CommunitySubpage>("posts");
  const [followedUsernames, setFollowedUsernames] = useState<string[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerRecord | null>(null);
  const [chatPartner, setChatPartner] = useState<FarmerRecord | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(filters.q), 250);
    return () => clearTimeout(timer);
  }, [filters.q]);

  const handleSelectSubpage = (page: CommunitySubpage) => {
    setSubpage(page);
    if (page === "saved") {
      setFilters((old) => ({ ...old, scope: "saved" }));
    } else if (page === "posts") {
      setFilters((old) => ({ ...old, scope: "all" }));
    }
    if (page !== "profile") {
      setSelectedFarmer(null);
    }
  };

  const needsLogin = filters.scope !== "all" && !user && (subpage === "posts" || subpage === "saved");

  const q = useInfiniteQuery({
    queryKey: ["forum-feed", user?.id, { ...filters, q: search }],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.getForumFeed({ ...filters, q: search }, pageParam),
    getNextPageParam: (page) => page.next_page ?? undefined,
    enabled: ready,
    retry: 1,
  });

  const articlesQ = useQuery({
    queryKey: ["forum-latest-articles"],
    queryFn: () => api.getArticles("All"),
    enabled: ready,
  });

  const firstPage = q.data?.pages[0];
  const farmers: FarmerRecord[] = firstPage?.suggestedFarmers ?? [];
  const sokoListings = firstPage?.sokoListings ?? [];
  const marketPrices = firstPage?.marketPrices ?? [];
  const articles = articlesQ.data ?? [];

  const allPosts = q.data?.pages.flatMap((page) => page.items) ?? [];
  const data = subpage === "posts" || subpage === "saved" ? (needsLogin ? [] : allPosts) : [];
  const total = needsLogin ? undefined : firstPage?.total;

  const compose = () => router.push(user ? "/create-post" : "/auth/sign-in");
  const filtered = !!(filters.q || filters.tag || filters.sort !== "latest");

  const handleToggleFollow = (username: string) => {
    const clean = username.startsWith("@") ? username : `@${username}`;
    setFollowedUsernames((prev) =>
      prev.includes(clean) ? prev.filter((u) => u !== clean) : [...prev, clean]
    );
  };

  const handleOpenFarmerProfile = (farmer: FarmerRecord) => {
    setSelectedFarmer(farmer);
    setSubpage("profile");
  };

  const handleStartChat = (farmer: FarmerRecord) => {
    setChatPartner(farmer);
    setSubpage("konnekt");
  };

  const empty = () => {
    if (subpage !== "posts" && subpage !== "saved") {
      return null;
    }
    if (needsLogin)
      return (
        <ForumState
          testID="forum-sign-in-state"
          icon={filters.scope === "saved" ? "bookmark" : "user-round"}
          title={
            filters.scope === "saved"
              ? "Your next good idea, saved"
              : "Your voice belongs here"
          }
          description="Sign in to keep your discussions and saved advice in one place."
          action="Sign in to continue"
          onPress={() => router.push("/auth/sign-in")}
        />
      );
    if (!ready || (q.isPending && !data.length))
      return (
        <View testID="forum-loading">
          <ListSkeleton count={3} height={220} />
        </View>
      );
    if (q.isError && !data.length)
      return (
        <ForumState
          testID="forum-error"
          icon="wifi-off"
          title="Let’s try that again"
          description="We couldn’t load the conversation. Your connection may have dropped."
          action="Try again"
          onPress={() => q.refetch()}
        />
      );
    return (
      <ForumState
        testID="forum-empty"
        icon={filters.scope === "saved" ? "bookmark" : "sprout"}
        title={
          filtered
            ? "No discussions found"
            : filters.scope === "saved"
              ? "Keep good advice close"
              : "Start something worth sharing"
        }
        description={
          filtered
            ? "Try another topic or search. Someone may be asking the same thing in a different way."
            : filters.scope === "saved"
              ? "Tap the bookmark on a discussion to find it here whenever you need it."
              : "Ask a question or share what’s working on your farm."
        }
        action={
          filtered
            ? "Clear filters"
            : filters.scope === "saved"
              ? "Explore discussions"
              : "Start a conversation"
        }
        onPress={() =>
          filtered
            ? setFilters({ ...initial, scope: filters.scope })
            : filters.scope === "saved"
              ? handleSelectSubpage("posts")
              : compose()
        }
      />
    );
  };

  return (
    <View testID={focused ? "forum-screen" : undefined} style={s.root}>
      {focused && <ForumToolbar onInfo={() => setGuidelines(true)} />}
      <FlatList
        testID="forum-thread-list"
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[s.list, { paddingBottom: bottom + 16 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={q.isRefetching && !q.isFetchingNextPage}
            onRefresh={() => {
              q.refetch();
              articlesQ.refetch();
            }}
            tintColor={colors.brand}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: 6 }}>
            {/* Discover & Connect Navigation Menu */}
            <CommunityNavigationCard
              subpage={subpage}
              onSelectSubpage={handleSelectSubpage}
            />

            {subpage === "posts" || subpage === "saved" ? (
              <ForumFeedHeader
                filters={filters}
                setFilters={(patch) => {
                  setFilters((old) => ({ ...old, ...patch }));
                  if (patch.scope === "saved") setSubpage("saved");
                  else if (patch.scope === "all") setSubpage("posts");
                }}
                total={total}
                onCompose={compose}
              />
            ) : subpage === "soko" ? (
              <SokoSubpageView
                listings={sokoListings}
                marketPrices={marketPrices}
                user={user}
                onListingCreated={() => q.refetch()}
              />
            ) : subpage === "consult" ? (
              <ConsultSubpageView user={user} />
            ) : subpage === "network" ? (
              <NetworkSubpageView
                farmers={farmers}
                followedUsernames={followedUsernames}
                onToggleFollow={handleToggleFollow}
                onOpenFarmerProfile={handleOpenFarmerProfile}
                onStartChat={handleStartChat}
              />
            ) : subpage === "konnekt" ? (
              <MessagesSubpageView
                user={user}
                farmers={farmers}
                activePartner={chatPartner}
                onSelectPartner={(f) => setChatPartner(f)}
              />
            ) : (
              <ProfileSubpageView
                user={user}
                selectedFarmer={selectedFarmer}
                posts={allPosts}
                onClearSelectedFarmer={() => setSelectedFarmer(null)}
              />
            )}
          </View>
        }
        ListEmptyComponent={empty}
        renderItem={({ item }) => (
          <View style={s.item}>
            <ThreadCard t={item} onPress={() => router.push(`/thread/${item.id}`)} />
          </View>
        )}
        ListFooterComponent={
          <View style={s.footerWrap}>
            {(subpage === "posts" || subpage === "saved") && data.length > 0 && (
              q.isFetchNextPageError || (q.isRefetchError && !q.isFetching) ? (
                <View style={s.footer}>
                  <Pressable
                    testID="forum-load-more-retry"
                    onPress={() => (q.isFetchNextPageError ? q.fetchNextPage() : q.refetch())}
                    style={s.loadMore}
                  >
                    <Text style={s.footerText}>Connection interrupted. Tap to retry.</Text>
                  </Pressable>
                </View>
              ) : q.hasNextPage ? (
                <View style={s.footer}>
                  <Pressable
                    testID="forum-load-more"
                    onPress={() => q.fetchNextPage()}
                    disabled={q.isFetchingNextPage}
                    style={s.loadMore}
                  >
                    {q.isFetchingNextPage ? (
                      <ActivityIndicator color={colors.brand} />
                    ) : (
                      <Text style={s.footerText}>More conversations</Text>
                    )}
                  </Pressable>
                </View>
              ) : (
                <AnimatedFeedEndCard onCompose={compose} />
              )
            )}

            {/* Agri Network (See All (3)), Latest Agri News, and Mqulima AI Card */}
            <CommunityWidgetsFooter
              farmers={farmers}
              articles={articles}
              followedUsernames={followedUsernames}
              onToggleFollow={handleToggleFollow}
              onSelectSubpage={handleSelectSubpage}
              onOpenFarmerProfile={handleOpenFarmerProfile}
              onStartChat={handleStartChat}
            />

            <Footer />
          </View>
        }
      />
      <Pressable
        testID="forum-create-post-fab"
        accessibilityLabel="Start a new discussion"
        onPress={compose}
        style={({ pressed }) => [
          s.fab,
          { bottom: Math.max(18, bottom - 78) },
          pressed && s.pressed,
        ]}
      >
        <Lucide name="plus" size={20} color="#0B2117" />
        <Text style={s.fabText}>New post</Text>
      </Pressable>
      <Guidelines open={guidelines} onClose={() => setGuidelines(false)} />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  list: { gap: 14 },
  item: { paddingHorizontal: 16 },
  footerWrap: { gap: 16, marginTop: 8 },
  footer: { paddingVertical: 18, paddingHorizontal: 16, alignItems: "center", gap: 8 },
  footerText: { fontFamily: fonts.b500, fontSize: 12, color: c.muted, textAlign: "center" },
  loadMore: {
    minHeight: 46,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#EAB308",
    backgroundColor: "#FACC15",
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    right: 18,
    minHeight: 50,
    paddingHorizontal: 20,
    borderRadius: 0,
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "#EAB308",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 5,
    boxShadow: "0px 5px 12px rgba(0, 0, 0, 0.20)",
  },
  fabText: { fontFamily: fonts.b800, fontSize: 12, color: "#0B2117" },
  pressed: { opacity: 0.9, transform: [{ scale: 0.96 }] },
}));
