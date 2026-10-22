import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "@/src/components/Img";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Page, useStackBottom } from "@/src/components/Page";
import { Btn, Body, Pill } from "@/src/components/ui";
import { Skeleton } from "@/src/components/Skeleton";
import { api } from "@/src/services/api";
import type { Lesson } from "@/src/data/academy";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { useApp } from "@/src/store/AppStore";

export default function CoursePreview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useStackBottom();
  const { toast } = useApp();
  const q = useQuery({ queryKey: ["course", id], queryFn: () => api.getCourse(id) });
  const [open, setOpen] = useState(0);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const c = q.data;

  if (q.isLoading) return <Page title="Course"><View style={{ padding: 16, gap: 12 }}><Skeleton style={{ height: 220, borderRadius: 24 }} /><Skeleton style={{ height: 24, width: "60%" }} /><Skeleton style={{ height: 120 }} /></View></Page>;
  if (!c) return <Page title="Course"><View style={{ padding: 24, alignItems: "center", gap: 12 }}><Text style={s.h2}>Course not found</Text><Btn label="Academy" onPress={() => router.replace("/academy")} /></View></Page>;
  const total = c.modules.reduce((a, m) => a + m.lessons.length, 0);
  const preview = lesson ?? c.modules.flatMap((m) => m.lessons).find((l) => l.preview)!;

  return (
    <Page title="Course Preview" testID="course-preview-screen">
      <ScrollView contentContainerStyle={{ paddingBottom: bottom }}>
        <View style={{ height: 240 }}>
          <Image source={{ uri: c.image }} style={s.abs} contentFit="cover" transition={300} />
          <LinearGradient colors={["transparent", colors.overlay]} style={[s.abs, { justifyContent: "flex-end", padding: 16, gap: 8 }]}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pill dark label={`TRACK ${c.n}`} />
              <Pill dark label={c.level.toUpperCase()} />
            </View>
            <Text style={s.h1} testID="course-title">{c.title}</Text>
            <Text style={s.heroMeta}>{c.duration} • Coming 2026</Text>
          </LinearGradient>
        </View>
        <View style={{ padding: 16, gap: 20 }}>
          <Body style={{ fontSize: 15, lineHeight: 23 }}>{c.text}</Body>

          <View style={s.card}>
            <Text style={s.h3}>You&apos;ll learn to</Text>
            {c.outcomes.map((o) => (
              <View key={o} style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                <Lucide name="circle-check" size={18} color={colors.brandPrimary} />
                <Text style={s.item}>{o}</Text>
              </View>
            ))}
          </View>

          {/* Sample lesson */}
          <Animated.View key={preview.title} entering={FadeIn.duration(300)} style={s.sample} testID="course-sample-lesson">
            <View style={s.player}>
              <View style={s.play}><Lucide name="play" size={26} color={colors.forestDeep} /></View>
              <Text style={s.playText}>FREE PREVIEW • {preview.duration}</Text>
            </View>
            <View style={{ padding: 18, gap: 10 }}>
              <Text style={[s.h3, { color: colors.white }]}>{preview.title}</Text>
              <Body dark style={{ fontSize: 13 }}>{preview.summary}</Body>
              {preview.points?.map((p) => (
                <View key={p} style={{ flexDirection: "row", gap: 8 }}>
                  <Text style={{ color: colors.brandSecondary, fontFamily: fonts.b800 }}>•</Text>
                  <Text style={s.point}>{p}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          <View style={{ gap: 10 }}>
            <Text style={s.h2}>Course outline</Text>
            <Text style={s.muted}>{c.modules.length} modules • {total} lessons shown</Text>
            {c.modules.map((m, mi) => (
              <Animated.View key={m.title} entering={FadeInDown.delay(mi * 60)} style={s.module}>
                <Pressable testID={`course-module-${mi}`} onPress={() => setOpen(open === mi ? -1 : mi)} style={s.moduleHead}>
                  <Text style={s.moduleN}>{String(mi + 1).padStart(2, "0")}</Text>
                  <Text style={s.moduleTitle}>{m.title}</Text>
                  <Lucide name={open === mi ? "chevron-up" : "chevron-down"} size={20} color={colors.muted} />
                </Pressable>
                {open === mi
                  ? m.lessons.map((l, li) => (
                      <Pressable
                        key={l.title}
                        testID={`course-lesson-${mi}-${li}`}
                        onPress={() => (l.preview ? setLesson(l) : toast("Unlocks at launch — join the waitlist"))}
                        style={s.lesson}
                      >
                        <Lucide name={l.preview ? "circle-play" : "lock"} size={18} color={l.preview ? colors.brandPrimary : colors.subtle} />
                        <Text style={[s.lessonTitle, !l.preview && { color: colors.muted }]}>{l.title}</Text>
                        {l.preview ? <Text style={s.free}>Preview</Text> : null}
                        <Text style={s.muted}>{l.duration}</Text>
                      </Pressable>
                    ))
                  : null}
              </Animated.View>
            ))}
          </View>
          <Btn testID="course-join-waitlist-btn" full variant="green" label="Join Waitlist for Early Access" onPress={() => router.replace("/academy")} />
        </View>
      </ScrollView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  abs: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  h1: { fontFamily: fonts.h900, fontSize: 32, color: c.white },
  heroMeta: { fontFamily: fonts.b600, fontSize: 13, color: c.whiteA85 },
  h2: { fontFamily: fonts.h900, fontSize: 20, color: c.onSurface },
  h3: { fontFamily: fonts.h800, fontSize: 16, color: c.onSurface },
  muted: { fontFamily: fonts.b500, fontSize: 12, color: c.muted },
  card: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 20, padding: 16, gap: 10 },
  item: { fontFamily: fonts.b600, fontSize: 14, color: c.onSurfaceSecondary, flex: 1 },
  sample: { backgroundColor: c.forest, borderRadius: 24, overflow: "hidden" },
  player: { height: 150, backgroundColor: c.forestCard, alignItems: "center", justifyContent: "center", gap: 10 },
  play: { width: 60, height: 60, borderRadius: 30, backgroundColor: c.brandSecondary, alignItems: "center", justifyContent: "center" },
  playText: { fontFamily: fonts.b800, fontSize: 11, letterSpacing: 1, color: c.brandSecondary },
  point: { flex: 1, fontFamily: fonts.b500, fontSize: 13, lineHeight: 19, color: c.white },
  module: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 18, overflow: "hidden" },
  moduleHead: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingHorizontal: 14 },
  moduleN: { fontFamily: fonts.h900, fontSize: 16, color: c.limeText },
  moduleTitle: { flex: 1, fontFamily: fonts.h700, fontSize: 15, color: c.onSurface },
  lesson: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 48, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: c.divider },
  lessonTitle: { flex: 1, fontFamily: fonts.b600, fontSize: 13, color: c.onSurface },
  free: { fontFamily: fonts.b800, fontSize: 10, color: c.onBrandTertiary, backgroundColor: c.brandTertiary, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, overflow: "hidden" },
}));
