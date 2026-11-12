import React, { useEffect, useRef, useState } from "react";
import {
  Animated as RNAnimated,
  Easing,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "@/src/components/Img";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Page, useStackBottom } from "@/src/components/Page";
import { ListSkeleton } from "@/src/components/Skeleton";
import { PHONE_RE } from "@/src/components/Form";
import { api } from "@/src/services/api";
import {
  categoryFilters,
  serviceCategories as fallbackCategories,
  servicesHero,
  servicesTools,
  type ServiceCategory,
  type SubService,
} from "@/src/data/services";
import { counties, contactInfo } from "@/src/data/home";
import { fonts, useTheme } from "@/src/theme";
import { useApp } from "@/src/store/AppStore";

const WHATSAPP_NUMBER = "254723346134";

function openWhatsAppInquiry(subject: string, category?: string, details?: string) {
  const lines = [
    "Hello Mqulima Team,",
    `I would like to inquire about: *${subject}*`,
    category ? `Category: ${category}` : "",
    details ? `Details: ${details}` : "",
    "Please share more information and next steps.",
  ].filter(Boolean);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  Linking.openURL(url).catch(() => {});
}

export default function Services() {
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useStackBottom();
  const { user } = useApp();
  const params = useLocalSearchParams<{ category?: string }>();

  const scrollRef = useRef<ScrollView>(null);
  const servicesSectionRef = useRef<View>(null);
  const subCardRefs = useRef<Record<string, View | null>>({});
  const layoutYRef = useRef<Record<string, number>>({});
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [servicesSectionY, setServicesSectionY] = useState(520);
  const [highlightedSubId, setHighlightedSubId] = useState<string | null>(null);
  const [cat, setCat] = useState<string>("all");
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const scrollToServicesSection = () => {
    if (Platform.OS === "web") {
      const webNode = servicesSectionRef.current as unknown as HTMLElement | null;
      if (webNode && typeof webNode.scrollIntoView === "function") {
        webNode.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    scrollRef.current?.scrollTo({ y: servicesSectionY, animated: true });
  };

  const scrollToSubService = (categoryId: string, subId: string) => {
    setHighlightedSubId(subId);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => setHighlightedSubId(null), 2000);

    if (Platform.OS === "web") {
      const refNode = subCardRefs.current[subId] as unknown as HTMLElement | null;
      const domNode =
        refNode && typeof refNode.scrollIntoView === "function"
          ? refNode
          : typeof document !== "undefined"
          ? (document.querySelector(`[data-testid="sub-service-${subId}"]`) as HTMLElement | null)
          : null;
      if (domNode && typeof domNode.scrollIntoView === "function") {
        domNode.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }

    const yMap = layoutYRef.current;
    const targetY =
      (yMap.servicesSection ?? servicesSectionY) +
      (yMap.categoriesStack ?? 0) +
      (yMap[`cat:${categoryId}`] ?? 0) +
      (yMap[`subsWrap:${categoryId}`] ?? 0) +
      (yMap[`subsGrid:${categoryId}`] ?? 0) +
      (yMap[`sub:${subId}`] ?? 0) -
      14;
    scrollRef.current?.scrollTo({ y: Math.max(0, targetY), animated: true });
  };

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedSub, setSelectedSub] = useState<SubService | null>(null);
  const [countyPickerOpen, setCountyPickerOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    farmerName: user?.name ?? "",
    farmerPhone: user?.phone ?? "",
    farmerEmail: user?.email ?? "",
    county: user?.county ?? "Uasin Gishu",
    location: "",
    farmSize: "",
    preferredDate: "",
    notes: "",
  });
  const [bookingError, setBookingError] = useState("");
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<{ reference: string; serviceName: string } | null>(null);

  // Continuous Marquee Animation for the Hero Stats Bar (matching mqulima.com/services)
  const marqueeAnim = useRef(new RNAnimated.Value(0)).current;
  const SINGLE_SET_WIDTH = 780;

  useEffect(() => {
    const loop = RNAnimated.loop(
      RNAnimated.timing(marqueeAnim, {
        toValue: -SINGLE_SET_WIDTH,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== "web",
      })
    );
    loop.start();
    return () => loop.stop();
  }, [marqueeAnim]);

  useEffect(() => {
    if (params.category) {
      const p = params.category.toLowerCase();
      if (p.includes("finance")) setCat("finance");
      else if (p.includes("soil")) setCat("soil");
      else if (p.includes("crop")) setCat("crop");
      else if (p.includes("animal-health") || p.includes("health") || p.includes("vet")) setCat("animal-health");
      else if (p.includes("nutrition") || p.includes("feed")) setCat("animal-nutrition");
      else if (p.includes("irrigation")) setCat("irrigation");
      else if (p.includes("value")) setCat("value-addition");
      else if (p.includes("important")) setCat("important");
    }
  }, [params.category]);

  const q = useQuery({
    queryKey: ["serviceCategories"],
    queryFn: api.getServiceCategories,
    initialData: fallbackCategories,
  });

  const allCategories = q.data && q.data.length > 0 ? q.data : fallbackCategories;
  const visibleCategories = allCategories.filter((c) => cat === "all" || c.id === cat);
  const activeFilterLabel =
    categoryFilters.find((f) => f.id === cat)?.label || "All Categories (8)";

  const openBookingModal = (category: ServiceCategory, sub?: SubService) => {
    setSelectedCategory(category);
    setSelectedSub(sub ?? null);
    setBookingError("");
    setBookingSuccess(null);
    setBookingForm((prev) => ({
      ...prev,
      farmerName: prev.farmerName || user?.name || "",
      farmerPhone: prev.farmerPhone || user?.phone || "",
      farmerEmail: prev.farmerEmail || user?.email || "",
      county: prev.county || user?.county || "Uasin Gishu",
    }));
    setBookingModalOpen(true);
  };

  const handleSubPrimaryAction = (category: ServiceCategory, sub: SubService) => {
    if (sub.id === "learn_value_addition") {
      router.push("/academy");
      return;
    }
    if (sub.id === "buy_machinery") {
      router.push("/(tabs)/shop");
      return;
    }
    openBookingModal(category, sub);
  };

  const handleBookingSubmit = async () => {
    setBookingError("");
    if (bookingForm.farmerName.trim().length < 2) {
      setBookingError("Please enter your full name.");
      return;
    }
    const cleanPhone = bookingForm.farmerPhone.replace(/[\s\-()]/g, "");
    if (!PHONE_RE.test(cleanPhone)) {
      setBookingError("Please enter a valid Kenyan phone number (e.g. 0712 345 678 or +254712345678).");
      return;
    }
    const cleanEmail = bookingForm.farmerEmail.trim();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setBookingError("Please enter a valid email address or leave it blank.");
      return;
    }
    if (!bookingForm.county) {
      setBookingError("Please select your county.");
      return;
    }

    const serviceName = selectedSub
      ? `${selectedCategory?.title} - ${selectedSub.title}`
      : selectedCategory?.title || "Agricultural Service";
    const subTitle = selectedSub?.title || selectedCategory?.title || "Agricultural Service";

    setSubmittingBooking(true);
    try {
      const res = await api.submitServiceRequest({
        service: serviceName,
        subservice_name: subTitle,
        category: selectedCategory?.title || "",
        name: bookingForm.farmerName.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        county: bookingForm.county,
        subcounty: bookingForm.location.trim(),
        farmSize: bookingForm.farmSize.trim(),
        date: bookingForm.preferredDate.trim() || new Date().toISOString().slice(0, 10),
        channel: selectedSub?.id === "lease_land" ? "whatsapp" : "website",
        details:
          bookingForm.notes.trim() ||
          `Service request for ${serviceName} in ${bookingForm.county}${bookingForm.farmSize ? ` (${bookingForm.farmSize})` : ""}`,
      });

      const refId = res?.id || `SRV-${Date.now().toString().slice(-6)}`;
      setBookingSuccess({ reference: refId, serviceName });

      if (selectedSub?.id === "lease_land") {
        openWhatsAppInquiry(
          `Land Leasing Request (Ref: ${refId})`,
          selectedCategory?.title,
          `Farmer: ${bookingForm.farmerName} (${cleanPhone}), County: ${bookingForm.county}, Location: ${bookingForm.location || "N/A"}, Preferred Acreage: ${bookingForm.farmSize || "N/A"}, Notes: ${bookingForm.notes || "Looking to lease farmland"}`
        );
      }
    } catch (err: any) {
      setBookingError(err?.message || "Failed to submit request. Please try again.");
    } finally {
      setSubmittingBooking(false);
    }
  };

  const isLeaseLandSelected = selectedSub?.id === "lease_land";

  return (
    <Page title="Services" testID="services-screen">
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: bottom + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={q.isRefetching}
            onRefresh={q.refetch}
            tintColor={colors.brandPrimary}
            colors={[colors.brandPrimary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* =========================================================
            SECTION 1: HERO BANNER + STATS BAR (MATCHING MQULIMA.COM)
           ========================================================= */}
        <View style={styles.heroContainer}>
          <View style={styles.heroImageArea}>
            <Image
              source={{ uri: servicesHero.heroImage }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={300}
            />
            <LinearGradient
              colors={["rgba(11,33,23,0.92)", "rgba(11,33,23,0.78)", "rgba(15,41,30,0.96)"]}
              locations={[0, 0.5, 1]}
              style={styles.heroOverlay}
            >
              {/* Pill Badge */}
              <View style={styles.heroBadge}>
                <Lucide name="sprout" size={14} color="#85CC14" />
                <Text style={styles.heroBadgeText}>{servicesHero.badge}</Text>
              </View>

              {/* Main Title */}
              <Text style={styles.heroTitle}>{servicesHero.title}</Text>

              {/* Full Website Narrative Paragraph */}
              <Text style={styles.heroDescription}>{servicesHero.text}</Text>

              {/* Action Buttons Row */}
              <View style={styles.heroButtonsRow}>
                <Pressable
                  testID="services-view-btn"
                  onPress={scrollToServicesSection}
                  style={({ pressed }) => [
                    styles.heroPrimaryBtn,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Text style={styles.heroPrimaryBtnText}>View Services</Text>
                  <Lucide name="arrow-right" size={16} color="#0B2117" />
                </Pressable>

                <Pressable
                  testID="services-terms-btn"
                  onPress={() => router.push("/legal")}
                  style={({ pressed }) => [
                    styles.heroSecondaryBtn,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Lucide name="file-text" size={15} color="#0B2117" />
                  <Text style={styles.heroSecondaryBtnText}>Terms & Conditions</Text>
                </Pressable>
              </View>

              {/* 3 Checkmark Trust Badges */}
              <View style={styles.trustRow}>
                {servicesHero.trust.map((item) => (
                  <View key={item} style={styles.trustItem}>
                    <View style={styles.trustCheckCircle}>
                      <Lucide name="check" size={11} color="#FFFFFF" />
                    </View>
                    <Text style={styles.trustItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>

          {/* Bottom Stats Bar Ribbon (#EDF7E2) - Self-Sliding Marquee */}
          <View style={styles.statsRibbon} testID="services-stats">
            <RNAnimated.View
              style={[
                styles.statsMarqueeTrack,
                { transform: [{ translateX: marqueeAnim }] },
              ]}
            >
              {[0, 1].map((dupIdx) => (
                <View key={dupIdx} style={styles.statsSetRow}>
                  {servicesHero.stats.map((st) => (
                    <View key={`${dupIdx}-${st.l}`} style={styles.statRibbonItem}>
                      <View style={styles.statIconBox}>
                        <Lucide name={st.icon as any} size={18} color="#16A34A" />
                      </View>
                      <View>
                        <Text style={styles.statValueText}>{st.v}</Text>
                        <Text style={styles.statLabelText}>{st.l}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </RNAnimated.View>
          </View>
        </View>

        {/* =========================================================
            SECTION 2: STRUCTURED SERVICES & SUB-CATEGORIES
           ========================================================= */}
        <View
          ref={servicesSectionRef}
          onLayout={(e) => {
            const y = e.nativeEvent.layout.y;
            setServicesSectionY(y);
            layoutYRef.current.servicesSection = y;
          }}
          style={styles.servicesSection}
        >
          {/* Section Header */}
          <View style={styles.sectionHeaderBlock}>
            <View style={styles.structuredBadge}>
              <Lucide name="sprout" size={14} color="#35610D" />
              <Text style={styles.structuredBadgeText}>
                STRUCTURED SERVICES & SUB-CATEGORIES
              </Text>
            </View>

            <Text style={styles.sectionHeading}>
              Everything your farm needs,{" "}
              <Text style={styles.sectionHeadingHighlight}>organized by category</Text>
            </Text>

            <Text style={styles.sectionSubheading}>
              Explore our specialist agricultural services arranged by main category and
              dedicated sub-categories. Select any category to view its vetted
              specialists, detailed procedures, and dispatch options.
            </Text>
          </View>

          {/* Category Filter Dropdown Card (Matching mqulima.com) */}
          <View style={styles.filterCard}>
            <View style={styles.filterCardTop}>
              <View style={styles.filterIconBox}>
                <Lucide name="sprout" size={20} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.filterCardTitle}>Filter by Service Category</Text>
                <Text style={styles.filterCardSub}>
                  Select a category from the dropdown to filter services
                </Text>
              </View>
            </View>

            <View style={styles.filterControlsRow}>
              <Pressable
                testID="services-category-dropdown"
                onPress={() => setFilterModalOpen(true)}
                style={styles.dropdownSelector}
              >
                <Text style={styles.dropdownSelectorText} numberOfLines={1}>
                  {activeFilterLabel}
                </Text>
                <Lucide name="chevron-down" size={18} color="#0F291E" />
              </Pressable>

              {cat !== "all" && (
                <Pressable
                  testID="services-filter-reset"
                  onPress={() => setCat("all")}
                  style={styles.resetFilterBtn}
                >
                  <Lucide name="x" size={14} color="#475569" />
                  <Text style={styles.resetFilterBtnText}>Reset</Text>
                </Pressable>
              )}
            </View>

            {/* Quick Horizontal Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickChipsRow}
            >
              <Pressable
                testID="services-filter-all"
                onPress={() => setCat("all")}
                style={[
                  styles.quickChip,
                  cat === "all" && styles.quickChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.quickChipText,
                    cat === "all" && styles.quickChipTextActive,
                  ]}
                >
                  All ({allCategories.length})
                </Text>
              </Pressable>
              {allCategories.map((c) => {
                const isActive = cat === c.id;
                return (
                  <Pressable
                    key={c.id}
                    testID={`services-filter-${c.id}`}
                    onPress={() => setCat(c.id)}
                    style={[styles.quickChip, isActive && styles.quickChipActive]}
                  >
                    <Text
                      style={[
                        styles.quickChipText,
                        isActive && styles.quickChipTextActive,
                      ]}
                    >
                      {c.n}. {c.title} ({c.subs.length})
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Categories & Nested Sub-Services Blocks */}
          {q.isLoading && !visibleCategories.length ? (
            <ListSkeleton count={3} height={240} />
          ) : (
            <View
              style={styles.categoriesStack}
              onLayout={(e) => {
                layoutYRef.current.categoriesStack = e.nativeEvent.layout.y;
              }}
            >
              {visibleCategories.map((category) => (
                <View
                  key={category.id}
                  onLayout={(e) => {
                    layoutYRef.current[`cat:${category.id}`] = e.nativeEvent.layout.y;
                  }}
                  style={styles.categoryBlock}
                  testID={`service-category-${category.id}`}
                >
                  {/* 1. CATEGORY FLAGSHIP SHOWCASE CARD */}
                  <View style={styles.flagshipCard}>
                    {/* Top Dark Green Identification Bar + Bold Yellow Category Title Above */}
                    <View style={styles.flagshipTopBar}>
                      <View style={styles.flagshipTopMetaRow}>
                        <View style={styles.flagshipTopBarLeft}>
                          <View style={styles.categoryPartBadge}>
                            <Text style={styles.categoryPartBadgeText}>
                              CATEGORY {category.n}
                            </Text>
                          </View>
                          <Text style={styles.pillarLabelText} numberOfLines={1}>
                            Mqulima Specialist Pillar
                          </Text>
                        </View>
                        <View style={styles.servicesCountPill}>
                          <Text style={styles.servicesCountPillText}>
                            {category.servicesCountText ||
                              `${category.subs.length} Services Included`}
                          </Text>
                        </View>
                      </View>
                      <Text
                        testID={`category-title-${category.id}`}
                        style={styles.categoryTopTitleText}
                      >
                        {category.n}. {category.title}
                      </Text>
                    </View>

                    {/* 16:9 Category Image */}
                    <View style={styles.flagshipImageWrap}>
                      <Image
                        source={{ uri: category.image }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        transition={300}
                      />
                      <View style={styles.vettedBadge}>
                        <View style={styles.vettedBadgeIcon}>
                          <Lucide
                            name={(category.iconName as any) || "sprout"}
                            size={14}
                            color="#0F291E"
                          />
                        </View>
                        <Text style={styles.vettedBadgeText}>VETTED SERVICE</Text>
                      </View>
                    </View>

                    {/* Flagship Card Body */}
                    <View style={styles.flagshipBody}>
                      <Text style={styles.servicePillarKicker}>
                        SERVICE PILLAR {category.n}
                      </Text>

                      {/* Category Narrative Description */}
                      <Text style={styles.flagshipDescription}>{category.text}</Text>

                      {/* Sub-categories Covered Checklist Box */}
                      <View style={styles.checklistBox}>
                        <Text style={styles.checklistHeading}>
                          SUB-CATEGORIES COVERED IN {category.n}.{" "}
                          {category.title.toUpperCase()}
                        </Text>
                        <View style={styles.checklistGrid}>
                          {category.subs.map((sub) => (
                            <Pressable
                              key={sub.id}
                              testID={`checklist-sub-${sub.id}`}
                              onPress={() => scrollToSubService(category.id, sub.id)}
                              style={({ pressed }) => [
                                styles.checklistItemBtn,
                                pressed && { backgroundColor: "#EDF7E2" },
                              ]}
                            >
                              <View style={styles.romanSmallBadge}>
                                <Text style={styles.romanSmallBadgeText}>
                                  {sub.numeral}
                                </Text>
                              </View>
                              <Text style={styles.checklistItemText} numberOfLines={1}>
                                {sub.title}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>

                      {/* Category Dual Action Buttons */}
                      <View style={styles.dualActionRow}>
                        <Pressable
                          testID={`category-primary-cta-${category.id}`}
                          onPress={() => openBookingModal(category)}
                          style={({ pressed }) => [
                            styles.darkGreenActionBtn,
                            pressed && { opacity: 0.9 },
                          ]}
                        >
                          <Text style={styles.darkGreenActionBtnText}>
                            {category.cta}
                          </Text>
                          <Lucide name="arrow-up-right" size={16} color="#85CC14" />
                        </Pressable>

                        <Pressable
                          testID={`category-learn-more-${category.id}`}
                          onPress={() => router.push(`/services/${category.id}`)}
                          style={({ pressed }) => [
                            styles.yellowActionBtn,
                            pressed && { opacity: 0.9 },
                          ]}
                        >
                          <Text style={styles.yellowActionBtnText}>
                            {category.action2Text || "Learn More"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>

                  {/* 2. NESTED SUB-SERVICES SECTION FOR THIS CATEGORY */}
                  <View
                    style={styles.subServicesContainer}
                    onLayout={(e) => {
                      layoutYRef.current[`subsWrap:${category.id}`] = e.nativeEvent.layout.y;
                    }}
                  >
                    <View style={styles.subServicesHeaderBar}>
                      <View style={styles.subServicesAccentLine} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subServicesHeaderTitle}>
                          {category.n}. Sub-services in {category.title}
                        </Text>
                        <Text style={styles.subServicesHeaderSub}>
                          {category.subs.length} specialist services available to request
                          directly
                        </Text>
                      </View>
                    </View>

                    <View
                      style={styles.subServicesCardsGrid}
                      onLayout={(e) => {
                        layoutYRef.current[`subsGrid:${category.id}`] = e.nativeEvent.layout.y;
                      }}
                    >
                      {category.subs.map((sub) => (
                        <View
                          key={sub.id}
                          ref={(el) => {
                            subCardRefs.current[sub.id] = el;
                          }}
                          onLayout={(e) => {
                            layoutYRef.current[`sub:${sub.id}`] = e.nativeEvent.layout.y;
                          }}
                          style={[
                            styles.subServiceCard,
                            highlightedSubId === sub.id && {
                              borderColor: "#FACC15",
                              borderWidth: 2,
                            },
                          ]}
                          testID={`sub-service-${sub.id}`}
                        >
                          {/* Sub-service Image Header */}
                          <View style={styles.subServiceImageWrap}>
                            <Image
                              source={{ uri: sub.image }}
                              style={StyleSheet.absoluteFill}
                              contentFit="cover"
                              transition={300}
                            />
                            <View style={styles.subServiceImageBadgesRow}>
                              <View style={styles.subServiceRomanPill}>
                                <Text style={styles.subServiceRomanPillLabel}>
                                  SUB-SERVICE
                                </Text>
                                <Text style={styles.subServiceRomanPillValue}>
                                  {sub.numeral}
                                </Text>
                              </View>
                              {sub.tag ? (
                                <View style={styles.subServiceTagPill}>
                                  <Text style={styles.subServiceTagPillText}>
                                    {sub.tag}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          </View>

                          {/* Sub-service Card Body */}
                          <View style={styles.subServiceBody}>
                            <View style={styles.subServiceTitleRow}>
                              <View style={styles.subServiceIconBox}>
                                <Lucide
                                  name={(sub.iconName as any) || "sprout"}
                                  size={18}
                                  color="#16A34A"
                                />
                              </View>
                              <View style={styles.subServiceTitleWrap}>
                                <View style={styles.subServiceTitleInline}>
                                  <View style={styles.subServiceInlineRoman}>
                                    <Text style={styles.subServiceInlineRomanText}>
                                      {sub.numeral}
                                    </Text>
                                  </View>
                                  <Text style={styles.subServiceTitleText}>
                                    {sub.title}
                                  </Text>
                                </View>
                              </View>
                            </View>

                            <Text style={styles.subServiceDescription}>{sub.text}</Text>

                            {/* Special Mqulima Agro-Insurance Expert Desk Box (Matching mqulima.com) */}
                            {sub.id === "agri_insurance" && (
                              <View style={styles.insuranceExpertDesk}>
                                <View style={styles.insuranceDeskHeader}>
                                  <Lucide
                                    name="shield-check"
                                    size={15}
                                    color="#16A34A"
                                  />
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
                                  onPress={() =>
                                    Linking.openURL("mailto:mqulima@mqulima.com")
                                  }
                                  style={styles.insuranceDeskRow}
                                >
                                  <Lucide name="mail" size={13} color="#16A34A" />
                                  <Text style={styles.insuranceDeskLabel}>Email:</Text>
                                  <Text style={styles.insuranceDeskLink}>
                                    mqulima@mqulima.com
                                  </Text>
                                </Pressable>
                                <Pressable
                                  onPress={() =>
                                    openWhatsAppInquiry(
                                      "Agri Insurance Desk",
                                      "01. Finance & Insurance"
                                    )
                                  }
                                  style={styles.insuranceDeskRow}
                                >
                                  <Lucide
                                    name="message-circle"
                                    size={13}
                                    color="#16A34A"
                                  />
                                  <Text style={styles.insuranceDeskLabel}>WhatsApp:</Text>
                                  <Text style={styles.insuranceDeskLink}>
                                    @mqulima (0723346134)
                                  </Text>
                                </Pressable>
                              </View>
                            )}

                            {/* Sub-service Dual Action Buttons */}
                            <View style={styles.subServiceActionsRow}>
                              <Pressable
                                testID={`sub-service-request-${sub.id}`}
                                onPress={() => handleSubPrimaryAction(category, sub)}
                                style={({ pressed }) => [
                                  styles.subPrimaryBtn,
                                  pressed && { opacity: 0.9 },
                                ]}
                              >
                                <Text
                                  style={styles.subPrimaryBtnText}
                                  numberOfLines={1}
                                >
                                  {sub.cta}
                                </Text>
                                <Lucide
                                  name="arrow-up-right"
                                  size={14}
                                  color="#85CC14"
                                />
                              </Pressable>

                              {sub.action2Text !== "" && (
                                <Pressable
                                  testID={`sub-service-learn-${sub.id}`}
                                  onPress={() => router.push(`/service/${sub.id}`)}
                                  style={({ pressed }) => [
                                    styles.subSecondaryBtn,
                                    pressed && { opacity: 0.9 },
                                  ]}
                                >
                                  <Text style={styles.subSecondaryBtnText}>
                                    {sub.action2Text || "Learn More"}
                                  </Text>
                                </Pressable>
                              )}
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* =========================================================
            SECTION 3: MQULIMA DIGITAL TOOLS GRID (TOOLS #38 TO #43)
           ========================================================= */}
        <View style={styles.toolsSection}>
          <View style={styles.toolsHeaderBlock}>
            <View style={styles.toolsBadge}>
              <Lucide name="sparkles" size={14} color="#85CC14" />
              <Text style={styles.toolsBadgeText}>MQULIMA TOOLS</Text>
            </View>

            <Text style={styles.toolsHeading}>
              Farming decisions are only as good as the{" "}
              <Text style={styles.toolsHeadingHighlight}>information behind them</Text>
            </Text>

            <Text style={styles.toolsDescription}>
              Mqulima Tools puts the pulse of the market, the sky above your farm, and
              the story behind every product literally in your hands. Plan smarter, farm
              sharper, and prove what you’ve built. Win
            </Text>

            <View style={styles.toolsHeaderBtnsRow}>
              <Pressable
                testID="services-see-toolbox-btn"
                onPress={() => router.push("/tools")}
                style={styles.toolsPrimaryHeaderBtn}
              >
                <Text style={styles.toolsPrimaryHeaderBtnText}>See Toolbox</Text>
                <Lucide name="arrow-right" size={16} color="#0B2117" />
              </Pressable>

              <Pressable
                onPress={() =>
                  openWhatsAppInquiry("Mqulima Digital Tools", "Mqulima Tools")
                }
                style={styles.toolsSecondaryHeaderBtn}
              >
                <Text style={styles.toolsSecondaryHeaderBtnText}>Learn More</Text>
              </Pressable>
            </View>
          </View>

          {/* 6 Digital Tool Cards */}
          <View style={styles.toolsCardsList}>
            {servicesTools.map((tool) => (
              <View key={tool.id} style={styles.toolCard} testID={`service-tool-${tool.id}`}>
                <View style={styles.toolCardTopRow}>
                  <View style={styles.toolIconBox}>
                    <Lucide
                      name={tool.iconName as any}
                      size={22}
                      color="#0F291E"
                    />
                  </View>
                  <View style={styles.toolNumberPill}>
                    <Text style={styles.toolNumberPillText}>TOOL #{tool.number}</Text>
                  </View>
                </View>

                <Text style={styles.toolCardTitle}>{tool.name}</Text>
                <Text style={styles.toolCardDescription}>{tool.description}</Text>

                <View style={styles.toolCardActionsRow}>
                  <Pressable
                    onPress={() => router.push(tool.route as any)}
                    style={({ pressed }) => [
                      styles.toolCardPrimaryBtn,
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    <Text style={styles.toolCardPrimaryBtnText} numberOfLines={1}>
                      {tool.action1Text}
                    </Text>
                    <Lucide name="arrow-up-right" size={14} color="#0F291E" />
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      openWhatsAppInquiry(tool.name, "Mqulima Digital Tools")
                    }
                    style={({ pressed }) => [
                      styles.toolCardSecondaryBtn,
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    <Text style={styles.toolCardSecondaryBtnText}>
                      {tool.action2Text}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* =========================================================
          MODAL 1: CATEGORY FILTER DROPDOWN PICKER
         ========================================================= */}
      <Modal
        visible={filterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setFilterModalOpen(false)}
        >
          <View style={styles.filterModalSheet}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filter by Service Category</Text>
              <Pressable onPress={() => setFilterModalOpen(false)} hitSlop={10}>
                <Lucide name="x" size={20} color="#0F291E" />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {categoryFilters.map((f) => {
                const active = cat === f.id;
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => {
                      setCat(f.id);
                      setFilterModalOpen(false);
                    }}
                    style={[
                      styles.filterOptionRow,
                      active && styles.filterOptionRowActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        active && styles.filterOptionTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                    {active && <Lucide name="check" size={18} color="#16A34A" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* =========================================================
          MODAL 2: SERVICE BOOKING REQUEST MODAL (MATCHING MQULIMA.COM)
         ========================================================= */}
      <Modal
        visible={bookingModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setBookingModalOpen(false)}
      >
        <View style={styles.bookingModalBackdrop}>
          <View style={styles.bookingModalCard}>
            {/* Dark Green Modal Header */}
            <View style={styles.bookingModalHeader}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <View style={styles.bookingModalBadge}>
                  <Lucide name="sprout" size={13} color="#85CC14" />
                  <Text style={styles.bookingModalBadgeText}>MQULIMA SERVICES</Text>
                </View>
                <Text style={styles.bookingModalTitle}>
                  {selectedSub
                    ? selectedSub.title
                    : selectedCategory?.title || "Book a Service"}
                </Text>
                <Text style={styles.bookingModalSubtitle}>
                  {selectedSub && selectedCategory
                    ? `${selectedCategory.title} • ${selectedSub.tag}`
                    : "Complete the details below to dispatch an expert to your farm."}
                </Text>
              </View>
              <Pressable
                onPress={() => setBookingModalOpen(false)}
                style={styles.bookingCloseBtn}
                hitSlop={10}
              >
                <Lucide name="x" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.bookingModalBody}
              keyboardShouldPersistTaps="handled"
            >
              {bookingSuccess ? (
                <View style={styles.bookingSuccessBox}>
                  <View style={styles.bookingSuccessIconCircle}>
                    <Lucide name="circle-check" size={38} color="#16A34A" />
                  </View>
                  <Text style={styles.bookingSuccessTitle}>Request Received!</Text>
                  <Text style={styles.bookingSuccessText}>
                    Your request for{" "}
                    <Text style={{ fontFamily: fonts.b700, color: "#0F291E" }}>
                      {bookingSuccess.serviceName}
                    </Text>{" "}
                    has been logged under reference{" "}
                    <Text style={{ fontFamily: fonts.b800, color: "#16A34A" }}>
                      {bookingSuccess.reference}
                    </Text>
                    . An agricultural specialist in {bookingForm.county} will contact
                    you shortly.
                  </Text>

                  <View style={{ width: "100%", gap: 10, marginTop: 12 }}>
                    <Pressable
                      onPress={() =>
                        openWhatsAppInquiry(
                          `${bookingSuccess.serviceName} (Ref: ${bookingSuccess.reference})`,
                          selectedCategory?.title,
                          `Farmer: ${bookingForm.farmerName}, County: ${bookingForm.county}`
                        )
                      }
                      style={styles.whatsappConfirmBtn}
                    >
                      <Lucide name="message-circle" size={18} color="#0F291E" />
                      <Text style={styles.whatsappConfirmBtnText}>
                        Follow Up on WhatsApp
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setBookingSuccess(null);
                        setBookingModalOpen(false);
                      }}
                      style={styles.doneBookingBtn}
                    >
                      <Text style={styles.doneBookingBtnText}>Done</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  {/* Special Land Leasing Desk Banner when Lease Land is selected */}
                  {isLeaseLandSelected && (
                    <View style={styles.leaseLandBanner}>
                      <View style={styles.leaseLandBannerTop}>
                        <View style={styles.leaseLandIconBox}>
                          <Lucide
                            name="message-circle"
                            size={18}
                            color="#FFFFFF"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.leaseLandBannerTitle}>
                            Mqulima Land Leasing Desk (WhatsApp Enabled)
                          </Text>
                          <Text style={styles.leaseLandBannerText}>
                            Submit your preferred county, acreage, and farming enterprise
                            below, or connect immediately with our vetted Land Leasing Desk
                            on WhatsApp.
                          </Text>
                        </View>
                      </View>
                      <View style={styles.leaseLandBtnsRow}>
                        <Pressable
                          onPress={() =>
                            openWhatsAppInquiry(
                              "Lease Land Inquiry",
                              "03. Crop services",
                              `County: ${bookingForm.county || "Kenya"}, Acreage: ${bookingForm.farmSize || "To be discussed"}`
                            )
                          }
                          style={styles.leaseWhatsappDirectBtn}
                        >
                          <Lucide
                            name="message-circle"
                            size={14}
                            color="#FFFFFF"
                          />
                          <Text style={styles.leaseWhatsappDirectBtnText}>
                            Chat on WhatsApp Now (+254 723 346 134)
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => Linking.openURL(`tel:${contactInfo.phoneRaw}`)}
                          style={styles.leaseCallBtn}
                        >
                          <Lucide name="phone" size={14} color="#065F46" />
                          <Text style={styles.leaseCallBtnText}>Call Desk</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {bookingError ? (
                    <View style={styles.bookingErrorBox}>
                      <Lucide name="circle-alert" size={16} color="#DC2626" />
                      <Text style={styles.bookingErrorText}>{bookingError}</Text>
                    </View>
                  ) : null}

                  <View style={styles.formFieldGroup}>
                    <Text style={styles.formLabel}>Farmer Name *</Text>
                    <TextInput
                      value={bookingForm.farmerName}
                      onChangeText={(v) =>
                        setBookingForm((s) => ({ ...s, farmerName: v }))
                      }
                      placeholder="John Kamau"
                      placeholderTextColor="#94A3B8"
                      style={styles.formInput}
                    />
                  </View>

                  <View style={styles.formFieldGroup}>
                    <Text style={styles.formLabel}>Phone Number *</Text>
                    <TextInput
                      value={bookingForm.farmerPhone}
                      onChangeText={(v) =>
                        setBookingForm((s) => ({ ...s, farmerPhone: v }))
                      }
                      placeholder="+254 712 345 678"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      style={styles.formInput}
                    />
                  </View>

                  <View style={styles.formFieldGroup}>
                    <Text style={styles.formLabel}>Email Address (Optional)</Text>
                    <TextInput
                      value={bookingForm.farmerEmail}
                      onChangeText={(v) =>
                        setBookingForm((s) => ({ ...s, farmerEmail: v }))
                      }
                      placeholder="john@example.com"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={styles.formInput}
                    />
                  </View>

                  <View style={styles.formFieldGroup}>
                    <Text style={styles.formLabel}>County *</Text>
                    <Pressable
                      onPress={() => setCountyPickerOpen((o) => !o)}
                      style={styles.formSelectBtn}
                    >
                      <Text style={styles.formSelectBtnText}>
                        {bookingForm.county || "Select County"}
                      </Text>
                      <Lucide
                        name={countyPickerOpen ? "chevron-up" : "chevron-down"}
                        size={18}
                        color="#475569"
                      />
                    </Pressable>
                    {countyPickerOpen && (
                      <View style={styles.inlineCountyList}>
                        <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                          {counties.map((cName) => (
                            <Pressable
                              key={cName}
                              onPress={() => {
                                setBookingForm((s) => ({ ...s, county: cName }));
                                setCountyPickerOpen(false);
                              }}
                              style={styles.inlineCountyItem}
                            >
                              <Text
                                style={[
                                  styles.inlineCountyItemText,
                                  bookingForm.county === cName && {
                                    fontFamily: fonts.b700,
                                    color: "#16A34A",
                                  },
                                ]}
                              >
                                {cName}
                              </Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  <View style={styles.formFieldGroup}>
                    <Text style={styles.formLabel}>
                      Specific Farm Location (Ward / Village)
                    </Text>
                    <TextInput
                      value={bookingForm.location}
                      onChangeText={(v) =>
                        setBookingForm((s) => ({ ...s, location: v }))
                      }
                      placeholder="e.g., Soy Ward, Ziwa"
                      placeholderTextColor="#94A3B8"
                      style={styles.formInput}
                    />
                  </View>

                  <View style={styles.formFieldGroup}>
                    <Text style={styles.formLabel}>Farm Size / Scale</Text>
                    <TextInput
                      value={bookingForm.farmSize}
                      onChangeText={(v) =>
                        setBookingForm((s) => ({ ...s, farmSize: v }))
                      }
                      placeholder="e.g., 5 Acres or 20 Dairy Cows"
                      placeholderTextColor="#94A3B8"
                      style={styles.formInput}
                    />
                  </View>

                  <View style={styles.formFieldGroup}>
                    <Text style={styles.formLabel}>Preferred Date</Text>
                    <TextInput
                      value={bookingForm.preferredDate}
                      onChangeText={(v) =>
                        setBookingForm((s) => ({ ...s, preferredDate: v }))
                      }
                      placeholder="e.g., Next Monday or 2026-11-15"
                      placeholderTextColor="#94A3B8"
                      style={styles.formInput}
                    />
                  </View>

                  <View style={styles.formFieldGroup}>
                    <Text style={styles.formLabel}>
                      Specific Notes or Requirements
                    </Text>
                    <TextInput
                      value={bookingForm.notes}
                      onChangeText={(v) =>
                        setBookingForm((s) => ({ ...s, notes: v }))
                      }
                      placeholder="Tell us more about your current challenge or goal..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={3}
                      style={[styles.formInput, { minHeight: 82, textAlignVertical: "top" }]}
                    />
                  </View>

                  <View style={styles.bookingFooterRow}>
                    <Pressable
                      onPress={() => setBookingModalOpen(false)}
                      style={styles.bookingCancelBtn}
                    >
                      <Text style={styles.bookingCancelBtnText}>Cancel</Text>
                    </Pressable>

                    <Pressable
                      onPress={handleBookingSubmit}
                      disabled={submittingBooking}
                      style={[
                        styles.bookingSubmitBtn,
                        submittingBooking && { opacity: 0.6 },
                      ]}
                    >
                      <Text style={styles.bookingSubmitBtnText}>
                        {submittingBooking
                          ? "Submitting..."
                          : isLeaseLandSelected
                          ? "Submit & Open WhatsApp"
                          : "Submit Service Request"}
                      </Text>
                      <Lucide name="arrow-right" size={16} color="#0F291E" />
                    </Pressable>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Page>
  );
}

const styles = StyleSheet.create({
  // Section 1: Hero + Stats Ribbon
  heroContainer: {
    backgroundColor: "#0B2117",
  },
  heroImageArea: {
    minHeight: 450,
    position: "relative",
  },
  heroOverlay: {
    paddingHorizontal: 18,
    paddingTop: 26,
    paddingBottom: 28,
    justifyContent: "center",
    gap: 14,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(133, 204, 20, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(133, 204, 20, 0.35)",
  },
  heroBadgeText: {
    fontFamily: fonts.b800,
    fontSize: 11,
    letterSpacing: 1.1,
    color: "#A9E34B",
  },
  heroTitle: {
    fontFamily: fonts.h900,
    fontSize: 38,
    lineHeight: 42,
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  heroDescription: {
    fontFamily: fonts.b400,
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255, 255, 255, 0.90)",
  },
  heroButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  heroPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#85CC14",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 0,
  },
  heroPrimaryBtnText: {
    fontFamily: fonts.b700,
    fontSize: 14,
    color: "#0B2117",
  },
  heroSecondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#FACC15",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 0,
  },
  heroSecondaryBtnText: {
    fontFamily: fonts.b700,
    fontSize: 13,
    color: "#0B2117",
  },
  trustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 6,
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  trustCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  trustItemText: {
    fontFamily: fonts.b600,
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.92)",
  },
  statsRibbon: {
    backgroundColor: "#EDF7E2",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#D8EBC4",
    paddingVertical: 12,
    overflow: "hidden",
  },
  statsMarqueeTrack: {
    flexDirection: "row",
    alignItems: "center",
    width: 1560,
  },
  statsSetRow: {
    flexDirection: "row",
    alignItems: "center",
    width: 780,
    justifyContent: "space-around",
  },
  statRibbonItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
  },
  statIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8EBC4",
    alignItems: "center",
    justifyContent: "center",
  },
  statValueText: {
    fontFamily: fonts.h900,
    fontSize: 16,
    color: "#0F291E",
  },
  statLabelText: {
    fontFamily: fonts.b500,
    fontSize: 11,
    color: "#475569",
  },

  // Section 2: Structured Services & Sub-Categories
  servicesSection: {
    backgroundColor: "#FAFBF9",
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 16,
    gap: 20,
  },
  sectionHeaderBlock: {
    gap: 10,
  },
  structuredBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#E5F5D0",
    borderWidth: 1,
    borderColor: "#C8E6A0",
    borderRadius: 6,
  },
  structuredBadgeText: {
    fontFamily: fonts.b800,
    fontSize: 11,
    letterSpacing: 0.8,
    color: "#35610D",
  },
  sectionHeading: {
    fontFamily: fonts.h900,
    fontSize: 26,
    lineHeight: 32,
    color: "#0F291E",
  },
  sectionHeadingHighlight: {
    color: "#6EA810",
  },
  sectionSubheading: {
    fontFamily: fonts.b400,
    fontSize: 13.5,
    lineHeight: 20,
    color: "#475569",
  },

  // Filter Card
  filterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    gap: 12,
  },
  filterCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  filterIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EDF7E2",
    borderWidth: 1,
    borderColor: "#C5E898",
    alignItems: "center",
    justifyContent: "center",
  },
  filterCardTitle: {
    fontFamily: fonts.b700,
    fontSize: 14,
    color: "#0F291E",
  },
  filterCardSub: {
    fontFamily: fonts.b400,
    fontSize: 11.5,
    color: "#64748B",
  },
  filterControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dropdownSelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAFBF9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dropdownSelectorText: {
    fontFamily: fonts.b700,
    fontSize: 13.5,
    color: "#0F291E",
    flex: 1,
  },
  resetFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 0,
  },
  resetFilterBtnText: {
    fontFamily: fonts.b700,
    fontSize: 12,
    color: "#475569",
  },
  quickChipsRow: {
    gap: 8,
    paddingTop: 2,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 0,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  quickChipActive: {
    backgroundColor: "#0F291E",
    borderColor: "#0F291E",
  },
  quickChipText: {
    fontFamily: fonts.b600,
    fontSize: 12,
    color: "#475569",
  },
  quickChipTextActive: {
    color: "#85CC14",
    fontFamily: fonts.b700,
  },

  // Category Block + Flagship Card
  categoriesStack: {
    gap: 32,
  },
  categoryBlock: {
    gap: 16,
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
    gap: 8,
  },
  flagshipTopBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
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
    letterSpacing: 0.7,
    color: "#0F291E",
  },
  pillarLabelText: {
    fontFamily: fonts.b600,
    fontSize: 10.5,
    color: "rgba(255, 255, 255, 0.80)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    flex: 1,
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
  flagshipImageWrap: {
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
    letterSpacing: 0.6,
    color: "#0F291E",
  },
  flagshipBody: {
    padding: 16,
    gap: 14,
  },
  servicePillarKicker: {
    fontFamily: fonts.b800,
    fontSize: 10.5,
    letterSpacing: 1,
    color: "#16A34A",
  },
  flagshipDescription: {
    fontFamily: fonts.b400,
    fontSize: 13.5,
    lineHeight: 21,
    color: "#475569",
  },
  checklistBox: {
    backgroundColor: "#FAFBF9",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    gap: 8,
  },
  checklistHeading: {
    fontFamily: fonts.b800,
    fontSize: 10,
    letterSpacing: 0.6,
    color: "#0F291E",
  },
  checklistGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  checklistItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  romanSmallBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 6,
    backgroundColor: "#0F291E",
    alignItems: "center",
    justifyContent: "center",
  },
  romanSmallBadgeText: {
    fontFamily: fonts.b800,
    fontSize: 10,
    color: "#85CC14",
  },
  checklistItemText: {
    fontFamily: fonts.b600,
    fontSize: 12,
    color: "#1E293B",
  },
  dualActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  darkGreenActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0F291E",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 0,
  },
  darkGreenActionBtnText: {
    fontFamily: fonts.b700,
    fontSize: 13.5,
    color: "#FFFFFF",
  },
  yellowActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FACC15",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 0,
  },
  yellowActionBtnText: {
    fontFamily: fonts.b700,
    fontSize: 13.5,
    color: "#0F291E",
  },

  // Sub-services Container & Cards
  subServicesContainer: {
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: "rgba(133, 204, 20, 0.55)",
    gap: 14,
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
  subServicesCardsGrid: {
    gap: 14,
  },
  subServiceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  subServiceImageWrap: {
    width: "100%",
    height: 185,
    backgroundColor: "#0B2017",
    position: "relative",
  },
  subServiceImageBadgesRow: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subServiceRomanPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0F291E",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  subServiceRomanPillLabel: {
    fontFamily: fonts.b800,
    fontSize: 9.5,
    letterSpacing: 0.6,
    color: "rgba(255, 255, 255, 0.75)",
  },
  subServiceRomanPillValue: {
    fontFamily: fonts.b800,
    fontSize: 11,
    color: "#85CC14",
  },
  subServiceTagPill: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  subServiceTagPillText: {
    fontFamily: fonts.b700,
    fontSize: 10.5,
    color: "#0F291E",
  },
  subServiceBody: {
    padding: 15,
    gap: 11,
  },
  subServiceTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  subServiceIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#EDF7E2",
    borderWidth: 1,
    borderColor: "#D8EBC4",
    alignItems: "center",
    justifyContent: "center",
  },
  subServiceTitleWrap: {
    flex: 1,
  },
  subServiceTitleInline: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  subServiceInlineRoman: {
    backgroundColor: "#EDF7E2",
    borderWidth: 1,
    borderColor: "#C5E898",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  subServiceInlineRomanText: {
    fontFamily: fonts.b800,
    fontSize: 10.5,
    color: "#0F291E",
  },
  subServiceTitleText: {
    fontFamily: fonts.h800,
    fontSize: 17,
    color: "#0F291E",
    flexShrink: 1,
  },
  subServiceDescription: {
    fontFamily: fonts.b400,
    fontSize: 13,
    lineHeight: 19.5,
    color: "#475569",
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
    letterSpacing: 0.5,
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
  subServiceActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  subPrimaryBtn: {
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
  subPrimaryBtnText: {
    fontFamily: fonts.b700,
    fontSize: 12.5,
    color: "#FFFFFF",
  },
  subSecondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FACC15",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 0,
  },
  subSecondaryBtnText: {
    fontFamily: fonts.b700,
    fontSize: 12.5,
    color: "#0F291E",
  },

  // Section 3: Mqulima Digital Tools Grid
  toolsSection: {
    backgroundColor: "#0F291E",
    paddingHorizontal: 16,
    paddingVertical: 28,
    gap: 22,
  },
  toolsHeaderBlock: {
    gap: 12,
  },
  toolsBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(133, 204, 20, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(133, 204, 20, 0.3)",
  },
  toolsBadgeText: {
    fontFamily: fonts.b800,
    fontSize: 11,
    letterSpacing: 1,
    color: "#85CC14",
  },
  toolsHeading: {
    fontFamily: fonts.h900,
    fontSize: 26,
    lineHeight: 32,
    color: "#FFFFFF",
  },
  toolsHeadingHighlight: {
    color: "#85CC14",
  },
  toolsDescription: {
    fontFamily: fonts.b400,
    fontSize: 13.5,
    lineHeight: 21,
    color: "rgba(255, 255, 255, 0.82)",
  },
  toolsHeaderBtnsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  toolsPrimaryHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#85CC14",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 0,
  },
  toolsPrimaryHeaderBtnText: {
    fontFamily: fonts.b700,
    fontSize: 13.5,
    color: "#0B2117",
  },
  toolsSecondaryHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FACC15",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 0,
  },
  toolsSecondaryHeaderBtnText: {
    fontFamily: fonts.b700,
    fontSize: 13.5,
    color: "#0B2117",
  },
  toolsCardsList: {
    gap: 14,
  },
  toolCard: {
    backgroundColor: "#133325",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    padding: 16,
    gap: 10,
  },
  toolCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toolIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#85CC14",
    alignItems: "center",
    justifyContent: "center",
  },
  toolNumberPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.10)",
  },
  toolNumberPillText: {
    fontFamily: fonts.b700,
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.70)",
  },
  toolCardTitle: {
    fontFamily: fonts.h800,
    fontSize: 19,
    color: "#FFFFFF",
  },
  toolCardDescription: {
    fontFamily: fonts.b400,
    fontSize: 13,
    lineHeight: 19.5,
    color: "rgba(255, 255, 255, 0.78)",
  },
  toolCardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.10)",
  },
  toolCardPrimaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#85CC14",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 0,
  },
  toolCardPrimaryBtnText: {
    fontFamily: fonts.b700,
    fontSize: 12.5,
    color: "#0F291E",
  },
  toolCardSecondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FACC15",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 0,
  },
  toolCardSecondaryBtnText: {
    fontFamily: fonts.b700,
    fontSize: 12.5,
    color: "#0F291E",
  },

  // Filter Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(11, 33, 23, 0.6)",
    justifyContent: "center",
    padding: 20,
  },
  filterModalSheet: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
  },
  filterModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  filterModalTitle: {
    fontFamily: fonts.h800,
    fontSize: 16,
    color: "#0F291E",
  },
  filterOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  filterOptionRowActive: {
    backgroundColor: "#EDF7E2",
  },
  filterOptionText: {
    fontFamily: fonts.b600,
    fontSize: 14,
    color: "#1E293B",
  },
  filterOptionTextActive: {
    fontFamily: fonts.b800,
    color: "#0F291E",
  },

  // Booking Modal
  bookingModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(11, 33, 23, 0.72)",
    justifyContent: "flex-end",
  },
  bookingModalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    overflow: "hidden",
  },
  bookingModalHeader: {
    backgroundColor: "#0F291E",
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  bookingModalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  bookingModalBadgeText: {
    fontFamily: fonts.b800,
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: "#85CC14",
  },
  bookingModalTitle: {
    fontFamily: fonts.h900,
    fontSize: 20,
    color: "#FFFFFF",
  },
  bookingModalSubtitle: {
    fontFamily: fonts.b400,
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.78)",
    marginTop: 2,
  },
  bookingCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  bookingModalBody: {
    padding: 18,
    gap: 14,
  },
  leaseLandBanner: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#6EE7B7",
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  leaseLandBannerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  leaseLandIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  leaseLandBannerTitle: {
    fontFamily: fonts.b800,
    fontSize: 13,
    color: "#064E3B",
  },
  leaseLandBannerText: {
    fontFamily: fonts.b400,
    fontSize: 11.5,
    lineHeight: 17,
    color: "#065F46",
    marginTop: 2,
  },
  leaseLandBtnsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  leaseWhatsappDirectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#16A34A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 0,
  },
  leaseWhatsappDirectBtnText: {
    fontFamily: fonts.b700,
    fontSize: 11.5,
    color: "#FFFFFF",
  },
  leaseCallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#6EE7B7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 0,
  },
  leaseCallBtnText: {
    fontFamily: fonts.b700,
    fontSize: 11.5,
    color: "#065F46",
  },
  bookingErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 12,
  },
  bookingErrorText: {
    fontFamily: fonts.b600,
    fontSize: 12.5,
    color: "#DC2626",
    flex: 1,
  },
  formFieldGroup: {
    gap: 5,
  },
  formLabel: {
    fontFamily: fonts.b700,
    fontSize: 12.5,
    color: "#1E293B",
  },
  formInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: fonts.b500,
    fontSize: 14,
    color: "#0F172A",
  },
  formSelectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  formSelectBtnText: {
    fontFamily: fonts.b600,
    fontSize: 14,
    color: "#0F172A",
  },
  inlineCountyList: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    marginTop: 4,
    overflow: "hidden",
  },
  inlineCountyItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  inlineCountyItemText: {
    fontFamily: fonts.b500,
    fontSize: 13.5,
    color: "#334155",
  },
  bookingFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 8,
  },
  bookingCancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  bookingCancelBtnText: {
    fontFamily: fonts.b700,
    fontSize: 13.5,
    color: "#475569",
  },
  bookingSubmitBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#85CC14",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 0,
  },
  bookingSubmitBtnText: {
    fontFamily: fonts.b800,
    fontSize: 14,
    color: "#0F291E",
  },
  bookingSuccessBox: {
    alignItems: "center",
    paddingVertical: 18,
    gap: 10,
  },
  bookingSuccessIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EDF7E2",
    alignItems: "center",
    justifyContent: "center",
  },
  bookingSuccessTitle: {
    fontFamily: fonts.h900,
    fontSize: 22,
    color: "#0F291E",
  },
  bookingSuccessText: {
    fontFamily: fonts.b400,
    fontSize: 13.5,
    lineHeight: 20,
    color: "#475569",
    textAlign: "center",
  },
  whatsappConfirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#85CC14",
    paddingVertical: 13,
    borderRadius: 0,
  },
  whatsappConfirmBtnText: {
    fontFamily: fonts.b800,
    fontSize: 14,
    color: "#0F291E",
  },
  doneBookingBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F291E",
    paddingVertical: 13,
    borderRadius: 0,
  },
  doneBookingBtnText: {
    fontFamily: fonts.b700,
    fontSize: 14,
    color: "#FFFFFF",
  },
});
