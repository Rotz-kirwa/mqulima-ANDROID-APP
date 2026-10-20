import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { Page, useStackBottom } from "@/src/components/Page";
import { Btn, Body } from "@/src/components/ui";
import { Field, EMAIL_RE } from "@/src/components/Form";
import { academy } from "@/src/data/pages";
import { academyIntro } from "@/src/data/home";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const FEATURES = [
  { icon: "circle-play", title: "Video courses", text: "Certified, practical lessons you can watch anywhere." },
  { icon: "users", title: "Expert masterclasses", text: "Live sessions with agronomists and vets." },
  { icon: "award", title: "Certificates", text: "Earn proof of skill for every completed track." },
];

export default function Academy() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useStackBottom();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [joined, setJoined] = useState(false);

  const links = [
    { id: "products", icon: "shopping-bag", label: "Browse Products", route: "/(tabs)/shop" },
    { id: "services", icon: "briefcase", label: "Explore Specialist Services", route: "/services" },
    { id: "tools", icon: "wrench", label: "View Tools", route: "/tools" },
  ];

  return (
    <Page title="Academy" testID="academy-screen">
      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: bottom }}>
        {/* Hero */}
        <View style={s.hero}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={s.mh}><Text style={s.mhText}>MH</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.brand}>{academy.badge}</Text>
              <Text style={s.kicker}>{academy.sub.toUpperCase()}</Text>
            </View>
          </View>
          <Animated.Text entering={ZoomIn.duration(600)} style={s.soon} testID="academy-coming-soon">
            COMING{"\n"}<Text style={{ color: colors.brandSecondary }}>SOON!!</Text>
          </Animated.Text>
          <Body dark style={{ fontSize: 14, lineHeight: 22 }}>{academy.text}</Body>
          <Btn testID="academy-browse-products-btn" full variant="orange" label="Browse Products" onPress={() => router.navigate("/(tabs)/shop")} />
        </View>

        {/* What's coming */}
        <View style={{ gap: 12 }}>
          <Text style={s.h2}>What&apos;s coming</Text>
          {FEATURES.map((f, i) => (
            <Animated.View key={f.title} entering={FadeInDown.delay(100 + i * 80)} style={s.feature}>
              <View style={s.fIcon}><Lucide name={f.icon as any} size={20} color={colors.onBrandTertiary} /></View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.fTitle}>{f.title}</Text>
                <Text style={s.fText}>{f.text}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Learning tracks */}
        <View style={{ gap: 12 }}>
          <Text style={s.h2}>Learning tracks</Text>
          {academyIntro.steps.map((st) => (
            <View key={st.n} style={s.track}>
              <Text style={s.trackN}>{st.n}</Text>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.fTitle}>{st.title}</Text>
                <Text style={s.fText}>{st.text}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Waitlist */}
        <View style={s.wait}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <Text style={s.waitTitle}>{academy.waitlist}</Text>
            <View style={s.free}><Text style={s.freeText}>{academy.free}</Text></View>
          </View>
          <Text style={s.fText}>Be first to know when courses go live.</Text>
          {joined ? (
            <View style={s.joined} testID="academy-waitlist-success">
              <Lucide name="circle-check" size={20} color={colors.brandPrimary} />
              <Text style={s.joinedText}>You&apos;re on the waitlist! We&apos;ll email {email} at launch.</Text>
            </View>
          ) : (
            <>
              <Field testID="academy-email-input" label="Email address" value={email} onChangeText={(v) => { setEmail(v); setErr(""); }} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" error={err} />
              <Btn testID="academy-join-waitlist-btn" full variant="green" label="Join Waitlist" onPress={() => (EMAIL_RE.test(email.trim()) ? setJoined(true) : setErr("Enter a valid email address"))} />
            </>
          )}
        </View>

        {/* Explore meanwhile */}
        <View style={{ gap: 10 }}>
          <Text style={s.h2}>Explore in the meantime</Text>
          <View style={s.linkCard}>
            {links.map((l, i) => (
              <Pressable
                key={l.id}
                testID={`academy-link-${l.id}`}
                onPress={() => router.push(l.route as any)}
                style={({ pressed }) => [s.linkRow, i > 0 && s.linkDivider, pressed && { opacity: 0.7 }]}
              >
                <Lucide name={l.icon as any} size={20} color={colors.brandPrimary} />
                <Text style={s.linkText}>{l.label}</Text>
                <Lucide name="chevron-right" size={18} color={colors.subtle} />
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable testID="academy-back-home-btn" onPress={() => router.navigate("/")} style={s.back}>
          <Lucide name="house" size={16} color={colors.muted} />
          <Text style={s.backText}>Back to Home  •  {academy.handle}</Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  hero: { backgroundColor: c.forest, borderRadius: 28, padding: 24, gap: 20 },
  mh: { width: 48, height: 48, borderRadius: 14, backgroundColor: c.brandSecondary, alignItems: "center", justifyContent: "center" },
  mhText: { fontFamily: fonts.h900, fontSize: 17, color: c.forestDeep },
  brand: { fontFamily: fonts.h800, fontSize: 17, color: c.white },
  kicker: { fontFamily: fonts.b800, fontSize: 11, letterSpacing: 1.2, color: c.brandSecondary, marginTop: 2 },
  soon: { fontFamily: fonts.h900, fontSize: 52, lineHeight: 54, color: c.white, letterSpacing: -1 },
  h2: { fontFamily: fonts.h900, fontSize: 20, color: c.onSurface },
  feature: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 20, padding: 16 },
  fIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  fTitle: { fontFamily: fonts.h700, fontSize: 15, color: c.onSurface },
  fText: { fontFamily: fonts.b400, fontSize: 13, lineHeight: 19, color: c.onSurfaceTertiary },
  track: { flexDirection: "row", gap: 14, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 20, padding: 16 },
  trackN: { fontFamily: fonts.h900, fontSize: 22, color: c.limeText, width: 32 },
  wait: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 24, padding: 20, gap: 14 },
  waitTitle: { fontFamily: fonts.h800, fontSize: 18, color: c.onSurface, flexShrink: 1 },
  free: { backgroundColor: c.brandTertiary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  freeText: { fontFamily: fonts.b800, fontSize: 11, color: c.onBrandTertiary },
  joined: { flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: c.brandTertiary, borderRadius: 14, padding: 14 },
  joinedText: { flex: 1, fontFamily: fonts.b600, fontSize: 14, lineHeight: 20, color: c.onBrandTertiary },
  linkCard: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 20, paddingHorizontal: 16 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56 },
  linkDivider: { borderTopWidth: 1, borderTopColor: c.divider },
  linkText: { flex: 1, fontFamily: fonts.b700, fontSize: 14, color: c.onSurface },
  back: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 48 },
  backText: { fontFamily: fonts.b600, fontSize: 13, color: c.muted },
}));
