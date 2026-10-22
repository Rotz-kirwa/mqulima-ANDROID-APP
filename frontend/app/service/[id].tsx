import React from "react";
import { Linking, ScrollView, Text, View } from "react-native";
import { Image } from "@/src/components/Img";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Page } from "@/src/components/Page";
import { Btn, Body, Pill } from "@/src/components/ui";
import { Skeleton } from "@/src/components/Skeleton";
import { api } from "@/src/services/api";
import { contactInfo } from "@/src/data/home";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function ServiceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const q = useQuery({ queryKey: ["subService", id], queryFn: () => api.getSubService(id) });
  const d = q.data;

  if (q.isLoading) {
    return (
      <Page title="Service">
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton style={{ height: 240, borderRadius: 24 }} />
          <Skeleton style={{ height: 24, width: "70%" }} />
          <Skeleton style={{ height: 80 }} />
        </View>
      </Page>
    );
  }
  if (!d) {
    return (
      <Page title="Service">
        <View style={{ padding: 24, alignItems: "center", gap: 12 }}>
          <Text style={s.h2}>Service not found</Text>
          <Btn label="All Services" onPress={() => router.replace("/services")} />
        </View>
      </Page>
    );
  }
  const { sub, category, price } = d;
  const request = () => router.push({ pathname: "/service-request", params: { service: sub.title, category: category.title } });
  const related = category.subs.filter((x) => x.id !== sub.id);

  return (
    <Page title={category.title} testID="service-detail-screen">
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
        <View style={{ height: 260 }}>
          <Image source={{ uri: sub.image }} style={s.abs} contentFit="cover" transition={300} />
          <LinearGradient colors={["transparent", colors.overlay]} style={[s.abs, { justifyContent: "flex-end", padding: 16, gap: 8 }]}>
            <Pill dark label={`SUB-SERVICE ${sub.numeral} • ${sub.tag}`} />
            <Text style={s.h1} testID="service-detail-title">{sub.title}</Text>
          </LinearGradient>
        </View>
        <View style={{ padding: 16, gap: 20 }}>
          <View style={s.priceCard} testID="service-detail-price">
            <View style={s.priceIcon}><Lucide name="tag" size={20} color={colors.onBrandTertiary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.priceLabel}>INDICATIVE PRICING</Text>
              <Text style={s.price}>{price}</Text>
              <Text style={s.muted}>Final quote confirmed after assessment • Pay via M-Pesa</Text>
            </View>
          </View>
          <Body style={{ fontSize: 15, lineHeight: 24 }}>{sub.text}</Body>

          <View style={{ gap: 12 }}>
            <Text style={s.h2}>How it works</Text>
            {d.steps.map((st, i) => (
              <Animated.View key={st.title} entering={FadeInDown.delay(i * 70)} style={s.step}>
                <View style={s.stepN}><Text style={s.stepNText}>{i + 1}</Text></View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.stepTitle}>{st.title}</Text>
                  <Text style={s.muted}>{st.text}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          <View style={s.card}>
            <Text style={s.h3}>What&apos;s included</Text>
            {d.includes.map((x) => (
              <View key={x} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Lucide name="circle-check" size={18} color={colors.brandPrimary} />
                <Text style={s.incl}>{x}</Text>
              </View>
            ))}
          </View>

          <View style={s.help}>
            <Text style={[s.h3, { color: colors.white }]}>Have questions first?</Text>
            <Body dark style={{ fontSize: 13 }}>Talk to our {category.title.toLowerCase()} desk on WhatsApp or call {contactInfo.phone}.</Body>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Btn testID="service-detail-whatsapp" small icon="message-circle" label="WhatsApp" onPress={() => Linking.openURL(contactInfo.whatsapp)} />
              <Btn testID="service-detail-call" small variant="ghostDark" icon="phone" label="Call" onPress={() => Linking.openURL(`tel:${contactInfo.phoneRaw}`)} />
            </View>
          </View>

          {related.length ? (
            <View style={{ gap: 10 }}>
              <Text style={s.h2}>More in {category.title}</Text>
              {related.map((r) => (
                <Btn key={r.id} testID={`service-related-${r.id}`} full variant="outline" icon="chevron-right" label={r.title} onPress={() => router.replace(`/service/${r.id}`)} />
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
      <View style={[s.bar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.priceLabel}>FROM</Text>
          <Text style={s.barPrice} numberOfLines={1}>{price}</Text>
        </View>
        <Btn testID="service-detail-request-btn" variant="green" label={sub.cta} onPress={request} />
      </View>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  abs: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  h1: { fontFamily: fonts.h900, fontSize: 30, lineHeight: 34, color: c.white },
  h2: { fontFamily: fonts.h900, fontSize: 20, color: c.onSurface },
  h3: { fontFamily: fonts.h800, fontSize: 16, color: c.onSurface },
  muted: { fontFamily: fonts.b500, fontSize: 12, lineHeight: 18, color: c.muted },
  priceCard: { flexDirection: "row", gap: 14, alignItems: "center", backgroundColor: c.brandTertiary, borderRadius: 20, padding: 16 },
  priceIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.white, alignItems: "center", justifyContent: "center" },
  priceLabel: { fontFamily: fonts.b800, fontSize: 10, letterSpacing: 1, color: c.onBrandTertiary },
  price: { fontFamily: fonts.h900, fontSize: 18, color: c.onSurface, marginVertical: 2 },
  step: { flexDirection: "row", gap: 14, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 18, padding: 14 },
  stepN: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.forest, alignItems: "center", justifyContent: "center" },
  stepNText: { fontFamily: fonts.h900, fontSize: 14, color: c.brandSecondary },
  stepTitle: { fontFamily: fonts.h700, fontSize: 15, color: c.onSurface },
  card: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 20, padding: 16, gap: 12 },
  incl: { fontFamily: fonts.b600, fontSize: 14, color: c.onSurfaceSecondary },
  help: { backgroundColor: c.forest, borderRadius: 24, padding: 20, gap: 10 },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 12, backgroundColor: c.white, borderTopWidth: 1, borderTopColor: c.border },
  barPrice: { fontFamily: fonts.h900, fontSize: 15, color: c.onSurface },
}));
