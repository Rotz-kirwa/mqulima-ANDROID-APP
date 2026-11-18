import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Page } from "@/src/components/Page";
import { Logo } from "@/src/components/Logo";
import { Btn } from "@/src/components/ui";
import { Field, EMAIL_RE, PHONE_RE } from "@/src/components/Form";
import { fonts, makeStyles } from "@/src/theme";
import { useAuth, useToast } from "@/src/store/AppStore";
import { api } from "@/src/services/api";

export default function SignUp() {
  const s = useStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ name: "", email: "", phone: "", pw: "", pw2: "" });
  const [e, setE] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  const setPin = (k: "pw" | "pw2") => (v: string) =>
    setF((x) => ({ ...x, [k]: v.replace(/\D/g, "").slice(0, 4) }));

  const submit = async () => {
    const err: Record<string, string> = {};
    if (f.name.trim().length < 3) err.name = "Enter your full names";
    if (!EMAIL_RE.test(f.email.trim())) err.email = "Enter a valid email address";
    if (!PHONE_RE.test(f.phone.replace(/\s/g, ""))) err.phone = "Enter a valid phone number e.g. 0712345678";
    if (!/^\d{4}$/.test(f.pw)) err.pw = "Enter a 4-digit password";
    if (f.pw2 !== f.pw) err.pw2 = "Passwords do not match";
    setE(err);
    if (Object.keys(err).length) return;
    setLoading(true);
    try {
      const r = await api.register({ name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), password: f.pw });
      await signIn(r.access_token, r.user);
      toast("Account created — welcome to Mqulima!");
      router.replace("/account");
    } catch (ex: any) {
      let msg = ex?.message || "Sign up could not be completed. Please try again.";
      if (/Only HTML requests are supported/i.test(msg) || /Request failed \(500\)/i.test(msg)) {
        msg = "The backend service is currently updating. Please try again in a few moments.";
      }
      if (/phone/i.test(msg)) {
        setE({ phone: msg });
      } else if (/email/i.test(msg) || ex?.status === 409) {
        setE({ email: msg });
      } else {
        setE({ pw2: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Join Us" testID="sign-up-screen">
      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: insets.bottom + 32 }}>
        <View style={{ alignItems: "center", gap: 8 }}>
          <Logo size={64} />
          <Text style={s.h1}>Create your account</Text>
          <Text style={s.tagline}>
            ✨ ...taking you <Text style={s.taglineAccent}>first class</Text> ✨
          </Text>
        </View>
        <Field testID="sign-up-name-input" label="Full Names" value={f.name} onChangeText={set("name")} placeholder="e.g. Kosgei Kiprono" error={e.name} />
        <Field testID="sign-up-email-input" label="Email" value={f.email} onChangeText={set("email")} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" error={e.email} />
        <Field testID="sign-up-phone-input" label="Phone Number" value={f.phone} onChangeText={set("phone")} placeholder="0712 345 678" keyboardType="phone-pad" error={e.phone} />
        <Field testID="sign-up-password-input" label="4-Digit Password" value={f.pw} onChangeText={setPin("pw")} placeholder="Enter 4-digit password" keyboardType="number-pad" maxLength={4} secureTextEntry error={e.pw} />
        <Field testID="sign-up-confirm-input" label="Confirm Password" value={f.pw2} onChangeText={setPin("pw2")} placeholder="Repeat 4-digit password" keyboardType="number-pad" maxLength={4} secureTextEntry error={e.pw2} />
        <Btn testID="sign-up-submit-btn" full variant="orange" label="Join Us" loading={loading} onPress={submit} />
        <Pressable testID="sign-up-to-sign-in" onPress={() => router.replace("/auth/sign-in")} style={{ alignSelf: "center", minHeight: 44, justifyContent: "center" }}>
          <Text style={s.sub}>Already have an account? <Text style={s.link}>Sign In</Text></Text>
        </Pressable>
        <Text style={s.legal}>By joining you agree to our Terms of Service and Privacy Policy.</Text>
      </KeyboardAwareScrollView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  h1: { fontFamily: fonts.h900, fontSize: 26, color: c.onSurface },
  tagline: {
    fontFamily: fonts.b700,
    fontStyle: "italic",
    fontSize: 15,
    letterSpacing: 0.4,
    color: c.brandPrimary,
    textAlign: "center",
  },
  taglineAccent: {
    fontFamily: fonts.b800,
    fontStyle: "italic",
    color: "#D97706",
  },
  sub: { fontFamily: fonts.b500, fontSize: 14, color: c.onSurfaceTertiary },
  link: { fontFamily: fonts.b700, fontSize: 14, color: c.brandPrimary },
  legal: { fontFamily: fonts.b400, fontSize: 11, color: c.muted, textAlign: "center" },
}));
