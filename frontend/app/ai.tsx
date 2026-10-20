import React, { useRef, useState } from "react";
import { FlatList, Platform, Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, { FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, withDelay } from "react-native-reanimated";
import { Page } from "@/src/components/Page";
import { AiLogo } from "@/src/components/Logo";
import { api } from "@/src/services/api";
import { aiSuggestions } from "@/src/data/pages";
import { fonts, makeStyles, useTheme } from "@/src/theme";

type Msg = { id: string; role: "user" | "ai"; text: string };

const SUGGESTION_ICONS = ["sprout", "bug", "milk", "calendar-days"];

function Dot({ delay }: { delay: number }) {
  const { colors } = useTheme();
  const o = useSharedValue(0.3);
  React.useEffect(() => {
    o.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 350 }), withTiming(0.3, { duration: 350 })), -1));
  }, [o, delay]);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brandPrimary }, st]} />;
}

export default function AiChat() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const list = useRef<FlatList<Msg>>(null);
  const canSend = !!text.trim() && !typing;

  const send = async (t: string) => {
    const q = t.trim();
    if (!q || typing) return;
    setText("");
    setMsgs((m) => [...m, { id: `u${Date.now()}`, role: "user", text: q }]);
    setTyping(true);
    const reply = await api.askAI(q);
    setMsgs((m) => [...m, { id: `a${Date.now()}`, role: "ai", text: reply }]);
    setTyping(false);
  };

  const empty = (
    <View style={s.empty} testID="ai-empty-state">
      <Animated.View entering={FadeIn.duration(500)} style={s.logoRing}>
        <AiLogo size={60} />
      </Animated.View>
      <Animated.Text entering={FadeInDown.delay(100)} style={s.title}>Hi, I&apos;m Mqulima AI</Animated.Text>
      <Animated.Text entering={FadeInDown.delay(160)} style={s.subtitle}>
        Your farm advisor for crops, livestock, soil, pests, fertilizer and market prices.
      </Animated.Text>
      <View style={s.grid}>
        {aiSuggestions.map((q, i) => (
          <Animated.View key={q} entering={FadeInDown.delay(220 + i * 70)} style={s.gridItem}>
            <Pressable testID={`ai-suggestion-${i}`} onPress={() => send(q)} style={({ pressed }) => [s.sugg, pressed && { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary }]}>
              <View style={s.suggIcon}><Lucide name={SUGGESTION_ICONS[i] as any} size={18} color={colors.onBrandTertiary} /></View>
              <Text style={s.suggText}>{q}</Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
      <View style={s.disclaimer}>
        <Lucide name="info" size={14} color={colors.muted} />
        <Text style={s.disclaimerText}>Tips are general guidance. For your farm, request an agronomist under Services.</Text>
      </View>
    </View>
  );

  return (
    <Page title="Mqulima AI" testID="ai-chat-screen">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "translate-with-padding"}>
        <FlatList
          ref={list}
          testID="ai-message-list"
          data={msgs}
          keyExtractor={(m) => m.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={msgs.length ? { padding: 16, gap: 14 } : { flexGrow: 1 }}
          ListEmptyComponent={empty}
          onContentSizeChange={() => msgs.length && list.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) =>
            item.role === "user" ? (
              <Animated.View entering={FadeInUp.duration(220)} style={{ alignItems: "flex-end" }}>
                <View style={[s.bubble, s.user]} testID="ai-msg-user">
                  <Text style={[s.text, { color: colors.white }]}>{item.text}</Text>
                </View>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeInUp.duration(260)} style={s.aiRow}>
                <View style={s.avatar}><AiLogo size={22} /></View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={s.aiName}>Mqulima AI</Text>
                  <View style={[s.bubble, s.ai]} testID="ai-msg-ai">
                    <Text style={s.text}>{item.text}</Text>
                  </View>
                </View>
              </Animated.View>
            )
          }
          ListFooterComponent={
            typing ? (
              <View style={[s.aiRow, { marginTop: 14 }]} testID="ai-typing">
                <View style={s.avatar}><AiLogo size={22} /></View>
                <View style={[s.bubble, s.ai, s.typing]}>
                  <Dot delay={0} /><Dot delay={150} /><Dot delay={300} />
                </View>
              </View>
            ) : null
          }
        />
        <View style={[s.bar, { paddingBottom: insets.bottom + 10 }]}>
          <View style={s.inputWrap}>
            <TextInput
              testID="ai-chat-input"
              value={text}
              onChangeText={setText}
              placeholder="Ask about crops, livestock, soil..."
              placeholderTextColor={colors.subtle}
              style={s.input}
              multiline
              numberOfLines={1}
              onSubmitEditing={() => send(text)}
            />
            <Pressable testID="ai-chat-send" onPress={() => send(text)} disabled={!canSend} style={[s.send, !canSend && { backgroundColor: colors.border }]}>
              <Lucide name="arrow-up" size={20} color={canSend ? colors.white : colors.muted} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20, paddingVertical: 24, gap: 10 },
  logoRing: { width: 96, height: 96, borderRadius: 48, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  title: { fontFamily: fonts.h900, fontSize: 24, color: c.onSurface, textAlign: "center" },
  subtitle: { fontFamily: fonts.b400, fontSize: 14, lineHeight: 21, color: c.onSurfaceTertiary, textAlign: "center", maxWidth: 320 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14, alignSelf: "stretch" },
  gridItem: { width: "48.5%" },
  sugg: { minHeight: 96, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 18, padding: 14, gap: 10, justifyContent: "space-between" },
  suggIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  suggText: { fontFamily: fonts.b700, fontSize: 13, lineHeight: 18, color: c.onSurface },
  disclaimer: { flexDirection: "row", gap: 6, alignItems: "center", marginTop: 10, paddingHorizontal: 8 },
  disclaimerText: { flex: 1, fontFamily: fonts.b500, fontSize: 11, lineHeight: 16, color: c.muted },
  aiRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" },
  aiName: { fontFamily: fonts.b700, fontSize: 11, color: c.muted, marginLeft: 2 },
  bubble: { maxWidth: "85%", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 11 },
  ai: { alignSelf: "flex-start", backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderTopLeftRadius: 6 },
  user: { backgroundColor: c.brand, borderBottomRightRadius: 6 },
  typing: { flexDirection: "row", gap: 6, alignItems: "center", paddingVertical: 16 },
  text: { fontFamily: fonts.b500, fontSize: 14, lineHeight: 21, color: c.onSurface },
  bar: { paddingHorizontal: 12, paddingTop: 10, backgroundColor: c.white, borderTopWidth: 1, borderTopColor: c.border },
  inputWrap: { flexDirection: "row", alignItems: "flex-end", gap: 8, borderWidth: 1, borderColor: c.border, borderRadius: 26, backgroundColor: c.surface, paddingLeft: 16, paddingRight: 5, paddingVertical: 5 },
  input: { flex: 1, minHeight: 42, maxHeight: 120, paddingTop: 11, paddingBottom: 11, fontFamily: fonts.b500, fontSize: 15, color: c.onSurface },
  send: { width: 42, height: 42, borderRadius: 21, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
}));
