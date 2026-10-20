import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Image } from "@/src/components/Img";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Page, useStackBottom } from "@/src/components/Page";
import { Skeleton } from "@/src/components/Skeleton";
import { Btn, Body, Pill, Avatar } from "@/src/components/ui";
import { ArticleCard } from "@/src/components/Cards";
import { api } from "@/src/services/api";
import { articles } from "@/src/data/articles";
import { avatar } from "@/src/data/home";
import { fonts, makeStyles } from "@/src/theme";

export default function ArticleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useStyles();
  const router = useRouter();
  const bottom = useStackBottom();
  const q = useQuery({ queryKey: ["article", id], queryFn: () => api.getArticle(id) });
  const a = q.data;

  return (
    <Page title="Mqulima News" testID="article-detail-screen">
      {q.isLoading ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton style={{ height: 220, borderRadius: 24 }} />
          <Skeleton style={{ height: 28, width: "90%" }} />
          <Skeleton style={{ height: 14 }} />
          <Skeleton style={{ height: 14 }} />
        </View>
      ) : !a ? (
        <View style={{ padding: 24, gap: 12, alignItems: "center" }}>
          <Text style={s.title}>Article not found</Text>
          <Btn label="Back to News" onPress={() => router.navigate("/(tabs)/news")} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: bottom }}>
          <Image source={{ uri: a.image }} style={{ width: "100%", aspectRatio: 16 / 10 }} contentFit="cover" transition={300} />
          <View style={{ padding: 16, gap: 14 }}>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <Pill label={a.category} />
              <Text style={s.meta}>{a.readTime}</Text>
            </View>
            <Text style={s.title} testID="article-title">{a.title}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Avatar uri={avatar("Mqulima Desk")} size={36} />
              <View>
                <Text style={s.author}>Mqulima Desk • Editorial Desk</Text>
                <Text style={s.meta}>{a.date} • {a.reads} reads</Text>
              </View>
            </View>
            <Text style={s.lead}>{a.excerpt}</Text>
            {a.body.map((p) => <Body key={p.slice(0, 16)} style={{ fontSize: 15, lineHeight: 25 }}>{p}</Body>)}
            <View style={s.cta}>
              <Text style={s.ctaTitle}>Need expert help on this?</Text>
              <Body dark style={{ fontSize: 13 }}>Our certified agronomists and vets are one request away.</Body>
              <Btn testID="article-request-service-btn" small label="Request a Service" onPress={() => router.push("/services")} />
            </View>
            <Text style={s.h3}>More from the Journal</Text>
            {articles.filter((x) => x.id !== a.id).slice(0, 2).map((x, i) => <ArticleCard key={x.id} a={x} index={i} />)}
          </View>
        </ScrollView>
      )}
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  title: { fontFamily: fonts.h900, fontSize: 26, lineHeight: 31, color: c.onSurface },
  meta: { fontFamily: fonts.b600, fontSize: 12, color: c.muted },
  author: { fontFamily: fonts.h700, fontSize: 13, color: c.onSurface },
  lead: { fontFamily: fonts.b600, fontSize: 16, lineHeight: 24, color: c.onSurface },
  cta: { backgroundColor: c.forest, borderRadius: 24, padding: 20, gap: 10, marginTop: 8 },
  ctaTitle: { fontFamily: fonts.h800, fontSize: 18, color: c.white },
  h3: { fontFamily: fonts.h900, fontSize: 20, color: c.onSurface, marginTop: 8 },
}));
