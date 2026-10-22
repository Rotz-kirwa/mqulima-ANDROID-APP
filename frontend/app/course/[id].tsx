import React, { useRef, useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { KeyboardAwareScrollView, KeyboardAwareScrollViewRef } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Page } from "@/src/components/Page";
import { Skeleton } from "@/src/components/Skeleton";
import { AcademyButton, AcademyState, CourseArtwork, courseLength, courseSamples, useAcademyStyles } from "@/src/components/academy/AcademyUI";
import { CourseOutline, LessonReader } from "@/src/components/academy/CourseOutline";
import { WaitlistSection } from "@/src/components/academy/WaitlistSection";
import { Course } from "@/src/data/academy";
import { api } from "@/src/services/api";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { useApp } from "@/src/store/AppStore";

function CourseContent({ course, refreshing, refresh }: { course: Course; refreshing: boolean; refresh: () => void }) {
  const s = useStyles(); const shared = useAcademyStyles(); const { colors } = useTheme(); const insets = useSafeAreaInsets(); const router = useRouter(); const { toast } = useApp();
  const scroll = useRef<KeyboardAwareScrollViewRef>(null); const anchors = useRef({ outline: 0, sample: 0, waitlist: 0 });
  const [selectedKey, setSelectedKey] = useState<string | undefined>();
  const samples = courseSamples(course); const selected = samples.find(sample => sample.key === selectedKey) ?? samples[0];
  const jump = (section: keyof typeof anchors.current) => scroll.current?.scrollTo({ y: Math.max(0, anchors.current[section] - 12), animated: true });
  return <KeyboardAwareScrollView ref={scroll} testID="course-scroll" keyboardShouldPersistTaps="handled" bottomOffset={24} showsVerticalScrollIndicator={false} contentContainerStyle={[shared.content, { paddingBottom: insets.bottom + 28 }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}>
    <View style={s.heading}><View style={s.titleMeta}><Text testID="course-track" style={shared.kicker}>LEARNING PATH {course.n}</Text><Text testID="course-level" style={s.level}>{course.level}</Text></View><Text testID="course-title" style={shared.h1}>{course.title}</Text><Text testID="course-description" style={shared.body}>{course.text}</Text></View>
    <View testID="course-hero-banner" style={shared.card}><CourseArtwork course={course} testID="course-cover-image" /><View style={s.facts}><View style={s.fact}><Lucide name="calendar-days" size={18} color={colors.brand} /><Text testID="course-planned-length" style={s.factValue}>{courseLength(course)}</Text><Text style={shared.meta}>Planned duration</Text></View><View style={[s.fact, s.factBorder]}><Lucide name="layers" size={18} color={colors.brand} /><Text testID="course-module-total" style={s.factValue}>{course.modules.length} modules</Text><Text style={shared.meta}>In the outline</Text></View><View style={[s.fact, s.factBorder]}><Lucide name="file-text" size={18} color={colors.brand} /><Text testID="course-sample-total" style={s.factValue}>{samples.length} {samples.length === 1 ? "sample" : "samples"}</Text><Text style={shared.meta}>Free to explore</Text></View></View></View>
    <View style={s.actions}><AcademyButton testID="course-read-sample-button" label={selected ? "Read a free lesson" : "Explore course outline"} icon={selected ? "book-open" : "list"} onPress={() => jump(selected ? "sample" : "outline")} /><Text testID="course-availability" style={s.availability}>Full course coming soon · No enrolment required for samples</Text></View>
    {!!course.outcomes.filter(outcome => outcome.trim()).length && <View testID="course-outcomes-card" style={s.outcomes}><Text testID="course-outcomes-title" style={shared.h2}>What you’ll learn</Text>{course.outcomes.filter(outcome => outcome.trim()).map((outcome, index) => <View key={index} style={s.outcome}><Lucide name="check" size={18} color={colors.brand} /><Text testID={`course-outcome-${index}`} style={s.outcomeText}>{outcome}</Text></View>)}</View>}
    <View onLayout={event => { anchors.current.outline = event.nativeEvent.layout.y; }}><CourseOutline course={course} selected={selected?.key} onSelect={key => { setSelectedKey(key); jump("sample"); }} onUnavailable={() => { toast("Full lessons are coming soon. Register your interest below."); jump("waitlist"); }} /></View>
    <View onLayout={event => { anchors.current.sample = event.nativeEvent.layout.y; }}>{selected ? <LessonReader lesson={selected.lesson} moduleTitle={selected.module} onOutline={() => jump("outline")} /> : <AcademyState testID="course-no-preview" title="A sample is on its way" description="Explore the course outline above. A free text lesson will appear here when it is ready." />}</View>
    {samples.length > 1 && <View style={s.sampleSwitch}><Text testID="course-sample-position" style={shared.meta}>Sample {samples.findIndex(sample => sample.key === selected.key) + 1} of {samples.length}</Text><Pressable testID="course-next-sample" onPress={() => { const next = samples[(samples.findIndex(sample => sample.key === selected.key) + 1) % samples.length]; setSelectedKey(next.key); jump("sample"); }} style={s.inlineAction}><Text style={s.inlineActionText}>Next free sample</Text><Lucide name="arrow-right" size={17} color={colors.brand} /></Pressable></View>}
    <View onLayout={event => { anchors.current.waitlist = event.nativeEvent.layout.y; }}><WaitlistSection prefix="course" /></View>
    <Pressable testID="course-back-to-academy" onPress={() => router.navigate("/academy")} style={s.back}><Lucide name="arrow-left" size={18} color={colors.brand} /><Text style={s.inlineActionText}>Explore all learning paths</Text></Pressable>
  </KeyboardAwareScrollView>;
}

export default function CoursePreview() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { colors } = useTheme(); const s = useStyles(); const shared = useAcademyStyles(); const router = useRouter();
  const q = useQuery({ queryKey: ["course", id], queryFn: () => api.getCourse(id), retry: 1 });
  return <Page title="Course preview" testID="course-preview-screen">{q.isPending ? <View style={shared.content} testID="course-loading"><Skeleton style={s.loadingTitle} /><Skeleton style={s.loadingImage} /><Skeleton style={s.loadingButton} /></View> : q.isError ? <View style={shared.content}><AcademyState testID="course-error" icon="wifi-off" title="Let’s try that again" description="The course couldn’t load. Check your connection and try again." action="Reload course" onPress={() => q.refetch()} /></View> : !q.data ? <View style={shared.content}><AcademyState testID="course-not-found" title="This path isn’t available" description="It may no longer be published. Explore the other learning paths in the Academy." action="Back to Academy" onPress={() => router.replace("/academy")} /></View> : <View style={{ flex: 1, backgroundColor: colors.surface }}><CourseContent key={q.data.id} course={q.data} refreshing={q.isRefetching} refresh={() => q.refetch()} /></View>}</Page>;
}

const useStyles = makeStyles(c => ({
  heading: { paddingHorizontal: 4, paddingTop: 8, gap: 14 }, titleMeta: { flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "space-between" }, level: { fontFamily: fonts.b700, fontSize: 10, color: c.onBrandTertiary, backgroundColor: c.brandTertiary, paddingHorizontal: 10, paddingVertical: 6 },
  facts: { flexDirection: "row", paddingVertical: 18 }, fact: { flex: 1, alignItems: "center", gap: 8, paddingHorizontal: 5 }, factBorder: { borderLeftWidth: 1, borderLeftColor: c.border }, factValue: { fontFamily: fonts.b700, fontSize: 11, lineHeight: 18, color: c.onSurface, textAlign: "center" },
  actions: { gap: 10 }, availability: { fontFamily: fonts.b400, fontSize: 10, lineHeight: 18, color: c.muted, textAlign: "center" },
  outcomes: { gap: 18, paddingVertical: 24, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.borderStrong }, outcome: { flexDirection: "row", gap: 12, alignItems: "flex-start" }, outcomeText: { flex: 1, fontFamily: fonts.b500, fontSize: 14, lineHeight: 23, color: c.onSurfaceSecondary },
  sampleSwitch: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }, inlineAction: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8 }, inlineActionText: { fontFamily: fonts.b700, fontSize: 12, color: c.brand }, back: { minHeight: 48, flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center" },
  loadingTitle: { height: 90, borderRadius: 0 }, loadingImage: { height: 220, borderRadius: 0 }, loadingButton: { height: 50, borderRadius: 0 },
}));