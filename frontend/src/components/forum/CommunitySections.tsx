import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { api, ApiThread } from "@/src/services/api";
import { pickAndUploadForumImages } from "@/src/utils/forumMedia";
import { Article } from "@/src/data/articles";
import { ThreadCard } from "@/src/components/ThreadCard";

export type CommunitySubpage =
  | "posts"
  | "soko"
  | "consult"
  | "network"
  | "konnekt"
  | "saved"
  | "profile";

export type FarmerRecord = {
  id?: string;
  username: string;
  name: string;
  country?: string;
  county: string;
  natureOfAgriculture?: string;
  interests?: string[];
  crops?: string[];
  livestock?: string[];
  yearsFarming?: number;
  certifications?: string[];
  reputationScore?: number;
  followersCount?: number;
  avatarUrl?: string;
  coverImage?: string;
  bio?: string;
  phone?: string;
  email?: string;
  farmingActivities?: string;
  farmingPhotos?: string[];
  joinedDate?: string;
};

export type SokoListingRecord = {
  id: string;
  commodity: string;
  type: "crop" | "livestock" | "fruit";
  price: number;
  quantity: string;
  location: string;
  images: string[];
  description: string;
  phone?: string;
  status: "available" | "sold";
  createdAt: string;
  author: {
    username: string;
    name: string;
    county: string;
    phone?: string;
    avatarUrl?: string;
  };
};

export type MarketPriceRecord = {
  id: string;
  commodity: string;
  unit: string;
  market: string;
  price: number;
  trend?: string;
  change?: string;
};

const DISCOVER_ITEMS: {
  id: CommunitySubpage;
  label: string;
  icon: any;
  accent: string;
  bg: string;
}[] = [
  { id: "posts", label: "Posts", icon: "message-square", accent: "#166534", bg: "#DCFCE7" },
  { id: "soko", label: "Mqulima Soko", icon: "shopping-bag", accent: "#B45309", bg: "#FEF3C7" },
  { id: "consult", label: "Mqulima Consult", icon: "stethoscope", accent: "#6D28D9", bg: "#EDE9FE" },
];

const CONNECT_ITEMS: {
  id: CommunitySubpage;
  label: string;
  icon: any;
  accent: string;
  bg: string;
}[] = [
  { id: "network", label: "Farmers Network", icon: "users", accent: "#0F766E", bg: "#CCFBF1" },
  { id: "konnekt", label: "Messages", icon: "send", accent: "#1D4ED8", bg: "#DBEAFE" },
  { id: "saved", label: "Saved Posts", icon: "bookmark", accent: "#B45309", bg: "#FEF3C7" },
  { id: "profile", label: "Mqulima Profile", icon: "user-round", accent: "#1B4332", bg: "#D8F3DC" },
];

export function CommunityNavigationCard({
  subpage,
  onSelectSubpage,
}: {
  subpage: CommunitySubpage;
  onSelectSubpage: (page: CommunitySubpage) => void;
}) {
  const s = useStyles();

  return (
    <View style={s.navCard} testID="community-navigation-card">
      {/* Discover label above the row */}
      <Text style={s.navSectionLabel}>Discover</Text>
      <View style={s.navRow}>
        {DISCOVER_ITEMS.map((item) => {
          const active = subpage === item.id;
          return (
            <Pressable
              key={item.id}
              testID={`community-nav-${item.id}`}
              onPress={() => onSelectSubpage(item.id)}
              style={({ pressed }) => [
                s.navItem,
                active && [s.navItemActive, { borderBottomColor: item.accent, backgroundColor: item.bg }],
                pressed && s.pressed,
              ]}
            >
              <Lucide name={item.icon} size={13} color={active ? item.accent : "#374151"} />
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={[s.navItemText, active && { color: "#0B2117", fontFamily: fonts.b800 }]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Connect label above the row */}
      <Text style={[s.navSectionLabel, { marginTop: 6 }]}>Connect</Text>
      <View style={s.navRow}>
        {CONNECT_ITEMS.map((item) => {
          const active = subpage === item.id;
          return (
            <Pressable
              key={item.id}
              testID={`community-nav-${item.id}`}
              onPress={() => onSelectSubpage(item.id)}
              style={({ pressed }) => [
                s.navItem,
                { paddingHorizontal: 5 },
                active && [s.navItemActive, { borderBottomColor: item.accent, backgroundColor: item.bg }],
                pressed && s.pressed,
              ]}
            >
              <Lucide name={item.icon} size={12} color={active ? item.accent : "#374151"} />
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={[s.navItemText, { fontSize: 10 }, active && { color: "#0B2117", fontFamily: fonts.b800 }]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function AnimatedFeedEndCard({ onCompose }: { onCompose?: () => void }) {
  const s = useStyles();
  const ring = useSharedValue(0);
  const floatY = useSharedValue(0);
  const sway = useSharedValue(0);
  const twinkleA = useSharedValue(0.65);
  const twinkleB = useSharedValue(1);
  const shimmerX = useSharedValue(-220);

  useEffect(() => {
    ring.value = withRepeat(
      withTiming(1, { duration: 1900, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    floatY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
        withTiming(2, { duration: 1300, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    sway.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    twinkleA.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 950, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.7, { duration: 950, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    twinkleB.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 950, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.25, { duration: 950, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    shimmerX.value = withRepeat(
      withSequence(
        withTiming(360, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(360, { duration: 900 })
      ),
      -1,
      false
    );
  }, [ring, floatY, sway, twinkleA, twinkleB, shimmerX]);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.9 + ring.value * 0.65 }],
    opacity: 0.55 * (1 - ring.value),
  }));

  const sproutStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { rotate: `${sway.value}deg` },
    ],
  }));

  const starLeftStyle = useAnimatedStyle(() => ({
    transform: [{ scale: twinkleA.value }],
    opacity: 0.45 + twinkleA.value * 0.45,
  }));

  const starRightStyle = useAnimatedStyle(() => ({
    transform: [{ scale: twinkleB.value }],
    opacity: 0.45 + twinkleB.value * 0.45,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }, { rotate: "16deg" }],
  }));

  return (
    <Animated.View entering={FadeInDown.duration(450)} style={s.feedEndCard}>
      {/* Subtle animated shimmer sweep across background */}
      <Animated.View style={[s.feedEndShimmer, { pointerEvents: "none" }, shimmerStyle]} />

      {/* Top special character ornament banner */}
      <View style={s.feedEndRibbonRow}>
        <Animated.Text style={[s.feedEndStarGold, starLeftStyle]}>✦</Animated.Text>
        <Text style={s.feedEndRibbonGlyph}>── ❦ 🌱 • 🌾 • 🌿 ❦ ──</Text>
        <Animated.Text style={[s.feedEndStarEmerald, starRightStyle]}>✧</Animated.Text>
      </View>

      {/* Center animated sprout emblem with pulsing ripple */}
      <View style={s.feedEndMedalRow}>
        <Animated.Text style={[s.feedEndSideChar, starRightStyle]}>✨</Animated.Text>
        <View style={s.feedEndMedalWrap}>
          <Animated.View style={[s.feedEndHalo, haloStyle]} />
          <Animated.View style={[s.feedEndMedal, sproutStyle]}>
            <Lucide name="sprout" size={24} color="#166534" />
          </Animated.View>
        </View>
        <Animated.Text style={[s.feedEndSideChar, starLeftStyle]}>✨</Animated.Text>
      </View>

      {/* Stylized special-character typography */}
      <Text
        testID="forum-feed-end"
        accessibilityLabel="You’re all caught up. Share something from your farm."
        style={s.feedEndTextBlock}
      >
        <Text style={s.feedEndFlourish}>❝ ✦ </Text>
        <Text style={s.feedEndHeadline}>You’re all caught up.</Text>
        <Text style={s.feedEndFlourish}> ✦ ❞{"\n"}</Text>
        <Text style={s.feedEndSubline}>❧ Share something from your farm ❦</Text>
      </Text>

      {onCompose ? (
        <Pressable
          testID="forum-feed-end-compose"
          onPress={onCompose}
          style={({ pressed }) => [s.feedEndCtaBtn, pressed && s.pressed]}
        >
          <Text style={s.feedEndCtaText}>✦ Share From Your Farm ✧</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

export function CommunityWidgetsFooter({
  farmers,
  articles,
  followedUsernames,
  onToggleFollow,
  onSelectSubpage,
  onOpenFarmerProfile,
  onStartChat,
}: {
  farmers: FarmerRecord[];
  articles: Article[];
  followedUsernames: string[];
  onToggleFollow: (username: string) => void;
  onSelectSubpage: (page: CommunitySubpage) => void;
  onOpenFarmerProfile: (farmer: FarmerRecord) => void;
  onStartChat: (farmer: FarmerRecord) => void;
}) {
  const s = useStyles();
  const router = useRouter();

  return (
    <View style={s.widgetsWrap} testID="community-widgets-footer">
      {/* 1. Agri Network Card */}
      <View style={s.widgetCard} testID="agri-network-card">
        <View style={s.widgetHeader}>
          <Text style={s.agriNetworkTitle}>Agri Network</Text>
          <Pressable
            testID="agri-network-see-all"
            onPress={() => onSelectSubpage("network")}
            style={s.seeAllBtn}
          >
            <Text style={s.seeAllText}>{`See All (${farmers.length})`}</Text>
            <Lucide name="user-plus" size={14} color="#1B4332" />
          </Pressable>
        </View>

        <View style={{ gap: 12 }}>
          {farmers.map((f) => {
            const cleanHandle = f.username.startsWith("@") ? f.username : `@${f.username}`;
            const isFollowing = followedUsernames.includes(cleanHandle);
            const initials = (f.name || "MF")
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase();

            return (
              <View key={f.id || cleanHandle} style={s.farmerRow}>
                <Pressable
                  onPress={() => onOpenFarmerProfile(f)}
                  style={s.farmerInfoBtn}
                >
                  <View style={s.farmerAvatarWrap}>
                    <Text style={s.farmerAvatarInitials}>{initials}</Text>
                    <View style={s.onlineDot} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.farmerName} numberOfLines={1}>
                      {f.name}
                    </Text>
                    <Text style={s.farmerCounty} numberOfLines={1}>
                      {`📍 ${f.county || "Kenya"}`}
                    </Text>
                  </View>
                </Pressable>

                {/* Paired buttons on the same row: Yellow Follow + Green Message */}
                <View style={s.farmerActionsRow}>
                  <Pressable
                    onPress={() => onToggleFollow(cleanHandle)}
                    style={({ pressed }) => [
                      s.followBtnYellow,
                      isFollowing && s.followingBtn,
                      pressed && s.pressed,
                    ]}
                  >
                    <Lucide
                      name={isFollowing ? "user-check" : "user-plus"}
                      size={12}
                      color={isFollowing ? "#FFFFFF" : "#0B2117"}
                    />
                    <Text style={[s.followBtnText, isFollowing && { color: "#FFFFFF" }]}>
                      {isFollowing ? "Following" : "Follow"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => onStartChat(f)}
                    style={({ pressed }) => [s.messageBtnGreen, pressed && s.pressed]}
                    accessibilityLabel={`Send message to ${f.name}`}
                  >
                    <Lucide name="message-square" size={13} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* 2. Latest Agri News Card */}
      <View style={s.widgetCard} testID="latest-agri-news-card">
        <Pressable
          onPress={() => router.push("/(tabs)/news")}
          style={s.widgetHeader}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <Lucide name="file-text" size={16} color="#0F766E" />
            <Text style={s.newsCardTitle}>Latest Agri News</Text>
          </View>
          <Text style={s.seeAllText}>See All →</Text>
        </Pressable>

        <View style={{ gap: 10 }}>
          {articles.length > 0 ? (
            articles.slice(0, 3).map((news) => (
              <Pressable
                key={news.id}
                onPress={() => router.push(`/article/${news.id}`)}
                style={s.newsItemRow}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={s.newsCategoryPill}>
                    <Text style={s.newsCategoryText}>{news.category}</Text>
                  </View>
                  <Text style={s.newsDateText}>{news.date || "Recent"}</Text>
                </View>
                <Text style={s.newsTitleText} numberOfLines={2}>
                  {news.title}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={s.emptyNewsText}>No news published yet.</Text>
          )}
        </View>

        <Pressable
          onPress={() => router.push("/(tabs)/news")}
          style={s.viewAllNewsLink}
        >
          <Text style={s.viewAllNewsText}>View All Mqulima News & Insights →</Text>
        </Pressable>
      </View>

      {/* 3. Mqulima AI Promo Card */}
      <View style={s.aiPromoCard} testID="mqulima-ai-card">
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={s.aiIconBox}>
            <Lucide name="sparkles" size={20} color="#FACC15" />
          </View>
          <View>
            <Text style={s.aiTitle}>Mqulima AI</Text>
            <Text style={s.aiSubtitle}>Instant farming advice</Text>
          </View>
        </View>
        <Text style={s.aiDescription}>
          Get personalized crop recommendations, pest identification, and market insights via WhatsApp.
        </Text>
        <Pressable
          testID="mqulima-ai-chat-now"
          onPress={() => onSelectSubpage("consult")}
          style={({ pressed }) => [s.aiChatNowBtn, pressed && s.pressed]}
        >
          <Text style={s.aiChatNowText}>Chat Now</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function SokoSubpageView({
  listings,
  marketPrices,
  user,
  onListingCreated,
}: {
  listings: SokoListingRecord[];
  marketPrices: MarketPriceRecord[];
  user: any;
  onListingCreated: () => void;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "crop" | "fruit" | "livestock">("all");
  const [modalOpen, setModalOpen] = useState(false);

  const [commodity, setCommodity] = useState("");
  const [type, setType] = useState<"crop" | "livestock" | "fruit">("crop");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState(user?.county || "Uasin Gishu");
  const [phone, setPhone] = useState(user?.phone || "");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePickSokoPhoto = async () => {
    if (uploadingPhoto) return;
    setUploadingPhoto(true);
    try {
      const picked = await pickAndUploadForumImages(1);
      if (picked.error) Alert.alert("Photo Notice", picked.error);
      if (picked.imageUrls.length > 0) setImages(picked.imageUrls);
    } catch (err: any) {
      Alert.alert("Upload Error", err?.message || "Could not upload commodity photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const filteredListings = listings.filter((item) => {
    const matchesSearch =
      !search.trim() ||
      item.commodity.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handlePublish = async () => {
    if (!user) {
      setModalOpen(false);
      router.push("/auth/sign-in");
      return;
    }
    if (!commodity.trim() || !price.trim() || !quantity.trim()) {
      Alert.alert("Missing Details", "Please provide commodity name, price (KES), and quantity.");
      return;
    }
    setSubmitting(true);
    try {
      await api.createSokoListing({
        commodityName: commodity.trim(),
        type,
        price: Number(price),
        quantity: quantity.trim(),
        location: location.trim() || "Kenya",
        description: description.trim() || "Verified farmer harvest listing.",
        images,
        phone: phone.trim(),
      });
      setSubmitting(false);
      setModalOpen(false);
      setCommodity("");
      setPrice("");
      setQuantity("");
      setDescription("");
      setImages([]);
      onListingCreated();
      Alert.alert("Published", "Your commodity listing is now live on Mqulima Soko!");
    } catch (err: any) {
      setSubmitting(false);
      Alert.alert("Error", err?.message || "Failed to publish listing.");
    }
  };

  return (
    <View style={s.subpageContainer} testID="soko-subpage">
      {/* Header */}
      <View style={s.subpageHeaderCard}>
        <View style={{ flex: 1 }}>
          <Text style={s.subpageTitle}>Mqulima Soko</Text>
          <Text style={s.subpageSubtitle}>
            Direct farmer-to-buyer commodity trade. Post harvests, livestock, and farm produce.
          </Text>
        </View>
        <Pressable
          testID="soko-list-commodity-btn"
          onPress={() => (user ? setModalOpen(true) : router.push("/auth/sign-in"))}
          style={({ pressed }) => [s.standaloneYellowBtn, pressed && s.pressed]}
        >
          <Lucide name="plus" size={16} color="#0B2117" />
          <Text style={s.standaloneYellowBtnText}>List Commodity</Text>
        </Pressable>
      </View>

      {/* Live Commodity Prices Index */}
      {marketPrices.length > 0 && (
        <View style={s.priceBillboard}>
          <View style={s.priceBillboardHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Lucide name="trending-up" size={14} color="#85CC14" />
              <Text style={s.priceBillboardTitle}>LIVE COMMODITY PRICES INDEX (KES REALTIME)</Text>
            </View>
            <Text style={s.priceBillboardBadge}>KAMIS Live Official Feed</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {marketPrices.map((m) => (
              <View key={m.id} style={s.priceTile}>
                <Text style={s.priceTileCommodity} numberOfLines={1}>
                  {m.commodity}
                </Text>
                <Text style={s.priceTileMarket} numberOfLines={1}>
                  {`${m.market} (${m.unit})`}
                </Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                  <Text style={s.priceTileValue}>{`KES ${Number(m.price).toLocaleString()}`}</Text>
                  <Text style={s.priceTileChange}>{m.change || "+1.8%"}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Search & Filter */}
      <View style={s.searchBox}>
        <Lucide name="search" size={17} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search commodity, breed, or county..."
          placeholderTextColor={colors.muted}
          style={s.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {(
          [
            { id: "all", label: "All Types" },
            { id: "crop", label: "Crops & Tubers" },
            { id: "fruit", label: "Fruits & Orchards" },
            { id: "livestock", label: "Livestock & Poultry" },
          ] as const
        ).map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setTypeFilter(tab.id)}
            style={[s.filterPill, typeFilter === tab.id && s.filterPillActive]}
          >
            <Text style={[s.filterPillText, typeFilter === tab.id && s.filterPillTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Listings */}
      {filteredListings.length === 0 ? (
        <View style={s.emptyBox}>
          <Lucide name="shopping-bag" size={32} color="#166534" />
          <Text style={s.emptyTitle}>No marketplace listings found</Text>
          <Text style={s.emptySub}>
            Be the first farmer to list fresh harvests, seeds, or livestock on Mqulima Soko.
          </Text>
          <Pressable
            onPress={() => (user ? setModalOpen(true) : router.push("/auth/sign-in"))}
            style={s.standaloneYellowBtn}
          >
            <Lucide name="plus" size={15} color="#0B2117" />
            <Text style={s.standaloneYellowBtnText}>List a Commodity</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {filteredListings.map((item) => (
            <View key={item.id} style={s.sokoCard}>
              {item.images?.[0] ? (
                <Image source={{ uri: item.images[0] }} style={s.sokoImage} />
              ) : null}
              <View style={{ padding: 14, gap: 6 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={s.sokoCommodity}>{item.commodity}</Text>
                  <Text style={s.sokoPrice}>{`KES ${Number(item.price).toLocaleString()}`}</Text>
                </View>
                <Text style={s.sokoMeta}>{`${item.quantity} • 📍 ${item.location}`}</Text>
                {item.description ? <Text style={s.sokoDesc}>{item.description}</Text> : null}
                <Text style={s.sokoSeller}>{`Seller: ${item.author.name} (${item.author.username})`}</Text>
                {item.phone ? (
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                    <Pressable
                      onPress={() => Linking.openURL(`tel:${item.phone}`)}
                      style={[s.pairedYellowBtn, { flex: 1 }]}
                    >
                      <Lucide name="phone" size={14} color="#0B2117" />
                      <Text style={s.pairedYellowBtnText}>Call Seller</Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        Linking.openURL(
                          `https://wa.me/${item.phone?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                            `Habari ${item.author.name}, I saw your ${item.commodity} listing on Mqulima Soko.`
                          )}`
                        )
                      }
                      style={[s.pairedGreenBtn, { flex: 1 }]}
                    >
                      <Lucide name="message-circle" size={14} color="#FFFFFF" />
                      <Text style={s.pairedGreenBtnText}>WhatsApp</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Create Soko Listing Modal */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={s.modalTitle}>List Farm Commodity on Soko</Text>
              <Pressable onPress={() => setModalOpen(false)}>
                <Lucide name="x" size={20} color="#374151" />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 10, paddingVertical: 8 }}>
              <Text style={s.inputLabel}>Commodity / Livestock Name *</Text>
              <TextInput
                value={commodity}
                onChangeText={setCommodity}
                placeholder="e.g., Fresh Harvest Irish Potatoes"
                style={s.modalInput}
              />
              <Text style={s.inputLabel}>Asking Price (KES) *</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="e.g., 3500"
                style={s.modalInput}
              />
              <Text style={s.inputLabel}>Quantity & Unit *</Text>
              <TextInput
                value={quantity}
                onChangeText={setQuantity}
                placeholder="e.g., 50 Bags (50kg)"
                style={s.modalInput}
              />
              <Text style={s.inputLabel}>County / Pickup Location *</Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="e.g., Eldoret, Uasin Gishu"
                style={s.modalInput}
              />
              <Text style={s.inputLabel}>Direct Phone / WhatsApp</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+2547..."
                style={s.modalInput}
              />
              <Text style={s.inputLabel}>Quality & Harvest Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="Describe grade, harvest date, and delivery availability..."
                style={[s.modalInput, { minHeight: 72, textAlignVertical: "top" }]}
              />
              <Text style={s.inputLabel}>Commodity Photo (optional)</Text>
              {images[0] ? (
                <View style={{ gap: 8 }}>
                  <Image
                    source={{ uri: api.resolveMediaUrl(images[0]) }}
                    style={{ width: "100%", height: 140, borderRadius: 0 }}
                    resizeMode="cover"
                  />
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable onPress={handlePickSokoPhoto} disabled={uploadingPhoto} style={[s.pairedYellowBtn, { flex: 1 }]}>
                      <Text style={s.pairedYellowBtnText}>
                        {uploadingPhoto ? "Uploading..." : "Change Photo"}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => setImages([])} style={[s.pairedGreenBtn, { flex: 1 }]}>
                      <Text style={s.pairedGreenBtnText}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={handlePickSokoPhoto}
                  disabled={uploadingPhoto}
                  style={[s.standaloneYellowBtn, { justifyContent: "center" }]}
                >
                  <Lucide name="image-plus" size={16} color="#0B2117" />
                  <Text style={s.standaloneYellowBtnText}>
                    {uploadingPhoto ? "Uploading Photo..." : "Upload Commodity Photo"}
                  </Text>
                </Pressable>
              )}
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <Pressable onPress={() => setModalOpen(false)} style={[s.pairedGreenBtn, { flex: 1 }]}>
                <Text style={s.pairedGreenBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handlePublish}
                disabled={submitting}
                style={[s.pairedYellowBtn, { flex: 1 }]}
              >
                <Text style={s.pairedYellowBtnText}>
                  {submitting ? "Publishing..." : "Publish to Soko"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function ConsultSubpageView({ user }: { user: any }) {
  const s = useStyles();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [county, setCounty] = useState(user?.county || "Uasin Gishu");
  const [specialty, setSpecialty] = useState("Crop & Soil Agronomy");
  const [channel, setChannel] = useState<"whatsapp" | "call" | "visit">("whatsapp");
  const [urgency, setUrgency] = useState<"normal" | "urgent" | "emergency">("normal");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState<any | null>(null);

  const handleSubmit = async () => {
    if (!phone.trim() || !message.trim()) {
      Alert.alert("Required Fields", "Please enter your phone number and describe your farm inquiry.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.submitForumConsultation({
        name: name.trim() || user?.name || "Farmer Client",
        phone: phone.trim(),
        email: user?.email || "",
        county: county.trim() || "Uasin Gishu",
        specialty,
        channel,
        urgency,
        message: message.trim(),
      });
      setSubmitting(false);
      setTicket(res.ticket);
    } catch (err: any) {
      setSubmitting(false);
      Alert.alert("Error", err?.message || "Failed to submit consultation.");
    }
  };

  return (
    <View style={s.subpageContainer} testID="consult-subpage">
      {/* Banner */}
      <View style={s.consultBanner}>
        <Text style={s.consultEyebrow}>CERTIFIED AGRONOMY & VETERINARY DESK</Text>
        <Text style={s.consultBannerTitle}>Mqulima Extension Consult Desk 🌾</Text>
        <Text style={s.consultBannerSub}>
          Submit your crop, soil, livestock, or irrigation inquiry below. Our certified extension team reviews every ticket directly and responds via phone call, WhatsApp, or on-farm visit.
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {[
            { label: "🌱 Crop Agronomy", val: "Crop & Soil Agronomy" },
            { label: "🐄 Vet Care", val: "Livestock & Veterinary Care" },
            { label: "🐛 Pest Emergency", val: "Pest & Disease Diagnosis" },
            { label: "💧 Irrigation & Water", val: "Irrigation & Borehole Engineering" },
          ].map((chip) => (
            <Pressable
              key={chip.val}
              onPress={() => setSpecialty(chip.val)}
              style={[s.consultChip, specialty === chip.val && s.consultChipActive]}
            >
              <Text style={[s.consultChipText, specialty === chip.val && { color: "#0B2117", fontFamily: fonts.b800 }]}>
                {chip.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {ticket ? (
        <View style={s.widgetCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Lucide name="shield-check" size={22} color="#166534" />
            <Text style={s.subpageTitle}>{`Ticket Registered: ${ticket.id}`}</Text>
          </View>
          <Text style={s.subpageSubtitle}>
            {`Assigned Desk: ${ticket.assignedConsultant} • Contact: ${ticket.phone}`}
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <Pressable
              onPress={() =>
                Linking.openURL(
                  `https://wa.me/254718646944?text=${encodeURIComponent(
                    `Habari Mqulima Consult Desk, following up on ticket ${ticket.id} (${ticket.specialty}): ${ticket.message}`
                  )}`
                )
              }
              style={[s.pairedYellowBtn, { flex: 1 }]}
            >
              <Lucide name="message-circle" size={15} color="#0B2117" />
              <Text style={s.pairedYellowBtnText}>Open WhatsApp Desk</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setTicket(null);
                setMessage("");
              }}
              style={[s.pairedGreenBtn, { flex: 1 }]}
            >
              <Text style={s.pairedGreenBtnText}>New Inquiry</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={s.widgetCard}>
          <Text style={s.subpageTitle}>Direct Consultation Intake Form</Text>
          <Text style={s.inputLabel}>Full Name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Kosgei Kiprono"
            style={s.modalInput}
          />
          <Text style={s.inputLabel}>Phone / WhatsApp Number *</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+254 7XX XXX XXX"
            style={s.modalInput}
          />
          <Text style={s.inputLabel}>County *</Text>
          <TextInput
            value={county}
            onChangeText={setCounty}
            placeholder="e.g., Uasin Gishu"
            style={s.modalInput}
          />
          <Text style={s.inputLabel}>Consultation Specialty</Text>
          <TextInput value={specialty} onChangeText={setSpecialty} style={s.modalInput} />

          <Text style={s.inputLabel}>Preferred Response Channel</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(
              [
                { id: "whatsapp", label: "WhatsApp" },
                { id: "call", label: "Voice Call" },
                { id: "visit", label: "Farm Visit" },
              ] as const
            ).map((ch) => (
              <Pressable
                key={ch.id}
                onPress={() => setChannel(ch.id)}
                style={[s.filterPill, channel === ch.id && s.filterPillActive, { flex: 1, alignItems: "center" }]}
              >
                <Text style={[s.filterPillText, channel === ch.id && s.filterPillTextActive]}>
                  {ch.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.inputLabel}>Describe Your Farm Issue or Question *</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            placeholder="Describe crop stage, symptoms observed, acreage, or livestock condition..."
            style={[s.modalInput, { minHeight: 88, textAlignVertical: "top" }]}
          />

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => [s.standaloneYellowBtn, { marginTop: 8, justifyContent: "center" }, pressed && s.pressed]}
          >
            <Lucide name="send" size={15} color="#0B2117" />
            <Text style={s.standaloneYellowBtnText}>
              {submitting ? "Registering Ticket..." : "Submit Consultation Request"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export function NetworkSubpageView({
  farmers,
  followedUsernames,
  onToggleFollow,
  onOpenFarmerProfile,
  onStartChat,
}: {
  farmers: FarmerRecord[];
  followedUsernames: string[];
  onToggleFollow: (username: string) => void;
  onOpenFarmerProfile: (farmer: FarmerRecord) => void;
  onStartChat: (farmer: FarmerRecord) => void;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const [focus, setFocus] = useState<"all" | "crops" | "livestock" | "mixed">("all");

  const filtered = farmers.filter((f) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      f.name.toLowerCase().includes(q) ||
      f.username.toLowerCase().includes(q) ||
      (f.county || "").toLowerCase().includes(q);
    if (!matchesSearch) return false;
    const nat = (f.natureOfAgriculture || "").toLowerCase();
    if (focus === "crops") return nat.includes("crop") || nat.includes("horticulture");
    if (focus === "livestock") return nat.includes("poultry") || nat.includes("livestock") || nat.includes("dairy");
    if (focus === "mixed") return nat.includes("mixed");
    return true;
  });

  return (
    <View style={s.subpageContainer} testID="network-subpage">
      <View style={s.consultBanner}>
        <Text style={s.consultEyebrow}>VERIFIED KENYAN GROWERS & PRODUCERS</Text>
        <Text style={s.consultBannerTitle}>Mqulima Farmers Directory</Text>
        <Text style={s.consultBannerSub}>
          {`Connect directly with ${farmers.length} verified farmers across Kenya. Follow growers in your county and message peers directly.`}
        </Text>
      </View>

      <View style={s.searchBox}>
        <Lucide name="search" size={17} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search farmer name, @username, or county..."
          placeholderTextColor={colors.muted}
          style={s.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {(
          [
            { id: "all", label: "All Farmers" },
            { id: "crops", label: "Crop Growers" },
            { id: "livestock", label: "Livestock & Dairy" },
            { id: "mixed", label: "Mixed Farming" },
          ] as const
        ).map((pill) => (
          <Pressable
            key={pill.id}
            onPress={() => setFocus(pill.id)}
            style={[s.filterPill, focus === pill.id && s.filterPillActive]}
          >
            <Text style={[s.filterPillText, focus === pill.id && s.filterPillTextActive]}>
              {pill.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ gap: 12 }}>
        {filtered.map((farmer) => {
          const cleanHandle = farmer.username.startsWith("@") ? farmer.username : `@${farmer.username}`;
          const isFollowing = followedUsernames.includes(cleanHandle);
          const initials = (farmer.name || "MF")
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase();

          return (
            <View key={cleanHandle} style={s.widgetCard}>
              <Pressable onPress={() => onOpenFarmerProfile(farmer)} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={[s.farmerAvatarWrap, { width: 48, height: 48, borderRadius: 24 }]}>
                  <Text style={[s.farmerAvatarInitials, { fontSize: 16 }]}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={[s.farmerName, { fontSize: 15 }]}>{farmer.name}</Text>
                    <Lucide name="shield-check" size={14} color="#166534" />
                  </View>
                  <Text style={s.farmerHandleText}>{cleanHandle}</Text>
                  <Text style={s.farmerCounty}>{`📍 ${farmer.county || "Kenya"} • ${farmer.natureOfAgriculture || "Farmer"}`}</Text>
                </View>
              </Pressable>

              {/* Paired buttons: Yellow Follow + Green Message */}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <Pressable
                  onPress={() => onToggleFollow(cleanHandle)}
                  style={[s.pairedYellowBtn, { flex: 1 }, isFollowing && s.followingBtn]}
                >
                  <Lucide
                    name={isFollowing ? "user-check" : "user-plus"}
                    size={14}
                    color={isFollowing ? "#FFFFFF" : "#0B2117"}
                  />
                  <Text style={[s.pairedYellowBtnText, isFollowing && { color: "#FFFFFF" }]}>
                    {isFollowing ? "Following" : "Follow"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => onStartChat(farmer)}
                  style={[s.pairedGreenBtn, { flex: 1 }]}
                >
                  <Lucide name="send" size={14} color="#FFFFFF" />
                  <Text style={s.pairedGreenBtnText}>Message</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function MessagesSubpageView({
  user,
  farmers,
  activePartner,
  onSelectPartner,
}: {
  user: any;
  farmers: FarmerRecord[];
  activePartner: FarmerRecord | null;
  onSelectPartner: (farmer: FarmerRecord) => void;
}) {
  const s = useStyles();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const selectedFarmer = activePartner || farmers[0] || null;

  useEffect(() => {
    if (!user || !selectedFarmer) return;
    let mounted = true;
    setLoading(true);
    api
      .getDirectMessages(selectedFarmer.username)
      .then((res) => {
        if (mounted) {
          setMessages(res.messages || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user, selectedFarmer?.username]);

  if (!user) {
    return (
      <View style={s.subpageContainer} testID="messages-subpage">
        <View style={s.emptyBox}>
          <Lucide name="send" size={28} color="#166534" />
          <Text style={s.emptyTitle}>Sign in to use Mqulima Konnekt Messages</Text>
          <Text style={s.emptySub}>
            Send and receive direct 1-on-1 messages with verified farmers across Kenya.
          </Text>
          <Pressable onPress={() => router.push("/auth/sign-in")} style={s.standaloneYellowBtn}>
            <Text style={s.standaloneYellowBtnText}>Sign In to Message</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const handleSend = async () => {
    if (!selectedFarmer || !text.trim()) return;
    setSending(true);
    try {
      const res = await api.sendDirectMessage(selectedFarmer.username, text.trim());
      setText("");
      setSending(false);
      if (res.message) {
        setMessages((prev) => [...prev, res.message]);
      }
    } catch (err: any) {
      setSending(false);
      Alert.alert("Message Notice", err?.message || "Could not send message.");
    }
  };

  return (
    <View style={s.subpageContainer} testID="messages-subpage">
      <View style={s.widgetCard}>
        <Text style={s.subpageTitle}>Mqulima Konnekt — Direct Messages</Text>
        <Text style={s.subpageSubtitle}>Select a verified farmer to chat directly:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 6 }}>
          {farmers.map((f) => {
            const active = selectedFarmer?.username === f.username;
            return (
              <Pressable
                key={f.username}
                onPress={() => onSelectPartner(f)}
                style={[s.filterPill, active && s.filterPillActive]}
              >
                <Text style={[s.filterPillText, active && s.filterPillTextActive]}>{f.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedFarmer && (
          <View style={s.chatThreadBox}>
            <View style={s.chatPartnerHeader}>
              <Text style={s.farmerName}>{selectedFarmer.name}</Text>
              <Text style={s.farmerCounty}>{`${selectedFarmer.username} • 📍 ${selectedFarmer.county}`}</Text>
            </View>

            {loading ? (
              <ActivityIndicator color="#166534" style={{ marginVertical: 20 }} />
            ) : messages.length === 0 ? (
              <Text style={s.emptyNewsText}>
                {`No direct messages with ${selectedFarmer.name} yet. Say Habari below!`}
              </Text>
            ) : (
              <View style={{ gap: 8, marginVertical: 8 }}>
                {messages.map((m) => (
                  <View
                    key={m.id}
                    style={[s.chatBubble, m.isMe ? s.chatBubbleMine : s.chatBubbleOther]}
                  >
                    <Text style={[s.chatBubbleText, m.isMe && { color: "#FFFFFF" }]}>{m.text}</Text>
                    <Text style={[s.chatBubbleTime, m.isMe && { color: "#D8F3DC" }]}>{m.timestamp}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={`Message ${selectedFarmer.name}...`}
                style={[s.modalInput, { flex: 1 }]}
              />
              <Pressable
                onPress={handleSend}
                disabled={sending}
                style={s.standaloneYellowBtn}
              >
                <Lucide name="send" size={15} color="#0B2117" />
                <Text style={s.standaloneYellowBtnText}>{sending ? "..." : "Send"}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

export function ProfileSubpageView({
  user,
  selectedFarmer,
  posts,
  onClearSelectedFarmer,
}: {
  user: any;
  selectedFarmer: FarmerRecord | null;
  posts: ApiThread[];
  onClearSelectedFarmer: () => void;
}) {
  const s = useStyles();
  const router = useRouter();

  const profile: FarmerRecord = selectedFarmer || {
    username: user
      ? `@mqulima_${(user.name || "farmer").toLowerCase().replace(/[^a-z0-9]/g, "")}`
      : "@mqulima_kosgeikiprono",
    name: user?.name || "Kosgei Kiprono",
    county: user?.county || "Elgeyo-Marakwet",
    natureOfAgriculture: "Crop Farming (Horticulture)",
    followersCount: 1,
    phone: user?.phone || "+254718646944",
    email: user?.email || "kosgenick@gmail.com",
  };

  const cleanHandle = profile.username.startsWith("@") ? profile.username : `@${profile.username}`;
  const farmerPosts = posts.filter(
    (p) =>
      p.handle?.toLowerCase() === cleanHandle.toLowerCase() ||
      p.author?.toLowerCase() === profile.name.toLowerCase()
  );

  return (
    <View style={s.subpageContainer} testID="profile-subpage">
      {selectedFarmer && (
        <Pressable onPress={onClearSelectedFarmer} style={s.seeAllBtn}>
          <Text style={s.seeAllText}>← Back to My Mqulima Profile</Text>
        </Pressable>
      )}

      <View style={s.profileHeaderCard}>
        <View style={s.profileBannerBg}>
          <View style={s.verifiedBadge}>
            <Lucide name="shield-check" size={13} color="#85CC14" />
            <Text style={s.verifiedBadgeText}>Verified Member</Text>
          </View>
        </View>

        <View style={{ padding: 16, gap: 8 }}>
          <Text style={s.profileName}>{profile.name}</Text>
          <Text style={s.farmerHandleText}>{`${cleanHandle} • 📍 ${profile.county}, Kenya`}</Text>

          {/* Stats Grid */}
          <View style={s.profileStatsRow}>
            <View style={s.profileStatBox}>
              <Text style={s.profileStatValue}>{farmerPosts.length}</Text>
              <Text style={s.profileStatLabel}>Published Posts</Text>
            </View>
            <View style={s.profileStatBox}>
              <Text style={s.profileStatValue}>{profile.followersCount ?? 1}</Text>
              <Text style={s.profileStatLabel}>Followers</Text>
            </View>
            <View style={s.profileStatBox}>
              <Text style={s.profileStatValue} numberOfLines={1}>
                {profile.natureOfAgriculture || "Horticulture"}
              </Text>
              <Text style={s.profileStatLabel}>Farming Focus</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={[s.subpageTitle, { paddingHorizontal: 4 }]}>
        {`Published Posts (${farmerPosts.length})`}
      </Text>

      {farmerPosts.length === 0 ? (
        <View style={s.emptyBox}>
          <Text style={s.emptyTitle}>No published posts yet</Text>
        </View>
      ) : (
        farmerPosts.map((post) => (
          <ThreadCard key={post.id} t={post} onPress={() => router.push(`/thread/${post.id}`)} />
        ))
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  navCard: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 5,
  },
  navSectionLabel: {
    fontFamily: fonts.b800,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#1D4ED8",
    paddingHorizontal: 4,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    width: "100%",
  },
  navItem: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  navItemActive: {
    borderBottomWidth: 3,
  },
  navItemText: {
    fontFamily: fonts.b600,
    fontSize: 11,
    color: "#374151",
    flexShrink: 1,
  },
  widgetsWrap: {
    paddingHorizontal: 16,
    gap: 16,
    marginTop: 8,
  },
  widgetCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  widgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  agriNetworkTitle: {
    fontFamily: fonts.h700,
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#1B4332",
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  seeAllText: {
    fontFamily: fonts.b700,
    fontSize: 12,
    color: "#1B4332",
  },
  farmerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  farmerInfoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  farmerAvatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1A5438",
    alignItems: "center",
    justifyContent: "center",
  },
  farmerAvatarInitials: {
    fontFamily: fonts.b800,
    fontSize: 13,
    color: "#FFFFFF",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  farmerName: {
    fontFamily: fonts.b700,
    fontSize: 13,
    color: "#1F2937",
  },
  farmerHandleText: {
    fontFamily: fonts.b500,
    fontSize: 11,
    color: "#6B7280",
  },
  farmerCounty: {
    fontFamily: fonts.b600,
    fontSize: 11,
    color: "#065F46",
  },
  farmerActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  followBtnYellow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 0,
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "#EAB308",
  },
  followingBtn: {
    backgroundColor: "#1B4332",
    borderColor: "#1B4332",
  },
  followBtnText: {
    fontFamily: fonts.b800,
    fontSize: 11,
    color: "#0B2117",
  },
  messageBtnGreen: {
    padding: 7,
    borderRadius: 0,
    backgroundColor: "#166534",
    alignItems: "center",
    justifyContent: "center",
  },
  newsCardTitle: {
    fontFamily: fonts.h700,
    fontSize: 15,
    color: "#134E4A",
  },
  newsItemRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 4,
  },
  newsCategoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#CCFBF1",
  },
  newsCategoryText: {
    fontFamily: fonts.b700,
    fontSize: 9,
    textTransform: "uppercase",
    color: "#115E59",
  },
  newsDateText: {
    fontFamily: fonts.b500,
    fontSize: 11,
    color: "#6B7280",
  },
  newsTitleText: {
    fontFamily: fonts.b600,
    fontSize: 13,
    lineHeight: 18,
    color: "#1F2937",
  },
  emptyNewsText: {
    fontFamily: fonts.b500,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    paddingVertical: 12,
  },
  viewAllNewsLink: {
    paddingTop: 6,
    alignItems: "center",
  },
  viewAllNewsText: {
    fontFamily: fonts.b700,
    fontSize: 12,
    color: "#0F766E",
  },
  aiPromoCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: "#1B4332",
    borderWidth: 1,
    borderColor: "#2D6A4F",
    gap: 12,
  },
  aiIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  aiTitle: {
    fontFamily: fonts.h700,
    fontSize: 16,
    color: "#FFFFFF",
  },
  aiSubtitle: {
    fontFamily: fonts.b500,
    fontSize: 11,
    color: "#A7F3D0",
  },
  aiDescription: {
    fontFamily: fonts.b400,
    fontSize: 12,
    lineHeight: 18,
    color: "#ECFDF5",
  },
  aiChatNowBtn: {
    paddingVertical: 11,
    borderRadius: 0,
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "#EAB308",
    alignItems: "center",
    justifyContent: "center",
  },
  aiChatNowText: {
    fontFamily: fonts.b800,
    fontSize: 13,
    color: "#0B2117",
  },
  subpageContainer: {
    paddingHorizontal: 16,
    gap: 14,
    marginTop: 8,
  },
  subpageHeaderCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  subpageTitle: {
    fontFamily: fonts.h700,
    fontSize: 17,
    color: "#1F2937",
  },
  subpageSubtitle: {
    fontFamily: fonts.b400,
    fontSize: 12,
    lineHeight: 17,
    color: "#6B7280",
    marginTop: 2,
  },
  standaloneYellowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 0,
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "#EAB308",
  },
  standaloneYellowBtnText: {
    fontFamily: fonts.b800,
    fontSize: 12,
    color: "#0B2117",
  },
  pairedYellowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 0,
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "#EAB308",
  },
  pairedYellowBtnText: {
    fontFamily: fonts.b800,
    fontSize: 12,
    color: "#0B2117",
  },
  pairedGreenBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 0,
    backgroundColor: "#166534",
  },
  pairedGreenBtnText: {
    fontFamily: fonts.b800,
    fontSize: 12,
    color: "#FFFFFF",
  },
  priceBillboard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#0B2117",
    gap: 10,
  },
  priceBillboardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceBillboardTitle: {
    fontFamily: fonts.b800,
    fontSize: 10,
    letterSpacing: 0.8,
    color: "#A7F3D0",
  },
  priceBillboardBadge: {
    fontFamily: fonts.b600,
    fontSize: 9,
    color: "#D1FAE5",
  },
  priceTile: {
    width: 148,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  priceTileCommodity: {
    fontFamily: fonts.b700,
    fontSize: 12,
    color: "#FFFFFF",
  },
  priceTileMarket: {
    fontFamily: fonts.b400,
    fontSize: 10,
    color: "#9CA3AF",
  },
  priceTileValue: {
    fontFamily: fonts.b800,
    fontSize: 12,
    color: "#FACC15",
  },
  priceTileChange: {
    fontFamily: fonts.b700,
    fontSize: 10,
    color: "#85CC14",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    height: 42,
    paddingHorizontal: 8,
    fontFamily: fonts.b400,
    fontSize: 12,
    color: c.onSurface,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterPillActive: {
    backgroundColor: "#1B4332",
    borderColor: "#1B4332",
  },
  filterPillText: {
    fontFamily: fonts.b600,
    fontSize: 11,
    color: "#374151",
  },
  filterPillTextActive: {
    color: "#FFFFFF",
    fontFamily: fonts.b700,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.h700,
    fontSize: 16,
    color: "#1F2937",
  },
  emptySub: {
    fontFamily: fonts.b400,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  sokoCard: {
    borderRadius: 18,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  sokoImage: {
    width: "100%",
    height: 170,
  },
  sokoCommodity: {
    fontFamily: fonts.h700,
    fontSize: 15,
    color: "#1F2937",
  },
  sokoPrice: {
    fontFamily: fonts.b800,
    fontSize: 14,
    color: "#166534",
  },
  sokoMeta: {
    fontFamily: fonts.b600,
    fontSize: 11,
    color: "#6B7280",
  },
  sokoDesc: {
    fontFamily: fonts.b400,
    fontSize: 12,
    color: "#374151",
  },
  sokoSeller: {
    fontFamily: fonts.b600,
    fontSize: 11,
    color: "#1B4332",
  },
  consultBanner: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#1B4332",
    gap: 6,
  },
  consultEyebrow: {
    fontFamily: fonts.b800,
    fontSize: 9,
    letterSpacing: 1.2,
    color: "#85CC14",
  },
  consultBannerTitle: {
    fontFamily: fonts.h700,
    fontSize: 20,
    color: "#FFFFFF",
  },
  consultBannerSub: {
    fontFamily: fonts.b400,
    fontSize: 12,
    lineHeight: 18,
    color: "#D1FAE5",
  },
  consultChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  consultChipActive: {
    backgroundColor: "#FACC15",
  },
  consultChipText: {
    fontFamily: fonts.b600,
    fontSize: 11,
    color: "#FFFFFF",
  },
  inputLabel: {
    fontFamily: fonts.b700,
    fontSize: 11,
    color: "#374151",
    marginTop: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: fonts.b400,
    fontSize: 12,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    gap: 8,
  },
  modalTitle: {
    fontFamily: fonts.h700,
    fontSize: 16,
    color: "#111827",
  },
  chatThreadBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chatPartnerHeader: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  chatBubble: {
    padding: 10,
    borderRadius: 12,
    maxWidth: "82%",
  },
  chatBubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: "#1B4332",
  },
  chatBubbleOther: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chatBubbleText: {
    fontFamily: fonts.b400,
    fontSize: 12,
    color: "#1F2937",
  },
  chatBubbleTime: {
    fontFamily: fonts.b400,
    fontSize: 9,
    color: "#6B7280",
    marginTop: 2,
  },
  profileHeaderCard: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  profileBannerBg: {
    height: 76,
    backgroundColor: "#1B4332",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: 10,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  verifiedBadgeText: {
    fontFamily: fonts.b700,
    fontSize: 10,
    color: "#FFFFFF",
  },
  profileName: {
    fontFamily: fonts.h700,
    fontSize: 20,
    color: "#111827",
  },
  profileStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  profileStatBox: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  profileStatValue: {
    fontFamily: fonts.b800,
    fontSize: 14,
    color: "#1B4332",
  },
  profileStatLabel: {
    fontFamily: fonts.b500,
    fontSize: 10,
    color: "#6B7280",
  },
  feedEndCard: {
    marginHorizontal: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: "#F0FDF4",
    borderWidth: 1.5,
    borderColor: "#BBF7D0",
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
    boxShadow: "0px 4px 14px rgba(22, 101, 52, 0.08)",
    elevation: 2,
  },
  feedEndShimmer: {
    position: "absolute",
    top: -40,
    left: 0,
    width: 72,
    height: 260,
    backgroundColor: "rgba(250, 204, 21, 0.14)",
  },
  feedEndRibbonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  feedEndRibbonGlyph: {
    fontFamily: fonts.b700,
    fontSize: 11,
    letterSpacing: 1.2,
    color: "#15803D",
  },
  feedEndStarGold: {
    fontSize: 14,
    color: "#D97706",
    fontWeight: "900",
  },
  feedEndStarEmerald: {
    fontSize: 14,
    color: "#15803D",
    fontWeight: "900",
  },
  feedEndMedalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginVertical: 2,
  },
  feedEndSideChar: {
    fontSize: 15,
  },
  feedEndMedalWrap: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  feedEndHalo: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#85CC14",
    backgroundColor: "rgba(133, 204, 20, 0.2)",
  },
  feedEndMedal: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#DCFCE7",
    borderWidth: 1.5,
    borderColor: "#86EFAC",
    alignItems: "center",
    justifyContent: "center",
  },
  feedEndTextBlock: {
    textAlign: "center",
    lineHeight: 22,
  },
  feedEndFlourish: {
    fontFamily: fonts.b800,
    fontSize: 14,
    color: "#D97706",
  },
  feedEndHeadline: {
    fontFamily: fonts.wordmark,
    fontStyle: "italic",
    fontSize: 16,
    color: "#14532D",
  },
  feedEndSubline: {
    fontFamily: fonts.h700,
    fontSize: 12,
    color: "#1B4332",
    letterSpacing: 0.3,
  },
  feedEndCtaBtn: {
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 0,
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "#EAB308",
    alignItems: "center",
    justifyContent: "center",
  },
  feedEndCtaText: {
    fontFamily: fonts.b800,
    fontSize: 12,
    color: "#0B2117",
    letterSpacing: 0.4,
  },
  pressed: {
    opacity: 0.85,
  },
}));

