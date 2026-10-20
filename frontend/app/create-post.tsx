import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Page } from "@/src/components/Page";
import { Avatar, Btn } from "@/src/components/ui";
import { Field, SelectField, SuccessState } from "@/src/components/Form";
import { postTags } from "@/src/data/forum";
import { avatar, counties } from "@/src/data/home";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { useApp } from "@/src/store/AppStore";

export default function CreatePost() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, addThread } = useApp();
  const [tag, setTag] = useState(postTags[0]);
  const [text, setText] = useState("");
  const [county, setCounty] = useState(user?.county ?? "Uasin Gishu");
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const name = user?.name ?? "Mqulima Farmer";

  const publish = () => {
    if (text.trim().length < 5) {
      setError("Write at least 5 characters");
      return;
    }
    const id = `my-${Date.now()}`;
    addThread({
      id, author: name, handle: `@mqulima_${name.toLowerCase().replace(/\s+/g, "")}`, date: new Date().toISOString().slice(0, 10),
      tag: tag.replace(/^\S+\s/, ""), text: text.trim(), county, location: county, likes: 0, comments: [],
    });
    setDone(id);
  };

  if (done) {
    return (
      <Page title="Create Post">
        <SuccessState testID="create-post-success" title="Post published!" text="Your post is now live in the Mqulima community.">
          <Btn testID="create-post-view-btn" full variant="green" label="View Post" onPress={() => router.replace(`/thread/${done}`)} />
          <Btn testID="create-post-back-btn" full variant="outline" label="Back to Forum" onPress={() => router.navigate("/(tabs)/forum")} />
        </SuccessState>
      </Page>
    );
  }

  return (
    <Page title="Create Post" testID="create-post-screen">
      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 32 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Avatar uri={avatar(name)} />
          <View>
            <Text style={s.name}>{name}</Text>
            <Text style={s.muted}>Everyone • {county}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {postTags.map((t, i) => (
            <Pressable key={t} testID={`create-post-tag-${i}`} onPress={() => setTag(t)} style={[s.tag, tag === t && { backgroundColor: colors.forest, borderColor: colors.forest }]}>
              <Text style={[s.tagText, tag === t && { color: colors.white }]}>{t}</Text>
            </Pressable>
          ))}
        </View>
        <Field testID="create-post-text-input" label="What's happening on your farm?" value={text} onChangeText={(v) => { setText(v); setError(""); }} placeholder="Share farm progress, harvest updates, tips or ask a question..." multiline error={error} />
        <SelectField testID="create-post-county-select" label="Location" value={county} options={counties} onChange={setCounty} />
        <Btn testID="create-post-publish-btn" full variant="green" label="Publish Post" icon="send" onPress={publish} />
      </KeyboardAwareScrollView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  name: { fontFamily: fonts.h700, fontSize: 15, color: c.onSurface },
  muted: { fontFamily: fonts.b500, fontSize: 12, color: c.muted },
  tag: { minHeight: 40, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: c.border, backgroundColor: c.white, justifyContent: "center" },
  tagText: { fontFamily: fonts.b600, fontSize: 12, color: c.onSurface },
}));
