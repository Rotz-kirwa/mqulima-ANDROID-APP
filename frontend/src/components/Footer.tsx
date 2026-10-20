import React from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { useRouter } from "expo-router";
import { contactInfo } from "@/src/data/home";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { Logo } from "./Logo";

export function Footer() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const rows = [
    { icon: "map-pin", text: contactInfo.address, onPress: undefined, id: "address" },
    { icon: "phone", text: contactInfo.phone, onPress: () => Linking.openURL(`tel:${contactInfo.phoneRaw}`), id: "phone" },
    { icon: "mail", text: contactInfo.email, onPress: () => Linking.openURL(`mailto:${contactInfo.email}`), id: "email" },
  ];
  return (
    <View style={s.wrap} testID="footer">
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Logo size={44} />
        <View>
          <Text style={s.word}>MQULIMA</Text>
          <Text style={s.tag}>...taking you first class</Text>
        </View>
      </View>
      <Text style={s.about}>Africa’s 360° agriculture ecosystem. Everything you need to know, learn, buy, hire, trade, treat or tell someone in one platform.</Text>
      <View style={{ gap: 4 }}>
        {rows.map((r) => (
          <Pressable key={r.id} testID={`footer-${r.id}`} onPress={r.onPress} style={s.row}>
            <Lucide name={r.icon as any} size={16} color={colors.brandSecondary} />
            <Text style={s.rowText}>{r.text}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {contactInfo.socials.map((so) => (
          <Pressable key={so.name} testID={`footer-social-${so.name.toLowerCase()}`} onPress={() => Linking.openURL(so.url)} style={s.social} accessibilityLabel={`Follow Mqulima on ${so.name}`}>
            <FontAwesome6 name={so.icon as any} iconStyle="brand" size={18} color={colors.white} />
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        {[["About", "/about"], ["Contact", "/contact"], ["Terms & Privacy", "/legal"]].map(([l, r]) => (
          <Pressable key={l} testID={`footer-link-${l.toLowerCase().replace(/\W+/g, "-")}`} onPress={() => router.push(r as any)} style={{ minHeight: 44, justifyContent: "center" }}>
            <Text style={s.link}>{l}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.copy}>© {new Date().getFullYear()} Mqulima Hub. All rights reserved.</Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { backgroundColor: c.forestDeep, padding: 24, gap: 16, paddingBottom: 120 },
  word: { fontFamily: fonts.wordmark, fontSize: 20, letterSpacing: 1.5, color: c.white },
  tag: { fontFamily: fonts.b500, fontStyle: "italic", fontSize: 10, color: c.brandSecondary },
  about: { fontFamily: fonts.b400, fontSize: 13, lineHeight: 20, color: c.whiteA70 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 40 },
  rowText: { fontFamily: fonts.b500, fontSize: 13, color: c.white, flexShrink: 1 },
  social: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.whiteA10, borderWidth: 1, borderColor: c.whiteA20, alignItems: "center", justifyContent: "center" },
  link: { fontFamily: fonts.b700, fontSize: 13, color: c.brandSecondary },
  copy: { fontFamily: fonts.b400, fontSize: 11, color: c.whiteA70 },
}));
