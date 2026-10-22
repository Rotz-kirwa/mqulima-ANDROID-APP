import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Logo } from "@/src/components/Logo";
import { Field } from "@/src/components/Form";
import { AdminButton, useAdminStyles } from "@/src/admin/UI";
import { api } from "@/src/services/api";
import { useApp } from "@/src/store/AppStore";
import { useTheme } from "@/src/theme";

export default function AdminLogin() {
  const s = useAdminStyles(); const { colors } = useTheme(); const insets = useSafeAreaInsets(); const router = useRouter();
  const { signIn } = useApp(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!email.trim() || !password) { setError("Enter your admin email and password."); return; }
    setLoading(true); setError("");
    try { const result = await api.login(email.trim(), password); if (result.user.role !== "admin") { setError("This account does not have administrator access."); return; } await signIn(result.access_token, result.user); router.replace(result.user.must_change_password ? "/admin/security" : "/admin"); }
    catch (e: any) { setError(e.message || "Could not sign in."); } finally { setLoading(false); }
  };
  return <View testID="admin-login-screen" style={s.root}><KeyboardAwareScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.content, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}><Pressable testID="admin-login-back" accessibilityLabel="Back to public app" onPress={() => router.replace("/")} style={s.iconButton}><Lucide name="arrow-left" size={22} color={colors.brand} /></Pressable><Logo size={64} /><Text style={s.eyebrow}>MQULIMA OPERATIONS</Text><Text style={s.h1}>Good things grow{`\n`}with good management.</Text><Text style={s.body}>Your secure workspace for the people, products, and services behind Mqulima.</Text><View style={s.card}><Text style={s.h2}>Administrator sign in</Text><Field testID="admin-login-email" label="Work email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="you@mqulima.com" /><Field testID="admin-login-password" label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" placeholder="Enter your password" />{!!error && <Text testID="admin-login-error" style={s.error}>{error}</Text>}<AdminButton testID="admin-login-submit" label="Open workspace" loading={loading} icon="arrow-right" onPress={submit} /></View><View style={s.row}><Lucide name="shield-check" size={17} color={colors.brand} /><Text style={s.caption}>Restricted access. Administrative changes are recorded.</Text></View></KeyboardAwareScrollView></View>;
}