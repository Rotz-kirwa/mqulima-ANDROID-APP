import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Logo } from "./Logo";
import { fonts } from "@/src/theme";

// Brand palette from specification
const BRAND = {
  green: "#245B35", // Mqulima Green (Primary)
  greenDeep: "#13361E", // Deep Forest Editorial
  greenDarkest: "#0A1F11",
  cream: "#F8F6EF", // Warm Cream (Secondary)
  creamCard: "#FDFCF8",
  gold: "#C49A45", // Premium Gold (Accent)
  goldLight: "#F5EBD4",
  goldBorder: "rgba(196, 154, 69, 0.35)",
  textPrimary: "#112A1A",
  textSecondary: "#3B5243",
  textMuted: "#687D6F",
  white: "#FFFFFF",
};

type Slide = {
  id: string;
  stepNumber: string;
  kicker: string;
  headline: string;
  supportingHeadline: string;
  description: string;
  microcopy?: string;
  image: any;
  imageFit: "contain" | "cover";
  imageBg: string;
  highlights: { icon: string; label: string }[];
  badgeTitle: string;
  badgeSub: string;
};

export const ONBOARDING_SLIDES: Slide[] = [
  {
    id: "discover",
    stepNumber: "01",
    kicker: "DISCOVER MQULIMA",
    headline: "Welcome to Mqulima",
    supportingHeadline: "Taking You First Class.",
    description:
      "Your agricultural journey starts here. Discover a smarter way to access quality farming products, trusted agricultural solutions, and the support you need to grow.",
    image: require("../../assets/images/mqulima-onboarding-1-yield.jpg"),
    imageFit: "contain",
    imageBg: "#122B1A",
    highlights: [
      { icon: "shield-check", label: "Verified Quality" },
      { icon: "sprout", label: "Trusted Solutions" },
      { icon: "truck", label: "47 Counties" },
    ],
    badgeTitle: "Africa's 360° Agriculture Ecosystem",
    badgeSub: "Connecting farmers, inputs & expertise",
  },
  {
    id: "platform",
    stepNumber: "02",
    kicker: "ALL-IN-ONE ECOSYSTEM",
    headline: "Everything Agriculture. One Platform.",
    supportingHeadline: "Inputs, Agronomy & Vet Support.",
    description:
      "From certified seeds and fertilizers to crop protection, farming supplies, and professional agricultural support, Mqulima brings essential farming solutions closer to you.",
    image: require("../../assets/images/onboarding-photo-2.webp"),
    imageFit: "cover",
    imageBg: "#13361E",
    highlights: [
      { icon: "package-check", label: "Seeds & Fertilizers" },
      { icon: "flask-conical", label: "Crop Protection" },
      { icon: "stethoscope", label: "Agronomy & Vet" },
    ],
    badgeTitle: "1,000+ Certified Farm Inputs",
    badgeSub: "Direct from verified manufacturers & agrovets",
  },
  {
    id: "confidence",
    stepNumber: "03",
    kicker: "GROW WITH CONFIDENCE",
    headline: "Your Growth Is Our Priority.",
    supportingHeadline: "Smarter Decisions. Better Harvests.",
    description:
      "Shop with confidence, discover reliable agricultural solutions, and access the resources you need to make smarter farming decisions. With Mqulima, you're always one step ahead.",
    microcopy: "Your journey to smarter agriculture starts today.",
    image: require("../../assets/images/mqulima-onboarding-3-agroshop.jpg"),
    imageFit: "contain",
    imageBg: "#14351F",
    highlights: [
      { icon: "award", label: "First-Class Quality" },
      { icon: "sparkles", label: "Mqulima AI Advisor" },
      { icon: "trending-up", label: "Higher Yields" },
    ],
    badgeTitle: "Built for Every Farmer's Success",
    badgeSub: "Reliable delivery, fair pricing & expert care",
  },
];

function PaginationDot({
  active,
  index,
  onPress,
}: {
  active: boolean;
  index: number;
  onPress: () => void;
}) {
  const width = useSharedValue(active ? 32 : 10);
  const opacity = useSharedValue(active ? 1 : 0.45);

  useEffect(() => {
    width.value = withTiming(active ? 32 : 10, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(active ? 1 : 0.45, { duration: 220 });
  }, [active, width, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    width: width.value,
    opacity: opacity.value,
  }));

  return (
    <Pressable
      testID={`onboarding-dot-${index + 1}`}
      accessibilityRole="button"
      accessibilityLabel={`Go to onboarding screen ${index + 1}`}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      hitSlop={10}
      style={styles.dotHitArea}
    >
      <Animated.View
        style={[
          styles.dot,
          active ? styles.dotActive : styles.dotInactive,
          animStyle,
        ]}
      />
    </Pressable>
  );
}

export function OnboardingFlow({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const isCompact = height < 720;

  const current = ONBOARDING_SLIDES[step];
  const isFirst = step === 0;
  const isLast = step === ONBOARDING_SLIDES.length - 1;

  // Keep a ref to current step for PanResponder swipe gestures
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const goNext = useCallback(() => {
    if (stepRef.current < ONBOARDING_SLIDES.length - 1) {
      setStep((s) => Math.min(ONBOARDING_SLIDES.length - 1, s + 1));
    } else {
      onFinish();
    }
  }, [onFinish]);

  const goBack = useCallback(() => {
    if (stepRef.current > 0) {
      setStep((s) => Math.max(0, s - 1));
    }
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 18 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
        onPanResponderRelease: (_, g) => {
          if (g.dx < -45 && stepRef.current < ONBOARDING_SLIDES.length - 1) {
            setStep((s) => s + 1);
          } else if (g.dx > 45 && stepRef.current > 0) {
            setStep((s) => s - 1);
          }
        },
      }),
    []
  );

  const heroHeight = isCompact ? Math.round(height * 0.38) : Math.round(height * 0.43);

  return (
    <View
      style={styles.root}
      testID="onboarding-screen"
      {...panResponder.panHandlers}
    >
      <StatusBar style="light" />

      {/* Top Bar: Brand Identity + Skip Button (dedicated header so hero visuals are unobstructed) */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top + 6, 14) }]}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Logo size={26} />
          </View>
          <View>
            <Text style={styles.brandWordmark}>MQULIMA</Text>
            <Text style={styles.brandTagline}>Taking You First Class.</Text>
          </View>
        </View>

        <Pressable
          testID="onboarding-skip-btn"
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding and go to app"
          onPress={onFinish}
          hitSlop={10}
          style={({ pressed }) => [
            styles.skipBtn,
            pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
          ]}
        >
          <Text style={styles.skipText}>Skip</Text>
          <Lucide name="chevrons-right" size={14} color={BRAND.cream} />
        </Pressable>
      </View>

      {/* UPPER VISUAL STAGE — Framed Mqulima visual showcase */}
      <View style={[styles.heroStage, { height: heroHeight, backgroundColor: current.imageBg }]}>
        <Animated.View
          key={`img-${current.id}`}
          entering={FadeIn.duration(260)}
          style={styles.heroImageFrame}
        >
          <ExpoImage
            source={current.image}
            style={StyleSheet.absoluteFill}
            contentFit={current.imageFit}
            contentPosition="center"
            transition={200}
            priority="high"
            cachePolicy="memory-disk"
          />
        </Animated.View>
      </View>

      {/* LOWER EDITORIAL CARD — Warm Cream (#F8F6EF) with Mqulima Green (#245B35) & Gold (#C49A45) */}
      <View style={[styles.cardSheet, { paddingBottom: Math.max(insets.bottom + 14, 18) }]}>
        {/* Subtle Gold Accent Top Bar */}
        <View style={styles.goldTopBar} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={[
            styles.cardContent,
            isCompact && { paddingTop: 12, gap: 8 },
          ]}
        >
          <Animated.View
            key={`content-${current.id}`}
            entering={FadeInDown.duration(340)}
            style={{ gap: isCompact ? 8 : 10 }}
          >
            {/* Kicker Pill + Step Indicator */}
            <View style={styles.kickerRow}>
              <View style={styles.kickerPill}>
                <View style={styles.kickerDot} />
                <Text style={styles.kickerText}>{current.kicker}</Text>
              </View>
              <View style={styles.stepPill}>
                <Text style={styles.stepPillText}>{current.stepNumber} / 03</Text>
              </View>
            </View>

            {/* Main Headline */}
            <Text
              testID={`onboarding-headline-${step + 1}`}
              style={[styles.headline, isCompact && { fontSize: 25, lineHeight: 30 }]}
            >
              {current.headline}
            </Text>

            {/* Supporting Headline */}
            <Text style={[styles.supportingHeadline, isCompact && { fontSize: 14 }]}>
              {current.supportingHeadline}
            </Text>

            {/* Description */}
            <Text
              testID={`onboarding-description-${step + 1}`}
              style={[styles.description, isCompact && { fontSize: 13.5, lineHeight: 20 }]}
            >
              {current.description}
            </Text>

            {/* Feature Highlight Pills */}
            <View style={styles.highlightsRow}>
              {current.highlights.map((h) => (
                <View key={h.label} style={styles.highlightChip}>
                  <Lucide name={h.icon as any} size={13} color={BRAND.green} />
                  <Text style={styles.highlightChipText}>{h.label}</Text>
                </View>
              ))}
            </View>

            {/* Screen 3 Supporting Microcopy */}
            {Boolean(current.microcopy) && (
              <View style={styles.microcopyBanner} testID="onboarding-final-microcopy">
                <Lucide name="circle-check" size={15} color={BRAND.gold} />
                <Text style={styles.microcopyText}>{current.microcopy}</Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* FOOTER: Pagination Indicators + Navigation Buttons */}
        <View style={styles.footer}>
          {/* 3-Step Pagination Indicators */}
          <View style={styles.paginationRow} testID="onboarding-pagination">
            {ONBOARDING_SLIDES.map((s, idx) => (
              <PaginationDot
                key={s.id}
                index={idx}
                active={idx === step}
                onPress={() => setStep(idx)}
              />
            ))}
          </View>

          {/* Navigation Action Row */}
          <View style={styles.actionsRow}>
            {!isFirst ? (
              <Pressable
                testID="onboarding-back-btn"
                accessibilityRole="button"
                accessibilityLabel="Previous onboarding screen"
                onPress={goBack}
                style={({ pressed }) => [
                  styles.backBtn,
                  pressed && { opacity: 0.82, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Lucide name="arrow-left" size={18} color={BRAND.green} />
                <Text style={styles.backBtnText}>Back</Text>
              </Pressable>
            ) : null}

            <Pressable
              testID={isLast ? "onboarding-get-started-btn" : "onboarding-next-btn"}
              accessibilityRole="button"
              accessibilityLabel={isLast ? "Get Started with Mqulima" : "Next onboarding screen"}
              onPress={goNext}
              style={({ pressed }) => [
                styles.primaryBtn,
                isLast && styles.getStartedBtn,
                pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={styles.primaryBtnText}>
                {isLast ? "Get Started" : "Next"}
              </Text>
              <View style={[styles.primaryBtnIconWrap, isLast && styles.getStartedIconWrap]}>
                <Lucide
                  name="arrow-right"
                  size={16}
                  color={isLast ? BRAND.greenDarkest : BRAND.white}
                />
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND.greenDarkest,
  },
  heroStage: {
    width: "100%",
    paddingHorizontal: 12,
    paddingBottom: 10,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: BRAND.greenDeep,
  },
  heroImageFrame: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BRAND.goldBorder,
    backgroundColor: "#0E2616",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 10,
    backgroundColor: BRAND.greenDarkest,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(248, 246, 239, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BRAND.goldBorder,
  },
  brandWordmark: {
    fontFamily: fonts.wordmark,
    fontSize: 17,
    letterSpacing: 1.6,
    color: BRAND.cream,
    lineHeight: 20,
  },
  brandTagline: {
    fontFamily: fonts.b600,
    fontSize: 10,
    color: BRAND.gold,
    letterSpacing: 0.4,
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 0,
    backgroundColor: "rgba(19, 54, 30, 0.65)",
    borderWidth: 1,
    borderColor: "rgba(248, 246, 239, 0.28)",
  },
  skipText: {
    fontFamily: fonts.b700,
    fontSize: 13,
    color: BRAND.cream,
    letterSpacing: 0.3,
  },
  heroOverlayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 28,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(15, 41, 25, 0.84)",
    borderWidth: 1,
    borderColor: BRAND.goldBorder,
  },
  goldIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  heroBadgeTitle: {
    fontFamily: fonts.h700,
    fontSize: 12.5,
    color: BRAND.cream,
  },
  heroBadgeSub: {
    fontFamily: fonts.b400,
    fontSize: 11,
    color: "rgba(248, 246, 239, 0.78)",
  },
  stepPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(36, 91, 53, 0.10)",
    borderWidth: 1,
    borderColor: BRAND.goldBorder,
  },
  stepPillText: {
    fontFamily: fonts.b800,
    fontSize: 10.5,
    color: BRAND.green,
    letterSpacing: 0.8,
  },
  cardSheet: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: BRAND.cream,
    paddingHorizontal: 22,
    justifyContent: "space-between",
    boxShadow: "0px -6px 18px rgba(0, 0, 0, 0.22)",
    elevation: 14,
  },
  goldTopBar: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: BRAND.gold,
    alignSelf: "center",
    marginTop: 10,
  },
  cardContent: {
    paddingTop: 14,
    paddingBottom: 8,
    gap: 10,
  },
  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kickerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: BRAND.goldLight,
    borderWidth: 1,
    borderColor: BRAND.goldBorder,
  },
  kickerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND.gold,
  },
  kickerText: {
    fontFamily: fonts.b800,
    fontSize: 10,
    letterSpacing: 1.3,
    color: BRAND.green,
  },
  headline: {
    fontFamily: fonts.h900,
    fontSize: 28,
    lineHeight: 34,
    color: BRAND.textPrimary,
    letterSpacing: -0.4,
  },
  supportingHeadline: {
    fontFamily: fonts.h700,
    fontSize: 15.5,
    lineHeight: 21,
    color: BRAND.gold,
  },
  description: {
    fontFamily: fonts.b500,
    fontSize: 14.5,
    lineHeight: 22,
    color: BRAND.textSecondary,
  },
  highlightsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  highlightChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: BRAND.creamCard,
    borderWidth: 1,
    borderColor: "rgba(36, 91, 53, 0.16)",
  },
  highlightChipText: {
    fontFamily: fonts.b700,
    fontSize: 11.5,
    color: BRAND.green,
  },
  microcopyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "rgba(36, 91, 53, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(196, 154, 69, 0.35)",
    marginTop: 2,
  },
  microcopyText: {
    fontFamily: fonts.b700,
    fontSize: 12.5,
    color: BRAND.green,
    flex: 1,
  },
  footer: {
    gap: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(36, 91, 53, 0.09)",
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dotHitArea: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
  dotActive: {
    backgroundColor: BRAND.green,
    borderWidth: 1,
    borderColor: BRAND.gold,
  },
  dotInactive: {
    backgroundColor: "rgba(36, 91, 53, 0.35)",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: 0,
    backgroundColor: BRAND.creamCard,
    borderWidth: 1.5,
    borderColor: "rgba(36, 91, 53, 0.24)",
  },
  backBtnText: {
    fontFamily: fonts.b700,
    fontSize: 15,
    color: BRAND.green,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 22,
    borderRadius: 0,
    backgroundColor: BRAND.green,
    boxShadow: "0px 6px 12px rgba(36, 91, 53, 0.28)",
    elevation: 5,
  },
  getStartedBtn: {
    backgroundColor: BRAND.green,
    borderWidth: 1.5,
    borderColor: BRAND.gold,
  },
  primaryBtnText: {
    fontFamily: fonts.h800,
    fontSize: 16,
    color: BRAND.white,
    letterSpacing: 0.3,
  },
  primaryBtnIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  getStartedIconWrap: {
    backgroundColor: BRAND.gold,
  },
});
