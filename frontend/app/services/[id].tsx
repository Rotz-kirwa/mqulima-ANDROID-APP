import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "@/src/components/Img";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Page, useStackBottom } from "@/src/components/Page";
import { Btn } from "@/src/components/ui";
import { ListSkeleton } from "@/src/components/Skeleton";
import { api } from "@/src/services/api";
import { serviceCategories } from "@/src/data/services";
import { fonts } from "@/src/theme";

export default function ServiceCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const bottom = useStackBottom();
  const fallback = serviceCategories.find((x) => x.id === id);
  const q = useQuery({
    queryKey: ["serviceCategory", id],
    queryFn: () => api.getServiceCategory(id),
    initialData: fallback,
  });
  const c = q.data ?? fallback;

  return (
    <Page title={c?.title ?? "Services"} testID="service-category-screen">
      {q.isLoading && !c ? (
        <View style={{ paddingTop: 16 }}>
          <ListSkeleton count={3} height={180} />
        </View>
      ) : !c ? (
        <View style={{ padding: 24, gap: 12, alignItems: "center" }}>
          <Text style={styles.notFoundTitle}>Category not found</Text>
          <Btn label="All Services" onPress={() => router.replace("/services")} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: bottom + 24, padding: 16, gap: 18 }}>
          {/* Flagship Category Card */}
          <View style={styles.flagshipCard}>
            <View style={styles.flagshipTopBar}>
              <View style={styles.flagshipTopMetaRow}>
                <View style={styles.categoryPartBadge}>
                  <Text style={styles.categoryPartBadgeText}>CATEGORY {c.n}</Text>
                </View>
                <View style={styles.servicesCountPill}>
                  <Text style={styles.servicesCountPillText}>
                    {c.servicesCountText || `${c.subs.length} Services Included`}
                  </Text>
                </View>
              </View>
              <Text style={styles.categoryTopTitleText}>
                {c.n}. {c.title}
              </Text>
            </View>

            <View style={styles.heroImageWrap}>
              <Image
                source={{ uri: c.image }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={300}
              />
              <View style={styles.vettedBadge}>
                <View style={styles.vettedBadgeIcon}>
                  <Lucide name={(c.iconName as any) || "sprout"} size={14} color="#0F291E" />
                </View>
                <Text style={styles.vettedBadgeText}>VETTED SERVICE</Text>
              </View>
            </View>

            <View style={styles.flagshipBody}>
              <Text style={styles.kicker}>SERVICE PILLAR {c.n}</Text>
              <Text style={styles.description}>{c.text}</Text>
            </View>
          </View>

          {/* Sub-services Header */}
          <View style={styles.subServicesHeaderBar}>
            <View style={styles.subServicesAccentLine} />
            <View style={{ flex: 1 }}>
              <Text style={styles.subServicesHeaderTitle}>
                {c.n}. Sub-services in {c.title}
              </Text>
              <Text style={styles.subServicesHeaderSub}>
                {c.subs.length} specialist services available to request directly
              </Text>
            </View>
          </View>

          {/* Sub-service Cards */}
          {c.subs.map((sb) => (
            <View key={sb.id} style={styles.subCard} testID={`sub-service-${sb.id}`}>
              <View style={styles.subImageWrap}>
                <Image
                  source={{ uri: sb.image }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={300}
                />
                <View style={styles.subBadgesRow}>
                  <View style={styles.subRomanPill}>
                    <Text style={styles.subRomanPillLabel}>SUB-SERVICE</Text>
                    <Text style={styles.subRomanPillValue}>{sb.numeral}</Text>
                  </View>
                  <View style={styles.subTagPill}>
                    <Text style={styles.subTagPillText}>{sb.tag}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.subBody}>
                <View style={styles.subTitleRow}>
                  <View style={styles.subIconBox}>
                    <Lucide name={(sb.iconName as any) || "sprout"} size={18} color="#16A34A" />
                  </View>
                  <View style={styles.subInlineRoman}>
                    <Text style={styles.subInlineRomanText}>{sb.numeral}</Text>
                  </View>
                  <Text style={styles.subTitle}>{sb.title}</Text>
                </View>

                <Text style={styles.description}>{sb.text}</Text>

                {sb.id === "agri_insurance" && (
                  <View style={styles.insuranceExpertDesk}>
                    <View style={styles.insuranceDeskHeader}>
                      <Lucide name="shield-check" size={15} color="#16A34A" />
                      <Text style={styles.insuranceDeskTitle}>
                        MQULIMA AGRO-INSURANCE EXPERT DESK
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => Linking.openURL("tel:0723346134")}
                      style={styles.insuranceDeskRow}
                    >
                      <Lucide name="phone" size={13} color="#16A34A" />
                      <Text style={styles.insuranceDeskLabel}>Phone:</Text>
                      <Text style={styles.insuranceDeskLink}>0723346134</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => Linking.openURL("mailto:mqulima@mqulima.com")}
                      style={styles.insuranceDeskRow}
                    >
                      <Lucide name="mail" size={13} color="#16A34A" />
                      <Text style={styles.insuranceDeskLabel}>Email:</Text>
                      <Text style={styles.insuranceDeskLink}>mqulima@mqulima.com</Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        Linking.openURL("https://wa.me/254723346134")
                      }
                      style={styles.insuranceDeskRow}
                    >
                      <Lucide name="message-circle" size={13} color="#16A34A" />
                      <Text style={styles.insuranceDeskLabel}>WhatsApp:</Text>
                      <Text style={styles.insuranceDeskLink}>@mqulima (0723346134)</Text>
                    </Pressable>
                  </View>
                )}

                <View style={styles.actionsRow}>
                  <Pressable
                    testID={`sub-service-request-${sb.id}`}
                    onPress={() => {
                      if (sb.id === "learn_value_addition") {
                        router.push("/academy");
                        return;
                      }
                      if (sb.id === "buy_machinery") {
                        router.push("/(tabs)/shop");
                        return;
                      }
                      router.push({
                        pathname: "/service-request",
                        params: { service: sb.title, category: c.title },
                      });
                    }}
                    style={styles.primaryBtn}
                  >
                    <Text style={styles.primaryBtnText}>{sb.cta}</Text>
                    <Lucide name="arrow-up-right" size={14} color="#85CC14" />
                  </Pressable>

                  <Pressable
                    testID={`sub-service-learn-${sb.id}`}
                    onPress={() => router.push(`/service/${sb.id}`)}
                    style={styles.secondaryBtn}
                  >
                    <Text style={styles.secondaryBtnText}>Learn More</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  notFoundTitle: {
    fontFamily: fonts.h900,
    fontSize: 20,
    color: "#0F291E",
  },
  flagshipCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "rgba(15, 41, 30, 0.14)",
    overflow: "hidden",
  },
  flagshipTopBar: {
    backgroundColor: "#0F291E",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  flagshipTopMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryTopTitleText: {
    fontFamily: fonts.h900,
    fontSize: 22,
    lineHeight: 27,
    color: "#FACC15",
  },
  categoryPartBadge: {
    backgroundColor: "#85CC14",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryPartBadgeText: {
    fontFamily: fonts.b800,
    fontSize: 10,
    color: "#0F291E",
  },
  servicesCountPill: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  servicesCountPillText: {
    fontFamily: fonts.b700,
    fontSize: 10,
    color: "#85CC14",
    textTransform: "uppercase",
  },
  heroImageWrap: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#0B2017",
    position: "relative",
  },
  vettedBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  vettedBadgeIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#85CC14",
    alignItems: "center",
    justifyContent: "center",
  },
  vettedBadgeText: {
    fontFamily: fonts.b800,
    fontSize: 10,
    color: "#0F291E",
  },
  flagshipBody: {
    padding: 16,
    gap: 12,
  },
  kicker: {
    fontFamily: fonts.b800,
    fontSize: 10.5,
    letterSpacing: 1,
    color: "#16A34A",
  },
  description: {
    fontFamily: fonts.b400,
    fontSize: 13.5,
    lineHeight: 21,
    color: "#475569",
  },
  subServicesHeaderBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  subServicesAccentLine: {
    width: 5,
    height: 28,
    borderRadius: 3,
    backgroundColor: "#0F291E",
  },
  subServicesHeaderTitle: {
    fontFamily: fonts.h800,
    fontSize: 15,
    color: "#0F291E",
  },
  subServicesHeaderSub: {
    fontFamily: fonts.b500,
    fontSize: 11.5,
    color: "#64748B",
  },
  subCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  subImageWrap: {
    width: "100%",
    height: 185,
    backgroundColor: "#0B2017",
    position: "relative",
  },
  subBadgesRow: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subRomanPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0F291E",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  subRomanPillLabel: {
    fontFamily: fonts.b800,
    fontSize: 9.5,
    color: "rgba(255, 255, 255, 0.75)",
  },
  subRomanPillValue: {
    fontFamily: fonts.b800,
    fontSize: 11,
    color: "#85CC14",
  },
  subTagPill: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  subTagPillText: {
    fontFamily: fonts.b700,
    fontSize: 10.5,
    color: "#0F291E",
  },
  subBody: {
    padding: 15,
    gap: 11,
  },
  subTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  subIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#EDF7E2",
    borderWidth: 1,
    borderColor: "#D8EBC4",
    alignItems: "center",
    justifyContent: "center",
  },
  subInlineRoman: {
    backgroundColor: "#EDF7E2",
    borderWidth: 1,
    borderColor: "#C5E898",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  subInlineRomanText: {
    fontFamily: fonts.b800,
    fontSize: 10.5,
    color: "#0F291E",
  },
  subTitle: {
    fontFamily: fonts.h800,
    fontSize: 17,
    color: "#0F291E",
    flex: 1,
  },
  insuranceExpertDesk: {
    backgroundColor: "#EDF7E2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C5E898",
    padding: 11,
    gap: 6,
  },
  insuranceDeskHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  insuranceDeskTitle: {
    fontFamily: fonts.b800,
    fontSize: 10.5,
    color: "#0F291E",
  },
  insuranceDeskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  insuranceDeskLabel: {
    fontFamily: fonts.b700,
    fontSize: 12,
    color: "#0F291E",
  },
  insuranceDeskLink: {
    fontFamily: fonts.b600,
    fontSize: 12,
    color: "#15803D",
    textDecorationLine: "underline",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#0F291E",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 0,
  },
  primaryBtnText: {
    fontFamily: fonts.b700,
    fontSize: 12.5,
    color: "#FFFFFF",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FACC15",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 0,
  },
  secondaryBtnText: {
    fontFamily: fonts.b700,
    fontSize: 12.5,
    color: "#0F291E",
  },
});
