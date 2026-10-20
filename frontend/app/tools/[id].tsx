import React, { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { Image } from "@/src/components/Img";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Lucide } from "@react-native-vector-icons/lucide";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Page, useStackBottom } from "@/src/components/Page";
import { Btn, Body, Chip } from "@/src/components/ui";
import { Field, SelectField, SuccessState } from "@/src/components/Form";
import { ListSkeleton } from "@/src/components/Skeleton";
import { api } from "@/src/services/api";
import { counties } from "@/src/data/home";
import { cropSymptoms, marketFilters, tools, weather } from "@/src/data/tools";
import { fonts, makeStyles, useTheme } from "@/src/theme";

function Weather() {
  const s = useStyles();
  const { colors } = useTheme();
  const [county, setCounty] = useState("Nairobi");
  const [unit, setUnit] = useState<"C" | "F">("C");
  const t = (c: number) => (unit === "C" ? `${c}°` : `${Math.round(c * 1.8 + 32)}°`);
  return (
    <View style={{ gap: 16 }}>
      <SelectField testID="weather-county-select" label="County" value={county} options={counties} onChange={setCounty} />
      <View style={s.wxCard} testID="weather-current">
        <Image source={{ uri: weather.image }} style={{ width: "100%", height: 140, borderRadius: 16 }} contentFit="cover" />
        <Text style={s.wxLoc}>{county} County, Kenya</Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={s.wxTemp}>{t(weather.temp)}{unit}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["C", "F"] as const).map((u) => <Chip key={u} testID={`weather-unit-${u}`} label={`°${u}`} active={unit === u} onPress={() => setUnit(u)} />)}
          </View>
        </View>
        <Text style={s.muted}>{weather.day} • {weather.condition} • {weather.rain}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {weather.week.map((d) => (
          <View key={d.d} style={s.day}>
            <Text style={s.muted}>{d.d}</Text>
            <Lucide name="cloud-sun" size={22} color={colors.orange} />
            <Text style={s.dayT}>{t(d.hi)} / {t(d.lo)}</Text>
          </View>
        ))}
      </ScrollView>
      <Text style={s.h3}>Today&apos;s Highlights</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {weather.highlights.map((h) => (
          <View key={h.l} style={s.hl}>
            <Text style={s.muted}>{h.l}</Text>
            <Text style={s.hlV}>{h.v}</Text>
            <Text style={s.hlS}>{h.s}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Markets() {
  const s = useStyles();
  const { colors } = useTheme();
  const [f, setF] = useState("All Varieties");
  const q = useQuery({ queryKey: ["markets"], queryFn: api.getMarketPrices });
  const rows = (q.data ?? []).filter((r) => f === "All Varieties" || r.type === f);
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={s.h3}>Commodity Index</Text>
        <View style={s.live}><Text style={s.liveText}>KAMIS Live</Text></View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {marketFilters.map((m) => <Chip key={m} testID={`market-filter-${m.replace(/\W+/g, "-").toLowerCase()}`} label={m} active={f === m} onPress={() => setF(m)} />)}
      </ScrollView>
      {q.isLoading ? <View style={{ marginHorizontal: -16 }}><ListSkeleton count={5} height={56} /></View> : rows.map((r, i) => (
        <View key={`${r.name}-${r.market}`} style={s.mRow} testID={`market-row-${i}`}>
          <Text style={{ fontSize: 24 }}>{r.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.mName}>{r.name} <Text style={s.muted}>({r.unit})</Text></Text>
            <Text style={s.muted}>{r.market}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.mPrice}>KSh {r.price.toLocaleString("en-US")}</Text>
            <Text style={{ fontFamily: fonts.b700, fontSize: 12, color: r.change >= 0 ? colors.brandPrimary : colors.error }}>{r.change >= 0 ? "+" : ""}{r.change}%</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function CropDoctor() {
  const s = useStyles();
  const { colors } = useTheme();
  const [sel, setSel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<(typeof cropSymptoms)[number] | null>(null);
  const run = () => {
    setLoading(true);
    setRes(null);
    setTimeout(() => { setRes(cropSymptoms.find((c) => c.id === sel) ?? null); setLoading(false); }, 1200);
  };
  return (
    <View style={{ gap: 12 }}>
      <Text style={s.h3}>What symptoms do you see?</Text>
      {cropSymptoms.map((c) => (
        <Pressable key={c.id} testID={`symptom-${c.id}`} onPress={() => setSel(c.id)} style={[s.opt, sel === c.id && { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary }]}>
          <Lucide name={sel === c.id ? "circle-check" : "circle"} size={20} color={sel === c.id ? colors.brandPrimary : colors.subtle} />
          <Text style={s.mName}>{c.label}</Text>
        </Pressable>
      ))}
      <Btn testID="crop-doctor-diagnose-btn" full variant="green" label="Diagnose" icon="scan-search" loading={loading} onPress={sel ? run : undefined} style={!sel && { opacity: 0.5 }} />
      {res ? (
        <View style={s.result} testID="crop-doctor-result">
          <Text style={s.liveText}>LIKELY DIAGNOSIS</Text>
          <Text style={[s.h3, { color: colors.white }]}>{res.dx}</Text>
          <Body dark>{res.tx}</Body>
        </View>
      ) : null}
    </View>
  );
}

function FieldMapping() {
  const s = useStyles();
  const [l, setL] = useState("");
  const [w, setW] = useState("");
  const area = (parseFloat(l) || 0) * (parseFloat(w) || 0);
  return (
    <View style={{ gap: 12 }}>
      <Field testID="field-length-input" label="Field length (metres)" value={l} onChangeText={setL} keyboardType="decimal-pad" placeholder="e.g. 120" />
      <Field testID="field-width-input" label="Field width (metres)" value={w} onChangeText={setW} keyboardType="decimal-pad" placeholder="e.g. 80" />
      <View style={s.result} testID="field-mapping-result">
        <Text style={s.liveText}>YOUR FARM SIZE</Text>
        <Text style={[s.wxTemp, { color: "#FFFFFF", fontSize: 36 }]}>{(area / 4046.86).toFixed(2)} acres</Text>
        <Body dark>{area.toLocaleString("en-US")} m² • {(area / 10000).toFixed(2)} hectares</Body>
        <Body dark>Seed estimate (maize @10kg/acre): {((area / 4046.86) * 10).toFixed(1)} kg</Body>
      </View>
    </View>
  );
}

function Trace() {
  const [f, setF] = useState({ produce: "", farm: "", county: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  if (done) return <SuccessState testID="trace-success" title="Trace request received" text="Our team will contact you to set up verifiable farm-to-consumer traceability for your produce." />;
  return (
    <View style={{ gap: 12 }}>
      <Field testID="trace-produce-input" label="Produce" value={f.produce} onChangeText={(v) => setF({ ...f, produce: v })} placeholder="e.g. Hass Avocado" error={err.produce} />
      <Field testID="trace-farm-input" label="Farm name" value={f.farm} onChangeText={(v) => setF({ ...f, farm: v })} placeholder="e.g. Kiprono Farms" error={err.farm} />
      <SelectField testID="trace-county-select" label="County" value={f.county} options={counties} onChange={(v) => setF({ ...f, county: v })} error={err.county} />
      <Btn testID="trace-submit-btn" full variant="green" label="Become Traceable" onPress={() => {
        const e: Record<string, string> = {};
        if (!f.produce.trim()) e.produce = "Enter your produce";
        if (!f.farm.trim()) e.farm = "Enter your farm name";
        if (!f.county) e.county = "Select a county";
        setErr(e);
        if (!Object.keys(e).length) setDone(true);
      }} />
    </View>
  );
}

function Advisory() {
  const router = useRouter();
  return (
    <View style={{ gap: 12 }}>
      <Body>Our agro-meteorology experts translate forecasts into practical planting, spraying and harvesting decisions for your specific county and crop.</Body>
      <Btn testID="advisory-consult-btn" full variant="green" label="Consult Expert" onPress={() => router.push({ pathname: "/service-request", params: { service: "Weather Advisory", category: "Mqulima Tools" } })} />
      <Btn testID="advisory-forecast-btn" full variant="outline" label="View Weather Forecast" onPress={() => router.replace("/tools/weather")} />
    </View>
  );
}

export default function ToolScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useStyles();
  const bottom = useStackBottom();
  const { colors } = useTheme();
  const tool = tools.find((t) => t.id === id);
  const [refreshing, setRefreshing] = useState(false);
  const body = { weather: <Weather />, markets: <Markets />, "crop-doctor": <CropDoctor />, "field-mapping": <FieldMapping />, trace: <Trace />, "weather-advisory": <Advisory /> }[id ?? ""];
  return (
    <Page title={tool?.title ?? "Tool"} testID={`tool-screen-${id}`}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: bottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800); }} tintColor={colors.brandPrimary} colors={[colors.brandPrimary]} />}
      >
        {tool ? <Body style={{ fontSize: 13 }}>{tool.text}</Body> : null}
        {body ?? <Text style={s.h3}>Tool not found</Text>}
      </KeyboardAwareScrollView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  h3: { fontFamily: fonts.h800, fontSize: 18, color: c.onSurface },
  muted: { fontFamily: fonts.b500, fontSize: 12, color: c.muted },
  wxCard: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 24, padding: 16, gap: 8 },
  wxLoc: { fontFamily: fonts.h700, fontSize: 15, color: c.onSurface },
  wxTemp: { fontFamily: fonts.h900, fontSize: 48, color: c.onSurface },
  day: { width: 88, alignItems: "center", gap: 6, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 18, paddingVertical: 12 },
  dayT: { fontFamily: fonts.b700, fontSize: 12, color: c.onSurface },
  hl: { width: "48%", backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 18, padding: 14, gap: 4 },
  hlV: { fontFamily: fonts.h900, fontSize: 20, color: c.onSurface },
  hlS: { fontFamily: fonts.b600, fontSize: 12, color: c.onSurfaceTertiary },
  live: { backgroundColor: c.forest, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  liveText: { fontFamily: fonts.b800, fontSize: 10, letterSpacing: 1, color: c.brandSecondary },
  mRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 12 },
  mName: { fontFamily: fonts.h700, fontSize: 14, color: c.onSurface },
  mPrice: { fontFamily: fonts.h900, fontSize: 15, color: c.onSurface },
  opt: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 52, borderWidth: 1, borderColor: c.border, borderRadius: 14, paddingHorizontal: 14, backgroundColor: c.white },
  result: { backgroundColor: c.forest, borderRadius: 24, padding: 20, gap: 8 },
}));
