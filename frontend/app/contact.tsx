import React, { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Page } from "@/src/components/Page";
import { Btn, SectionTitle } from "@/src/components/ui";
import { Field, SuccessState, EMAIL_RE, PHONE_RE } from "@/src/components/Form";
import { contactInfo } from "@/src/data/home";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function Contact() {
  const { subject } = useLocalSearchParams<{ subject?: string }>();
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [f, setF] = useState({ name: "", contact: "", subject: subject ?? "", message: "" });
  const [e, setE] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  const submit = () => {
    const err: Record<string, string> = {};
    if (f.name.trim().length < 2) err.name = "Enter your name";
    const c = f.contact.trim().replace(/\s/g, "");
    if (!EMAIL_RE.test(c) && !PHONE_RE.test(c)) err.contact = "Enter a valid email or phone number";
    if (f.message.trim().length < 10) err.message = "Message should be at least 10 characters";
    setE(err);
    if (!Object.keys(err).length) setDone(true);
  };
  const rows = [
    { id: "phone", icon: "phone", label: contactInfo.phone, url: `tel:${contactInfo.phoneRaw}` },
    { id: "email", icon: "mail", label: contactInfo.email, url: `mailto:${contactInfo.email}` },
    { id: "whatsapp", icon: "message-circle", label: "WhatsApp @mqulima", url: contactInfo.whatsapp },
    { id: "address", icon: "map-pin", label: contactInfo.address, url: "" },
  ];
  return (
    <Page title="Contact" testID="contact-screen">
      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 96 }}>
        <SectionTitle badge="CONTACT US" title="Talk to" highlight="Mqulima" />
        <View style={s.card}>
          {rows.map((r) => (
            <Pressable key={r.id} testID={`contact-${r.id}`} onPress={r.url ? () => Linking.openURL(r.url) : undefined} style={s.row}>
              <View style={s.icon}><Lucide name={r.icon as any} size={18} color={colors.onBrandTertiary} /></View>
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
            <Btn testID="contact-submit-btn" full variant="green" label="Send Message" icon="send" onPress={submit} />
          </View>
        )}
      </KeyboardAwareScrollView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  card: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 24, padding: 12, gap: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 52 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  rowText: { fontFamily: fonts.b600, fontSize: 14, color: c.onSurface, flexShrink: 1 },
}));
