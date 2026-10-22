import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useRouter } from "expo-router";
import { Image } from "@/src/components/Img";
import { Course, Lesson } from "@/src/data/academy";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export const hasSample = (lesson: Lesson) => !!lesson.preview && !!(lesson.summary?.trim() || lesson.points?.some(point => point.trim()));
export const courseSamples = (course: Course) => course.modules.flatMap((module, moduleIndex) => module.lessons.map((lesson, lessonIndex) => ({ lesson, moduleIndex, lessonIndex, key: `${moduleIndex}-${lessonIndex}`, module: module.title })).filter(item => hasSample(item.lesson)));
export const courseLength = (course: Course) => course.duration.split(/[•·]/)[0].trim();

export function AcademyButton({ testID, label, onPress, secondary = false, loading = false, light = false, icon = "arrow-up-right" }: { testID: string; label: string; onPress: () => void; secondary?: boolean; loading?: boolean; light?: boolean; icon?: string }) {
  const s = useAcademyStyles(); const { colors } = useTheme();
  const foreground = light ? colors.onBrandSecondary : secondary ? colors.brand : colors.onBrand;
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: loading }} disabled={loading} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondaryButton, light && s.lightButton, (pressed || loading) && s.pressed]}><Text style={[s.buttonText, { color: foreground }]}>{label}</Text><View style={[s.buttonArrow, secondary && s.secondaryArrow, light && s.lightArrow]}>{loading ? <ActivityIndicator size="small" color={foreground} /> : <Lucide name={icon as any} size={19} color={foreground} />}</View></Pressable>;
}

export function CourseArtwork({ course, compact = false, testID }: { course: Course; compact?: boolean; testID: string }) {
  const s = useAcademyStyles(); const { colors } = useTheme(); const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [course.image]);
  return <View testID={`${testID}-frame`} style={compact ? s.thumb : s.artwork}>{course.image && !failed ? <Image testID={testID} source={{ uri: course.image }} style={s.image} contentFit="cover" transition={180} accessibilityLabel={`${course.title} learning path`} onError={() => setFailed(true)} /> : <View testID={`${testID}-placeholder`} style={s.artworkFallback}><Lucide name="book-open" size={compact ? 26 : 42} color={colors.brand} /><Text style={s.artworkLabel}>MQULIMA ACADEMY</Text></View>}</View>;
}

export function CourseCard({ course, featured = false }: { course: Course; featured?: boolean }) {
  const s = useAcademyStyles(); const router = useRouter(); const open = () => router.push(`/course/${course.id}`);
  const samples = courseSamples(course);
  return <View testID={`academy-course-card-${course.id}`} style={s.card}>
    {featured ? <><Pressable testID={`academy-course-${course.id}`} accessibilityRole="button" accessibilityLabel={`Explore ${course.title}`} onPress={open}><CourseArtwork course={course} testID={`academy-image-${course.id}`} /><View style={s.imageFlag}><Text testID={`academy-track-${course.id}`} style={s.imageFlagText}>LEARNING PATH {course.n}</Text></View></Pressable><View style={s.featureBody}><View style={s.cardMeta}><Text testID={`academy-level-${course.id}`} style={s.kicker}>{course.level}</Text><Text testID={`academy-length-${course.id}`} style={s.meta}>{courseLength(course)}</Text></View><Pressable testID={`academy-course-title-link-${course.id}`} accessibilityRole="button" onPress={open}><Text testID={`academy-course-title-${course.id}`} style={s.featureTitle}>{course.title}</Text></Pressable><Text testID={`academy-description-${course.id}`} style={s.body} numberOfLines={3}>{course.text}</Text><View style={s.cardBottomMeta}><Text testID={`academy-modules-${course.id}`} style={s.meta}>{course.modules.length} modules outlined</Text><Text testID={`academy-samples-${course.id}`} style={s.sampleLabel}>{samples.length ? `${samples.length} free ${samples.length === 1 ? "sample" : "samples"}` : "Course outline"}</Text></View><AcademyButton testID={`academy-preview-${course.id}`} label="Explore course" onPress={open} /></View></> : <View style={s.compactBody}><Pressable testID={`academy-course-${course.id}`} accessibilityRole="button" accessibilityLabel={`Explore ${course.title}`} onPress={open} style={s.compactRow}><View style={s.flex}><Text testID={`academy-level-${course.id}`} style={s.kicker}>{course.level} · PATH {course.n}</Text><Text testID={`academy-course-title-${course.id}`} style={s.cardTitle}>{course.title}</Text><Text testID={`academy-description-${course.id}`} style={s.body} numberOfLines={2}>{course.text}</Text></View><CourseArtwork course={course} compact testID={`academy-image-${course.id}`} /></Pressable><View style={s.cardBottomMeta}><Text testID={`academy-length-${course.id}`} style={s.meta}>{courseLength(course)}</Text><Text testID={`academy-samples-${course.id}`} style={s.sampleLabel}>{samples.length ? "Free sample available" : "Outline preview"}</Text></View><AcademyButton testID={`academy-preview-${course.id}`} label="Explore course" onPress={open} secondary /></View>}
  </View>;
}

export function AcademyState({ testID, title, description, icon = "book-open", action, onPress }: { testID: string; title: string; description: string; icon?: string; action?: string; onPress?: () => void }) {
  const s = useAcademyStyles(); const { colors } = useTheme();
  return <View testID={testID} style={s.state}><View style={s.stateIcon}><Lucide name={icon as any} size={26} color={colors.brand} /></View><Text testID={`${testID}-title`} style={s.h2}>{title}</Text><Text testID={`${testID}-description`} style={s.body}>{description}</Text>{action && onPress && <AcademyButton testID={`${testID}-action`} label={action} onPress={onPress} />}</View>;
}

export const useAcademyStyles = makeStyles(c => ({
  content: { width: "100%", maxWidth: 720, alignSelf: "center", padding: 16, gap: 24 },
  flex: { flex: 1, minWidth: 0, gap: 8 },
  h1: { fontFamily: fonts.h800, fontSize: 34, lineHeight: 40, letterSpacing: -0.8, color: c.onSurface },
  h2: { fontFamily: fonts.h700, fontSize: 24, lineHeight: 30, color: c.onSurface, letterSpacing: -0.4 },
  h3: { fontFamily: fonts.h700, fontSize: 19, lineHeight: 26, color: c.onSurface },
  body: { fontFamily: fonts.b400, fontSize: 13, lineHeight: 22, color: c.onSurfaceTertiary },
  meta: { fontFamily: fonts.b500, fontSize: 10, lineHeight: 17, color: c.muted },
  kicker: { fontFamily: fonts.b800, fontSize: 9, lineHeight: 15, letterSpacing: 1.1, textTransform: "uppercase", color: c.brand },
  button: { backgroundColor: c.brand, minHeight: 50, borderRadius: 0, flexDirection: "row", alignItems: "center", paddingLeft: 16, gap: 10 },
  buttonText: { flex: 1, fontFamily: fonts.b700, fontSize: 12, lineHeight: 18, color: c.onBrand },
  buttonArrow: { width: 48, minHeight: 50, alignItems: "center", justifyContent: "center", borderLeftWidth: 1, borderLeftColor: c.whiteA20 },
  secondaryButton: { borderWidth: 1, borderColor: c.borderStrong, backgroundColor: c.surfaceSecondary }, secondaryArrow: { borderLeftColor: c.border },
  lightButton: { backgroundColor: c.brandSecondary }, lightArrow: { borderLeftColor: c.brand },
  artwork: { width: "100%", aspectRatio: 1.85, borderRadius: 0, overflow: "hidden", backgroundColor: c.heroBg },
  thumb: { width: 96, height: 120, borderRadius: 0, overflow: "hidden", backgroundColor: c.heroBg }, image: { width: "100%", height: "100%", borderRadius: 0 },
  artworkFallback: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }, artworkLabel: { fontFamily: fonts.b700, fontSize: 7, letterSpacing: 0.6, color: c.brand },
  card: { borderWidth: 1, borderColor: c.border, borderRadius: 0, backgroundColor: c.surfaceSecondary, overflow: "hidden" },
  imageFlag: { position: "absolute", bottom: 0, left: 0, backgroundColor: c.brandSecondary, paddingHorizontal: 14, paddingVertical: 9 }, imageFlagText: { fontFamily: fonts.b800, fontSize: 9, letterSpacing: 1.3, color: c.onBrandSecondary },
  featureBody: { padding: 18, gap: 12 }, featureTitle: { fontFamily: fonts.h800, fontSize: 27, lineHeight: 33, color: c.onSurface, letterSpacing: -0.4 },
  cardMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" },
  cardBottomMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, paddingVertical: 3 },
  sampleLabel: { fontFamily: fonts.b700, fontSize: 10, lineHeight: 16, color: c.brand }, compactBody: { padding: 16, gap: 16 }, compactRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 }, cardTitle: { fontFamily: fonts.h700, fontSize: 20, lineHeight: 25, color: c.onSurface },
  state: { padding: 24, gap: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary }, stateIcon: { width: 54, height: 54, backgroundColor: c.heroBg, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.78 },
}));