import React, { useEffect } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { AcademyCtaButton } from "./AcademyCtaButton";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { fonts, useTheme } from "@/src/theme";

const HERO_ART = require("../../../assets/images/academy-hero-banner.webp");

const PARTICLES = [
  { id: "p1", left: "10%", top: "14%", size: 4, delay: 0, color: "#85CC14" },
  { id: "p2", left: "24%", top: "28%", size: 3, delay: 420, color: "#FACC15" },
  { id: "p3", left: "44%", top: "12%", size: 5, delay: 200, color: "#FDE047" },
  { id: "p4", left: "66%", top: "18%", size: 3, delay: 640, color: "#85CC14" },
  { id: "p5", left: "82%", top: "15%", size: 4, delay: 160, color: "#FACC15" },
  { id: "p6", left: "88%", top: "40%", size: 4, delay: 500, color: "#4ADE80" },
  { id: "p7", left: "14%", top: "54%", size: 3, delay: 780, color: "#FACC15" },
] as const;

type HeroProps = {
  onJoinWaitlist: () => void;
};

/** Ambient twinkling dawn starlight dot over the highland hero canvas. */
function TwinklingParticle({
  left,
  top,
  size,
  delay,
  color,
}: {
  left: string;
  top: string;
  size: number;
  delay: number;
  color: string;
}) {
  const opacity = useSharedValue(0.25);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.95, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: 0.8 + opacity.value * 0.45 }],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: left as `${number}%`,
          top: top as `${number}%`,
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color,
          pointerEvents: "none",
        },
        animStyle,
      ]}
    />
  );
}

/** Sharp-edged showcase card displaying the Mqulima Academy agricultural WebP visual. */
function HeroShowcaseImage() {
  return (
    <View style={styles.sceneCard}>
      <ExpoImage
        source={HERO_ART}
        contentFit="cover"
        style={StyleSheet.absoluteFill}
        accessibilityLabel="Agricultural showcase featuring orchards, harvesters, livestock, and crop production"
      />
    </View>
  );
}

/**
 * Full-bleed atmospheric "Coming Soon" hero banner for Mqulima Academy.
 * Blends generated East African highland dawn art with animated camp vectors and clear dual CTAs.
 */
export function AcademyComingSoonHero({ onJoinWaitlist }: HeroProps) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const isWide = width >= 760;

  const badgePulse = useSharedValue(1);
  useEffect(() => {
    badgePulse.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [badgePulse]);

  const liveDotStyle = useAnimatedStyle(() => ({
    opacity: badgePulse.value,
    transform: [{ scale: 0.85 + badgePulse.value * 0.25 }],
  }));

  return (
    <View testID="academy-coming-soon-hero" style={styles.heroWrap}>
      <LinearGradient
        colors={["#082114", "#0B2A19", "#05170D"]}
        style={StyleSheet.absoluteFill}
      />

      {PARTICLES.map((p) => (
        <TwinklingParticle key={p.id} {...p} />
      ))}

      <View style={[styles.inner, isWide && styles.innerWide]}>
        {/* Top Brand + Coming Soon Badge Strip */}
        <View style={styles.topRow}>
          <View style={styles.brandBadge}>
            <View style={styles.mhSquare}>
              <Text style={styles.mhText}>MH</Text>
            </View>
            <Text testID="academy-eyebrow" style={styles.brandLabel}>
              MQULIMA ACADEMY
            </Text>
          </View>

          <View style={styles.comingBadge}>
            <Animated.View style={[styles.liveDot, liveDotStyle]} />
            <Text style={styles.comingBadgeText}>COMING 2026</Text>
          </View>
        </View>

        {/* Main Hero Responsive Split */}
        <View style={[styles.heroGrid, isWide && styles.heroGridWide]}>
          <View style={[styles.copyCol, isWide && styles.copyColWide]}>
            {/* Giant Banner Headline */}
            <View style={styles.giantRow}>
              <Text style={styles.giantComing}>COMING </Text>
              <Text style={styles.giantSoon}>SOON!!</Text>
            </View>

            <Text testID="academy-heading" style={styles.headline}>
              Grow your farm knowledge<Text style={styles.headlineAccent}>.</Text>
            </Text>

            <Text testID="academy-description" style={styles.subhead}>
              Full HD video masterclasses, localized crop playbooks, livestock workshops, and verified farmer certifications are launching soon — built specifically for East African growers.
            </Text>

            {/* Standalone Yellow Action Button (project convention) */}
            <View style={styles.ctaRow}>
              <AcademyCtaButton
                testID="academy-header-waitlist"
                accessibilityLabel="Join the Academy waitlist for early beta access"
                variant="yellow"
                fullWidth
                icon="bell-ring"
                label="Get Early Access"
                onPress={onJoinWaitlist}
              />
            </View>
          </View>

          <View style={[styles.artCol, isWide && styles.artColWide]}>
            <HeroShowcaseImage />
          </View>
        </View>
      </View>

      {/* Torn-Paper Bottom Edge Transition into light curriculum surface */}
      <View style={[styles.waveWrap, { pointerEvents: "none" }]}>
        <Svg width="100%" height={28} viewBox="0 0 1200 44" preserveAspectRatio="none">
          <Path
            d="M0 44 L0 26 Q85 6 175 24 T350 22 Q435 36 520 18 T700 22 Q795 36 885 16 T1060 22 Q1130 32 1200 18 L1200 44 Z"
            fill={colors.surface}
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    position: "relative",
    backgroundColor: "#082114",
    overflow: "hidden",
    paddingTop: 18,
  },
  particle: {
    position: "absolute",
    zIndex: 1,
  },
  inner: {
    width: "100%",
    maxWidth: 960,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingBottom: 24,
    zIndex: 2,
    gap: 18,
  },
  innerWide: {
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 32,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  mhSquare: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "#85CC14",
    alignItems: "center",
    justifyContent: "center",
  },
  mhText: {
    fontFamily: fonts.h900,
    fontSize: 10,
    color: "#082114",
    letterSpacing: 0.4,
  },
  brandLabel: {
    fontFamily: fonts.b800,
    fontSize: 11,
    letterSpacing: 1.4,
    color: "#E2F7D5",
  },
  comingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(250,204,21,0.14)",
    borderWidth: 1,
    borderColor: "rgba(250,204,21,0.45)",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: "#FACC15",
  },
  comingBadgeText: {
    fontFamily: fonts.b800,
    fontSize: 11,
    letterSpacing: 1.1,
    color: "#FDE047",
  },
  heroGrid: {
    flexDirection: "column",
    gap: 20,
  },
  heroGridWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 28,
  },
  copyCol: {
    gap: 12,
  },
  copyColWide: {
    flex: 1.15,
  },
  artCol: {
    width: "100%",
  },
  artColWide: {
    flex: 0.9,
  },
  giantRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
  },
  giantComing: {
    fontFamily: fonts.h900,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.6,
    color: "#A3E635",
  },
  giantSoon: {
    fontFamily: fonts.h900,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.6,
    color: "#FACC15",
  },
  headline: {
    fontFamily: fonts.h800,
    fontSize: 23,
    lineHeight: 29,
    color: "#FFFFFF",
  },
  headlineAccent: {
    color: "#85CC14",
  },
  subhead: {
    fontFamily: fonts.b400,
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(236, 253, 245, 0.84)",
  },
  ctaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  sceneCard: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "#061C11",
  },
  waveWrap: {
    width: "100%",
    height: 28,
    marginBottom: -1,
  },
});
