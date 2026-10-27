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
import { cropSymptoms, marketFilters, marketPrices, tools, weather } from "@/src/data/tools";
import { fonts, makeStyles, useTheme } from "@/src/theme";

function Weather() {
  const s = useStyles();
  const { colors } = useTheme();
  const [county, setCounty] = useState("Uasin Gishu");
  const [unit, setUnit] = useState<"C" | "F">("C");
  const t = (c: number) => (unit === "C" ? `${Math.round(c)}°` : `${Math.round(c * 1.8 + 32)}°`);

  const q = useQuery({
    queryKey: ["weather", county],
    queryFn: () => api.getWeather(county),
    staleTime: 1000 * 60 * 15,
  });

  const wxData = q.data;
  const currentTemp = wxData?.current?.temperature_2m ?? weather.temp;
  const conditionLabel = wxData?.conditionLabel ?? weather.condition;
  const humidity = wxData?.current?.relative_humidity_2m ?? 65;
  const wind = wxData?.current?.wind_speed_10m ?? 8;
  const advisory = wxData?.advisory;

  const weekForecast = wxData?.daily?.map((d: any) => ({
    d: d.dayLabel,
    hi: d.tempMax,
    lo: d.tempMin,
    condition: d.conditionLabel,
  })) ?? weather.week;

  return (
    <View style={{ gap: 16 }}>
      <SelectField testID="weather-county-select" label="County" value={county} options={counties} onChange={setCounty} />
      <View style={s.wxCard} testID="weather-current">
        <Image source={{ uri: weather.image }} style={{ width: "100%", height: 140, borderRadius: 16 }} contentFit="cover" />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={s.wxLoc}>{county} County, Kenya</Text>
          {advisory?.sprayWindow && (
            <View style={[s.live, { backgroundColor: advisory.sprayWindow === "IDEAL" ? colors.forest : colors.orange }]}>
              <Text style={s.liveText}>{advisory.sprayWindow === "IDEAL" ? "SPRAY WINDOW OPEN" : "SPRAY RESTRICTED"}</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={s.wxTemp}>{t(currentTemp)}{unit}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["C", "F"] as const).map((u) => <Chip key={u} testID={`weather-unit-${u}`} label={`°${u}`} active={unit === u} onPress={() => setUnit(u)} />)}
          </View>
        </View>
        <Text style={s.muted}>{conditionLabel} • Wind {wind} km/h • Humidity {humidity}%</Text>
        {advisory?.sprayWindowText && (
          <View style={{ backgroundColor: colors.surfaceSecondary, padding: 10, borderRadius: 12, marginTop: 4 }}>
            <Text style={{ fontFamily: fonts.b500, fontSize: 12, color: colors.onSurfaceSecondary }}>{advisory.sprayWindowText}</Text>
          </View>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {weekForecast.map((d: any, idx: number) => (
          <View key={`${d.d}-${idx}`} style={s.day}>
            <Text style={s.muted}>{d.d}</Text>
            <Lucide name="cloud-sun" size={22} color={colors.orange} />
            <Text style={s.dayT}>{t(d.hi)} / {t(d.lo)}</Text>
          </View>
        ))}
      </ScrollView>
      <Text style={s.h3}>Agricultural Highlights</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <View style={s.hl}>
          <Text style={s.muted}>GDD Accumulation</Text>
          <Text style={s.hlV}>{wxData?.gdd ?? 14.2}</Text>
          <Text style={s.hlS}>Maize Growth Index</Text>
        </View>
        <View style={s.hl}>
          <Text style={s.muted}>Soil Moisture</Text>
          <Text style={s.hlV}>{wxData?.hourlySnapshot?.soilMoisturePct ?? 32}%</Text>
          <Text style={s.hlS}>Root Zone (0-10cm)</Text>
        </View>
        <View style={s.hl}>
          <Text style={s.muted}>Solar Radiation</Text>
          <Text style={s.hlV}>{Math.round(wxData?.hourlySnapshot?.shortwaveRadiation ?? 680)} W/m²</Text>
          <Text style={s.hlS}>Photosynthesis Peak</Text>
        </View>
        <View style={s.hl}>
          <Text style={s.muted}>Evapotranspiration</Text>
          <Text style={s.hlV}>{wxData?.daily?.[0]?.et0 ?? 3.8} mm/day</Text>
          <Text style={s.hlS}>FAO ET0 Water Need</Text>
        </View>
      </View>
    </View>
  );
}

function Markets() {
  const s = useStyles();
  const { colors } = useTheme();
  const [filter, setFilter] = useState("All Varieties");
  const filtered = filter === "All Varieties" ? marketPrices : marketPrices.filter((m) => m.type === filter);

  return (
    <View style={{ gap: 14 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {marketFilters.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: filter === f ? colors.brandPrimary : colors.border,
              backgroundColor: filter === f ? colors.brandPrimary : colors.surfaceSecondary,
            }}
          >
            <Text style={{ fontFamily: fonts.b700, fontSize: 13, color: filter === f ? colors.white : colors.onSurfaceSecondary }}>
              {f}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ gap: 10 }}>
        {filtered.map((item, i) => (
          <View key={`${item.name}-${item.market}-${i}`} style={s.mRow}>
            <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.mName}>{item.name}</Text>
              <Text style={s.muted}>{item.market} Hub · per {item.unit}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[s.mPrice, { color: colors.brandPrimary }]}>KES {item.price}</Text>
              <Text style={{ fontSize: 12, fontFamily: fonts.b600, color: item.change >= 0 ? colors.brandPrimary : colors.error }}>
                {item.change >= 0 ? `+${item.change}%` : `${item.change}%`}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function CropDoctor() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const [crop, setCrop] = useState("Maize");
  const [sel, setSel] = useState<string | null>("s1");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<any>(null);

  const run = async () => {
    setLoading(true);
    setRes(null);
    try {
      const selectedSymptom = cropSymptoms.find((c) => c.id === sel);
      const apiRes = await api.diagnoseCrop({
        crop,
        symptoms: { [selectedSymptom?.label || "General symptom"]: true },
        farmerQuestion: notes || undefined,
      });

      if (apiRes.success && apiRes.diagnosis) {
        setRes({
          dx: apiRes.diagnosis.disease || apiRes.diagnosis.name || "Identified Crop Pathogen",
          tx: apiRes.diagnosis.treatmentPlan || apiRes.diagnosis.recommendation || selectedSymptom?.tx,
          confidence: apiRes.diagnosis.confidence || "High",
          urgency: apiRes.diagnosis.urgency || "Moderate",
          immediateAction: apiRes.diagnosis.immediateAction,
          products: apiRes.diagnosis.recommendedProducts || [],
        });
      } else {
        throw new Error("No diagnosis returned");
      }
    } catch {
      // Offline / fallback to agronomic knowledge base
      const local = cropSymptoms.find((c) => c.id === sel);
      if (local) {
        setRes({
          dx: local.dx,
          tx: local.tx,
          confidence: "Field Agronomy Reference",
          urgency: "Standard",
          products: ["Top-dressing Fertilizer", "Broad-spectrum Fungicide"],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <SelectField
        testID="crop-doctor-crop-select"
        label="Target Crop"
        value={crop}
        options={["Maize", "Irish Potatoes", "Tomatoes", "Avocado", "Beans", "Cabbage & Kales", "Wheat", "Onions"]}
        onChange={setCrop}
      />
      <Text style={s.h3}>What symptoms do you observe?</Text>
      {cropSymptoms.map((c) => (
        <Pressable key={c.id} testID={`symptom-${c.id}`} onPress={() => setSel(c.id)} style={[s.opt, sel === c.id && { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary }]}>
          <Lucide name={sel === c.id ? "circle-check" : "circle"} size={20} color={sel === c.id ? colors.brandPrimary : colors.subtle} />
          <Text style={s.mName}>{c.label}</Text>
        </Pressable>
      ))}
      <Field
        testID="crop-doctor-notes-input"
        label="Additional Observations (Optional)"
        placeholder="e.g. Started after heavy rains in Eldoret, lower leaves curling"
        value={notes}
        onChangeText={setNotes}
      />
      <Btn testID="crop-doctor-diagnose-btn" full variant="green" label="Diagnose with Gemini Vision AI" icon="scan-search" loading={loading} onPress={sel ? run : undefined} style={!sel && { opacity: 0.5 }} />
      {res ? (
        <View style={s.result} testID="crop-doctor-result">
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={s.liveText}>AI AGRONOMY DIAGNOSIS</Text>
            {res.confidence && <Text style={[s.liveText, { color: colors.white }]}>{res.confidence}</Text>}
          </View>
          <Text style={[s.h3, { color: colors.white }]}>{res.dx}</Text>
          {res.immediateAction && (
            <View style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: 8, borderRadius: 10 }}>
              <Text style={{ fontFamily: fonts.b700, fontSize: 12, color: colors.brandSecondary }}>Action: {res.immediateAction}</Text>
            </View>
          )}
          <Body dark>{res.tx}</Body>
          {Array.isArray(res.products) && res.products.length > 0 && (
            <View style={{ gap: 6, marginTop: 4 }}>
              <Text style={[s.liveText, { color: colors.brandSecondary }]}>RECOMMENDED CERTIFIED TREATMENTS</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {res.products.map((p: string, idx: number) => (
                  <Chip key={idx} label={p} active onPress={() => router.push({ pathname: "/(tabs)/shop" })} />
                ))}
              </View>
            </View>
          )}
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
