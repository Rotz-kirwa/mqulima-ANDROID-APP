import React, { useState } from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Page } from "@/src/components/Page";
import { Btn } from "@/src/components/ui";
import { Field, SuccessState, EMAIL_RE } from "@/src/components/Form";
import { fonts, makeStyles } from "@/src/theme";

export default function Forgot() {
  const s = useStyles();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <Page title="Reset Password">
        <SuccessState testID="forgot-success" title="Check your email" text={`If an account exists for ${email}, we've sent a password reset link.`}>
          <Btn testID="forgot-back-sign-in-btn" full variant="green" label="Back to Sign In" onPress={() => router.replace("/auth/sign-in")} />
        </SuccessState>
      </Page>
    );
  }
  return (
    <Page title="Reset Password" testID="forgot-screen">
      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text style={s.h1}>Forgot password?</Text>
        <Text style={s.sub}>Enter the email linked to your account and we&apos;ll send you a reset link.</Text>
        <Field testID="forgot-email-input" label="Email" value={email} onChangeText={(v) => { setEmail(v); setErr(""); }} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" error={err} />
        <Btn testID="forgot-submit-btn" full variant="green" label="Send Reset Link" onPress={() => (EMAIL_RE.test(email.trim()) ? setSent(true) : setErr("Enter a valid email address"))} />
      </KeyboardAwareScrollView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  h1: { fontFamily: fonts.h900, fontSize: 26, color: c.onSurface },
  sub: { fontFamily: fonts.b500, fontSize: 14, color: c.onSurfaceTertiary, lineHeight: 21 },
}));
