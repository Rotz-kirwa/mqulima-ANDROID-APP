import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Image } from "@/src/components/Img";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Page, useStackBottom } from "@/src/components/Page";
import { Btn, Body, Pill } from "@/src/components/ui";
import { ListSkeleton } from "@/src/components/Skeleton";
import { api } from "@/src/services/api";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function ServiceCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useStackBottom();
  const q = useQuery({ queryKey: ["serviceCategory", id], queryFn: () => api.getServiceCategory(id) });
  const c = q.data;

  return (
    <Page title={c?.title ?? "Services"} testID="service-category-screen">
      {q.isLoading ? (
        <View style={{ paddingTop: 16 }}><ListSkeleton count={3} height={180} /></View>
      ) : !c ? (
        <View style={{ padding: 24, gap: 12, alignItems: "center" }}>
          <Text style={s.h2}>Category not found</Text>
          <Btn label="All Services" onPress={() => router.replace("/services")} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: bottom, gap: 16 }}>
          <View style={{ height: 240 }}>
            <Image source={{ uri: c.image }} style={s.abs} contentFit="cover" transition={300} />
            <LinearGradient colors={["transparent", colors.overlay]} style={[s.abs, { justifyContent: "flex-end", padding: 16, gap: 6 }]}>
              <Pill dark label={`Service Pillar ${c.n}`} />
              <Text style={s.h1}>{c.title}</Text>
            </LinearGradient>
          </View>
          <View style={{ paddingHorizontal: 16, gap: 8 }}>
            <Body>{c.text}</Body>
            <Text style={s.h2}>{c.n}. Sub-services in {c.title}</Text>
            <Text style={s.muted}>{c.subs.length} specialist services available to request directly</Text>
          </View>
          {c.subs.map((sb, i) => (
            <Animated.View key={sb.id} entering={FadeInDown.delay(i * 70)} style={[s.card, { marginHorizontal: 16 }]} testID={`sub-service-${sb.id}`}>
              <Image source={{ uri: sb.image }} style={{ width: "100%", height: 170 }} contentFit="cover" transition={300} />
              <View style={{ padding: 16, gap: 10 }}>
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <Text style={s.kicker}>SUB-SERVICE {sb.numeral}</Text>
                  <Pill label={sb.tag} />
                </View>
                <Text style={s.title}>{sb.title}</Text>
                <Body style={{ fontSize: 13 }}>{sb.text}</Body>
                <Btn testID={`sub-service-request-${sb.id}`} full variant="green" label={sb.cta} onPress={() => router.push({ pathname: "/service-request", params: { service: sb.title, category: c.title } })} />
              </View>
            </Animated.View>
          ))}
        </ScrollView>
      )}
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  abs: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  h1: { fontFamily: fonts.h900, fontSize: 30, color: c.white },
  h2: { fontFamily: fonts.h900, fontSize: 20, color: c.onSurface, marginTop: 8 },
  muted: { fontFamily: fonts.b500, fontSize: 12, color: c.muted },
  card: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 24, overflow: "hidden" },
  kicker: { fontFamily: fonts.b800, fontSize: 10, letterSpacing: 1, color: c.limeText },
  title: { fontFamily: fonts.h800, fontSize: 20, color: c.onSurface },
}));
