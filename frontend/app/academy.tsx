import React, { useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { KeyboardAwareScrollView, KeyboardAwareScrollViewRef } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Page } from "@/src/components/Page";
import { Skeleton } from "@/src/components/Skeleton";
import { AcademyState, CourseCard, useAcademyStyles } from "@/src/components/academy/AcademyUI";
import { WaitlistSection } from "@/src/components/academy/WaitlistSection";
import { api } from "@/src/services/api";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function Academy() {
  const s = useStyles(); const shared = useAcademyStyles(); const { colors } = useTheme(); const insets = useSafeAreaInsets(); const router = useRouter();
  const scroll = useRef<KeyboardAwareScrollViewRef>(null); const waitlistY = useRef(0);
  const [level, setLevel] = useState("All");
  const q = useQuery({ queryKey: ["courses"], queryFn: api.getCourses, retry: 1 });
  const courses = (q.data ?? []).filter(course => level === "All" || course.level === level);
  const levels = [...new Set(["All", "Beginner", "Intermediate", "Advanced", ...(q.data ?? []).map(course => course.level)])];
  const links = [{ id: "products", label: "Find the right farm inputs", caption: "Explore AgroShop", icon: "shopping-bag", route: "/(tabs)/shop" }, { id: "services", label: "Put your learning into practice", caption: "Explore agricultural services", icon: "sprout", route: "/services" }, { id: "tools", label: "Make more informed decisions", caption: "Explore farm tools", icon: "wrench", route: "/tools" }];
  return <Page title="Academy" testID="academy-screen"><KeyboardAwareScrollView ref={scroll} testID="academy-scroll" bottomOffset={24} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[shared.content, { paddingBottom: insets.bottom + 28 }]} refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.brand} />}>
    <View style={s.masthead}><View style={s.eyebrowRow}><View style={s.rule} /><Text testID="academy-eyebrow" style={shared.kicker}>MQULIMA ACADEMY</Text></View><Text testID="academy-heading" style={shared.h1}>Grow your{`\n`}knowledge<Text style={s.accent}>.</Text></Text><Text testID="academy-description" style={shared.body}>Practical learning for better decisions on your farm.</Text><View style={s.statusRow}><Text testID="academy-preview-status" style={s.available}>FREE PREVIEWS AVAILABLE</Text><Pressable testID="academy-header-waitlist" accessibilityLabel="Go to Academy waitlist" onPress={() => scroll.current?.scrollTo({ y: Math.max(0, waitlistY.current - 12), animated: true })} style={s.waitlistLink}><Text style={s.waitlistLinkText}>Join the waitlist</Text><Lucide name="arrow-down" size={14} color={colors.brand} /></Pressable></View></View>
    <View style={s.section}><View style={s.sectionHeading}><Text testID="academy-paths-heading" style={shared.h2}>Find your learning path</Text>{q.data && <Text testID="academy-course-count" style={shared.meta}>{courses.length} {courses.length === 1 ? "path" : "paths"}</Text>}</View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters} testID="academy-level-filters">{levels.map(item => <Pressable testID={`academy-filter-${item.toLowerCase().replace(/\W+/g, "-")}`} key={item} accessibilityRole="tab" accessibilityState={{ selected: level === item }} onPress={() => setLevel(item)} style={({ pressed }) => [s.filter, item === level && s.filterActive, pressed && shared.pressed]}><Text style={[s.filterText, item === level && s.filterActiveText]}>{item === "All" ? "All paths" : item}</Text></Pressable>)}</ScrollView></View>
    {q.isPending ? <View testID="academy-courses-loading" style={s.section}><Skeleton style={s.loadingImage} /><Skeleton style={s.loadingTitle} /><Skeleton style={s.loadingButton} /></View> : q.isError && !q.data ? <AcademyState testID="academy-courses-error" icon="wifi-off" title="Let’s get you back to learning" description="We couldn’t load the courses. Check your connection and try again." action="Reload learning paths" onPress={() => q.refetch()} /> : !courses.length ? <AcademyState testID="academy-courses-empty" title="More learning is on the way" description={level === "All" ? "No courses are published just yet. Join the waitlist for future course access." : "There are no published paths at this level yet. Explore the other levels."} action={level === "All" ? "View the waitlist" : "Explore all paths"} onPress={() => level === "All" ? scroll.current?.scrollTo({ y: waitlistY.current, animated: true }) : setLevel("All")} /> : <View style={s.courseList}>{courses.map((course, index) => <Animated.View key={course.id} entering={FadeInDown.duration(240).delay(Math.min(index, 2) * 60)}><CourseCard course={course} featured={index === 0} /></Animated.View>)}</View>}
    {q.isRefetchError && q.data && <View testID="academy-refresh-error" style={s.refreshError}><Text style={[shared.body, { flex: 1 }]}>Couldn’t refresh. Showing the last loaded courses.</Text><Pressable testID="academy-refresh-retry" onPress={() => q.refetch()} style={s.waitlistLink}><Text style={s.waitlistLinkText}>Retry</Text></Pressable></View>}
    <View style={s.learningNote}><Lucide name="book-open" size={23} color={colors.brand} /><View style={shared.flex}><Text testID="academy-availability-title" style={shared.h3}>Start with a free lesson.</Text><Text testID="academy-availability-description" style={shared.body}>Explore course outlines and text-based samples today. Full courses are still being prepared.</Text></View></View>
    <View onLayout={event => { waitlistY.current = event.nativeEvent.layout.y; }}><WaitlistSection /></View>
    <View style={s.section}><Text testID="academy-explore-heading" style={shared.h2}>Keep growing with Mqulima</Text>{links.map(link => <Pressable key={link.id} testID={`academy-link-${link.id}`} onPress={() => router.push(link.route as any)} style={({ pressed }) => [s.exploreLink, pressed && shared.pressed]}><Lucide name={link.icon as any} size={22} color={colors.brand} /><View style={shared.flex}><Text style={s.exploreTitle}>{link.label}</Text><Text style={shared.meta}>{link.caption}</Text></View><Lucide name="arrow-up-right" size={19} color={colors.brand} /></Pressable>)}</View>
  </KeyboardAwareScrollView></Page>;
}

const useStyles = makeStyles(c => ({
  masthead: { paddingHorizontal: 4, paddingTop: 8, gap: 10 }, eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 8 }, rule: { width: 22, height: 2, backgroundColor: c.brand }, accent: { color: c.limeText },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", columnGap: 8 }, available: { fontFamily: fonts.b800, fontSize: 8, letterSpacing: 0.8, color: c.brand },
  waitlistLink: { minHeight: 44, minWidth: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }, waitlistLinkText: { fontFamily: fonts.b700, fontSize: 10, color: c.brand },
  section: { gap: 14 }, sectionHeading: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", gap: 8, justifyContent: "space-between" },
  filters: { gap: 8 }, filter: { minHeight: 44, paddingHorizontal: 14, justifyContent: "center", borderWidth: 1, borderColor: c.border, borderRadius: 0, backgroundColor: c.surfaceSecondary }, filterActive: { backgroundColor: c.brand, borderColor: c.brand }, filterText: { fontFamily: fonts.b600, fontSize: 11, color: c.onSurfaceTertiary }, filterActiveText: { color: c.onBrand },
  courseList: { gap: 16 }, learningNote: { flexDirection: "row", gap: 14, paddingVertical: 24, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.borderStrong },
  exploreLink: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 80, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: c.border }, exploreTitle: { fontFamily: fonts.b600, fontSize: 12, lineHeight: 19, color: c.onSurface },
  refreshError: { flexDirection: "row", gap: 12, alignItems: "center" }, loadingImage: { height: 180, borderRadius: 0 }, loadingTitle: { height: 75, borderRadius: 0 }, loadingButton: { height: 50, borderRadius: 0 },
}));