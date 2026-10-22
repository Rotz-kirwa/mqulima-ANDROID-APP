import React from "react";
import { FlatList, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Image } from "@/src/components/Img";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { TopBar } from "@/src/components/TopBar";
import { Btn, Body, Pill, SectionTitle, Avatar } from "@/src/components/ui";
import { ArticleCard } from "@/src/components/Cards";
import { Skeleton, ListSkeleton } from "@/src/components/Skeleton";
import { Footer } from "@/src/components/Footer";
import { useTabBottom } from "@/src/components/Page";
import { api } from "@/src/services/api";
import * as H from "@/src/data/home";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function Home() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const bottom = useTabBottom();
  const featured = useQuery({ queryKey: ["featured"], queryFn: api.getFeaturedProducts });
  const latest = useQuery({ queryKey: ["articles", "All"], queryFn: () => api.getArticles("All") });
  const services = useQuery({ queryKey: ["serviceCategories"], queryFn: api.getServiceCategories });
  const courses = useQuery({ queryKey: ["courses"], queryFn: api.getCourses });
  const serviceCards = (services.data ?? []).slice(0, 6).map(c => ({ ...c, category: c.id, items: c.subs.map(item => item.title), icon: H.homeServiceCards.find(original => original.category === c.id)?.icon || "sprout" }));
  const cardW = (width - 32 - 12) / 2;

  return (
    <View style={s.root} testID="home-screen">
      <TopBar />
      <ScrollView contentContainerStyle={{ paddingBottom: 0 }} showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View style={s.hero} testID="home-hero">
          <Image source={{ uri: H.hero.image }} style={StyleSheetAbs} contentFit="cover" transition={400} priority="high" />
          <LinearGradient colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.55)"]} style={StyleSheetAbs} />
          <View style={s.heroInner}>
            <Animated.View entering={FadeInDown.duration(500)} style={s.heroBadge}>
              <Lucide name="sparkles" size={14} color={colors.mint} />
              <Text style={s.heroBadgeText}>{H.hero.badge}</Text>
            </Animated.View>
            <Animated.Text entering={FadeInDown.delay(120).duration(500)} style={s.heroTitle}>
              {H.hero.titleA} <Text style={{ color: colors.mint }}>{H.hero.titleHighlight}</Text>,{"\n"}{H.hero.titleB}
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(240).duration(500)} style={s.heroSub}>{H.hero.subtext}</Animated.Text>
            <Animated.View entering={FadeInDown.delay(360).duration(500)} style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <Pressable testID="hero-join-us-btn" onPress={() => router.push("/auth/sign-up")} style={({ pressed }) => [s.heroBtn, { backgroundColor: colors.orange, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                <Text style={s.heroBtnText}>JOIN US</Text>
                <Lucide name="arrow-right" size={14} color={colors.white} />
              </Pressable>
              <Pressable testID="hero-explore-btn" onPress={() => router.push("/tools")} style={({ pressed }) => [s.heroBtn, { backgroundColor: colors.greenDark, borderWidth: 1, borderColor: "rgba(74,222,128,0.4)", transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                <Text style={s.heroBtnText}>EXPLORE ECOSYSTEM</Text>
              </Pressable>
            </Animated.View>
          </View>
          <Lucide name="chevron-down" size={20} color="rgba(255,255,255,0.4)" style={{ position: "absolute", bottom: 16, alignSelf: "center" }} />
        </View>

        {/* WELCOME */}
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SectionTitle title={H.welcome.title} highlight={H.welcome.highlight} />
          <Body>{H.welcome.p1}</Body>
          <Body>{H.welcome.p2}</Body>
          <View style={s.quoteCard} testID="who-is-mqulima">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Lucide name="sparkles" size={20} color={colors.brandSecondary} />
              <Text style={s.quoteTitle}>{H.welcome.quoteTitle}</Text>
            </View>
            <Text style={s.quote}>{H.welcome.quote}</Text>
          </View>
          <View style={s.imgCard}>
            <Image source={{ uri: H.welcome.image }} style={StyleSheetAbs} contentFit="cover" transition={300} />
            <LinearGradient colors={["transparent", colors.overlay]} style={[StyleSheetAbs, { justifyContent: "flex-end", padding: 24 }]}>
              <Text style={s.imgKicker}>{H.welcome.imageKicker}</Text>
              <Text style={s.imgTitle}>{H.welcome.imageTitle}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* ECOSYSTEM */}
        <View style={[s.section, { backgroundColor: colors.forest }]}>
          <SectionTitle dark badge={H.ecosystemIntro.badge} title={H.ecosystemIntro.title} highlight={H.ecosystemIntro.highlight} />
          <Body dark style={{ fontSize: 13 }}>{H.ecosystemIntro.text}</Body>
          {H.ecosystem.map((e, i) => (
            <Animated.View key={e.n} entering={FadeInUp.delay(i * 80)} style={s.ecoCard} testID={`ecosystem-card-${e.n}`}>
              <View style={s.ecoEmoji}><Text style={{ fontSize: 20 }}>{e.emoji}</Text></View>
              <Text style={s.ecoN}>{e.n}</Text>
              <Text style={s.ecoTitle}>{e.title.toUpperCase()}</Text>
              <Text style={s.ecoText}>{e.text}</Text>
              <Btn testID={`ecosystem-cta-${e.n}`} small label={e.cta} onPress={() => router.push(e.route as any)} style={{ marginTop: 16 }} />
            </Animated.View>
          ))}
        </View>

        {/* FEATURED COLLECTION */}
        <View style={[s.section, { backgroundColor: colors.surface, paddingHorizontal: 0 }]}>
          <View style={{ paddingHorizontal: 16 }}>
            <SectionTitle badge="FEATURED COLLECTION" title="Farm" highlight="Essentials" size={26} />
          </View>
          {featured.isLoading ? (
            <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16 }}>
              <Skeleton style={{ width: cardW, height: cardW * 1.33 }} />
              <Skeleton style={{ width: cardW, height: cardW * 1.33 }} />
            </View>
          ) : (
            <FlatList
              testID="featured-collection-list"
              horizontal
              data={featured.data}
              keyExtractor={(p) => p.id}
              showsHorizontalScrollIndicator={false}
              snapToInterval={cardW + 12}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item }) => (
                <Pressable testID={`featured-${item.id}`} onPress={() => router.push(`/product/${item.id}`)} style={[s.featCard, { width: cardW, height: cardW * 1.33 }]}>
                  <Image source={{ uri: item.image }} style={{ flex: 1, margin: 10, marginBottom: 36 }} contentFit="contain" transition={250} />
                  <LinearGradient colors={["rgba(255,255,255,0)", colors.white, colors.white]} style={s.featLabel}>
                    <Text style={s.featName} numberOfLines={2}>{item.name}</Text>
                  </LinearGradient>
                </Pressable>
              )}
            />
          )}
          <View style={{ paddingHorizontal: 16, alignItems: "center" }}>
            <Pressable testID="explore-agroshop-btn" onPress={() => router.navigate("/(tabs)/shop")} style={({ pressed }) => [s.greenBtn, { opacity: pressed ? 0.9 : 1 }]}>
              <Text style={s.greenBtnText}>EXPLORE AGROSHOP</Text>
              <Lucide name="arrow-right" size={16} color={colors.white} />
            </Pressable>
          </View>
        </View>

        {/* SERVICES */}
        <View style={[s.section, { backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border }]}>
          <SectionTitle badge={H.servicesIntro.badge} title={H.servicesIntro.title} highlight={H.servicesIntro.highlight} />
          <Body>{H.servicesIntro.text}</Body>
          {serviceCards.map((c) => (
            <View key={c.title} style={s.svcCard} testID={`home-service-card-${c.category}`}>
              <View style={{ height: 200 }}>
                <Image source={{ uri: c.image }} style={StyleSheetAbs} contentFit="cover" transition={300} />
                <LinearGradient colors={["transparent", colors.overlaySoft, colors.overlay]} style={StyleSheetAbs} />
                <View style={s.svcIcon}><Lucide name={c.icon as any} size={20} color={colors.white} /></View>
                <View style={s.svcCount}><Text style={s.svcCountText}>{c.items.length} services</Text></View>
                <Text style={s.svcTitle}>{c.title}</Text>
              </View>
              <View style={{ padding: 20, gap: 10 }}>
                <Body style={{ fontSize: 13 }}>{c.text}</Body>
                {c.items.map((it) => (
                  <View key={it} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Lucide name="check" size={16} color={colors.brandPrimary} />
                    <Text style={s.svcItem}>{it}</Text>
                  </View>
                ))}
                <Btn testID={`home-service-view-${c.category}`} full label="View Services" icon="arrow-up-right" onPress={() => router.push(`/services/${c.category}`)} style={{ marginTop: 8 }} />
              </View>
            </View>
          ))}
        </View>

        {/* ACADEMY */}
        <View style={[s.section, { backgroundColor: colors.white }]}>
          <SectionTitle badge={H.academyIntro.badge} title={H.academyIntro.title} highlight={H.academyIntro.highlight} />
          <Body>{H.academyIntro.text}</Body>
          <Btn testID="home-visit-academy-btn" label="Visit Academy" onPress={() => router.push("/academy")} />
          {(courses.data ?? []).map((st) => (
            <View key={st.n} style={s.stepCard}>
              <Text style={s.stepN}>{st.n}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.stepTitle}>{st.title}</Text>
                <Body style={{ fontSize: 13, marginTop: 4 }}>{st.text}</Body>
              </View>
            </View>
          ))}
        </View>

        {/* WHY WE EXIST */}
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <SectionTitle badge={H.whyWeExist.badge} title={H.whyWeExist.title} highlight={H.whyWeExist.highlight} />
          <Text style={s.whySub}>{H.whyWeExist.sub.toUpperCase()}</Text>
          {H.whyWeExist.paras.map((p) => <Body key={p.slice(0, 12)}>{p}</Body>)}
          <Text style={s.whyClose}>{H.whyWeExist.closing.toUpperCase()}</Text>
          <Btn testID="home-partner-btn" label="Partner with us" onPress={() => router.push("/contact")} />
          <View style={s.imgCard}>
            <Image source={{ uri: H.whyWeExist.image }} style={StyleSheetAbs} contentFit="cover" transition={300} />
            <LinearGradient colors={["transparent", colors.overlay]} style={[StyleSheetAbs, { justifyContent: "flex-end", padding: 24 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Lucide name="trending-up" size={16} color={colors.brandSecondary} />
                <Text style={s.imgKicker}>{H.whyWeExist.imageKicker.toUpperCase()}</Text>
              </View>
              <Text style={s.imgTitle}>{H.whyWeExist.imageTitle.toUpperCase()}</Text>
              <Text style={{ color: colors.whiteA85, fontFamily: fonts.b400, fontSize: 12 }}>{H.whyWeExist.imageText}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* TESTIMONIALS + STATS */}
        <View style={[s.section, { backgroundColor: colors.surface, paddingHorizontal: 0, borderTopWidth: 1, borderColor: colors.border }]}>
          <View style={{ paddingHorizontal: 16 }}>
            <SectionTitle badge={H.testimonialsIntro.badge} title={H.testimonialsIntro.title} highlight={H.testimonialsIntro.highlight} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={width - 32 + 12} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
            {H.testimonials.map((t) => (
              <View key={t.name} style={[s.testi, { width: width - 32 }]} testID={`testimonial-${t.name.split(" ")[0].toLowerCase()}`}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", gap: 3 }}>
                    {Array.from({ length: 5 }).map((_, i) => <Lucide key={i} name="star" size={16} color={colors.orange} />)}
                  </View>
                  <Pill label={t.tag} />
                </View>
                <Text style={s.testiText}>&quot;{t.text}&quot;</Text>
                <View style={s.testiFoot}>
                  <Avatar uri={H.avatar(t.name)} />
                  <View>
                    <Text style={s.testiName}>{t.name}</Text>
                    <Text style={s.testiRole}>{t.role}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={{ paddingHorizontal: 16, gap: 12 }}>
            {H.stats.map((st) => (
              <View key={st.label} style={s.stat} testID={`stat-${st.label.split(" ")[0].toLowerCase()}`}>
                <View>
                  <Text style={s.statV}>{st.value}</Text>
                  <Text style={s.statL}>{st.label.toUpperCase()}</Text>
                  <Text style={s.statS}>{st.sub}</Text>
                </View>
                <View style={s.statIcon}><Lucide name={st.icon as any} size={24} color={colors.onBrandTertiary} /></View>
              </View>
            ))}
          </View>
        </View>

        {/* JOURNAL */}
        <View style={[s.section, { backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border }]}>
          <SectionTitle badge={H.journalIntro.badge} title={H.journalIntro.title} highlight={H.journalIntro.highlight} />
          <Body style={{ fontSize: 13 }}>{H.journalIntro.text}</Body>
          {latest.isLoading ? <View style={{ marginHorizontal: -16 }}><ListSkeleton count={2} height={180} /></View> : latest.data?.slice(0, 3).map((a, i) => <ArticleCard key={a.id} a={a} index={i} />)}
        </View>

        {/* JOIN CTA */}
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <View style={s.join} testID="join-ecosystem-cta">
            <Pill dark label={H.joinCta.badge} />
            <Text style={s.joinTitle}>{H.joinCta.title}</Text>
            <Body dark style={{ fontSize: 13 }}>{H.joinCta.text}</Body>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <Btn testID="join-mqulima-btn" label="Join Mqulima" onPress={() => router.push("/auth/sign-up")} style={{ flex: 1 }} />
              <Btn testID="join-explore-btn" variant="ghostDark" icon={null} label="Explore Ecosystem" onPress={() => router.push("/tools")} style={{ flex: 1, paddingHorizontal: 8 }} />
            </View>
          </View>
        </View>

        <View style={{ paddingBottom: bottom - 96 }}>
          <Footer />
        </View>
      </ScrollView>
    </View>
  );
}

const StyleSheetAbs = { position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0 };

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  hero: { height: 620, backgroundColor: c.heroBg, justifyContent: "center", overflow: "hidden" },
  heroInner: { paddingHorizontal: 20, gap: 20 },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", borderRadius: 999, borderWidth: 1, borderColor: c.whiteA20, backgroundColor: c.blackA30, paddingHorizontal: 14, paddingVertical: 6 },
  heroBadgeText: { color: c.mint, fontFamily: fonts.b800, fontSize: 10, letterSpacing: 2, textTransform: "uppercase" },
  heroTitle: { color: c.white, fontFamily: fonts.h900, fontSize: 38, lineHeight: 41, textTransform: "uppercase", letterSpacing: -0.5, textShadowColor: "rgba(0,0,0,0.7)", textShadowRadius: 10, textShadowOffset: { width: 0, height: 2 } },
  heroSub: { color: c.white, fontFamily: fonts.b500, fontSize: 16, lineHeight: 25, textShadowColor: "rgba(0,0,0,0.85)", textShadowRadius: 4, textShadowOffset: { width: 0, height: 2 } },
  heroBtn: { flex: 1, minHeight: 50, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 10 },
  heroBtnText: { color: c.white, fontFamily: fonts.b800, fontSize: 11, letterSpacing: 0.8 },
  section: { paddingHorizontal: 16, paddingVertical: 40, gap: 20 },
  quoteCard: { backgroundColor: c.white, borderRadius: 24, borderWidth: 1, borderColor: c.border, padding: 24, gap: 8 },
  quoteTitle: { fontFamily: fonts.h800, fontSize: 18, color: c.onSurface },
  quote: { fontFamily: fonts.b500, fontStyle: "italic", fontSize: 13, lineHeight: 21, color: c.onSurfaceSecondary },
  imgCard: { aspectRatio: 4 / 3, borderRadius: 28, overflow: "hidden", borderWidth: 1, borderColor: c.border },
  imgKicker: { color: c.brandSecondary, fontFamily: fonts.b700, fontSize: 12, letterSpacing: 2 },
  imgTitle: { color: c.white, fontFamily: fonts.h700, fontSize: 20, textTransform: "uppercase", marginTop: 4 },
  ecoCard: { backgroundColor: "rgba(22,56,43,0.7)", borderWidth: 1, borderColor: c.whiteA10, borderRadius: 24, padding: 24 },
  ecoEmoji: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.limeA20, borderWidth: 1, borderColor: c.limeA30, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  ecoN: { color: c.brandSecondary, fontFamily: fonts.b800, fontSize: 12, letterSpacing: 2, marginBottom: 4 },
  ecoTitle: { color: c.white, fontFamily: fonts.h700, fontSize: 18 },
  ecoText: { color: c.whiteA70, fontFamily: fonts.b400, fontSize: 12, lineHeight: 19, marginTop: 8 },
  featCard: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, overflow: "hidden" },
  featLabel: { position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 24, paddingBottom: 10, paddingHorizontal: 12 },
  featName: { fontFamily: fonts.h800, fontSize: 13, color: c.onSurface, lineHeight: 16 },
  greenBtn: { minHeight: 48, width: "100%", maxWidth: 320, borderRadius: 12, backgroundColor: c.brandPrimary, flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center" },
  greenBtnText: { color: c.white, fontFamily: fonts.b800, fontSize: 13, letterSpacing: 1 },
  svcCard: { backgroundColor: c.white, borderRadius: 28, borderWidth: 1, borderColor: c.border, overflow: "hidden" },
  svcIcon: { position: "absolute", top: 16, left: 16, padding: 10, borderRadius: 999, backgroundColor: c.brandPrimary },
  svcCount: { position: "absolute", top: 16, right: 16, backgroundColor: c.whiteA85, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  svcCountText: { fontFamily: fonts.b700, fontSize: 12, color: "#1E293B" },
  svcTitle: { position: "absolute", left: 20, right: 20, bottom: 16, color: c.white, fontFamily: fonts.h700, fontSize: 24, lineHeight: 28 },
  svcItem: { fontFamily: fonts.b600, fontSize: 13, color: c.onSurfaceSecondary },
  stepCard: { flexDirection: "row", gap: 16, padding: 24, borderWidth: 1, borderColor: c.border, borderRadius: 24, backgroundColor: c.white },
  stepN: { fontFamily: fonts.h900, fontSize: 24, color: c.limeText },
  stepTitle: { fontFamily: fonts.h700, fontSize: 16, color: c.onSurface },
  whySub: { fontFamily: fonts.h700, fontSize: 16, color: c.brandPrimary, letterSpacing: 0.5 },
  whyClose: { fontFamily: fonts.b700, fontSize: 12, color: c.onBrandTertiary, letterSpacing: 1 },
  testi: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, padding: 24, gap: 16 },
  testiText: { fontFamily: fonts.b400, fontStyle: "italic", fontSize: 13, lineHeight: 21, color: c.onSurfaceSecondary },
  testiFoot: { flexDirection: "row", alignItems: "center", gap: 14, borderTopWidth: 1, borderTopColor: c.divider, paddingTop: 16 },
  testiName: { fontFamily: fonts.h700, fontSize: 13, color: c.onSurface },
  testiRole: { fontFamily: fonts.b400, fontSize: 11, color: c.muted },
  stat: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 24, borderWidth: 1, borderColor: c.border, backgroundColor: c.white },
  statV: { fontFamily: fonts.h900, fontSize: 30, color: c.onSurface },
  statL: { fontFamily: fonts.b700, fontSize: 12, letterSpacing: 1, color: c.onBrandTertiary, marginTop: 6 },
  statS: { fontFamily: fonts.b400, fontSize: 12, color: c.muted, marginTop: 2 },
  statIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  join: { backgroundColor: c.forest, borderRadius: 32, padding: 24, gap: 16, borderWidth: 1, borderColor: c.whiteA10 },
  joinTitle: { fontFamily: fonts.h900, fontSize: 28, lineHeight: 32, color: c.white },
}));
