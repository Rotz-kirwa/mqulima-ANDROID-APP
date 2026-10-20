import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Image } from "@/src/components/Img";
import { useRouter } from "expo-router";
import { Page, useStackBottom } from "@/src/components/Page";
import { Btn, Body, SectionTitle } from "@/src/components/ui";
import { about } from "@/src/data/pages";
import { stats, whyWeExist } from "@/src/data/home";
import { fonts, makeStyles } from "@/src/theme";

export default function About() {
  const s = useStyles();
  const router = useRouter();
  const bottom = useStackBottom();
  return (
    <Page title="About" testID="about-screen">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: bottom }}>
        <SectionTitle badge={about.badge} title={about.title} />
        <Text style={s.tag}>{about.tagline}</Text>
        <Image source={{ uri: about.image }} style={s.img} contentFit="cover" transition={300} />
        {about.paras.map((p) => <Body key={p.slice(0, 12)}>{p}</Body>)}
        {about.pillars.map((p) => (
          <View key={p.title} style={s.card}>
            <Text style={s.title}>{p.title}</Text>
            <Body style={{ fontSize: 13 }}>{p.text}</Body>
          </View>
        ))}
        <SectionTitle badge={whyWeExist.badge} title={whyWeExist.title} highlight={whyWeExist.highlight} size={24} />
        {whyWeExist.paras.map((p) => <Body key={p.slice(0, 12)}>{p}</Body>)}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {stats.map((st) => (
            <View key={st.label} style={[s.card, { flex: 1, padding: 12 }]}>
              <Text style={s.v}>{st.value}</Text>
              <Text style={s.l}>{st.label}</Text>
            </View>
          ))}
        </View>
        <Btn testID="about-contact-btn" variant="green" full label="Partner with us" onPress={() => router.push("/contact")} />
      </ScrollView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  tag: { fontFamily: fonts.b500, fontStyle: "italic", fontSize: 14, color: c.brandPrimary, marginTop: -8 },
  img: { width: "100%", aspectRatio: 4 / 3, borderRadius: 28 },
  card: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 24, padding: 20, gap: 6 },
  title: { fontFamily: fonts.h800, fontSize: 17, color: c.onSurface },
  v: { fontFamily: fonts.h900, fontSize: 20, color: c.onSurface },
  l: { fontFamily: fonts.b700, fontSize: 10, color: c.onBrandTertiary, textTransform: "uppercase" },
}));
