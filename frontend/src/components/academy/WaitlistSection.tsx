import React, { useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { api } from "@/src/services/api";
import { EMAIL_RE } from "@/src/components/Form";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { AcademyCtaButton } from "./AcademyCtaButton";

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
    <View style={s.header}>
      <View style={s.icon}>
        <Lucide name={registered ? "check" : "sparkles"} size={22} color="#0B2117" />
      </View>
      <View style={s.badgePill}>
        <Text testID={`${prefix}-waitlist-badge`} style={s.badge}>EARLY BETA ACCESS · FREE</Text>
      </View>
    </View>
    <Text testID={`${prefix}-waitlist-title`} style={s.title}>
      {registered ? "You’re on the launch list!" : "Get Early Beta Access."}
    </Text>
    {registered ? (
      <View testID={`${prefix}-waitlist-success`} accessibilityLiveRegion="polite" style={s.success}>
        <Text testID={`${prefix}-waitlist-confirmation`} style={s.successText}>
          {existing ? "This email is already registered for Academy updates." : "Your interest in Mqulima Academy has been registered. We’ll notify you before full courses open."}
        </Text>
        <Text selectable testID={`${prefix}-waitlist-email`} style={s.email}>{registered}</Text>
        <Text style={s.note}>Full video masterclasses launch in 2026. We’ll notify you as soon as enrollment opens.</Text>
      </View>
    ) : (
      <>
        <Text testID={`${prefix}-waitlist-description`} style={s.description}>
          Full video courses and certified learning paths are launching soon. Reserve your spot to be first in line when cohorts open.
        </Text>
        <View style={s.field}>
          <Text testID={`${prefix}-email-label`} style={s.label}>Email address</Text>
          <TextInput
            testID={`${prefix}-email-input`}
            accessibilityLabel="Email address for Academy waitlist"
            value={email}
            editable={!joining}
            onChangeText={value => { setEmail(value); setError(""); }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            placeholder="farmer@example.com"
            placeholderTextColor={colors.muted}
            returnKeyType="done"
            onSubmitEditing={join}
            maxLength={254}
            style={[s.input, !!error && s.invalid]}
          />
          {!!error && <Text testID={`${prefix}-waitlist-error`} accessibilityRole="alert" style={s.error}>{error}</Text>}
        </View>
        <AcademyCtaButton
          testID={`${prefix}-join-waitlist-btn`}
          variant="yellow"
          fullWidth
          icon="bell-ring"
          loading={joining}
          label={joining ? "Registering your interest…" : "Notify Me When Courses Launch"}
          onPress={join}
        />
        <Text testID={`${prefix}-waitlist-note`} style={s.note}>
          100% free early access notification. No payment or commitment required.
        </Text>
      </>
    )}
  </View>;
}

const useStyles = makeStyles(c => ({
  card: {
    padding: 22,
    borderRadius: 22,
    backgroundColor: "#082114",
    borderWidth: 1.5,
    borderColor: "rgba(250, 204, 21, 0.35)",
    borderTopWidth: 4,
    borderTopColor: "#FACC15",
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FACC15",
  },
  badgePill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(133, 204, 20, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(133, 204, 20, 0.42)",
  },
  badge: {
    fontFamily: fonts.b800,
    fontSize: 10,
    letterSpacing: 1,
    color: "#BEF264",
  },
  title: {
    fontFamily: fonts.h800,
    fontSize: 25,
    lineHeight: 30,
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  description: {
    fontFamily: fonts.b400,
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(236, 253, 245, 0.84)",
  },
  field: {
    gap: 8,
  },
  label: {
    fontFamily: fonts.b700,
    fontSize: 12,
    color: "#E2F7D5",
  },
  input: {
    minHeight: 50,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 14,
    paddingHorizontal: 14,
    fontFamily: fonts.b500,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
    color: c.onSurface,
  },
  invalid: {
    borderColor: "#F87171",
  },
  error: {
    fontFamily: fonts.b600,
    fontSize: 12,
    lineHeight: 18,
    color: "#FCA5A5",
  },
  note: {
    fontFamily: fonts.b400,
    fontSize: 11,
    lineHeight: 17,
    color: "rgba(226, 247, 213, 0.68)",
  },
  success: {
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(133, 204, 20, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(133, 204, 20, 0.36)",
  },
  successText: {
    fontFamily: fonts.b500,
    fontSize: 14,
    lineHeight: 21,
    color: "#DCFCE7",
  },
  email: {
    fontFamily: fonts.b800,
    fontSize: 13,
    color: "#FDE047",
  },
}));