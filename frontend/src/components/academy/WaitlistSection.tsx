import React, { useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { api } from "@/src/services/api";
import { EMAIL_RE } from "@/src/components/Form";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { AcademyButton } from "./AcademyUI";

export function WaitlistSection({ prefix = "academy" }: { prefix?: string }) {
  const s = useStyles(); const { colors } = useTheme();
  const [email, setEmail] = useState(""); const [error, setError] = useState(""); const [joining, setJoining] = useState(false); const [registered, setRegistered] = useState(""); const [existing, setExisting] = useState(false); const pending = useRef(false);
  const join = async () => {
    if (pending.current) return;
    const submitted = email.trim().toLowerCase();
    if (!EMAIL_RE.test(submitted)) { setError("Enter a valid email address to join the waitlist."); return; }
    pending.current = true; setJoining(true); setError("");
    try { const result = await api.joinWaitlist(submitted); setRegistered(submitted); setExisting(result.status === "Registered"); }
    catch (e: any) { setError(e.message || "We couldn’t save your email. Please try again."); }
    finally { pending.current = false; setJoining(false); }
  };
  return <View testID={`${prefix}-waitlist-section`} style={s.card}>
    <View style={s.header}><View style={s.icon}><Lucide name={registered ? "check" : "mail"} size={23} color={colors.brand} /></View><Text testID={`${prefix}-waitlist-badge`} style={s.badge}>FREE TO JOIN</Text></View>
    <Text testID={`${prefix}-waitlist-title`} style={s.title}>{registered ? "You’re on the list." : "Your next chapter starts here."}</Text>
    {registered ? <View testID={`${prefix}-waitlist-success`} accessibilityLiveRegion="polite" style={s.success}><Text testID={`${prefix}-waitlist-confirmation`} style={s.successText}>{existing ? "This email is already registered for Academy updates." : "Your interest in Mqulima Academy has been registered."}</Text><Text selectable testID={`${prefix}-waitlist-email`} style={s.email}>{registered}</Text><Text style={s.note}>Full-course enrolment is not open yet.</Text></View> : <>
      <Text testID={`${prefix}-waitlist-description`} style={s.description}>Full courses are coming soon. Register your interest while you explore the free lessons.</Text>
      <View style={s.field}><Text testID={`${prefix}-email-label`} style={s.label}>Email address</Text><TextInput testID={`${prefix}-email-input`} accessibilityLabel="Email address for Academy waitlist" value={email} editable={!joining} onChangeText={value => { setEmail(value); setError(""); }} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" placeholder="you@example.com" placeholderTextColor={colors.muted} returnKeyType="done" onSubmitEditing={join} maxLength={254} style={[s.input, !!error && s.invalid]} />{!!error && <Text testID={`${prefix}-waitlist-error`} accessibilityRole="alert" style={s.error}>{error}</Text>}</View>
      <AcademyButton testID={`${prefix}-join-waitlist-btn`} label={joining ? "Registering your interest…" : "Join the Academy waitlist"} onPress={join} loading={joining} />
      <Text testID={`${prefix}-waitlist-note`} style={s.note}>No payment required. This is a waitlist, not course enrolment.</Text>
    </>}
  </View>;
}

const useStyles = makeStyles(c => ({
  card: { padding: 20, borderWidth: 1, borderColor: c.border, borderTopWidth: 3, borderTopColor: c.brand, borderRadius: 0, backgroundColor: c.surfaceSecondary, gap: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }, icon: { width: 44, height: 44, alignItems: "center", justifyContent: "center", backgroundColor: c.heroBg },
  badge: { fontFamily: fonts.b800, fontSize: 8, letterSpacing: 1.2, color: c.brand }, title: { fontFamily: fonts.h700, fontSize: 27, lineHeight: 32, color: c.onSurface, letterSpacing: -0.5 },
  description: { fontFamily: fonts.b400, fontSize: 13, lineHeight: 22, color: c.onSurfaceTertiary }, field: { gap: 8 }, label: { fontFamily: fonts.b700, fontSize: 12, color: c.onSurface },
  input: { minHeight: 52, borderWidth: 1, borderColor: c.borderStrong, borderRadius: 0, paddingHorizontal: 14, fontFamily: fonts.b400, fontSize: 14, backgroundColor: c.surfaceSecondary, color: c.onSurface }, invalid: { borderColor: c.error }, error: { fontFamily: fonts.b600, fontSize: 12, lineHeight: 20, color: c.error },
  note: { fontFamily: fonts.b400, fontSize: 10, lineHeight: 18, color: c.muted }, success: { gap: 12 }, successText: { fontFamily: fonts.b500, fontSize: 14, lineHeight: 23, color: c.brand }, email: { fontFamily: fonts.b700, fontSize: 13, color: c.onSurface },
}));