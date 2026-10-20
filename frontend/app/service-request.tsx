import React, { useState } from "react";
import { Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Page } from "@/src/components/Page";
import { Btn, Pill } from "@/src/components/ui";
import { Field, SelectField, SuccessState, PHONE_RE } from "@/src/components/Form";
import { counties } from "@/src/data/home";
import { serviceCategories } from "@/src/data/services";
import { fonts, makeStyles } from "@/src/theme";
import { useApp } from "@/src/store/AppStore";

const allServices = serviceCategories.flatMap((c) => c.subs.map((s) => s.title));

export default function ServiceRequest() {
  const params = useLocalSearchParams<{ service?: string; category?: string }>();
  const s = useStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const [f, setF] = useState({ service: params.service ?? "", name: user?.name ?? "", phone: user?.phone ?? "", county: user?.county ?? "", subcounty: "", date: "", details: "" });
  const [e, setE] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  const submit = () => {
    const err: Record<string, string> = {};
    if (!f.service) err.service = "Select a service";
    if (f.name.trim().length < 3) err.name = "Enter your full names";
    if (!PHONE_RE.test(f.phone.replace(/\s/g, ""))) err.phone = "Enter a valid phone number e.g. 0712345678";
    if (!f.county) err.county = "Select your county";
    if (f.details.trim().length < 10) err.details = "Describe your need (at least 10 characters)";
    setE(err);
    if (Object.keys(err).length) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); }, 900);
  };

  if (done) {
    return (
      <Page title="Request Sent">
        <SuccessState testID="service-request-success" title="Request received!" text={`Thank you ${f.name.split(" ")[0]}. A vetted ${f.service} specialist in ${f.county} will contact you on ${f.phone} — average response under 10 minutes.`}>
          <Btn testID="service-request-more-btn" full variant="green" label="Browse More Services" onPress={() => router.replace("/services")} />
          <Btn testID="service-request-home-btn" full variant="outline" label="Back to Home" onPress={() => router.navigate("/")} />
        </SuccessState>
      </Page>
    );
  }

  return (
    <Page title="Request a Service" testID="service-request-screen">
      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 32 }}>
        {params.category ? <Pill label={params.category} /> : null}
        <Text style={s.h2}>Tell us what you need</Text>
        <Text style={s.muted}>Place a request and Mqulima will send an expert.</Text>
        <SelectField testID="service-request-service-select" label="Service" value={f.service} options={allServices} onChange={set("service")} error={e.service} placeholder="Select service" />
        <Field testID="service-request-name-input" label="Full Names" value={f.name} onChangeText={set("name")} placeholder="e.g. Eliud Rotich" error={e.name} />
        <Field testID="service-request-phone-input" label="Phone Number" value={f.phone} onChangeText={set("phone")} placeholder="0712 345 678" keyboardType="phone-pad" error={e.phone} />
        <SelectField testID="service-request-county-select" label="County" value={f.county} options={counties} onChange={set("county")} error={e.county} placeholder="Select county" />
        <Field testID="service-request-subcounty-input" label="Subcounty (optional)" value={f.subcounty} onChangeText={set("subcounty")} placeholder="e.g. Kapseret" />
        <Field testID="service-request-date-input" label="Preferred Date (optional)" value={f.date} onChangeText={set("date")} placeholder="e.g. Next Monday" />
        <Field testID="service-request-details-input" label="Details" value={f.details} onChangeText={set("details")} placeholder="Farm size, crop/livestock, the problem you need solved..." multiline error={e.details} />
        <Btn testID="service-request-submit-btn" full variant="green" label="Submit Request" icon="send" loading={loading} onPress={submit} />
      </KeyboardAwareScrollView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  h2: { fontFamily: fonts.h900, fontSize: 24, color: c.onSurface },
  muted: { fontFamily: fonts.b500, fontSize: 13, color: c.muted, marginTop: -8 },
}));
