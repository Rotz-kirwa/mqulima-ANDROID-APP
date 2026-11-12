import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lucide } from "@react-native-vector-icons/lucide";
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { useRouter } from "expo-router";
import { contactInfo } from "@/src/data/home";
import { fonts } from "@/src/theme";
import { Logo } from "./Logo";

export function Footer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const platformLinks = [
    { label: "AgroShop", route: "/(tabs)/shop" },
    { label: "Mqulima Academy", route: "/academy" },
    { label: "Mqulima News", route: "/(tabs)/news" },
    { label: "Mqulima Forum", route: "/(tabs)/forum" },
    { label: "Mqulima Tools", route: "/tools" },
    { label: "Mqulima AI", route: "/ai" },
    { label: "Services", route: "/services" },
  ];

  const companyLinks = [
    { label: "About Us", route: "/about", testId: "footer-link-about" },
    { label: "Contact Us", route: "/contact", testId: "footer-link-contact" },
    { label: "Careers", route: "/about" },
    { label: "Insurance", route: "/services/finance" },
  ];

  const supportLinks = [
    { label: "Privacy Policy", route: "/legal" },
    { label: "Terms & Conditions", route: "/legal", testId: "footer-link-terms-privacy" },
    { label: "Support Helpdesk", route: "/contact" },
  ];

  const reachRows = [
    {
      id: "address",
      icon: "map-pin",
      text: "Junction, Eldoret–Iten Highway",
      onPress: () =>
        Linking.openURL("https://maps.google.com/?q=Junction,+Eldoret+Iten+Highway"),
    },
    {
      id: "phone",
      icon: "phone",
      text: contactInfo.phone || "+254 723 346 134",
      onPress: () => Linking.openURL(`tel:${contactInfo.phoneRaw || "+254723346134"}`),
    },
    {
      id: "email",
      icon: "mail",
      text: contactInfo.email || "mqulima@mqulima.com",
      onPress: () => Linking.openURL(`mailto:${contactInfo.email || "mqulima@mqulima.com"}`),
    },
  ];

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(18, insets.bottom + 8) }]} testID="footer">
      {/* Brand Header */}
      <View style={styles.brandBlock}>
        <View style={styles.logoRow}>
          <Logo size={48} />
          <View>
            <Text style={styles.wordmark}>MQULIMA</Text>
            <Text style={styles.tagline}>...taking you first class</Text>
          </View>
        </View>
        <Text style={styles.aboutText}>
          Kenya&apos;s #1 digital farming ecosystem. From seed to sale — agrovet
          shop, expert services and AI intelligence built for every farmer,
          every county.
        </Text>

        {/* Social Handles */}
        <View style={styles.socialsRow}>
          {contactInfo.socials.map((so) => (
            <Pressable
              key={so.name}
              testID={`footer-social-${so.name.toLowerCase()}`}
              onPress={() => Linking.openURL(so.url)}
              style={[
                styles.socialCircle,
                so.name.toLowerCase().includes("linkedin") && {
                  backgroundColor: "#0077B5",
                },
              ]}
              accessibilityLabel={`Follow Mqulima on ${so.name}`}
            >
              <FontAwesome6
                name={so.icon as any}
                iconStyle="brand"
                size={16}
                color="#FFFFFF"
              />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Navigation Columns Grid */}
      <View style={styles.columnsGrid}>
        {/* Column 1: Platform */}
        <View style={styles.colBox}>
          <Text style={styles.colHeading}>PLATFORM</Text>
          <View style={styles.colLinksList}>
            {platformLinks.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => router.push(item.route as any)}
                style={styles.colLinkBtn}
              >
                <Text style={styles.colLinkText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Column 2: Company & Support */}
        <View style={styles.colBox}>
          <Text style={styles.colHeading}>COMPANY</Text>
          <View style={styles.colLinksList}>
            {companyLinks.map((item) => (
              <Pressable
                key={item.label}
                testID={item.testId}
                onPress={() => router.push(item.route as any)}
                style={styles.colLinkBtn}
              >
                <Text style={styles.colLinkText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.colHeading, { marginTop: 14 }]}>
            SUPPORT & LEGAL
          </Text>
          <View style={styles.colLinksList}>
            {supportLinks.map((item) => (
              <Pressable
                key={item.label}
                testID={item.testId}
                onPress={() => router.push(item.route as any)}
                style={styles.colLinkBtn}
              >
                <Text style={styles.colLinkText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Reach Us Block */}
      <View style={styles.reachBlock}>
        <Text style={styles.colHeading}>REACH US</Text>
        <View style={styles.reachRowsList}>
          {reachRows.map((r) => (
            <Pressable
              key={r.id}
              testID={`footer-${r.id}`}
              onPress={r.onPress}
              style={styles.reachRow}
            >
              <Lucide name={r.icon as any} size={15} color="#F5A623" />
              <Text style={styles.reachRowText}>{r.text}</Text>
            </Pressable>
          ))}
        </View>

        {/* Contact Us & WhatsApp Action Buttons */}
        <View style={styles.ctaButtonsRow}>
          <Pressable
            onPress={() => router.push("/contact")}
            style={styles.contactPageBtn}
          >
            <Text style={styles.contactPageBtnText}>Contact Us</Text>
            <Lucide name="arrow-right" size={14} color="#0F291E" />
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL("https://wa.me/254723346134")}
            style={styles.whatsappBtn}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <FontAwesome6
                name="whatsapp"
                iconStyle="brand"
                size={15}
                color="#FFFFFF"
              />
              <Text style={styles.whatsappBtnText}>WhatsApp</Text>
            </View>
            <Lucide name="arrow-right" size={14} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Bottom Copyright Bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.copyrightText}>
          © {new Date().getFullYear()} Mqulima Kenya Ltd. All rights reserved.
        </Text>
        <View style={styles.bottomLinksRow}>
          <Pressable onPress={() => router.push("/about")}>
            <Text style={styles.bottomLinkText}>About Us</Text>
          </Pressable>
          <Text style={styles.bottomDot}>·</Text>
          <Pressable onPress={() => router.push("/contact")}>
            <Text style={styles.bottomLinkText}>Contact</Text>
          </Pressable>
          <Text style={styles.bottomDot}>·</Text>
          <Pressable onPress={() => router.push("/legal")}>
            <Text style={styles.bottomLinkText}>Terms of Service</Text>
          </Pressable>
          <Text style={styles.bottomDot}>·</Text>
          <Pressable onPress={() => router.push("/legal")}>
            <Text style={styles.bottomLinkText}>Privacy Policy</Text>
          </Pressable>
        </View>
        <Text style={styles.engineeredByText}>Engineered by Webmakers</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#1A3D2F",
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 18,
    gap: 24,
  },
  brandBlock: {
    gap: 12,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  wordmark: {
    fontFamily: fonts.wordmark,
    fontSize: 21,
    letterSpacing: 1.6,
    color: "#FFFFFF",
  },
  tagline: {
    fontFamily: fonts.b500,
    fontStyle: "italic",
    fontSize: 10.5,
    color: "#F5A623",
    marginTop: 1,
  },
  aboutText: {
    fontFamily: fonts.b400,
    fontSize: 12.5,
    lineHeight: 19,
    color: "rgba(255, 255, 255, 0.65)",
  },
  socialsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  socialCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  columnsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.10)",
  },
  colBox: {
    flex: 1,
    gap: 8,
  },
  colHeading: {
    fontFamily: fonts.b800,
    fontSize: 12,
    letterSpacing: 1,
    color: "#F5A623",
    textTransform: "uppercase",
  },
  colLinksList: {
    gap: 6,
  },
  colLinkBtn: {
    paddingVertical: 3,
  },
  colLinkText: {
    fontFamily: fonts.b500,
    fontSize: 12.5,
    color: "rgba(255, 255, 255, 0.75)",
  },
  reachBlock: {
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.10)",
  },
  reachRowsList: {
    gap: 8,
  },
  reachRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 2,
  },
  reachRowText: {
    fontFamily: fonts.b600,
    fontSize: 12.5,
    color: "rgba(255, 255, 255, 0.85)",
    flexShrink: 1,
  },
  ctaButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  contactPageBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5A623",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 0,
  },
  contactPageBtnText: {
    fontFamily: fonts.b800,
    fontSize: 12,
    color: "#0F291E",
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#25D366",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 0,
  },
  whatsappBtnText: {
    fontFamily: fonts.b800,
    fontSize: 12,
    color: "#FFFFFF",
  },
  bottomBar: {
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    gap: 8,
  },
  copyrightText: {
    fontFamily: fonts.b500,
    fontSize: 11.5,
    color: "rgba(255, 255, 255, 0.65)",
    textAlign: "center",
  },
  bottomLinksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  bottomLinkText: {
    fontFamily: fonts.b500,
    fontSize: 11.5,
    color: "rgba(255, 255, 255, 0.75)",
  },
  bottomDot: {
    fontFamily: fonts.b700,
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.45)",
  },
  engineeredByText: {
    fontFamily: fonts.b700,
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.42)",
  },
});
