import React, { useState } from "react";
import { Linking, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Page } from "@/src/components/Page";
import { Btn } from "@/src/components/ui";
import { Field, SuccessState, EMAIL_RE, PHONE_RE } from "@/src/components/Form";
import { fonts, makeStyles } from "@/src/theme";
import { api } from "@/src/services/api";

export default function Forgot() {
  const s = useStyles();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"request" | "verify" | "done">("request");
  const [webFallbackAvailable, setWebFallbackAvailable] = useState(false);

  const requestCode = async () => {
    const clean = identifier.trim();
    const cleanedPhone = clean.replace(/\s/g, "");
    if (!EMAIL_RE.test(clean) && !PHONE_RE.test(cleanedPhone)) {
      setErr("Enter a valid email address or Kenyan phone number");
      return;
    }
    setLoading(true);
    setErr("");
    setWebFallbackAvailable(false);
    try {
      await api.forgotPassword(clean);
      setStep("verify");
    } catch (ex: any) {
      if (ex?.status === 404) {
        setErr("In-app recovery endpoint is unavailable on this server. Complete recovery on Mqulima Web below.");
        setWebFallbackAvailable(true);
      } else {
        setErr(ex?.message || "Could not dispatch recovery code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const completeReset = async () => {
    const cleanCode = code.trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      setErr("Enter the 6-digit recovery code sent to your email or SMS.");
      return;
    }
    if (newPassword.length < 8) {
      setErr("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      await api.resetPassword({
        identifier: identifier.trim(),
        code: cleanCode,
        newPassword,
      });
      setStep("done");
    } catch (ex: any) {
      setErr(ex?.message || "Invalid or expired recovery code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <Page title="Password Updated">
        <SuccessState
          testID="forgot-success"
          title="Password updated"
          text="Your password has been reset securely. Sign in with your new password to continue."
        >
          <Btn testID="forgot-back-sign-in-btn" full variant="green" label="Back to Sign In" onPress={() => router.replace("/auth/sign-in")} />
        </SuccessState>
      </Page>
    );
  }

  return (
    <Page title="Reset Password" testID="forgot-screen">
      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ padding: 20, gap: 16 }}>
        {step === "request" ? (
          <>
            <Text style={s.h1}>Forgot password?</Text>
            <Text style={s.sub}>
              Enter your registered email or phone number and we&apos;ll send a single-use 6-digit recovery code and sign-in link.
            </Text>
            <Field
              testID="forgot-email-input"
              label="Email or Phone"
              value={identifier}
              onChangeText={(v) => { setIdentifier(v); setErr(""); }}
              placeholder="you@example.com or 0712345678"
              keyboardType="email-address"
              autoCapitalize="none"
              error={err}
            />
            <Btn testID="forgot-submit-btn" full variant="green" label="Send Recovery Code" loading={loading} onPress={requestCode} />
            {webFallbackAvailable ? (
              <Btn
                testID="forgot-web-fallback-btn"
                full
                variant="outline"
                label="Reset Password on Mqulima Web"
                onPress={() => Linking.openURL("https://www.mqulima.com/auth/forgot-password")}
              />
            ) : null}
          </>
        ) : (
          <>
            <Text style={s.h1}>Enter recovery code</Text>
            <Text style={s.sub}>
              If an account exists for {identifier.trim()}, a 6-digit code was sent to your registered email and phone. Enter it below within 10 minutes.
            </Text>
            <Field
              testID="forgot-code-input"
              label="6-Digit Recovery Code"
              value={code}
              onChangeText={(v) => { setCode(v); setErr(""); }}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
            />
            <Field
              testID="forgot-new-pw-input"
              label="New Password"
              value={newPassword}
              onChangeText={(v) => { setNewPassword(v); setErr(""); }}
              placeholder="At least 8 characters"
              secureTextEntry
            />
            <Field
              testID="forgot-confirm-pw-input"
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); setErr(""); }}
              placeholder="Repeat new password"
              secureTextEntry
              error={err}
            />
            <Btn testID="forgot-reset-submit-btn" full variant="green" label="Update Password" loading={loading} onPress={completeReset} />
            <View style={{ gap: 8 }}>
              <Btn
                testID="forgot-resend-btn"
                full
                variant="outline"
                label="Request Another Code"
                onPress={() => { setStep("request"); setErr(""); }}
              />
            </View>
          </>
        )}
      </KeyboardAwareScrollView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  h1: { fontFamily: fonts.h900, fontSize: 26, color: c.onSurface },
  sub: { fontFamily: fonts.b500, fontSize: 14, color: c.onSurfaceTertiary, lineHeight: 21 },
}));
