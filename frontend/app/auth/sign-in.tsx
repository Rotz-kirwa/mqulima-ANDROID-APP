import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Page } from "@/src/components/Page";
import { Logo } from "@/src/components/Logo";
import { Btn } from "@/src/components/ui";
import { Field, EMAIL_RE } from "@/src/components/Form";
import { fonts, makeStyles } from "@/src/theme";
import { useApp } from "@/src/store/AppStore";
import { api } from "@/src/services/api";

export default function SignIn() {
  const s = useStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, toast } = useApp();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [e, setE] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const err: Record<string, string> = {};
    if (!EMAIL_RE.test(email.trim())) err.email = "Enter a valid email address";
    if (pw.length < 6) err.pw = "Password must be at least 6 characters";
    setE(err);
    if (Object.keys(err).length) return;
    setLoading(true);
    try {
      const r = await api.login(email.trim(), pw);
      await signIn(r.access_token, r.user);
      toast(`Welcome back, ${r.user.name}!`);
      router.replace("/account");
    } catch (err: any) {
      setE({ pw: err?.message ?? "Sign in failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Sign In" testID="sign-in-screen">
      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: insets.bottom + 32 }}>
        <View style={{ alignItems: "center", gap: 8 }}>
          <Logo size={64} />
          <Text style={s.h1}>Welcome back</Text>
          <Text style={s.sub}>Sign in to your Mqulima account</Text>
        </View>
        <Field testID="sign-in-email-input" label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" error={e.email} />
        <Field testID="sign-in-password-input" label="Password" value={pw} onChangeText={setPw} placeholder="••••••••" secureTextEntry error={e.pw} />
        <Pressable testID="sign-in-forgot-link" onPress={() => router.push("/auth/forgot")} style={{ alignSelf: "flex-end", minHeight: 44, justifyContent: "center" }}>
          <Text style={s.link}>Forgot password?</Text>
        </Pressable>
        <Btn testID="sign-in-submit-btn" full variant="green" label="Sign In" loading={loading} onPress={submit} />
        <Pressable testID="sign-in-to-sign-up" onPress={() => router.replace("/auth/sign-up")} style={{ alignSelf: "center", minHeight: 44, justifyContent: "center" }}>
          <Text style={s.sub}>New to Mqulima? <Text style={s.link}>Join Us</Text></Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  h1: { fontFamily: fonts.h900, fontSize: 26, color: c.onSurface },
  sub: { fontFamily: fonts.b500, fontSize: 14, color: c.onSurfaceTertiary },
  link: { fontFamily: fonts.b700, fontSize: 14, color: c.brandPrimary },
}));
