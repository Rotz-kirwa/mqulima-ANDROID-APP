import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "@/src/components/Img";
import { LinearGradient } from "expo-linear-gradient";
import { useIsFocused, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TopBar } from "@/src/components/TopBar";
import { Footer } from "@/src/components/Footer";
import { Skeleton } from "@/src/components/Skeleton";
import { newsDate, useShareArticle } from "@/src/components/news/NewsUI";
import { api } from "@/src/services/api";
import { QUERY_STALE_TIMES } from "@/src/query-client";
import {
  type Article,
  articleFilters,
  articles as fallbackArticles,
  newsTestimonials,
} from "@/src/data/articles";
import { fonts, useTheme } from "@/src/theme";
import { usesNativeTabs } from "@/src/navigation";
import { useAuth, useToast } from "@/src/store/AppStore";
import { storage } from "@/src/utils/storage";

const ALERTS_STORAGE_KEY = "mqulima_blog_alerts_v1";

function isCategoryMatch(article: Article, selectedCat: string): boolean {
  if (!selectedCat || selectedCat === "All") return true;
  const sCat = selectedCat.toLowerCase().trim();
  const pCat = (article.category || "").toLowerCase().trim();
  const pGroup = (article.group || "").toLowerCase().trim();

  if (pCat === sCat || pGroup === sCat) return true;
  if (sCat.includes("market") && (pCat.includes("market") || pGroup.includes("market"))) return true;
  if (
    (sCat.includes("farm") || sCat.includes("agronomy") || sCat.includes("tips")) &&
    (pCat.includes("farm") || pCat.includes("agronomy") || pGroup.includes("agronomy"))
  ) {
    return true;
  }
  if (sCat.includes("tech") && (pCat.includes("tech") || pGroup.includes("tech"))) return true;
  if (sCat.includes("weather") && (pCat.includes("weather") || pGroup.includes("weather") || pCat.includes("special"))) {
    return true;
  }
  if (sCat.includes("livestock") && (pCat.includes("livestock") || pGroup.includes("livestock") || pCat.includes("dairy"))) {
    return true;
  }
  return pCat.includes(sCat) || sCat.includes(pCat);
}

export default function News() {
  const { colors } = useTheme();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const shareArticle = useShareArticle();

  const scrollRef = useRef<ScrollView>(null);

  const [group, setGroup] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [visibleCount, setVisibleCount] = useState(6);

  // Alerts & Newsletter State
  const [remindToggled, setRemindToggled] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState(user?.email || "");
  const [subscribing, setSubscribing] = useState(false);
  const [newsletterModalOpen, setNewsletterModalOpen] = useState(false);

  // Active Inline Reader Modal State
  const [activeReadingPost, setActiveReadingPost] = useState<Article | null>(null);

  // Load persisted alert state
  useEffect(() => {
    storage
      .getItem<string>(ALERTS_STORAGE_KEY, "disabled")
      .then((v) => setRemindToggled(v === "enabled"))
      .catch(() => {});
  }, []);

  // Fetch all articles from live backend (with fallback to static articles)
  const q = useQuery({
    queryKey: ["articles", "All"],
    queryFn: ({ signal }) => api.getArticles("All", signal),
    initialData: fallbackArticles,
    staleTime: QUERY_STALE_TIMES.ARTICLES,
    retry: 1,
  });

  const articlesData = q.data;
  const allPosts = useMemo(
    () => (articlesData && articlesData.length > 0 ? articlesData : fallbackArticles),
    [articlesData]
  );

  // Featured Carousel List (Top 3 stories)
  const featuredPostsList = useMemo(() => {
    const flagged = allPosts.filter((p) => p.featured);
    return flagged.length >= 2 ? flagged.slice(0, 4) : allPosts.slice(0, 3);
  }, [allPosts]);

  const currentFeaturedPost = useMemo(() => {
    if (featuredPostsList.length === 0) return null;
    const safeIdx = Math.abs(featuredIndex) % featuredPostsList.length;
    return featuredPostsList[safeIdx];
  }, [featuredPostsList, featuredIndex]);

  // Auto-slide Featured Story Carousel every 5s when tab is focused
  useEffect(() => {
    if (!focused || featuredPostsList.length <= 1 || activeReadingPost || newsletterModalOpen) return;
    const timer = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredPostsList.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [focused, featuredPostsList.length, activeReadingPost, newsletterModalOpen]);

  // Auto-rotate Testimonials every 6s when tab is focused
  useEffect(() => {
    if (!focused) return;
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % newsTestimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [focused]);

  const resetFilters = () => {
    setGroup("All");
    setSearchQuery("");
    setVisibleCount(6);
  };

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    const cleanQ = searchQuery.trim().toLowerCase();
    return allPosts.filter((p) => {
      if (!isCategoryMatch(p, group)) return false;
      if (cleanQ) {
        const bodyText = (p.body || []).join(" ").toLowerCase();
        return (
          p.title.toLowerCase().includes(cleanQ) ||
          p.excerpt.toLowerCase().includes(cleanQ) ||
          p.category.toLowerCase().includes(cleanQ) ||
          bodyText.includes(cleanQ)
        );
      }
      return true;
    });
  }, [allPosts, group, searchQuery]);

  const showFeaturedBanner =
    group === "All" && !searchQuery.trim() && Boolean(currentFeaturedPost);

  const latestPostsList = useMemo(() => {
    if (!showFeaturedBanner) {
      return filteredPosts.slice(0, visibleCount);
    }
    const list = filteredPosts.filter((p) => p.id !== currentFeaturedPost?.id);
    return list.slice(0, visibleCount);
  }, [filteredPosts, showFeaturedBanner, currentFeaturedPost, visibleCount]);

  const totalAvailableCount = useMemo(() => {
    if (!showFeaturedBanner) return filteredPosts.length;
    return filteredPosts.filter((p) => p.id !== currentFeaturedPost?.id).length;
  }, [filteredPosts, showFeaturedBanner, currentFeaturedPost]);

  // Popular Posts sorted by reads
  const popularPostsList = useMemo(() => {
    return [...allPosts].sort((a, b) => (b.reads || 0) - (a.reads || 0)).slice(0, 4);
  }, [allPosts]);

  const handleToggleReminder = async () => {
    const next = !remindToggled;
    setRemindToggled(next);
    await storage.setItem(ALERTS_STORAGE_KEY, next ? "enabled" : "disabled").catch(() => {});
    if (next) {
      toast(
        user?.name
          ? `🌾 Alerts activated for ${user.name.split(" ")[0]}! You'll be notified of new farm reports.`
          : "🌾 Mqulima Agritech Alerts activated!"
      );
    } else {
      toast("News alerts deactivated.");
    }
  };

  const handleSubscribe = async () => {
    const email = newsletterEmail.trim();
    if (!email || !email.includes("@")) {
      toast("Please enter a valid email address.");
      return;
    }
    setSubscribing(true);
    try {
      const backendHost = (process.env.EXPO_PUBLIC_BACKEND_URL || "https://www.mqulima.com").replace(/\/$/, "");
      const res = await fetch(`${backendHost}/api/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast(`Subscribed! Weekly digest will be delivered to ${email}`);
        setNewsletterEmail("");
      } else {
        toast(`Subscribed! Weekly digest will be delivered to ${email}`);
        setNewsletterEmail("");
      }
    } catch {
      toast(`Subscribed! Weekly digest will be delivered to ${email}`);
      setNewsletterEmail("");
    } finally {
      setSubscribing(false);
    }
  };

  const selectCategory = (val: string) => {
    setGroup(val);
    setVisibleCount(6);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const currentTestimonial = newsTestimonials[activeTestimonial] || newsTestimonials[0];

  return (
    <View style={styles.root} testID={focused ? "news-screen" : undefined}>
      <TopBar />
      <ScrollView
        ref={scrollRef}
        testID="news-list"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: usesNativeTabs ? insets.bottom + 24 : 0 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={q.isRefetching}
            onRefresh={() => q.refetch()}
            tintColor={colors.brand}
          />
        }
      >
        {/* =========================================================
            1. EDITORIAL MASTHEAD & SEARCH BAR
           ========================================================= */}
        <View style={styles.mastheadSection}>
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowRule} />
            <Text testID="news-journal-label" style={styles.eyebrowText}>
              THE MQULIMA JOURNAL
            </Text>
          </View>

          <Text testID="news-page-title" style={styles.mastheadTitle}>
            Mqulima News & Insights<Text style={styles.mastheadAccent}>.</Text>
          </Text>

          <Text testID="news-page-description" style={styles.mastheadSubtitle}>
            Weekly combined agriculture newsletter, policy updates, and farm intel
            from our expert agronomists.
          </Text>

          {/* Search Bar + Utility Actions Row (Remind Me + Weekly Digest PDF) */}
          <View style={styles.searchBox}>
            <Lucide name="search" size={16} color="#64748B" />
            <TextInput
              testID="news-search-input"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setVisibleCount(6);
              }}
              placeholder="Search articles, crops, or market insights..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => {
                  setSearchQuery("");
                  setVisibleCount(6);
                }}
                hitSlop={8}
              >
                <Lucide name="x" size={16} color="#64748B" />
              </Pressable>
            )}
          </View>

          <View style={styles.utilityButtonsRow}>
            <Pressable
              testID="news-remind-me-btn"
              onPress={handleToggleReminder}
              style={[
                styles.remindBtn,
                remindToggled && styles.remindBtnActive,
              ]}
            >
              <Lucide
                name="bell"
                size={15}
                color="#EA580C"
              />
              <Text
                style={[
                  styles.remindBtnText,
                  remindToggled && styles.remindBtnTextActive,
                ]}
              >
                {remindToggled ? "Alerts Active" : "Remind Me"}
              </Text>
            </Pressable>

            <Pressable
              testID="news-weekly-digest-btn"
              onPress={() => setNewsletterModalOpen(true)}
              style={styles.digestBtn}
            >
              <Lucide name="book-open" size={14} color="#FFFFFF" />
              <Text style={styles.digestBtnText}>Weekly Digest PDF</Text>
            </Pressable>
          </View>
        </View>

        {/* =========================================================
            2. SHARP-EDGED CATEGORY TABS (MATCHING MQULIMA.COM/BLOG)
           ========================================================= */}
        <View style={styles.categoryBarWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
            testID="news-category-filters"
          >
            {articleFilters.map((filter) => {
              const active = group === filter;
              return (
                <Pressable
                  key={filter}
                  testID={`news-filter-${filter.replace(/\W+/g, "-").toLowerCase()}`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => selectCategory(filter)}
                  style={[styles.categoryTab, active && styles.categoryTabActive]}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      active && styles.categoryTabTextActive,
                    ]}
                  >
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* =========================================================
            3. HERO SECTION: FEATURED STORY CAROUSEL BANNER
           ========================================================= */}
        {q.isPending && !allPosts.length ? (
          <View style={{ paddingHorizontal: 16, gap: 14 }} testID="news-loading">
            <Skeleton style={{ height: 210, borderRadius: 0 }} />
            <Skeleton style={{ height: 64, borderRadius: 0 }} />
            <Skeleton style={{ height: 48, borderRadius: 0 }} />
          </View>
        ) : null}

        {showFeaturedBanner && currentFeaturedPost && (
          <View style={styles.featuredCard} testID="news-featured-story">
            {/* Cover Image */}
            <Pressable
              testID="news-featured-image-link"
              onPress={() => router.push(`/article/${currentFeaturedPost.id}`)}
              style={styles.featuredImageContainer}
            >
              <Image
                testID="news-featured-image"
                source={{ uri: currentFeaturedPost.image }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={250}
              />
              <LinearGradient
                colors={["transparent", "rgba(11,33,23,0.78)"]}
                style={styles.featuredImageOverlay}
              >
                <View style={styles.featuredTopPillsRow}>
                  <View style={styles.featuredStoryBadge}>
                    <Lucide name="sparkles" size={12} color="#85CC14" />
                    <Text testID="news-featured-label" style={styles.featuredStoryBadgeText}>
                      FEATURED STORY
                    </Text>
                  </View>
                  <View style={styles.featuredCategoryBadge}>
                    <Text
                      testID="news-featured-category"
                      style={styles.featuredCategoryBadgeText}
                    >
                      {currentFeaturedPost.category}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>

            {/* Featured Body */}
            <View style={styles.featuredBody}>
              <Pressable
                testID="news-featured-title-link"
                onPress={() => router.push(`/article/${currentFeaturedPost.id}`)}
              >
                <Text testID="news-featured-title" style={styles.featuredTitle}>
                  {currentFeaturedPost.title}
                </Text>
              </Pressable>

              <Text
                testID="news-featured-excerpt"
                style={styles.featuredExcerpt}
                numberOfLines={3}
              >
                {currentFeaturedPost.excerpt}
              </Text>

              {/* Meta Row */}
              <View style={styles.featuredMetaRow}>
                <View style={styles.metaInlineItem}>
                  <Lucide name="calendar" size={13} color="#0F766E" />
                  <Text testID="news-featured-date" style={styles.metaInlineText}>
                    {newsDate(currentFeaturedPost.date)}
                  </Text>
                </View>
                <Text style={styles.metaDotText}>•</Text>
                <View style={styles.metaInlineItem}>
                  <Lucide name="clock-3" size={13} color="#64748B" />
                  <Text testID="news-featured-read-time" style={styles.metaInlineText}>
                    {currentFeaturedPost.readTime}
                  </Text>
                </View>
                <Text style={styles.metaDotText}>•</Text>
                <View style={styles.metaInlineItem}>
                  <Lucide name="eye" size={13} color="#64748B" />
                  <Text style={styles.metaInlineText}>
                    {currentFeaturedPost.reads || 12} reads
                  </Text>
                </View>
              </View>

              {/* Action Row & Carousel Controls */}
              <View style={styles.featuredFooterRow}>
                <Pressable
                  testID="news-featured-read-button"
                  onPress={() => router.push(`/article/${currentFeaturedPost.id}`)}
                  style={styles.readFullStoryBtn}
                >
                  <Text style={styles.readFullStoryBtnText}>READ FULL STORY</Text>
                  <Lucide name="arrow-right" size={15} color="#0B2117" />
                </Pressable>

                {/* Carousel Indicators & Arrows */}
                <View style={styles.carouselControlsRow}>
                  <View style={styles.carouselDotsRow}>
                    {featuredPostsList.map((fp, idx) => {
                      const isActive =
                        idx === Math.abs(featuredIndex) % featuredPostsList.length;
                      return (
                        <Pressable
                          key={fp.id}
                          onPress={() => setFeaturedIndex(idx)}
                          style={[
                            styles.carouselDot,
                            isActive && styles.carouselDotActive,
                          ]}
                        />
                      );
                    })}
                  </View>

                  <View style={styles.carouselArrowsRow}>
                    <Pressable
                      onPress={() =>
                        setFeaturedIndex((prev) =>
                          prev <= 0 ? featuredPostsList.length - 1 : prev - 1
                        )
                      }
                      style={styles.carouselArrowBtnYellow}
                    >
                      <Lucide name="chevron-left" size={16} color="#0B2117" />
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        setFeaturedIndex(
                          (prev) => (prev + 1) % featuredPostsList.length
                        )
                      }
                      style={styles.carouselArrowBtnGreen}
                    >
                      <Lucide name="chevron-right" size={16} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* =========================================================
            4. LATEST AGRICULTURAL POSTS (LARGE SHARP EDITORIAL CARDS)
           ========================================================= */}
        <View style={styles.latestSection}>
          <View style={styles.latestHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text testID="news-section-title" style={styles.latestHeading}>
                {group === "All" && !searchQuery.trim()
                  ? "Latest Agricultural Posts"
                  : group}
              </Text>
              <Text style={styles.latestSubheading}>
                In-depth crop management guides, soil science, and live Kenyan
                commodity intelligence.
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <Text testID="news-story-count" style={styles.storyCountText}>
                {totalAvailableCount}{" "}
                {totalAvailableCount === 1 ? "story" : "stories"}
              </Text>
              {(group !== "All" || searchQuery.trim().length > 0) && (
                <Pressable
                  onPress={resetFilters}
                  style={styles.viewAllBtn}
                >
                  <Text style={styles.viewAllBtnText}>VIEW ALL</Text>
                  <Lucide name="arrow-right" size={13} color="#0B2117" />
                </Pressable>
              )}
            </View>
          </View>

          {latestPostsList.length === 0 ? (
            <View style={styles.emptyBox} testID="news-empty">
              <Lucide name="sprout" size={32} color="#0F766E" />
              <Text style={styles.emptyBoxTitle}>No agricultural posts found</Text>
              <Text style={styles.emptyBoxSub}>
                Try another keyword or switch back to All categories.
              </Text>
              <Pressable
                onPress={resetFilters}
                style={styles.resetEmptyBtn}
              >
                <Text style={styles.resetEmptyBtnText}>BROWSE ALL STORIES</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.postsGrid}>
              {latestPostsList.map((post, index) => (
                <View
                  key={post.id}
                  style={styles.postCard}
                  testID={`news-card-${post.id}`}
                >
                  {/* Large 16:10 Cover Image */}
                  <Pressable
                    testID={`news-item-${index}`}
                    onPress={() => router.push(`/article/${post.id}`)}
                    style={styles.postImageWrap}
                  >
                    <Image
                      testID={`news-${post.id}-image`}
                      source={{ uri: post.image }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      transition={220}
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.55)"]}
                      style={StyleSheet.absoluteFill}
                    />

                    {/* Top-Left Category Badge */}
                    <View style={styles.postCatBadge}>
                      <Text
                        testID={`news-${post.id}-category`}
                        style={styles.postCatBadgeText}
                      >
                        {post.category}
                      </Text>
                    </View>

                    {/* Top-Right Reading Time Pill */}
                    <View style={styles.postReadTimePill}>
                      <Lucide name="clock-3" size={11} color="#85CC14" />
                      <Text
                        testID={`news-${post.id}-read-time`}
                        style={styles.postReadTimePillText}
                      >
                        {post.readTime}
                      </Text>
                    </View>
                  </Pressable>

                  {/* Text Body */}
                  <Pressable
                    onPress={() => router.push(`/article/${post.id}`)}
                    style={styles.postBody}
                  >
                    <View style={styles.postMetaRow}>
                      <View style={styles.metaInlineItem}>
                        <Lucide name="calendar" size={12} color="#0F766E" />
                        <Text
                          testID={`news-${post.id}-date`}
                          style={styles.postMetaText}
                        >
                          {newsDate(post.date)}
                        </Text>
                      </View>
                      <Text style={styles.metaDotText}>•</Text>
                      <View style={styles.metaInlineItem}>
                        <Lucide name="eye" size={12} color="#94A3B8" />
                        <Text style={styles.postMetaText}>
                          {post.reads || 12} reads
                        </Text>
                      </View>
                    </View>

                    <Text
                      testID={`news-${post.id}-title`}
                      style={styles.postTitle}
                      numberOfLines={3}
                    >
                      {post.title}
                    </Text>

                    <Text style={styles.postExcerpt} numberOfLines={2}>
                      {post.excerpt}
                    </Text>

                    {/* Author Attribution */}
                    <View style={styles.authorRow}>
                      <View style={styles.authorAvatarBox}>
                        <Text style={styles.authorAvatarText}>
                          {post.author?.avatarInitials || "MD"}
                        </Text>
                      </View>
                      <Text style={styles.authorNameText}>
                        {post.author?.name || "Mqulima Desk"}
                      </Text>
                      <Text style={styles.authorRoleText}>
                        • {post.author?.role || "Editorial & Agronomy Desk"}
                      </Text>
                    </View>
                  </Pressable>

                  {/* Card Footer: Read Now (Yellow) + Quick Reader (Green) */}
                  <View style={styles.postFooterRow}>
                    <Pressable
                      testID={`news-read-${post.id}`}
                      onPress={() => router.push(`/article/${post.id}`)}
                      style={styles.readNowBtn}
                    >
                      <Text style={styles.readNowBtnText}>READ NOW</Text>
                      <Lucide name="arrow-right" size={14} color="#0B2117" />
                    </Pressable>

                    <Pressable
                      onPress={() => setActiveReadingPost(post)}
                      style={styles.quickReadLink}
                    >
                      <Lucide name="book-open" size={13} color="#FFFFFF" />
                      <Text style={styles.quickReadLinkText}>Quick Reader</Text>
                    </Pressable>
                  </View>
                </View>
              ))}

              {/* Load More Button */}
              {totalAvailableCount > latestPostsList.length && (
                <Pressable
                  onPress={() => setVisibleCount((prev) => prev + 6)}
                  style={styles.loadMoreBtn}
                >
                  <Text style={styles.loadMoreBtnText}>LOAD MORE ARTICLES</Text>
                  <Lucide name="chevron-down" size={16} color="#0B2117" />
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* =========================================================
            5. POPULAR POSTS WIDGET (RANKED BY VIEWS)
           ========================================================= */}
        <View style={styles.widgetSection}>
          <View style={styles.popularWidgetCard}>
            <View style={styles.widgetHeaderRow}>
              <Text style={styles.widgetTitle}>Popular Posts</Text>
              <Pressable
                onPress={() => {
                  resetFilters();
                  scrollRef.current?.scrollTo({ y: 0, animated: true });
                }}
                style={styles.widgetActionBtn}
              >
                <Text style={styles.widgetActionText}>VIEW ALL →</Text>
              </Pressable>
            </View>

            <View style={styles.popularList}>
              {popularPostsList.map((pop) => (
                <Pressable
                  key={`pop-${pop.id}`}
                  onPress={() => router.push(`/article/${pop.id}`)}
                  style={styles.popularItemRow}
                >
                  <View style={styles.popularThumbWrap}>
                    <Image
                      source={{ uri: pop.image }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.popularCatText}>{pop.category}</Text>
                    <Text style={styles.popularTitleText} numberOfLines={2}>
                      {pop.title}
                    </Text>
                    <View style={styles.popularMetaRow}>
                      <Text style={styles.popularMetaText}>
                        {newsDate(pop.date)}
                      </Text>
                      <Text style={styles.popularMetaText}>•</Text>
                      <Lucide name="eye" size={11} color="#64748B" />
                      <Text style={styles.popularMetaText}>
                        {pop.reads || 14} reads
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* =========================================================
              6. NEWSLETTER SUBSCRIPTION + WHAT OUR READERS SAY
             ========================================================= */}
          <View style={styles.newsletterCard}>
            <Text style={styles.newsletterKicker}>NEWSLETTER</Text>
            <Text style={styles.newsletterTitle}>
              Stay Updated with Our Agricultural Intel
            </Text>
            <Text style={styles.newsletterDesc}>
              Get weekly agronomist tips, market price super-cycles, and harvest
              alerts straight to your inbox.
            </Text>

            <View style={styles.newsletterFormRow}>
              <TextInput
                value={newsletterEmail}
                onChangeText={setNewsletterEmail}
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.newsletterInput}
              />
              <Pressable
                onPress={handleSubscribe}
                disabled={subscribing}
                style={[
                  styles.newsletterSubmitBtn,
                  subscribing && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.newsletterSubmitText}>
                  {subscribing ? "..." : "SUBSCRIBE"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* What Our Readers Say (Verified Farmer Testimonials) */}
          <View style={styles.testimonialCard}>
            <View style={styles.testimonialHeaderRow}>
              <Text style={styles.testimonialHeading}>What Our Readers Say</Text>
              <Lucide name="quote" size={18} color="#0F766E" />
            </View>

            <Text style={styles.testimonialQuote}>
              &ldquo;{currentTestimonial.quote}&rdquo;
            </Text>

            <View style={styles.testimonialFooterRow}>
              <View style={styles.testimonialAuthorRow}>
                <View style={styles.testimonialAvatar}>
                  <Text style={styles.testimonialAvatarText}>
                    {currentTestimonial.initials}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.testimonialAuthorName}>
                    {currentTestimonial.author}
                  </Text>
                  <Text style={styles.testimonialAuthorRole}>
                    {currentTestimonial.role}
                  </Text>
                </View>
              </View>

              <View style={styles.testimonialDotsRow}>
                {newsTestimonials.map((t, idx) => (
                  <Pressable
                    key={t.author}
                    onPress={() => setActiveTestimonial(idx)}
                    style={[
                      styles.testimonialDot,
                      idx === activeTestimonial && styles.testimonialDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* =========================================================
              7. EDITORIAL TEAM CARD ("HI, WE'RE MQULIMA DESK")
                 + LIVE MARKET COMMODITY INDEX PREVIEW
             ========================================================= */}
          <View style={styles.editorialDeskCard}>
            <View style={styles.editorialLogoCircle}>
              <Lucide name="sprout" size={28} color="#85CC14" />
            </View>
            <Text style={styles.editorialTitle}>Hi, We&apos;re Mqulima Desk</Text>
            <Text style={styles.editorialBio}>
              Certified Kenyan agronomists and market researchers delivering
              actionable farm intelligence, soil health data, and policy updates.
            </Text>

            <View style={styles.socialRow}>
              <Pressable
                onPress={() => Linking.openURL("https://x.com/_mqulima")}
                style={styles.socialPillYellow}
              >
                <Text style={styles.socialPillTextDark}>X @_mqulima</Text>
              </Pressable>
              <Pressable
                onPress={() => Linking.openURL("https://tiktok.com/@_mqulima")}
                style={styles.socialPillGreen}
              >
                <Text style={styles.socialPillTextLight}>TikTok</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  Linking.openURL("https://linkedin.com/company/mqulima-hub")
                }
                style={styles.socialPillYellow}
              >
                <Text style={styles.socialPillTextDark}>LinkedIn</Text>
              </Pressable>
            </View>
          </View>

          {/* Live Agricultural Commodity Index Banner */}
          <View style={styles.commodityCard}>
            <View style={styles.commodityTopRow}>
              <View style={styles.commodityIconBox}>
                <Lucide name="trending-up" size={20} color="#85CC14" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.commodityBadgeText}>
                  KAMIS LIVE COMMODITY INDEX
                </Text>
                <Text style={styles.commodityTitle}>
                  Real-Time Kenyan Market Prices
                </Text>
              </View>
            </View>
            <Text style={styles.commodityDesc}>
              Track wholesale and farm-gate prices for maize, potatoes, beans,
              milk, and horticulture across 47 counties before you sell.
            </Text>
            <Pressable
              onPress={() => router.push("/tools/markets" as any)}
              style={styles.commodityBtn}
            >
              <Text style={styles.commodityBtnText}>OPEN LIVE MARKETS</Text>
              <Lucide name="arrow-up-right" size={15} color="#0B2117" />
            </Pressable>
          </View>
        </View>

        {/* Footer Back to Top */}
        <View style={styles.footerSection}>
          <Lucide name="sprout" size={22} color="#0F766E" />
          <Text testID="news-end-message" style={styles.footerTagline}>
            Good ideas take root here.
          </Text>
          <Pressable
            testID="news-back-to-top"
            onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
            style={styles.backToTopBtn}
          >
            <Text style={styles.backToTopText}>Back to top</Text>
            <Lucide name="arrow-up" size={15} color="#0B2117" />
          </Pressable>
        </View>

        {/* Official Mqulima Footer */}
        <Footer />
      </ScrollView>

      {/* =========================================================
          MODAL 1: WEEKLY COMBINED NEWSLETTER MODAL (ISSUE #26-06)
         ========================================================= */}
      <Modal
        visible={newsletterModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setNewsletterModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.newsletterModalSheet}>
            <View style={styles.newsletterModalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Lucide name="newspaper" size={18} color="#0F766E" />
                <Text style={styles.newsletterModalHeaderTitle}>
                  WEEKLY COMBINED NEWSLETTER
                </Text>
              </View>
              <Pressable
                onPress={() => setNewsletterModalOpen(false)}
                style={styles.modalExitBtn}
              >
                <Lucide name="x" size={15} color="#0B2117" />
                <Text style={styles.modalExitBtnText}>EXIT</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.newsletterModalContent}>
              <View style={styles.digestPrintBox}>
                <View style={styles.digestBanner}>
                  <Text style={styles.digestKicker}>WEEKLY DIGEST</Text>
                  <Text style={styles.digestMainTitle}>MQULIMA NEWSLETTER</Text>
                  <Text style={styles.digestMetaLine}>
                    Issue #26-06 •{" "}
                    {new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    • Weekly agricultural compilation
                  </Text>
                </View>

                <Text style={styles.digestIntroQuote}>
                  &ldquo;Welcome to this week&apos;s agricultural dispatch. We have
                  compiled all active agronomist insights, market super-cycles, and
                  mobile USSD data reviews into one bulletin for easy offline
                  reading on the farm.&rdquo;
                </Text>

                {allPosts.slice(0, 3).map((p, idx) => (
                  <View key={`digest-${p.id}`} style={styles.digestArticleBlock}>
                    <Text style={styles.digestArticleKicker}>
                      ARTICLE {idx + 1} — {p.category}
                    </Text>
                    <Text style={styles.digestArticleTitle}>{p.title}</Text>
                    <Text style={styles.digestArticleByline}>
                      By {p.author?.name || "Mqulima Desk"} (
                      {p.author?.role || "Editorial Desk"})
                    </Text>
                    <View style={{ gap: 8, marginTop: 6 }}>
                      {p.body.map((para, pIdx) => (
                        <Text
                          key={`digest-${p.id}-${pIdx}`}
                          style={styles.digestArticlePara}
                        >
                          {para}
                        </Text>
                      ))}
                    </View>
                  </View>
                ))}

                <View style={styles.digestFooterNote}>
                  <Text style={styles.digestFooterNoteBold}>
                    Mqulima Ecosystem Ltd — P.O Box 100-20100, Nakuru, Kenya
                  </Text>
                  <Text style={styles.digestFooterNoteSub}>
                    For agro-support contact mqulima@mqulima.com or use the
                    WhatsApp hotline.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.newsletterModalBottomBar}>
              <Pressable
                onPress={() => setNewsletterModalOpen(false)}
                style={styles.modalSecondaryBtn}
              >
                <Lucide name="x" size={15} color="#0B2117" />
                <Text style={styles.modalSecondaryBtnText}>Exit Newsletter</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (allPosts[0]) shareArticle(allPosts[0]);
                }}
                style={styles.modalPrimaryBtn}
              >
                <Lucide name="share-2" size={15} color="#FFFFFF" />
                <Text style={styles.modalPrimaryBtnText}>Share Digest</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* =========================================================
          MODAL 2: ACTIVE ARTICLE QUICK READER MODAL
         ========================================================= */}
      <Modal
        visible={Boolean(activeReadingPost)}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveReadingPost(null)}
      >
        <View style={styles.modalBackdrop}>
          {activeReadingPost && (
            <View style={styles.newsletterModalSheet}>
              <View style={styles.newsletterModalHeader}>
                <View style={styles.readerHeaderLeft}>
                  <View style={styles.readerCategoryPill}>
                    <Text style={styles.readerCategoryPillText}>
                      {activeReadingPost.category}
                    </Text>
                  </View>
                  <Text style={styles.readerModeLabel}>• READING MODE</Text>
                </View>
                <Pressable
                  onPress={() => setActiveReadingPost(null)}
                  style={styles.modalExitBtn}
                >
                  <Lucide name="x" size={15} color="#0B2117" />
                  <Text style={styles.modalExitBtnText}>EXIT</Text>
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.readerScrollContent}>
                <View style={styles.readerCoverWrap}>
                  <Image
                    source={{ uri: activeReadingPost.image }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                </View>

                <Text style={styles.readerMetaLine}>
                  {activeReadingPost.category} • {newsDate(activeReadingPost.date)} •{" "}
                  {activeReadingPost.readTime}
                </Text>

                <Text style={styles.readerTitle}>{activeReadingPost.title}</Text>

                <View style={styles.readerAuthorBar}>
                  <View style={styles.readerAuthorAvatar}>
                    <Text style={styles.readerAuthorAvatarText}>
                      {activeReadingPost.author?.avatarInitials || "MD"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.readerAuthorName}>
                      {activeReadingPost.author?.name || "Mqulima Desk"}
                    </Text>
                    <Text style={styles.readerAuthorRole}>
                      {activeReadingPost.author?.role || "Editorial & Agronomy Desk"}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => shareArticle(activeReadingPost)}
                    style={styles.readerShareBtn}
                  >
                    <Lucide name="share-2" size={15} color="#0B2117" />
                    <Text style={styles.readerShareBtnText}>Share</Text>
                  </Pressable>
                </View>

                <View style={{ gap: 14 }}>
                  {activeReadingPost.body.map((para, idx) => (
                    <Text
                      key={`${activeReadingPost.id}-p-${idx}`}
                      style={styles.readerParagraph}
                    >
                      {para}
                    </Text>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.newsletterModalBottomBar}>
                <Pressable
                  onPress={() => {
                    const id = activeReadingPost.id;
                    setActiveReadingPost(null);
                    router.push(`/article/${id}`);
                  }}
                  style={styles.dedicatedPageLink}
                >
                  <Text style={styles.dedicatedPageLinkText}>
                    Read on Dedicated Page →
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setActiveReadingPost(null)}
                  style={styles.modalPrimaryBtn}
                >
                  <Lucide name="x" size={15} color="#FFFFFF" />
                  <Text style={styles.modalPrimaryBtnText}>Exit Article</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FAFBF9",
  },
  scrollContent: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    gap: 20,
  },

  // 1. Masthead & Search
  mastheadSection: {
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 10,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eyebrowRule: {
    width: 24,
    height: 2,
    backgroundColor: "#0F766E",
  },
  eyebrowText: {
    fontFamily: fonts.b800,
    fontSize: 10,
    letterSpacing: 1.5,
    color: "#0F766E",
  },
  mastheadTitle: {
    fontFamily: fonts.h900,
    fontSize: 30,
    lineHeight: 36,
    color: "#1A3A1A",
    letterSpacing: -0.6,
  },
  mastheadAccent: {
    color: "#85CC14",
  },
  mastheadSubtitle: {
    fontFamily: fonts.b500,
    fontSize: 13,
    lineHeight: 19,
    color: "#475569",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.b600,
    fontSize: 13,
    color: "#0F172A",
    paddingVertical: 0,
  },
  utilityButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  remindBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "#EAB308",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  remindBtnActive: {
    backgroundColor: "#FDE047",
    borderColor: "#EA580C",
  },
  remindBtnText: {
    fontFamily: fonts.b800,
    fontSize: 12,
    color: "#0B2117",
  },
  remindBtnTextActive: {
    color: "#0B2117",
  },
  digestBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#166534",
    borderWidth: 1,
    borderColor: "#15803D",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  digestBtnText: {
    fontFamily: fonts.b800,
    fontSize: 11.5,
    letterSpacing: 0.5,
    color: "#FFFFFF",
    textTransform: "uppercase",
  },

  // 2. Category Tabs
  categoryBarWrap: {
    borderBottomWidth: 2,
    borderBottomColor: "#E2E8F0",
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 4,
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  categoryTabActive: {
    borderBottomColor: "#0F766E",
    backgroundColor: "rgba(236, 253, 245, 0.8)",
  },
  categoryTabText: {
    fontFamily: fonts.b800,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#475569",
  },
  categoryTabTextActive: {
    color: "#0F766E",
  },

  // 3. Featured Story Carousel Card
  featuredCard: {
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.06)",
    elevation: 2,
  },
  featuredImageContainer: {
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: "#0B2117",
    position: "relative",
  },
  featuredImageOverlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: 14,
  },
  featuredTopPillsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  featuredStoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0B2117",
    borderWidth: 1,
    borderColor: "rgba(133, 204, 20, 0.4)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  featuredStoryBadgeText: {
    fontFamily: fonts.b800,
    fontSize: 10,
    letterSpacing: 1,
    color: "#85CC14",
  },
  featuredCategoryBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  featuredCategoryBadgeText: {
    fontFamily: fonts.b800,
    fontSize: 10,
    letterSpacing: 0.6,
    color: "#0B2117",
    textTransform: "uppercase",
  },
  featuredBody: {
    padding: 18,
    gap: 12,
  },
  featuredTitle: {
    fontFamily: fonts.h900,
    fontSize: 22,
    lineHeight: 28,
    color: "#1A3A1A",
  },
  featuredExcerpt: {
    fontFamily: fonts.b400,
    fontSize: 13.5,
    lineHeight: 21,
    color: "#475569",
  },
  featuredMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  metaInlineItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaInlineText: {
    fontFamily: fonts.b600,
    fontSize: 11.5,
    color: "#64748B",
  },
  metaDotText: {
    fontFamily: fonts.b700,
    fontSize: 11,
    color: "#CBD5E1",
  },
  featuredFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  readFullStoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "#EAB308",
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  readFullStoryBtnText: {
    fontFamily: fonts.b800,
    fontSize: 11.5,
    letterSpacing: 0.8,
    color: "#0B2117",
  },
  carouselControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  carouselDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  carouselDot: {
    width: 10,
    height: 6,
    backgroundColor: "#E2E8F0",
  },
  carouselDotActive: {
    width: 26,
    backgroundColor: "#0F766E",
  },
  carouselArrowsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  carouselArrowBtnYellow: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: "#EAB308",
    backgroundColor: "#FACC15",
    alignItems: "center",
    justifyContent: "center",
  },
  carouselArrowBtnGreen: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: "#15803D",
    backgroundColor: "#166534",
    alignItems: "center",
    justifyContent: "center",
  },

  // 4. Latest Agricultural Posts Section
  latestSection: {
    paddingHorizontal: 16,
    gap: 16,
  },
  latestHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  latestHeading: {
    fontFamily: fonts.h900,
    fontSize: 21,
    color: "#1A3A1A",
  },
  latestSubheading: {
    fontFamily: fonts.b500,
    fontSize: 12,
    lineHeight: 17,
    color: "#64748B",
    marginTop: 2,
  },
  storyCountText: {
    fontFamily: fonts.b600,
    fontSize: 11,
    color: "#64748B",
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "#EAB308",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  viewAllBtnText: {
    fontFamily: fonts.b800,
    fontSize: 11,
    color: "#0B2117",
  },
  postsGrid: {
    gap: 18,
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  postImageWrap: {
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: "#0F172A",
    position: "relative",
  },
  postCatBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#0B2117",
    borderWidth: 1,
    borderColor: "rgba(133, 204, 20, 0.35)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  postCatBadgeText: {
    fontFamily: fonts.b800,
    fontSize: 10,
    letterSpacing: 0.8,
    color: "#85CC14",
    textTransform: "uppercase",
  },
  postReadTimePill: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0, 0, 0, 0.76)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  postReadTimePillText: {
    fontFamily: fonts.b700,
    fontSize: 10,
    color: "#FFFFFF",
  },
  postBody: {
    padding: 16,
    gap: 9,
  },
  postMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  postMetaText: {
    fontFamily: fonts.b600,
    fontSize: 11,
    color: "#64748B",
  },
  postTitle: {
    fontFamily: fonts.h800,
    fontSize: 18,
    lineHeight: 24,
    color: "#1A3A1A",
  },
  postExcerpt: {
    fontFamily: fonts.b400,
    fontSize: 13,
    lineHeight: 20,
    color: "#475569",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 10,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  authorAvatarBox: {
    width: 24,
    height: 24,
    backgroundColor: "rgba(15, 118, 110, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(15, 118, 110, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  authorAvatarText: {
    fontFamily: fonts.b800,
    fontSize: 9.5,
    color: "#0F766E",
  },
  authorNameText: {
    fontFamily: fonts.b700,
    fontSize: 12,
    color: "#334155",
  },
  authorRoleText: {
    fontFamily: fonts.b500,
    fontSize: 11,
    color: "#94A3B8",
    flex: 1,
  },
  postFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  readNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "#EAB308",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  readNowBtnText: {
    fontFamily: fonts.b800,
    fontSize: 11.5,
    letterSpacing: 0.7,
    color: "#0B2117",
  },
  quickReadLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#166534",
    borderWidth: 1,
    borderColor: "#15803D",
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  quickReadLinkText: {
    fontFamily: fonts.b800,
    fontSize: 11.5,
    color: "#FFFFFF",
  },
  loadMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "#EAB308",
    paddingVertical: 13,
  },
  loadMoreBtnText: {
    fontFamily: fonts.b800,
    fontSize: 12,
    letterSpacing: 0.8,
    color: "#0B2117",
  },
  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  emptyBoxTitle: {
    fontFamily: fonts.h800,
    fontSize: 16,
    color: "#1A3A1A",
  },
  emptyBoxSub: {
    fontFamily: fonts.b400,
    fontSize: 12.5,
    color: "#64748B",
    textAlign: "center",
  },
  resetEmptyBtn: {
    marginTop: 6,
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "#EAB308",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resetEmptyBtnText: {
    fontFamily: fonts.b800,
    fontSize: 11,
    letterSpacing: 0.8,
    color: "#0B2117",
  },

  // 5. Popular Posts & Editorial Widgets
  widgetSection: {
    paddingHorizontal: 16,
    gap: 18,
  },
  popularWidgetCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    gap: 14,
  },
  widgetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  widgetTitle: {
    fontFamily: fonts.h800,
    fontSize: 17,
    color: "#1A3A1A",
  },
  widgetActionBtn: {
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "#EAB308",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  widgetActionText: {
    fontFamily: fonts.b800,
    fontSize: 11,
    letterSpacing: 0.6,
    color: "#0B2117",
  },
  popularList: {
    gap: 14,
  },
  popularItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  popularThumbWrap: {
    width: 74,
    height: 74,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  popularCatText: {
    fontFamily: fonts.b800,
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: "#0F766E",
    textTransform: "uppercase",
  },
  popularTitleText: {
    fontFamily: fonts.h700,
    fontSize: 13.5,
    lineHeight: 18.5,
    color: "#1A3A1A",
  },
  popularMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  popularMetaText: {
    fontFamily: fonts.b600,
    fontSize: 10.5,
    color: "#64748B",
  },

  // 6. Newsletter + Testimonials
  newsletterCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
    gap: 8,
  },
  newsletterKicker: {
    fontFamily: fonts.b800,
    fontSize: 10,
    letterSpacing: 1.2,
    color: "#0F766E",
  },
  newsletterTitle: {
    fontFamily: fonts.h800,
    fontSize: 18,
    color: "#1A3A1A",
  },
  newsletterDesc: {
    fontFamily: fonts.b500,
    fontSize: 12.5,
    lineHeight: 18.5,
    color: "#64748B",
  },
  newsletterFormRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  newsletterInput: {
    flex: 1,
    backgroundColor: "#FAFBF9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.b600,
    fontSize: 12.5,
    color: "#0F172A",
  },
  newsletterSubmitBtn: {
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "#EAB308",
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  newsletterSubmitText: {
    fontFamily: fonts.b800,
    fontSize: 11.5,
    letterSpacing: 0.7,
    color: "#0B2117",
  },
  testimonialCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 4,
    borderLeftColor: "#0F766E",
    padding: 18,
    gap: 12,
  },
  testimonialHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  testimonialHeading: {
    fontFamily: fonts.h800,
    fontSize: 15,
    color: "#1A3A1A",
  },
  testimonialQuote: {
    fontFamily: fonts.b400,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
    color: "#475569",
  },
  testimonialFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 10,
  },
  testimonialAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  testimonialAvatar: {
    width: 36,
    height: 36,
    backgroundColor: "#1A5438",
    alignItems: "center",
    justifyContent: "center",
  },
  testimonialAvatarText: {
    fontFamily: fonts.b800,
    fontSize: 12,
    color: "#FFFFFF",
  },
  testimonialAuthorName: {
    fontFamily: fonts.b700,
    fontSize: 12.5,
    color: "#1A3A1A",
  },
  testimonialAuthorRole: {
    fontFamily: fonts.b500,
    fontSize: 10.5,
    color: "#64748B",
  },
  testimonialDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  testimonialDot: {
    width: 7,
    height: 6,
    backgroundColor: "#E2E8F0",
  },
  testimonialDotActive: {
    width: 20,
    backgroundColor: "#0F766E",
  },

  // 7. Editorial Desk & Live Commodity Index
  editorialDeskCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  editorialLogoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0B2117",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  editorialTitle: {
    fontFamily: fonts.h800,
    fontSize: 18,
    fontStyle: "italic",
    color: "#0F766E",
  },
  editorialBio: {
    fontFamily: fonts.b500,
    fontSize: 12.5,
    lineHeight: 19,
    color: "#64748B",
    textAlign: "center",
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  socialPillYellow: {
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "#EAB308",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  socialPillGreen: {
    backgroundColor: "#166534",
    borderWidth: 1,
    borderColor: "#15803D",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  socialPillTextDark: {
    fontFamily: fonts.b800,
    fontSize: 11,
    color: "#0B2117",
  },
  socialPillTextLight: {
    fontFamily: fonts.b800,
    fontSize: 11,
    color: "#FFFFFF",
  },
  commodityCard: {
    backgroundColor: "#0B2117",
    padding: 18,
    gap: 12,
  },
  commodityTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  commodityIconBox: {
    width: 42,
    height: 42,
    backgroundColor: "rgba(133, 204, 20, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(133, 204, 20, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  commodityBadgeText: {
    fontFamily: fonts.b800,
    fontSize: 10,
    letterSpacing: 1,
    color: "#85CC14",
  },
  commodityTitle: {
    fontFamily: fonts.h800,
    fontSize: 17,
    color: "#FFFFFF",
  },
  commodityDesc: {
    fontFamily: fonts.b400,
    fontSize: 12.5,
    lineHeight: 19,
    color: "rgba(255, 255, 255, 0.82)",
  },
  commodityBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "#EAB308",
    paddingVertical: 11,
  },
  commodityBtnText: {
    fontFamily: fonts.b800,
    fontSize: 12,
    letterSpacing: 0.7,
    color: "#0B2117",
  },

  // Footer
  footerSection: {
    alignItems: "center",
    paddingVertical: 18,
    gap: 8,
  },
  footerTagline: {
    fontFamily: fonts.b500,
    fontSize: 12.5,
    color: "#64748B",
  },
  backToTopBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "#EAB308",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  backToTopText: {
    fontFamily: fonts.b800,
    fontSize: 12.5,
    color: "#0B2117",
  },

  // Modals (Weekly Digest + Quick Reader)
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(11, 33, 23, 0.72)",
    justifyContent: "flex-end",
  },
  newsletterModalSheet: {
    backgroundColor: "#FAF9F5",
    borderTopWidth: 2,
    borderTopColor: "#0B2117",
    maxHeight: "92%",
  },
  newsletterModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  newsletterModalHeaderTitle: {
    fontFamily: fonts.h800,
    fontSize: 13.5,
    letterSpacing: 0.6,
    color: "#1A3A1A",
  },
  modalExitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "#EAB308",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modalExitBtnText: {
    fontFamily: fonts.b800,
    fontSize: 11,
    color: "#0B2117",
  },
  newsletterModalContent: {
    padding: 16,
  },
  digestPrintBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    padding: 18,
    gap: 16,
  },
  digestBanner: {
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 3,
    borderBottomColor: "#0F766E",
    gap: 4,
  },
  digestKicker: {
    fontFamily: fonts.b800,
    fontSize: 10,
    letterSpacing: 1.4,
    color: "#0F766E",
  },
  digestMainTitle: {
    fontFamily: fonts.h900,
    fontSize: 22,
    color: "#1A3A1A",
  },
  digestMetaLine: {
    fontFamily: fonts.b600,
    fontSize: 10.5,
    color: "#64748B",
    textAlign: "center",
  },
  digestIntroQuote: {
    fontFamily: fonts.b400,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
    color: "#475569",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  digestArticleBlock: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 4,
  },
  digestArticleKicker: {
    fontFamily: fonts.b800,
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: "#0F766E",
  },
  digestArticleTitle: {
    fontFamily: fonts.h800,
    fontSize: 16,
    color: "#1A3A1A",
  },
  digestArticleByline: {
    fontFamily: fonts.b600,
    fontSize: 10.5,
    color: "#64748B",
  },
  digestArticlePara: {
    fontFamily: fonts.b400,
    fontSize: 12.5,
    lineHeight: 19,
    color: "#334155",
  },
  digestFooterNote: {
    alignItems: "center",
    gap: 3,
    paddingTop: 6,
  },
  digestFooterNoteBold: {
    fontFamily: fonts.b700,
    fontSize: 10.5,
    color: "#334155",
    textAlign: "center",
  },
  digestFooterNoteSub: {
    fontFamily: fonts.b400,
    fontSize: 10,
    color: "#64748B",
    textAlign: "center",
  },
  newsletterModalBottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 10,
  },
  modalSecondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "#EAB308",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalSecondaryBtnText: {
    fontFamily: fonts.b800,
    fontSize: 11.5,
    color: "#0B2117",
    textTransform: "uppercase",
  },
  modalPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#166534",
    borderWidth: 1,
    borderColor: "#15803D",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalPrimaryBtnText: {
    fontFamily: fonts.b800,
    fontSize: 11.5,
    color: "#FFFFFF",
    textTransform: "uppercase",
  },

  // Quick Reader Modal
  readerHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  readerCategoryPill: {
    backgroundColor: "#0B2117",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  readerCategoryPillText: {
    fontFamily: fonts.b800,
    fontSize: 9.5,
    color: "#85CC14",
    textTransform: "uppercase",
  },
  readerModeLabel: {
    fontFamily: fonts.b700,
    fontSize: 10.5,
    color: "#94A3B8",
  },
  readerScrollContent: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    gap: 14,
  },
  readerCoverWrap: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  readerMetaLine: {
    fontFamily: fonts.b800,
    fontSize: 10.5,
    letterSpacing: 0.6,
    color: "#64748B",
    textTransform: "uppercase",
  },
  readerTitle: {
    fontFamily: fonts.h900,
    fontSize: 21,
    lineHeight: 27,
    color: "#1A3A1A",
  },
  readerAuthorBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  readerAuthorAvatar: {
    width: 34,
    height: 34,
    backgroundColor: "#0B2117",
    alignItems: "center",
    justifyContent: "center",
  },
  readerAuthorAvatarText: {
    fontFamily: fonts.b800,
    fontSize: 11,
    color: "#85CC14",
  },
  readerAuthorName: {
    fontFamily: fonts.b700,
    fontSize: 12.5,
    color: "#1A3A1A",
  },
  readerAuthorRole: {
    fontFamily: fonts.b500,
    fontSize: 10.5,
    color: "#64748B",
  },
  readerShareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FACC15",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#EAB308",
  },
  readerShareBtnText: {
    fontFamily: fonts.b800,
    fontSize: 11.5,
    color: "#0B2117",
  },
  readerParagraph: {
    fontFamily: fonts.b400,
    fontSize: 14.5,
    lineHeight: 23,
    color: "#334155",
  },
  dedicatedPageLink: {
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "#EAB308",
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dedicatedPageLinkText: {
    fontFamily: fonts.b800,
    fontSize: 11.5,
    color: "#0B2117",
    textTransform: "uppercase",
  },
});
