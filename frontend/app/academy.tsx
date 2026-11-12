import React, { useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView, KeyboardAwareScrollViewRef } from "react-native-keyboard-controller";
import { useRouter } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Page } from "@/src/components/Page";
import { Footer } from "@/src/components/Footer";
import { useAcademyStyles } from "@/src/components/academy/AcademyUI";
import { AcademyComingSoonHero } from "@/src/components/academy/AcademyComingSoonHero";
import { AcademyCtaButton } from "@/src/components/academy/AcademyCtaButton";
import { WaitlistSection } from "@/src/components/academy/WaitlistSection";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const ECOSYSTEM_LINKS = [
  {
    id: "products",
    label: "Find certified farm inputs",
    caption: "Seeds, feeds, fertilizers & agro-supplies in AgroShop",
    icon: "shopping-bag",
    route: "/(tabs)/shop",
  },
  {
    id: "services",
    label: "Work with a vetted specialist",
    caption: "Book agronomists, soil testing & veterinary consultations",
    icon: "sprout",
    route: "/services",
  },
  {
    id: "tools",
    label: "Calculate yields & farm margins",
    caption: "Free agribusiness calculators & smart farming tools",
    icon: "wrench",
    route: "/tools",
  },
] as const;

export default function Academy() {
  const s = useStyles();
  const shared = useAcademyStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const scroll = useRef<KeyboardAwareScrollViewRef>(null);
  const waitlistY = useRef(0);

  const scrollToWaitlist = () => {
    scroll.current?.scrollTo({ y: Math.max(0, waitlistY.current - 16), animated: true });
  };

  return (
    <Page title="Academy" testID="academy-screen">
      <KeyboardAwareScrollView
        ref={scroll}
        testID="academy-scroll"
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* Full-Bleed Coming Soon Hero with Animated Highlands/Campfire SVG & CTA */}
        <AcademyComingSoonHero onJoinWaitlist={scrollToWaitlist} />

        <View style={s.bodyColumn}>
          {/* Early Access Waitlist Registration Card */}
          <View
            onLayout={(event) => {
              waitlistY.current = event.nativeEvent.layout.y;
            }}
          >
            <WaitlistSection />
          </View>

          {/* Explore Other Platform Pillars While Academy Launches */}
          <View style={s.section}>
            <Text style={s.sectionKicker}>GROW TODAY WITH MQULIMA</Text>
            <Text testID="academy-explore-heading" style={shared.h2}>
              Keep growing with Mqulima
            </Text>

            <View style={s.exploreList}>
              {ECOSYSTEM_LINKS.map((link) => (
                <Pressable
                  key={link.id}
                  testID={`academy-link-${link.id}`}
                  onPress={() => router.push(link.route as any)}
                  style={({ pressed }) => [s.exploreLink, pressed && shared.pressed]}
                >
                  <View style={s.exploreIconWrap}>
                    <Lucide name={link.icon as any} size={20} color={colors.brand} />
                  </View>
                  <View style={shared.flex}>
                    <Text style={s.exploreTitle}>{link.label}</Text>
                    <Text style={shared.meta}>{link.caption}</Text>
                  </View>
                  <Lucide name="arrow-up-right" size={19} color={colors.brand} />
                </Pressable>
              ))}
            </View>

            {/* Paired Yellow + Green Shortcut Buttons */}
            <View style={s.bottomCtaRow}>
              <AcademyCtaButton
                variant="yellow"
                icon="shopping-bag"
                label="Browse AgroShop"
                onPress={() => router.push("/(tabs)/shop" as any)}
              />
              <AcademyCtaButton
                variant="green"
                icon="sprout"
                label="Explore Services"
                onPress={() => router.push("/services" as any)}
              />
            </View>
          </View>
        </View>

        <Footer />
      </KeyboardAwareScrollView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: c.surface,
  },
  bodyColumn: {
    width: "100%",
    maxWidth: 960,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 26,
  },
  section: {
    gap: 14,
  },
  sectionKicker: {
    fontFamily: fonts.b800,
    fontSize: 11,
    letterSpacing: 1.2,
    color: c.limeText,
    marginBottom: 2,
  },
  exploreList: {
    gap: 10,
  },
  exploreLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 15,
    borderRadius: 16,
    backgroundColor: c.surfaceSecondary,
    borderWidth: 1,
    borderColor: c.border,
  },
  exploreIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: c.heroBg,
    alignItems: "center",
    justifyContent: "center",
  },
  exploreTitle: {
    fontFamily: fonts.h700,
    fontSize: 15,
    color: c.onSurface,
    marginBottom: 2,
  },
  bottomCtaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
}));
