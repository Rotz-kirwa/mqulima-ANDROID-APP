import React, { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SelectField } from "@/src/components/Form";
import { counties } from "@/src/data/home";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { useApp } from "@/src/store/AppStore";
import { api } from "@/src/services/api";
import { FarmerAvatar, ForumState, ForumToolbar, topics } from "@/src/components/forum/ForumUI";
import { useDiscussionDraft } from "@/src/components/forum/useDiscussionDraft";

export default function CreatePost() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { user, ready } = useApp();
  const { draft, update, loaded, saved, clear } = useDiscussionDraft(user?.id, user?.county);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const publish = async () => {
    if (loading) return;
    if (draft.title.trim().length < 8) { setError("Give your discussion a clear title (at least 8 characters)."); return; }
    if (draft.text.trim().length < 5) { setError("Add a little detail so the community can help (at least 5 characters)."); return; }
    if (!draft.county) { setError("Choose your county to give your discussion local context."); return; }
    setError(""); setLoading(true);
    try {
      const thread = await api.createThread({ ...draft, title: draft.title.trim(), text: draft.text.trim() });
      await clear();
      qc.invalidateQueries({ queryKey: ["forum-feed"] });
      qc.invalidateQueries({ queryKey: ["threads"] });
      qc.invalidateQueries({ queryKey: ["my-threads"] });
      setDone(thread.id);
    } catch (e: any) { setError(e?.message ?? "Could not publish. Your draft is safe; please try again."); }
    finally { setLoading(false); }
  };
  return <View style={s.root} testID="create-post-screen">
    <ForumToolbar title={done ? "You’re part of the conversation" : "New discussion"} right={!done && user ? <View style={s.draftStatus}><Lucide name={saved ? "check" : "pencil"} size={12} color={colors.muted} /><Text testID="create-post-draft-status" style={s.meta}>{saved ? "Draft saved" : "Draft"}</Text></View> : null} />
    {done ? <Animated.View entering={FadeInDown.duration(320)} style={s.success} testID="create-post-success"><ForumState testID="create-post-published" icon="circle-check" title="Your discussion is live" description="Thanks for sharing. Every conversation helps our community grow." action="View discussion" onPress={() => router.replace(`/thread/${done}`)} /><Pressable testID="create-post-back-btn" onPress={() => router.replace("/(tabs)/forum")} style={s.backButton}><Text style={s.backText}>Back to the community</Text></Pressable></Animated.View> : !ready || (user && !loaded) ? <ActivityIndicator testID="create-post-loading" style={s.loading} color={colors.brand} /> : !user ? <ForumState testID="create-post-sign-in" title="Join the conversation" description="Sign in to ask a question or share your experience." action="Sign in" onPress={() => router.push("/auth/sign-in")} /> : <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled" contentContainerStyle={[s.form, { paddingBottom: insets.bottom + 32 }]}>
      <View style={s.authorRow}><FarmerAvatar name={user.name} size={42} testID="create-post-avatar" /><View style={s.authorInfo}><Text testID="create-post-author" style={s.author}>{user.name}</Text><View style={s.visibility}><Lucide name="globe" size={12} color={colors.muted} /><Text testID="create-post-visibility" style={s.meta}>Public discussion · Everyone can reply</Text></View></View></View>
      <View style={s.section}><Text testID="create-post-topic-label" style={s.label}>What are you sharing?</Text><View style={s.topics}>{topics.slice(1).map((topic, index) => <Pressable key={topic.value} testID={`create-post-tag-${index}`} accessibilityState={{ selected: draft.tag === topic.value }} onPress={() => update({ tag: topic.value })} style={[s.topic, draft.tag === topic.value && s.activeTopic]}><Lucide name={topic.icon} size={15} color={draft.tag === topic.value ? colors.onBrand : colors.muted} /><Text style={[s.topicText, draft.tag === topic.value && s.activeText]}>{topic.label}</Text></Pressable>)}</View></View>
      <View style={s.writingCard}><Text testID="create-post-title-label" style={s.label}>Give it a clear title</Text><TextInput testID="create-post-title-input" accessibilityLabel="Discussion title" placeholder="e.g. What’s working for your maize this season?" placeholderTextColor={colors.subtle} value={draft.title} onChangeText={title => { update({ title }); setError(""); }} maxLength={120} multiline style={s.titleInput} /><View style={s.divider} /><Text testID="create-post-details-label" style={s.label}>Tell us a little more</Text><TextInput testID="create-post-text-input" accessibilityLabel="Discussion details" value={draft.text} onChangeText={text => { update({ text }); setError(""); }} placeholder="Share the details, what you’ve tried, or what you’ve learned. Your experience matters." placeholderTextColor={colors.subtle} maxLength={2000} multiline style={s.bodyInput} /><View style={s.editorFooter}><Lucide name="align-left" size={16} color={colors.muted} /><Text testID="create-post-character-count" style={s.meta}>{draft.text.length} / 2,000</Text></View></View>
      <SelectField testID="create-post-county-select" label="Your county" value={draft.county} options={counties} onChange={county => { update({ county }); setError(""); }} placeholder="Choose your county" />
      <View style={s.tip}><Lucide name="lightbulb" size={19} color={colors.onBrandTertiary} /><Text testID="create-post-tip" style={s.tipText}>A little context goes a long way. Include your crop or livestock, growing conditions, and location.</Text></View>
      {!!error && <Text testID="create-post-error" accessibilityRole="alert" style={s.error}>{error}</Text>}
      <Pressable testID="create-post-publish-btn" accessibilityRole="button" accessibilityState={{ disabled: loading }} disabled={loading} onPress={publish} style={({ pressed }) => [s.publish, (pressed || loading) && s.pressed]}>{loading ? <ActivityIndicator color={colors.onBrand} /> : <><Text style={s.publishText}>Publish discussion</Text><Lucide name="arrow-up-right" size={19} color={colors.onBrand} /></>}</Pressable>
      <Text testID="create-post-footer-note" style={s.note}>Keep it kind, helpful, and rooted in experience.</Text>
    </KeyboardAwareScrollView>}
  </View>;
}

const useStyles = makeStyles(c => ({
  root: { flex: 1, backgroundColor: c.surface },
  form: { padding: 20, gap: 24 },
  loading: { marginTop: 40 },
  draftStatus: { flexDirection: "row", gap: 4, alignItems: "center" },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  authorInfo: { flex: 1, gap: 4 },
  author: { fontFamily: fonts.b700, fontSize: 13, color: c.onSurface },
  visibility: { flexDirection: "row", gap: 5, alignItems: "center" },
  meta: { fontFamily: fonts.b500, fontSize: 10, color: c.muted },
  section: { gap: 12 },
  label: { fontFamily: fonts.b700, fontSize: 12, color: c.onSurface },
  topics: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  topic: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: 12, borderRadius: 24, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  activeTopic: { backgroundColor: c.brand, borderColor: c.brand },
  topicText: { fontFamily: fonts.b600, fontSize: 11, color: c.onSurfaceTertiary },
  activeText: { color: c.onBrand },
  writingCard: { backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, borderRadius: 20, padding: 18, gap: 10 },
  titleInput: { fontFamily: fonts.h600, fontSize: 20, lineHeight: 28, color: c.onSurface, minHeight: 74, textAlignVertical: "top" },
  divider: { height: 1, backgroundColor: c.border, marginVertical: 5 },
  bodyInput: { fontFamily: fonts.b400, fontSize: 14, lineHeight: 23, color: c.onSurfaceSecondary, minHeight: 150, textAlignVertical: "top" },
  editorFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 6 },
  tip: { flexDirection: "row", gap: 10, backgroundColor: c.heroBg, padding: 14, borderRadius: 14 },
  tipText: { flex: 1, fontFamily: fonts.b400, fontSize: 12, lineHeight: 20, color: c.onSurfaceTertiary },
  error: { fontFamily: fonts.b600, fontSize: 12, lineHeight: 20, color: c.error },
  publish: { minHeight: 54, backgroundColor: c.brand, borderRadius: 28, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  publishText: { fontFamily: fonts.b700, fontSize: 14, color: c.onBrand },
  pressed: { opacity: 0.75 },
  note: { fontFamily: fonts.b400, fontSize: 10, color: c.muted, textAlign: "center", marginTop: -10 },
  success: { flex: 1, justifyContent: "center", paddingBottom: 60 },
  backButton: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  backText: { fontFamily: fonts.b600, fontSize: 13, color: c.brand },
}));