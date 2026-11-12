import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "@/src/components/Img";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, {
  Easing,
  FadeInDown,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Page, useStackBottom } from "@/src/components/Page";
import { Btn, Body, Pill, SectionTitle } from "@/src/components/ui";
import { tools, toolsHero, toolsIntro } from "@/src/data/tools";
import { fonts, makeStyles, useTheme } from "@/src/theme";

function StatsMarquee() {
  const s = useStyles();
  const [setWidth, setSetWidth] = useState(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (setWidth <= 0) return;
    cancelAnimation(translateX);
    translateX.value = 0;
    translateX.value = withRepeat(
      withTiming(-setWidth, {
        duration: Math.max(10000, Math.round(setWidth * 24)),
        easing: Easing.linear,
      }),
      -1,
      false
    );
    return () => cancelAnimation(translateX);
  }, [setWidth, translateX]);

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={s.marqueeWrap} testID="tools-stats-marquee">
      <Animated.View style={[s.marqueeTrack, trackStyle]}>
        {[0, 1, 2].map((dupIdx) => (
          <View
            key={dupIdx}
            onLayout={dupIdx === 0 ? (e) => setSetWidth(Math.round(e.nativeEvent.layout.width)) : undefined}
            style={s.marqueeSet}
          >
            {toolsHero.stats.map((st) => (
              <View key={`${dupIdx}-${st.l}`} style={s.stat}>
                <Text style={s.statV}>{st.v}</Text>
                <Text style={s.statL}>{st.l}</Text>
              </View>
            ))}
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

export default function Tools() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useStackBottom();
  return (
    <Page title="Tools" testID="tools-screen">
      <ScrollView contentContainerStyle={{ paddingBottom: bottom }}>
        <View style={s.hero}>
          <Image source={{ uri: toolsHero.image }} style={s.abs} contentFit="cover" transition={300} />
          <LinearGradient
            colors={["rgba(11,33,23,0.55)", colors.overlay]}
            style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 22, gap: 12 }}
          >
            <Pill dark label={toolsHero.badge} />
            <Text style={s.h1}>{toolsHero.title} <Text style={{ color: colors.brandSecondary }}>{toolsHero.highlight}</Text> {toolsHero.title2}</Text>
            <Body dark style={{ fontSize: 13 }}>{toolsHero.text}</Body>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Btn testID="tools-open-console-btn" small label="Open Control Console" onPress={() => router.push("/tools/weather")} />
              <Btn testID="tools-browse-supplies-btn" small variant="yellow" icon={null} label="Browse Farm Supplies" onPress={() => router.navigate("/(tabs)/shop")} />
            </View>
          </LinearGradient>
        </View>
        <StatsMarquee />
        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          <SectionTitle badge={toolsIntro.badge} title={toolsIntro.title} highlight={toolsIntro.highlight} size={24} />
          <Body style={{ fontSize: 13 }}>{toolsIntro.text}</Body>
          {tools.map((t, i) => (
            <Animated.View key={t.id} entering={FadeInDown.delay(i * 60)}>
              <Pressable testID={`tool-card-${t.id}`} onPress={() => router.push(t.id === "ai" ? "/ai" : `/tools/${t.id}`)} style={({ pressed }) => [s.card, { opacity: pressed ? 0.9 : 1 }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={s.icon}><Lucide name={t.icon as any} size={22} color={colors.onBrandTertiary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.n}>TOOL {t.n}</Text>
                    <Text style={s.title}>{t.title}</Text>
                  </View>
                </View>
                <Body style={{ fontSize: 13 }}>{t.text}</Body>
                <Btn small label={t.cta} onPress={() => router.push(t.id === "ai" ? "/ai" : `/tools/${t.id}`)} />
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  hero: { overflow: "hidden" },
  abs: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  h1: { fontFamily: fonts.h900, fontSize: 32, lineHeight: 36, color: c.white },
  marqueeWrap: { overflow: "hidden", width: "100%", paddingVertical: 16 },
  marqueeTrack: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start" },
  marqueeSet: { flexDirection: "row", alignItems: "center", gap: 10, paddingRight: 10, flexShrink: 0 },
  stat: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, flexShrink: 0 },
  statV: { fontFamily: fonts.h900, fontSize: 20, color: c.onSurface },
  statL: { fontFamily: fonts.b600, fontSize: 11, color: c.muted },
  card: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 24, padding: 20, gap: 12 },
  icon: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  n: { fontFamily: fonts.b800, fontSize: 11, letterSpacing: 1, color: c.limeText },
  title: { fontFamily: fonts.h800, fontSize: 18, color: c.onSurface },
}));
