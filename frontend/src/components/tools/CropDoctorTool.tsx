import React, { useState } from "react";
import { Image, Platform, Pressable, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Lucide } from "@react-native-vector-icons/lucide";
import { api } from "@/src/services/api";
import { useApp } from "@/src/store/AppStore";
import { compressImageAsset } from "@/src/utils/mediaCompress";
import { counties } from "@/src/data/home";
import { SelectField } from "@/src/components/Form";
import { Btn } from "@/src/components/ui";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const CROPS = ["Maize", "Tomatoes", "Potatoes", "Beans", "Coffee", "Sukuma Wiki"];
const SYMPTOMS: { key: string; label: string }[] = [
  { key: "yellowing", label: "Leaf Yellowing" },
  { key: "leaf_spots", label: "Spots / Blight" },
  { key: "wilting", label: "Wilting" },
  { key: "pests_holes", label: "Pests / Holes" },
];

type DiagnosisResult = {
  condition: string;
  severity?: string;
  confidence?: string;
  summary: string;
  immediateActions?: string[];
  organicRemedies?: string[];
  chemicalRemedies?: string[];
  preventionTips?: string[];
  source?: string;
  followUpQuestion?: string;
};

function buildLocalOfflineTriage(crop: string, county: string): DiagnosisResult {
  return {
    condition: `${crop} Field Triage (Offline Mode)`,
    severity: "Moderate",
    confidence: "Local Cache Guide",
    source: "offline_agronomy_fallback",
    summary: `No cellular/internet connection reached Mqulima Cloud. Photo stays saved below so you can re-run AI analysis for ${county || "your farm"} once signal returns.`,
    immediateActions: [
      "Inspect both leaf undersides and stem collar in daylight; isolate severely wilting plants.",
      "Avoid spraying during strong midday heat or before heavy rain.",
    ],
    organicRemedies: [
      "Use cold-pressed neem extract early morning and improve mulch spacing around roots.",
    ],
    chemicalRemedies: [
      "Always verify active ingredient & Pre-Harvest Interval on PCPB-registered agrovet labels.",
    ],
  };
}

export function CropDoctorTool() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { user, toast } = useApp();

  const [crop, setCrop] = useState("Maize");
  const [county, setCounty] = useState(user?.county || "Uasin Gishu");
  const [symptoms, setSymptoms] = useState<Record<string, boolean>>({});
  const [question, setQuestion] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | undefined>(undefined);
  const [photoKb, setPhotoKb] = useState<number | null>(null);
  const [busyMedia, setBusyMedia] = useState(false);
  const [locating, setLocating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);

  const pickImage = async (fromCamera: boolean) => {
    setBusyMedia(true);
    try {
      if (Platform.OS !== "web") {
        const perm = fromCamera
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          toast(fromCamera ? "Allow camera access in Settings to photograph crops." : "Allow photo library access to pick a leaf photo.");
          return;
        }
      }
      const res = fromCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });

      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      const compressed = await compressImageAsset(asset.uri, {
        profile: "crop-doctor",
        width: asset.width,
        height: asset.height,
        includeBase64: true,
      });
      setPhotoUri(compressed.uri);
      setPhotoBase64(compressed.base64);
      setPhotoKb(compressed.sizeBytes ? Math.max(1, Math.round(compressed.sizeBytes / 1024)) : null);
    } catch {
      toast("Could not process crop photo.");
    } finally {
      setBusyMedia(false);
    }
  };

  const detectLocationCounty = async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        toast("Allow location permission or pick your county manually.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const geo = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const regionText = `${geo?.[0]?.region || ""} ${geo?.[0]?.subregion || ""} ${geo?.[0]?.city || ""}`.toLowerCase();
      const matched = counties.find((c) => regionText.includes(c.toLowerCase()));
      if (matched) {
        setCounty(matched);
        toast(`Location set to ${matched}`);
      } else {
        toast("GPS locked — confirm your nearest county below.");
      }
    } catch {
      toast("GPS unavailable offline — pick county manually.");
    } finally {
      setLocating(false);
    }
  };

  const handleDiagnose = async () => {
    setAnalyzing(true);
    try {
      const res = await api.diagnoseCrop({
        crop,
        symptoms,
        imageBase64: photoBase64,
        county,
        farmerQuestion: question.trim() || undefined,
      });
      setDiagnosis(res?.diagnosis ?? buildLocalOfflineTriage(crop, county));
    } catch {
      setDiagnosis(buildLocalOfflineTriage(crop, county));
      toast("Cloud AI unreachable — showing offline triage guide.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={s.card}>
        <Text style={s.sectionLabel}>1. Select Affected Crop</Text>
        <View style={s.chipWrap}>
          {CROPS.map((item) => {
            const active = crop === item;
            return (
              <Pressable
                key={item}
                testID={`crop-doctor-crop-${item.toLowerCase().replace(/\W+/g, "-")}`}
                onPress={() => setCrop(item)}
                style={[s.chip, active && { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }]}
              >
                <Text style={[s.chipText, active && { color: colors.white }]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[s.sectionLabel, { marginTop: 6 }]}>2. Observed Signs (Optional)</Text>
        <View style={s.chipWrap}>
          {SYMPTOMS.map((sym) => {
            const active = Boolean(symptoms[sym.key]);
            return (
              <Pressable
                key={sym.key}
                testID={`crop-doctor-symptom-${sym.key}`}
                onPress={() => setSymptoms((prev) => ({ ...prev, [sym.key]: !prev[sym.key] }))}
                style={[s.chip, active && { backgroundColor: "#FEF3C7", borderColor: "#D97706" }]}
              >
                <Text style={[s.chipText, active && { color: "#92400E" }]}>{sym.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ gap: 8, marginTop: 6 }}>
          <View style={s.countyRow}>
            <View style={{ flex: 1 }}>
              <SelectField testID="crop-doctor-county" label="County" value={county} options={counties} onChange={setCounty} />
            </View>
            <Pressable
              testID="crop-doctor-gps-btn"
              onPress={detectLocationCounty}
              disabled={locating}
              style={s.gpsBtn}
            >
              <Lucide name="map-pin" size={16} color={colors.brandPrimary} />
              <Text style={s.gpsBtnText}>{locating ? "GPS..." : "Use GPS"}</Text>
            </Pressable>
          </View>
        </View>

        <Text style={[s.sectionLabel, { marginTop: 6 }]}>3. Leaf / Pest Photo (Auto-Compressed)</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Btn
            testID="crop-doctor-camera-btn"
            small
            variant="outline"
            icon="camera"
            label="Camera"
            loading={busyMedia}
            onPress={() => pickImage(true)}
            style={{ flex: 1 }}
          />
          <Btn
            testID="crop-doctor-gallery-btn"
            small
            variant="outline"
            icon="image"
            label="Gallery"
            loading={busyMedia}
            onPress={() => pickImage(false)}
            style={{ flex: 1 }}
          />
        </View>

        {photoUri ? (
          <View style={s.previewBox}>
            <Image source={{ uri: photoUri }} style={s.previewImg} resizeMode="cover" />
            <View style={s.previewMeta}>
              <Text style={s.previewBadge}>
                {photoKb ? `Compressed • ${photoKb} KB` : "Compressed Ready"}
              </Text>
              <Pressable onPress={() => { setPhotoUri(null); setPhotoBase64(undefined); setPhotoKb(null); }}>
                <Text style={[s.clearLink, { color: colors.error }]}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <TextInput
          testID="crop-doctor-question-input"
          value={question}
          onChangeText={setQuestion}
          placeholder="Optional note (e.g. leaves curling for 4 days after rains)..."
          placeholderTextColor={colors.subtle}
          multiline
          style={s.input}
        />

        <Btn
          testID="crop-doctor-analyze-btn"
          full
          variant="green"
          icon="sparkles"
          label={analyzing ? "Analyzing..." : `Diagnose ${crop}`}
          loading={analyzing}
          onPress={handleDiagnose}
        />
      </View>

      {diagnosis ? (
        <View testID="crop-doctor-result" style={s.resultCard}>
          <View style={s.resultHeader}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.resultTitle}>{diagnosis.condition}</Text>
              <Text style={s.resultMeta}>
                Severity: {diagnosis.severity || "Moderate"} • {diagnosis.source === "offline_agronomy_fallback" ? "Offline / Fallback Agronomy Guide" : "Gemini Vision AI"}
              </Text>
            </View>
            <View style={s.sevBadge}>
              <Lucide name="shield-alert" size={16} color="#B45309" />
            </View>
          </View>

          <Text style={s.resultSummary}>{diagnosis.summary}</Text>

          {(diagnosis.immediateActions?.length ?? 0) > 0 ? (
            <View style={s.listBlock}>
              <Text style={s.listHeading}>Immediate Field Actions</Text>
              {diagnosis.immediateActions!.map((line, idx) => (
                <Text key={idx} style={s.listItem}>• {line}</Text>
              ))}
            </View>
          ) : null}

          {(diagnosis.organicRemedies?.length ?? 0) > 0 ? (
            <View style={s.listBlock}>
              <Text style={s.listHeading}>Organic & Cultural Control</Text>
              {diagnosis.organicRemedies!.map((line, idx) => (
                <Text key={idx} style={s.listItem}>• {line}</Text>
              ))}
            </View>
          ) : null}

          {(diagnosis.chemicalRemedies?.length ?? 0) > 0 ? (
            <View style={s.listBlock}>
              <Text style={s.listHeading}>Registered Agrochemical Guidance</Text>
              {diagnosis.chemicalRemedies!.map((line, idx) => (
                <Text key={idx} style={s.listItem}>• {line}</Text>
              ))}
            </View>
          ) : null}

          <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
            <Btn
              small
              variant="green"
              label="Shop Inputs"
              onPress={() => router.navigate("/(tabs)/shop")}
              style={{ flex: 1 }}
            />
            <Btn
              small
              variant="outline"
              label="Book Agronomist"
              onPress={() =>
                router.push({
                  pathname: "/service-request",
                  params: { service: `Crop Doctor Follow-Up (${crop})`, category: "Agronomy" },
                })
              }
              style={{ flex: 1 }}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  card: {
    backgroundColor: c.white,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  sectionLabel: { fontFamily: fonts.h700, fontSize: 13, color: c.onSurface },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceSecondary,
  },
  chipText: { fontFamily: fonts.b600, fontSize: 12.5, color: c.onSurface },
  countyRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  gpsBtn: {
    height: 46,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: "#F0FDF4",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  gpsBtnText: { fontFamily: fonts.b700, fontSize: 12, color: c.brandPrimary },
  previewBox: { borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: c.border },
  previewImg: { width: "100%", height: 170, backgroundColor: c.surfaceTertiary },
  previewMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: c.surfaceSecondary,
  },
  previewBadge: { fontFamily: fonts.b700, fontSize: 11.5, color: c.brandPrimary },
  clearLink: { fontFamily: fonts.b700, fontSize: 12 },
  input: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    padding: 12,
    fontFamily: fonts.b500,
    fontSize: 13,
    color: c.onSurface,
    backgroundColor: c.surfaceSecondary,
    textAlignVertical: "top",
  },
  resultCard: {
    backgroundColor: c.white,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  resultHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  resultTitle: { fontFamily: fonts.h800, fontSize: 16.5, color: c.onSurface },
  resultMeta: { fontFamily: fonts.b600, fontSize: 12, color: c.muted },
  sevBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  resultSummary: { fontFamily: fonts.b500, fontSize: 13.5, lineHeight: 20, color: c.onSurface },
  listBlock: { gap: 4, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 8 },
  listHeading: { fontFamily: fonts.h700, fontSize: 13, color: c.brandPrimary },
  listItem: { fontFamily: fonts.b500, fontSize: 12.5, lineHeight: 19, color: c.onSurfaceSecondary },
}));

