import React, { useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { Image } from "@/src/components/Img";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Page, useStackBottom } from "@/src/components/Page";
import { Btn, Body, Chip, Pill } from "@/src/components/ui";
import { ListSkeleton } from "@/src/components/Skeleton";
import { api } from "@/src/services/api";
import { servicesHero } from "@/src/data/services";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const HERO_IMG = "https://www.mqulima.com/images/services/crop_services_cat.webp";

export default function Services() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useStackBottom();
  const [cat, setCat] = useState("all");
  const [more, setMore] = useState(false);
  const q = useQuery({ queryKey: ["serviceCategories"], queryFn: api.getServiceCategories });
  const data = (q.data ?? []).filter((c) => cat === "all" || c.id === cat);

  return (
    <Page title="Services" testID="services-screen">
      <FlatList
        data={q.isLoading ? [] : data}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingBottom: bottom, gap: 16 }}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={q.refetch} tintColor={colors.brandPrimary} colors={[colors.brandPrimary]} />}
        ListHeaderComponent={
          <View style={{ gap: 20 }}>
            {/* Hero */}
            <View style={s.hero}>
              <Image source={{ uri: HERO_IMG }} style={s.abs} contentFit="cover" transition={300} />
              <LinearGradient colors={["rgba(11,33,23,0.35)", "rgba(11,33,23,0.75)", colors.forestDeep]} locations={[0, 0.45, 1]} style={[s.abs, s.heroInner]}>
                <Pill dark label={servicesHero.badge} />
                <Text style={s.h1}>{servicesHero.title}</Text>
                <Text style={s.lead}>Every kind of support agriculture needs — one request away.</Text>
                <Text style={s.heroText} numberOfLines={more ? undefined : 3}>{servicesHero.text}</Text>
                <Pressable testID="services-read-more" onPress={() => setMore((m) => !m)} hitSlop={8} style={{ alignSelf: "flex-start", minHeight: 32, justifyContent: "center" }}>
                  <Text style={s.readMore}>{more ? "Show less" : "Read more"}</Text>
                </Pressable>
                <View style={s.trustRow}>
                  {servicesHero.trust.map((t) => (
                    <View key={t} style={s.trustPill}>
                      <Lucide name="circle-check" size={13} color={colors.brandSecondary} />
                      <Text style={s.trust}>{t}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </View>

            {/* Stats */}
            <View style={s.statsCard} testID="services-stats">
              {servicesHero.stats.map((st, i) => (
                <View key={st.l} style={[s.stat, i % 2 === 1 && s.statLeftBorder, i > 1 && s.statTopBorder]}>
                  <Text style={s.statV}>{st.v}</Text>
                  <Text style={s.statL}>{st.l}</Text>
                </View>
              ))}
            </View>

            {/* Section heading + filters */}
            <View style={{ paddingHorizontal: 16, gap: 8 }}>
              <Text style={s.kicker}>STRUCTURED SERVICES & SUB-CATEGORIES</Text>
              <Text style={s.h2}>Everything your farm needs, <Text style={{ color: colors.limeText }}>organized by category</Text></Text>
            </View>
            <View style={s.chipRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, alignItems: "center" }}>
                <Chip testID="services-filter-all" label="All (8)" active={cat === "all"} onPress={() => setCat("all")} />
                {(q.data ?? []).map((c) => <Chip key={c.id} testID={`services-filter-${c.id}`} label={`${c.title} (${c.subs.length})`} active={cat === c.id} onPress={() => setCat(c.id)} />)}
              </ScrollView>
            </View>
            {q.isLoading ? <ListSkeleton count={3} height={200} /> : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 4) * 60)} style={{ paddingHorizontal: 16 }}>
            <Pressable testID={`service-category-${item.id}`} onPress={() => router.push(`/services/${item.id}`)} style={({ pressed }) => [s.card, pressed && { opacity: 0.95 }]}>
              <View style={{ height: 170 }}>
                <Image source={{ uri: item.image }} style={s.abs} contentFit="cover" transition={300} />
                <LinearGradient colors={["transparent", colors.overlay]} style={[s.abs, { justifyContent: "space-between", padding: 16 }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <View style={s.numBadge}><Text style={s.numText}>{item.n}</Text></View>
                    <View style={s.countBadge}><Text style={s.countText}>{item.subs.length} services</Text></View>
                  </View>
                  <Text style={s.catTitle}>{item.title}</Text>
                </LinearGradient>
              </View>
              <View style={{ padding: 16, gap: 14 }}>
                <Body style={{ fontSize: 13, lineHeight: 20 }}>{item.text}</Body>
                <View style={{ gap: 8 }}>
                  {item.subs.slice(0, 3).map((sb) => (
                    <View key={sb.id} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Lucide name="check" size={16} color={colors.brandPrimary} />
                      <Text style={s.subText} numberOfLines={1}>{sb.title}</Text>
                    </View>
                  ))}
                  {item.subs.length > 3 ? <Text style={s.moreSubs}>+{item.subs.length - 3} more</Text> : null}
                </View>
                <Btn full label={item.cta} icon="arrow-up-right" onPress={() => router.push(`/services/${item.id}`)} />
              </View>
            </Pressable>
          </Animated.View>
        )}
        ListFooterComponent={
          <View style={{ paddingHorizontal: 16 }}>
            <Pressable testID="services-terms-btn" onPress={() => router.push("/legal")} style={s.terms}>
              <Lucide name="file-text" size={18} color={colors.muted} />
              <Text style={s.termsText}>Service Terms & Conditions</Text>
              <Lucide name="chevron-right" size={18} color={colors.subtle} />
            </Pressable>
          </View>
        }
      />
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  abs: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  hero: { minHeight: 440, backgroundColor: c.forestDeep },
  heroInner: { position: "relative", minHeight: 440, padding: 20, paddingTop: 28, paddingBottom: 56, justifyContent: "flex-end", gap: 10 },
  h1: { fontFamily: fonts.h900, fontSize: 40, lineHeight: 44, color: c.white, letterSpacing: -0.5 },
  lead: { fontFamily: fonts.h700, fontSize: 18, lineHeight: 24, color: c.brandSecondary },
  heroText: { fontFamily: fonts.b400, fontSize: 13, lineHeight: 20, color: c.whiteA85 },
  readMore: { fontFamily: fonts.b700, fontSize: 13, color: c.white, textDecorationLine: "underline" },
  trustRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  trustPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: c.whiteA10, borderWidth: 1, borderColor: c.whiteA20, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  trust: { fontFamily: fonts.b600, fontSize: 12, color: c.white },
  statsCard: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: 16, marginTop: -36, backgroundColor: c.white, borderRadius: 24, borderWidth: 1, borderColor: c.border, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  stat: { width: "50%", paddingVertical: 16, paddingHorizontal: 18, gap: 2 },
  statLeftBorder: { borderLeftWidth: 1, borderLeftColor: c.divider },
  statTopBorder: { borderTopWidth: 1, borderTopColor: c.divider },
  statV: { fontFamily: fonts.h900, fontSize: 22, color: c.onSurface },
  statL: { fontFamily: fonts.b600, fontSize: 12, color: c.muted },
  kicker: { fontFamily: fonts.b800, fontSize: 11, letterSpacing: 1, color: c.onBrandTertiary },
  h2: { fontFamily: fonts.h900, fontSize: 24, lineHeight: 29, color: c.onSurface },
  chipRow: { height: 56, justifyContent: "center" },
  card: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 28, overflow: "hidden" },
  numBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  numText: { fontFamily: fonts.h900, fontSize: 14, color: c.white },
  countBadge: { alignSelf: "flex-start", backgroundColor: c.whiteA85, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  countText: { fontFamily: fonts.b700, fontSize: 12, color: c.onSurface },
  catTitle: { fontFamily: fonts.h800, fontSize: 24, lineHeight: 28, color: c.white },
  subText: { flex: 1, fontFamily: fonts.b600, fontSize: 13, color: c.onSurfaceSecondary },
  moreSubs: { fontFamily: fonts.b700, fontSize: 12, color: c.brandPrimary, marginLeft: 26 },
  terms: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 56, paddingHorizontal: 16, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 18 },
  termsText: { flex: 1, fontFamily: fonts.b700, fontSize: 14, color: c.onSurface },
}));
