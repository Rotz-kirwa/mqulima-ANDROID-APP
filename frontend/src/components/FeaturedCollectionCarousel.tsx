import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, { FadeInRight } from "react-native-reanimated";
import { Image } from "@/src/components/Img";
import { Skeleton } from "@/src/components/Skeleton";
import { ksh, type Product } from "@/src/data/products";
import { fonts, useTheme } from "@/src/theme";

type Props = {
  products?: Product[];
  isLoading?: boolean;
  showExploreButton?: boolean;
  compact?: boolean;
  intervalMs?: number;
};

export function FeaturedCollectionCarousel({
  products = [],
  isLoading = false,
  showExploreButton = true,
  compact = false,
  intervalMs = 3000,
}: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const itemsPerPage = width >= 768 ? 3 : 2;
  const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage));

  const [pageIndex, setPageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pageRef = useRef(pageIndex);
  useEffect(() => {
    pageRef.current = pageIndex;
  }, [pageIndex]);

  // Keep pageIndex within bounds if product list or screen width changes
  useEffect(() => {
    if (pageIndex >= totalPages) {
      setPageIndex(0);
    }
  }, [pageIndex, totalPages]);

  const pauseBriefly = useCallback(() => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    };
  }, []);

  // Auto-slide every 3 seconds (matching mqulima.com)
  useEffect(() => {
    if (isPaused || totalPages <= 1 || isLoading) return;
    const timer = setInterval(() => {
      setPageIndex((prev) => (prev + 1) % totalPages);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPaused, totalPages, isLoading, intervalMs]);

  const goPrev = useCallback(() => {
    pauseBriefly();
    setPageIndex((prev) => (prev - 1 + totalPages) % totalPages);
  }, [pauseBriefly, totalPages]);

  const goNext = useCallback(() => {
    pauseBriefly();
    setPageIndex((prev) => (prev + 1) % totalPages);
  }, [pauseBriefly, totalPages]);

  const goToPage = useCallback(
    (idx: number) => {
      pauseBriefly();
      setPageIndex(idx);
    },
    [pauseBriefly]
  );

  // Touch swipe gesture support (left/right drag to switch pages)
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 16 && Math.abs(g.dx) > Math.abs(g.dy) * 1.3,
        onPanResponderRelease: (_, g) => {
          if (g.dx < -35 && totalPages > 1) {
            goNext();
          } else if (g.dx > 35 && totalPages > 1) {
            goPrev();
          }
        },
      }),
    [goNext, goPrev, totalPages]
  );

  // Current group of products (2 on mobile, 3 on tablet/desktop)
  const currentGroup = useMemo(() => {
    if (!products.length) return [];
    const start = (pageIndex * itemsPerPage) % products.length;
    const group: (Product & { uniqueKey: string })[] = [];
    for (let i = 0; i < Math.min(itemsPerPage, products.length); i++) {
      const p = products[(start + i) % products.length];
      if (p) {
        group.push({
          ...p,
          uniqueKey: `${p.id}-slot-${i}-page-${pageIndex}`,
        });
      }
    }
    return group;
  }, [products, pageIndex, itemsPerPage]);

  const horizontalPad = 16;
  const gap = 12;
  const availableWidth = width - horizontalPad * 2 - gap * (itemsPerPage - 1);
  const cardW = Math.floor(availableWidth / itemsPerPage);
  const cardH = compact ? Math.round(cardW * 1.18) : Math.round(cardW * 1.32);

  return (
    <View
      style={[styles.container, compact && styles.containerCompact]}
      testID="featured-collection-carousel"
      {...panResponder.panHandlers}
    >
      {/* Header Row with Clean Title and Navigation Chevron Controls (matching mqulima.com) */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>FEATURED COLLECTION</Text>
          </View>
          <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>
            Farm <Text style={styles.sectionTitleHighlight}>Essentials</Text>
          </Text>
        </View>

        {/* Carousel Navigation Chevron Controls */}
        <View style={styles.chevronGroup}>
          <Pressable
            testID="featured-prev-btn"
            accessibilityRole="button"
            accessibilityLabel="Previous featured showcase"
            onPress={goPrev}
            style={({ pressed }) => [
              styles.chevronBtn,
              pressed && styles.chevronBtnPressed,
            ]}
          >
            <Lucide name="chevron-left" size={18} color="#0F291E" />
          </Pressable>
          <Pressable
            testID="featured-next-btn"
            accessibilityRole="button"
            accessibilityLabel="Next featured showcase"
            onPress={goNext}
            style={({ pressed }) => [
              styles.chevronBtn,
              pressed && styles.chevronBtnPressed,
            ]}
          >
            <Lucide name="chevron-right" size={18} color="#0F291E" />
          </Pressable>
        </View>
      </View>

      {/* Products Grid / Carousel with Auto-Slide */}
      {isLoading || currentGroup.length === 0 ? (
        <View style={styles.cardsRow}>
          {Array.from({ length: itemsPerPage }).map((_, idx) => (
            <Skeleton key={idx} style={{ width: cardW, height: cardH, borderRadius: 12 }} />
          ))}
        </View>
      ) : (
        <Animated.View
          key={`featured-page-${pageIndex}`}
          entering={FadeInRight.duration(340)}
          style={styles.cardsRow}
          testID="featured-collection-list"
        >
          {currentGroup.map((item) => (
            <Pressable
              key={item.uniqueKey}
              testID={`featured-${item.id}`}
              onPress={() => router.push(`/product/${item.id}`)}
              style={({ pressed }) => [
                styles.featCard,
                { width: cardW, height: cardH },
                pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
              ]}
            >
              {/* Top Category & Verified Pill */}
              <View style={styles.cardTopRow}>
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryTagText} numberOfLines={1}>
                    {item.category}
                  </Text>
                  <Lucide name="circle-check" size={11} color="#16A34A" />
                </View>
              </View>

              {/* Product Image */}
              <View style={[styles.imageWrap, compact && { marginBottom: 54 }]}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.productImage}
                  contentFit="contain"
                  transition={220}
                />
              </View>

              {/* Bottom Title & Details Overlay (matching mqulima.com) */}
              <LinearGradient
                colors={[
                  "rgba(255,255,255,0)",
                  "rgba(255,255,255,0.96)",
                  "#FFFFFF",
                ]}
                locations={[0, 0.35, 1]}
                style={styles.featLabel}
              >
                <Text style={styles.featName} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.detailFooter}>
                  <Text style={styles.featPrice}>{ksh(item.price)}</Text>
                  <View style={styles.stockBadge}>
                    <View style={styles.stockDot} />
                    <Text style={styles.stockText}>In Stock</Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          ))}
        </Animated.View>
      )}

      {/* Pagination Indicators Below Product Cards */}
      {totalPages > 1 && (
        <View style={styles.paginationRow} testID="featured-pagination">
          {Array.from({ length: totalPages }).map((_, idx) => {
            const active = pageIndex === idx;
            return (
              <Pressable
                key={idx}
                testID={`featured-dot-${idx + 1}`}
                accessibilityRole="button"
                accessibilityLabel={`Go to featured page ${idx + 1}`}
                onPress={() => goToPage(idx)}
                hitSlop={8}
                style={styles.dotHit}
              >
                <View
                  style={[
                    styles.dot,
                    active ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Explore Agroshop Button */}
      {showExploreButton && (
        <View style={styles.exploreWrap}>
          <Pressable
            testID="explore-agroshop-btn"
            onPress={() => router.navigate("/(tabs)/shop")}
            style={({ pressed }) => [
              styles.exploreBtn,
              { backgroundColor: colors.brandPrimary },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={styles.exploreBtnText}>EXPLORE AGROSHOP</Text>
            <Lucide name="arrow-right" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 14,
  },
  containerCompact: {
    paddingTop: 10,
    paddingBottom: 6,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  badgePill: {
    alignSelf: "flex-start",
    backgroundColor: "#E5F5D0",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 4,
  },
  badgePillText: {
    fontFamily: fonts.b800,
    fontSize: 10,
    letterSpacing: 1,
    color: "#35610D",
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontFamily: fonts.h900,
    fontSize: 26,
    lineHeight: 32,
    color: "#0F291E",
    letterSpacing: -0.4,
  },
  sectionTitleCompact: {
    fontSize: 20,
    lineHeight: 25,
  },
  sectionTitleHighlight: {
    color: "#6EA810",
  },
  chevronGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chevronBtn: {
    width: 36,
    height: 36,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.04)",
    elevation: 1,
  },
  chevronBtnPressed: {
    backgroundColor: "#E5F5D0",
    transform: [{ scale: 0.95 }],
  },
  cardsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  featCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.95)",
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    boxShadow: "0px 3px 8px rgba(15, 41, 30, 0.06)",
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingTop: 8,
    zIndex: 2,
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(22, 163, 74, 0.16)",
    maxWidth: "100%",
  },
  categoryTagText: {
    fontFamily: fonts.b700,
    fontSize: 9.5,
    color: "#15803D",
  },
  imageWrap: {
    flex: 1,
    marginHorizontal: 10,
    marginTop: 4,
    marginBottom: 60,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  featLabel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 22,
    paddingBottom: 10,
    paddingHorizontal: 11,
    gap: 4,
  },
  featName: {
    fontFamily: fonts.h800,
    fontSize: 12.5,
    lineHeight: 16,
    color: "#0F291E",
  },
  detailFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  featPrice: {
    fontFamily: fonts.h900,
    fontSize: 13,
    color: "#16A34A",
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stockDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#16A34A",
  },
  stockText: {
    fontFamily: fonts.b600,
    fontSize: 9.5,
    color: "#15803D",
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  dotHit: {
    paddingVertical: 4,
    paddingHorizontal: 1,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
  dotActive: {
    width: 28,
    backgroundColor: "#16A34A",
  },
  dotInactive: {
    width: 8,
    backgroundColor: "#CBD5E1",
  },
  exploreWrap: {
    alignItems: "center",
    marginTop: 4,
  },
  exploreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 0,
    boxShadow: "0px 4px 10px rgba(22, 163, 74, 0.25)",
    elevation: 4,
  },
  exploreBtnText: {
    fontFamily: fonts.h800,
    fontSize: 13,
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
});

