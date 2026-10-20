import React, { useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { Image } from "@/src/components/Img";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Page, useStackBottom } from "@/src/components/Page";
import { Btn, Body, Chip, Pill, SectionTitle } from "@/src/components/ui";
import { ListSkeleton } from "@/src/components/Skeleton";
import { api } from "@/src/services/api";
import { servicesHero } from "@/src/data/services";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function Services() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useStackBottom();
  const [cat, setCat] = useState("all");
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
          <View style={{ gap: 16 }}>
            <View style={{ padding: 16, gap: 12, backgroundColor: colors.forest }}>
              <Pill dark label={servicesHero.badge} />
              <Text style={s.h1}>{servicesHero.title}</Text>
              <Body dark style={{ fontSize: 13 }}>{servicesHero.text}</Body>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                {servicesHero.trust.map((t) => (
                  <View key={t} style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                    <Lucide name="circle-check" size={14} color={colors.brandSecondary} />
                    <Text style={s.trust}>{t}</Text>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {servicesHero.stats.map((st) => (
                  <View key={st.l} style={s.stat}>
                    <Text style={s.statV}>{st.v}</Text>
                    <Text style={s.statL}>{st.l}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={{ paddingHorizontal: 16 }}>
              <SectionTitle badge="STRUCTURED SERVICES & SUB-CATEGORIES" title="Everything your farm needs," highlight="organized by category" size={24} />
            </View>
            <View style={{ height: 56, justifyContent: "center" }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, alignItems: "center" }}>
                <Chip testID="services-filter-all" label={`All Categories (8)`} active={cat === "all"} onPress={() => setCat("all")} />
                {(q.data ?? []).map((c) => <Chip key={c.id} testID={`services-filter-${c.id}`} label={`${c.n}. ${c.title} (${c.subs.length})`} active={cat === c.id} onPress={() => setCat(c.id)} />)}
              </ScrollView>
            </View>
            {q.isLoading ? <ListSkeleton count={3} height={200} /> : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 60)} style={{ paddingHorizontal: 16 }}>
            <Pressable testID={`service-category-${item.id}`} onPress={() => router.push(`/services/${item.id}`)} style={s.card}>
              <View style={{ height: 180 }}>
                <Image source={{ uri: item.image }} style={s.abs} contentFit="cover" transition={300} />
                <LinearGradient colors={["transparent", colors.overlay]} style={[s.abs, { justifyContent: "flex-end", padding: 16 }]}>
                  <Text style={s.catN}>CATEGORY {item.n} • {item.subs.length} SERVICES INCLUDED</Text>
                  <Text style={s.catTitle}>{item.title}</Text>
                </LinearGradient>
              </View>
              <View style={{ padding: 16, gap: 12 }}>
                <Body style={{ fontSize: 13 }}>{item.text}</Body>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {item.subs.map((sb) => <View key={sb.id} style={s.sub}><Text style={s.subText}>{sb.numeral}. {sb.title}</Text></View>)}
                </View>
                <Btn full label={item.cta} icon="arrow-up-right" onPress={() => router.push(`/services/${item.id}`)} />
              </View>
            </Pressable>
          </Animated.View>
        )}
        ListFooterComponent={
          <View style={{ paddingHorizontal: 16 }}>
            <Btn testID="services-terms-btn" variant="outline" full label="Terms & Conditions" icon="file-text" onPress={() => router.push("/legal")} />
          </View>
        }
      />
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  h1: { fontFamily: fonts.h900, fontSize: 34, color: c.white },
  trust: { fontFamily: fonts.b600, fontSize: 12, color: c.white },
  stat: { width: "47%", backgroundColor: c.whiteA10, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: c.whiteA20 },
  statV: { fontFamily: fonts.h900, fontSize: 20, color: c.brandSecondary },
  statL: { fontFamily: fonts.b500, fontSize: 11, color: c.whiteA85 },
  card: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 28, overflow: "hidden" },
  abs: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  catN: { fontFamily: fonts.b800, fontSize: 10, letterSpacing: 1, color: c.brandSecondary },
  catTitle: { fontFamily: fonts.h800, fontSize: 24, color: c.white },
  sub: { backgroundColor: c.brandTertiary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  subText: { fontFamily: fonts.b600, fontSize: 11, color: c.onBrandTertiary },
}));
