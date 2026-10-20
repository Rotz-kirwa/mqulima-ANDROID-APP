import React, { useState } from "react";
import { FlatList, Platform, Pressable, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Page } from "@/src/components/Page";
import { Avatar, Btn } from "@/src/components/ui";
import { ThreadCard } from "@/src/components/ThreadCard";
import { threads } from "@/src/data/forum";
import { avatar } from "@/src/data/home";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { useApp } from "@/src/store/AppStore";

export default function ThreadDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { myThreads, extraComments, addComment, user, toast } = useApp();
  const [text, setText] = useState("");
  const t = [...myThreads, ...threads].find((x) => x.id === id);

  if (!t) {
    return (
      <Page title="Post">
        <View style={{ padding: 24, alignItems: "center", gap: 12 }}>
          <Text style={s.name}>Post not found</Text>
          <Btn label="Back to Forum" onPress={() => router.navigate("/(tabs)/forum")} />
        </View>
      </Page>
    );
  }
  const comments = [...t.comments, ...(extraComments[t.id] ?? [])];
  const send = () => {
    if (!text.trim()) return;
    if (!user) {
      toast("Sign in to comment");
      router.push("/auth/sign-in");
      return;
    }
    addComment(t.id, { id: `c${Date.now()}`, author: user.name, text: text.trim(), time: new Date().toISOString().slice(0, 10) });
    setText("");
  };

  return (
    <Page title="Post" testID="thread-detail-screen">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "translate-with-padding"}>
        <FlatList
          data={comments}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListHeaderComponent={
            <View style={{ gap: 12 }}>
              <ThreadCard t={t} full />
              <Text style={s.h3} testID="thread-comment-count">Comments ({comments.length})</Text>
            </View>
          }
          ListEmptyComponent={<Text style={s.muted}>No comments yet. Be the first to reply.</Text>}
          renderItem={({ item }) => (
            <View style={s.comment} testID={`comment-${item.id}`}>
              <Avatar uri={avatar(item.author)} size={32} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.name}>{item.author} <Text style={s.muted}>· {item.time}</Text></Text>
                <Text style={s.text}>{item.text}</Text>
              </View>
            </View>
          )}
        />
        <View style={[s.inputBar, { paddingBottom: insets.bottom + 10 }]}>
          <TextInput testID="thread-comment-input" value={text} onChangeText={setText} placeholder="Write a comment..." placeholderTextColor={colors.subtle} style={s.input} multiline />
          <Pressable testID="thread-comment-send" onPress={send} style={[s.send, !text.trim() && { opacity: 0.5 }]}>
            <Lucide name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  h3: { fontFamily: fonts.h800, fontSize: 16, color: c.onSurface },
  muted: { fontFamily: fonts.b500, fontSize: 12, color: c.muted },
  comment: { flexDirection: "row", gap: 10, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 12 },
  name: { fontFamily: fonts.h700, fontSize: 13, color: c.onSurface },
  text: { fontFamily: fonts.b400, fontSize: 14, lineHeight: 20, color: c.onSurfaceSecondary },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingTop: 10, backgroundColor: c.white, borderTopWidth: 1, borderTopColor: c.border },
  input: { flex: 1, minHeight: 48, maxHeight: 120, borderWidth: 1, borderColor: c.border, borderRadius: 24, paddingHorizontal: 16, paddingTop: 13, paddingBottom: 13, fontFamily: fonts.b500, fontSize: 14, color: c.onSurface },
  send: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
}));
