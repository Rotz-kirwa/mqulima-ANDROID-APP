import React, { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useQueryClient } from "@tanstack/react-query";
import { Field } from "@/src/components/Form";
import { AdminButton, AdminHeading, useAdminStyles } from "@/src/admin/UI";
import { useApp } from "@/src/store/AppStore";
import { api } from "@/src/services/api";

export default function AdminSecurity() {
  const s = useAdminStyles(); const router = useRouter(); const qc = useQueryClient(); const { user, signIn, signOut, toast } = useApp();
  const [current, setCurrent] = useState(""); const [next, setNext] = useState(""); const [confirm, setConfirm] = useState(""); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  const save = async () => {
    if (next.length < 12 || next !== confirm) { setError(next.length < 12 ? "Use at least 12 characters for your new password." : "The passwords do not match."); return; }
    setSaving(true); setError("");
    try { const response = await api.changePassword(current, next); await signIn(response.access_token, response.user); await qc.invalidateQueries({ queryKey: ["admin-session"] }); setCurrent(""); setNext(""); setConfirm(""); toast("Password changed. Previous sessions are signed out."); router.replace("/admin"); }
    catch (e: any) { setError(e.message || "Could not change password"); } finally { setSaving(false); }
  };
  return <View style={s.root} testID="admin-security-screen"><AdminHeading title={user?.must_change_password ? "Secure your account" : "Account & security"} subtitle={user?.must_change_password ? "Change the initial password before entering your workspace." : "Manage your administrator session."} /><KeyboardAwareScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}><View style={s.card}><Text style={s.h3} testID="admin-account-name">{user?.name}</Text><Text style={s.body} testID="admin-account-email">{user?.email}</Text><Text style={s.caption}>Administrator · Secure native token storage</Text></View><View style={s.card}><Text style={s.h2}>Change password</Text><Field testID="admin-password-current" label="Current password" value={current} onChangeText={setCurrent} secureTextEntry /><Field testID="admin-password-new" label="New password" value={next} onChangeText={setNext} secureTextEntry /><Field testID="admin-password-confirm" label="Confirm new password" value={confirm} onChangeText={setConfirm} secureTextEntry /><Text style={s.caption}>At least 12 characters. Changing your password signs out previous sessions.</Text>{!!error && <Text testID="admin-password-error" style={s.error}>{error}</Text>}<AdminButton testID="admin-password-save" label="Update password" onPress={save} loading={saving} /></View><AdminButton testID="admin-sign-out" secondary label="Sign out of workspace" icon="log-out" onPress={async () => { await signOut(); router.replace("/admin/login"); }} /></KeyboardAwareScrollView></View>;
}