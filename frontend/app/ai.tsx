import React, { useRef, useState } from "react";
import { ActivityIndicator, FlatList, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Page } from "@/src/components/Page";
import { AiLogo } from "@/src/components/Logo";
import { api } from "@/src/services/api";
import { aiSuggestions, aiWelcome } from "@/src/data/pages";
import { fonts, makeStyles, useTheme } from "@/src/theme";

type Msg = { id: string; role: "user" | "ai"; text: string };

export default function AiChat() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [msgs, setMsgs] = useState<Msg[]>([{ id: "w", role: "ai", text: aiWelcome }]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const list = useRef<FlatList<Msg>>(null);

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

  return (
    <Page title="Mqulima AI" testID="ai-chat-screen">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "translate-with-padding"}>
        <FlatList
          ref={list}
          testID="ai-message-list"
          data={msgs}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <Animated.View entering={FadeInUp.duration(250)} style={[s.row, item.role === "user" && { justifyContent: "flex-end" }]}>
              {item.role === "ai" ? <AiLogo size={30} /> : null}
              <View style={[s.bubble, item.role === "user" ? s.user : s.ai]} testID={`ai-msg-${item.role}`}>
                <Text style={[s.text, item.role === "user" && { color: colors.white }]}>{item.text}</Text>
              </View>
            </Animated.View>
          )}
          ListFooterComponent={typing ? (
            <View style={[s.row, { marginTop: 12 }]} testID="ai-typing">
              <AiLogo size={30} />
              <View style={[s.bubble, s.ai, { flexDirection: "row", gap: 8, alignItems: "center" }]}>
                <ActivityIndicator size="small" color={colors.brandPrimary} />
                <Text style={s.text}>Mqulima AI is thinking...</Text>
              </View>
            </View>
          ) : null}
        />
        {msgs.length < 3 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingBottom: 8 }}>
            {aiSuggestions.map((q, i) => (
              <Pressable key={q} testID={`ai-suggestion-${i}`} onPress={() => send(q)} style={s.sugg}>
                <Text style={s.suggText}>{q}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
        <View style={[s.bar, { paddingBottom: insets.bottom + 10 }]}>
          <TextInput testID="ai-chat-input" value={text} onChangeText={setText} placeholder="Ask about crops, livestock, soil..." placeholderTextColor={colors.subtle} style={s.input} multiline onSubmitEditing={() => send(text)} />
          <Pressable testID="ai-chat-send" onPress={() => send(text)} style={[s.send, (!text.trim() || typing) && { opacity: 0.5 }]}>
            <Lucide name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  row: { flexDirection: "row", gap: 8, alignItems: "flex-end" },
  bubble: { maxWidth: "80%", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  ai: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderBottomLeftRadius: 6 },
  user: { backgroundColor: c.brand, borderBottomRightRadius: 6 },
  text: { fontFamily: fonts.b500, fontSize: 14, lineHeight: 21, color: c.onSurface },
  sugg: { height: 36, flexShrink: 0, justifyContent: "center", paddingHorizontal: 14, borderRadius: 999, backgroundColor: c.brandTertiary },
  suggText: { fontFamily: fonts.b700, fontSize: 12, color: c.onBrandTertiary },
  bar: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingTop: 10, backgroundColor: c.white, borderTopWidth: 1, borderTopColor: c.border },
  input: { flex: 1, minHeight: 48, maxHeight: 120, borderWidth: 1, borderColor: c.border, borderRadius: 24, paddingHorizontal: 16, paddingTop: 13, paddingBottom: 13, fontFamily: fonts.b500, fontSize: 14, color: c.onSurface },
  send: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
}));
