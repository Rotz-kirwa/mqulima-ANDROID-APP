import React, { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Lucide } from "@react-native-vector-icons/lucide";
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { Page } from "@/src/components/Page";
import { Footer } from "@/src/components/Footer";
import { Btn, SectionTitle } from "@/src/components/ui";
import { Field, SuccessState, EMAIL_RE, PHONE_RE } from "@/src/components/Form";
import { contactInfo } from "@/src/data/home";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { api } from "@/src/services/api";

export default function Contact() {
  const { subject } = useLocalSearchParams<{ subject?: string }>();
  const s = useStyles();
  const { colors } = useTheme();
  const [f, setF] = useState({ name: "", contact: "", subject: subject ?? "", message: "" });
  const [e, setE] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  const submit = async () => {
    const err: Record<string, string> = {};
    if (f.name.trim().length < 2) err.name = "Enter your name";
    const c = f.contact.trim().replace(/\s/g, "");
    if (!EMAIL_RE.test(c) && !PHONE_RE.test(c)) err.contact = "Enter a valid email or phone number";
    if (f.message.trim().length < 10) err.message = "Message should be at least 10 characters";
    setE(err);
    if (Object.keys(err).length) return;
    setLoading(true);
    try { await api.submitContact(f); setDone(true); }
    catch (error: any) { setE({ message: error.message || "Could not send message. Please try again." }); }
    finally { setLoading(false); }
  };
  const rows: { id: string; icon: string; label: string; url: string; bg: string; iconColor: string; isBrand?: boolean }[] = [
    { id: "phone", icon: "phone", label: contactInfo.phone, url: `tel:${contactInfo.phoneRaw}`, bg: "#2563EB", iconColor: "#FFFFFF" },
    { id: "email", icon: "mail", label: contactInfo.email, url: `mailto:${contactInfo.email}`, bg: "#EA580C", iconColor: "#FFFFFF" },
    { id: "whatsapp", icon: "whatsapp", isBrand: true, label: "WhatsApp @mqulima", url: contactInfo.whatsapp, bg: colors.whatsapp, iconColor: "#FFFFFF" },
    { id: "address", icon: "map-pin", label: contactInfo.address, url: "", bg: "#DC2626", iconColor: "#FFFFFF" },
  ];
  return (
    <Page title="Contact" testID="contact-screen">
      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={s.scrollContent}>
        <View style={s.body}>
          <SectionTitle badge="CONTACT US" title="Talk to" highlight="Mqulima" />
          <View style={s.card}>
            {rows.map((r) => (
              <Pressable key={r.id} testID={`contact-${r.id}`} onPress={r.url ? () => Linking.openURL(r.url) : undefined} style={s.row}>
                <View style={[s.icon, { backgroundColor: r.bg }]}>
                  {r.isBrand ? (
                    <FontAwesome6 name={r.icon as any} iconStyle="brand" size={18} color={r.iconColor} />
                  ) : (
                    <Lucide name={r.icon as any} size={18} color={r.iconColor} />
                  )}
                </View>
                <Text style={s.rowText}>{r.label}</Text>
              </Pressable>
            ))}
          </View>
          {done ? (
            <SuccessState testID="contact-success" title="Message sent!" text="Thank you for reaching out. Our team will get back to you within 24 hours." />
          ) : (
            <View style={{ gap: 14 }}>
              <Field testID="contact-name-input" label="Your Name" value={f.name} onChangeText={set("name")} placeholder="Full names" error={e.name} />
              <Field testID="contact-contact-input" label="Email or Phone" value={f.contact} onChangeText={set("contact")} placeholder="you@example.com or 0712..." autoCapitalize="none" error={e.contact} />
              <Field testID="contact-subject-input" label="Subject (optional)" value={f.subject} onChangeText={set("subject")} placeholder="e.g. Partnership" />
              <Field testID="contact-message-input" label="Message" value={f.message} onChangeText={set("message")} placeholder="How can we help?" multiline error={e.message} />
              <Btn testID="contact-submit-btn" full variant="green" label="Send Message" icon="send" loading={loading} onPress={submit} />
            </View>
          )}
        </View>
        <Footer />
      </KeyboardAwareScrollView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  scrollContent: { flexGrow: 1, justifyContent: "space-between" },
  body: { padding: 16, gap: 16, paddingBottom: 32 },
  card: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 24, padding: 12, gap: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 52 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  rowText: { fontFamily: fonts.b600, fontSize: 14, color: c.onSurface, flexShrink: 1 },
}));
