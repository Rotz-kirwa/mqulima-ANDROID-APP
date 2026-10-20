import React, { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { Page, useStackBottom } from "@/src/components/Page";
import { Btn, Body } from "@/src/components/ui";
import { Field, EMAIL_RE } from "@/src/components/Form";
import { academy } from "@/src/data/pages";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function Academy() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useStackBottom();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [joined, setJoined] = useState(false);
  return (
    <Page title="Academy" testID="academy-screen">
      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: bottom }}>
        <View style={s.card}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={s.mh}><Text style={s.mhText}>MH</Text></View>
            <View>
              <Text style={s.brand}>{academy.badge}</Text>
              <Text style={s.sub}>{academy.sub}</Text>
            </View>
          </View>
          <Animated.Text entering={ZoomIn.duration(600)} style={s.soon} testID="academy-coming-soon">COMING{"\n"}<Text style={{ color: colors.brandSecondary }}>SOON!!</Text></Animated.Text>
          <Btn testID="academy-browse-products-btn" variant="orange" label="BROWSE PRODUCTS" onPress={() => router.navigate("/(tabs)/shop")} />
          <Body dark>{academy.text}</Body>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Btn testID="academy-services-btn" small variant="ghostDark" icon={null} label="Explore Specialist Services" onPress={() => router.push("/services")} style={{ flex: 1, paddingHorizontal: 8 }} />
            <Btn testID="academy-tools-btn" small variant="ghostDark" icon={null} label="VIEW TOOLS" onPress={() => router.push("/tools")} style={{ flex: 1 }} />
          </View>
        </View>
        <Animated.View entering={FadeInDown.delay(200)} style={s.wait}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={s.waitTitle}>{academy.waitlist}</Text>
            <Text style={s.free}>{academy.free}</Text>
          </View>
          {joined ? (
            <Text style={s.joined} testID="academy-waitlist-success">🎉 You&apos;re on the waitlist! We&apos;ll email {email} at launch.</Text>
          ) : (
            <>
              <Field testID="academy-email-input" label="Email address" value={email} onChangeText={(v) => { setEmail(v); setErr(""); }} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" error={err} />
              <Btn testID="academy-join-waitlist-btn" full variant="green" label="Join Waitlist" onPress={() => (EMAIL_RE.test(email.trim()) ? setJoined(true) : setErr("Enter a valid email address"))} />
            </>
          )}
        </Animated.View>
        <Btn testID="academy-back-home-btn" variant="outline" full icon="house" label="Back to Home" onPress={() => router.navigate("/")} />
        <Text style={[s.sub, { textAlign: "center", color: colors.muted }]}>{academy.handle}</Text>
      </KeyboardAwareScrollView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  card: { backgroundColor: c.forest, borderRadius: 32, padding: 24, gap: 18 },
  mh: { width: 44, height: 44, borderRadius: 12, backgroundColor: c.brandSecondary, alignItems: "center", justifyContent: "center" },
  mhText: { fontFamily: fonts.h900, fontSize: 16, color: c.forestDeep },
  brand: { fontFamily: fonts.h800, fontSize: 16, color: c.white },
  sub: { fontFamily: fonts.b600, fontSize: 12, color: c.brandSecondary },
  soon: { fontFamily: fonts.h900, fontSize: 56, lineHeight: 58, color: c.white, letterSpacing: -1 },
  wait: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 24, padding: 20, gap: 14 },
  waitTitle: { fontFamily: fonts.h800, fontSize: 17, color: c.onSurface },
  free: { fontFamily: fonts.b800, fontSize: 11, color: c.onBrandTertiary, backgroundColor: c.brandTertiary, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, overflow: "hidden" },
  joined: { fontFamily: fonts.b600, fontSize: 14, color: c.brandPrimary, lineHeight: 21 },
}));
