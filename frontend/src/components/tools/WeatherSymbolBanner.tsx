import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, G, Line, Path, Rect } from "react-native-svg";
import { Lucide } from "@react-native-vector-icons/lucide";
import { fonts } from "@/src/theme";

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;

type SkyKind = "clear" | "mainly-clear" | "partly" | "overcast" | "fog" | "drizzle" | "rain" | "showers" | "storm";

function classifyWmo(code: number): SkyKind {
  if (code === 0) return "clear";
  if (code === 1) return "mainly-clear";
  if (code === 2) return "partly";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 55) return "drizzle";
  if (code >= 61 && code <= 67) return "rain";
  if (code >= 80 && code <= 82) return "showers";
  if (code >= 95) return "storm";
  return "partly";
}

function getKenyaNow() {
  const iso = new Date(Date.now() + EAT_OFFSET_MS).toISOString();
  return {
    localDateTime: iso.substring(0, 16), // YYYY-MM-DDTHH:MM
    clock: `${iso.substring(11, 16)} EAT`,
    hour: parseInt(iso.substring(11, 13), 10),
  };
}

function resolveIsDay(
  sunrise?: string,
  sunset?: string,
  fallbackIsDay?: boolean | number
): { isDay: boolean; localClock: string } {
  const { localDateTime, clock, hour } = getKenyaNow();
  if (sunrise && sunset && sunrise.length >= 16 && sunset.length >= 16) {
    const today = localDateTime.substring(0, 10);
    const rise = `${today}T${sunrise.substring(11, 16)}`;
    const set = `${today}T${sunset.substring(11, 16)}`;
    return { isDay: localDateTime >= rise && localDateTime < set, localClock: clock };
  }
  if (typeof fallbackIsDay === "number") {
    return { isDay: fallbackIsDay === 1, localClock: clock };
  }
  if (typeof fallbackIsDay === "boolean") {
    return { isDay: fallbackIsDay, localClock: clock };
  }
  return { isDay: hour >= 6 && hour < 19, localClock: clock };
}

function getSkyPalette(kind: SkyKind, isDay: boolean): [string, string, string] {
  if (kind === "storm") return ["#0F172A", "#1E1B4B", "#312E81"];
  if (!isDay) {
    if (kind === "clear" || kind === "mainly-clear") return ["#050B1E", "#0E1F47", "#1D3C78"];
    if (kind === "rain" || kind === "drizzle" || kind === "showers") return ["#081126", "#112954", "#1D4ED8"];
    return ["#0B1324", "#1E293B", "#334155"];
  }
  if (kind === "clear" || kind === "mainly-clear") return ["#0369A1", "#0284C7", "#38BDF8"];
  if (kind === "partly" || kind === "showers") return ["#1D4ED8", "#2563EB", "#60A5FA"];
  if (kind === "rain" || kind === "drizzle") return ["#1E3A5F", "#1D4ED8", "#3B82F6"];
  return ["#475569", "#64748B", "#94A3B8"];
}

export function getForecastIconProps(code: number): {
  name: "sun" | "cloud-sun" | "cloud" | "cloud-fog" | "cloud-drizzle" | "cloud-rain" | "cloud-lightning";
  color: string;
} {
  const kind = classifyWmo(code);
  if (kind === "clear") return { name: "sun", color: "#F59E0B" };
  if (kind === "mainly-clear" || kind === "partly") return { name: "cloud-sun", color: "#EA580C" };
  if (kind === "overcast") return { name: "cloud", color: "#64748B" };
  if (kind === "fog") return { name: "cloud-fog", color: "#64748B" };
  if (kind === "drizzle") return { name: "cloud-drizzle", color: "#0284C7" };
  if (kind === "rain" || kind === "showers") return { name: "cloud-rain", color: "#2563EB" };
  return { name: "cloud-lightning", color: "#D97706" };
}

function WeatherGlyphSvg({ kind, isDay }: { kind: SkyKind; isDay: boolean }) {
  const showCelestial = kind !== "overcast" && kind !== "fog" && kind !== "rain" && kind !== "storm";
  const showCloud = kind !== "clear";
  const isSmallCloud = kind === "mainly-clear";
  const showDrizzle = kind === "drizzle";
  const showRain = kind === "rain" || kind === "showers" || kind === "storm";
  const showFog = kind === "fog";
  const showLightning = kind === "storm";

  const cloudFill = isDay
    ? kind === "overcast" || kind === "rain"
      ? "#E2E8F0"
      : "#FFFFFF"
    : "#334155";
  const cloudStroke = isDay ? "rgba(255,255,255,0.9)" : "#94A3B8";

  // Position sun/moon center depending on whether a cloud overlaps
  const cx = kind === "clear" ? 60 : isSmallCloud ? 50 : 42;
  const cy = kind === "clear" ? 56 : 42;
  const r = kind === "clear" ? 26 : 20;

  return (
    <Svg width={116} height={116} viewBox="0 0 120 120">
      {showCelestial && isDay && (
        <G>
          <Circle cx={cx} cy={cy} r={r + 10} fill="rgba(253, 224, 71, 0.24)" />
          <Circle cx={cx} cy={cy} r={r} fill="#FACC15" />
          <Circle cx={cx - 4} cy={cy - 4} r={r * 0.65} fill="#FEF08A" opacity={0.55} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const inner = r + 5;
            const outer = r + 12;
            return (
              <Line
                key={deg}
                x1={cx + Math.cos(rad) * inner}
                y1={cy + Math.sin(rad) * inner}
                x2={cx + Math.cos(rad) * outer}
                y2={cy + Math.sin(rad) * outer}
                stroke="#FDE047"
                strokeWidth={3}
                strokeLinecap="round"
              />
            );
          })}
        </G>
      )}

      {showCelestial && !isDay && (
        <G>
          {/* Stars */}
          <Circle cx={cx - 26} cy={cy - 18} r={2} fill="#FEF08A" />
          <Circle cx={cx + 30} cy={cy - 22} r={2.4} fill="#E0F2FE" />
          <Circle cx={cx + 36} cy={cy + 6} r={1.8} fill="#FEF08A" />
          <Circle cx={cx - 24} cy={cy + 20} r={1.6} fill="#BFDBFE" />
          {/* Night aura & crisp crescent moon */}
          <Circle cx={cx} cy={cy} r={r + 8} fill="rgba(254, 240, 138, 0.14)" />
          <Path
            d={
              kind === "clear"
                ? "M66 30 C52 31 41 42 41 56 C41 71 53 83 68 83 C75 83 82 80 86 75 C75 76 64 67 64 55 C64 44 71 35 80 31 C76 30 71 30 66 30 Z"
                : "M52 22 C40 23 31 33 31 45 C31 57 41 67 53 67 C59 67 65 65 69 60 C59 61 50 54 50 44 C50 35 56 27 64 24 C60 22 56 22 52 22 Z"
            }
            fill="#FEF08A"
          />
        </G>
      )}

      {showCloud && (
        <G
          transform={
            isSmallCloud ? "translate(32, 34) scale(0.62)" : showDrizzle || showRain || showFog || showLightning ? "translate(6, 2) scale(0.95)" : "translate(6, 10) scale(0.96)"
          }
        >
          <Path
            d="M28 76 H90 C99 76 105 69 105 61 C105 53 99 46 91 45 C88 32 76 23 62 23 C48 23 36 33 34 46 C25 47 18 54 18 62 C18 70 22 76 28 76 Z"
            fill={cloudFill}
            stroke={cloudStroke}
            strokeWidth={2}
          />
        </G>
      )}

      {showDrizzle && (
        <G>
          {[38, 56, 74].map((x, i) => (
            <Circle key={x} cx={x} cy={90 + (i % 2) * 6} r={3} fill="#7DD3FC" />
          ))}
        </G>
      )}

      {showRain && (
        <G>
          {[36, 54, 72, 88].map((x, i) => (
            <Line
              key={x}
              x1={x}
              y1={82 + (i % 2) * 4}
              x2={x - 5}
              y2={98 + (i % 2) * 4}
              stroke="#60A5FA"
              strokeWidth={3.2}
              strokeLinecap="round"
            />
          ))}
        </G>
      )}

      {showFog && (
        <G>
          <Rect x={24} y={84} width={72} height={4} rx={2} fill="#CBD5E1" opacity={0.85} />
          <Rect x={32} y={94} width={58} height={4} rx={2} fill="#CBD5E1" opacity={0.65} />
        </G>
      )}

      {showLightning && (
        <Path
          d="M64 68 L54 88 H65 L59 106 L78 82 H66 L72 68 Z"
          fill="#FACC15"
          stroke="#FEF08A"
          strokeWidth={1}
        />
      )}
    </Svg>
  );
}

type WeatherSymbolBannerProps = {
  county: string;
  weatherCode: number;
  conditionLabel: string;
  sunrise?: string;
  sunset?: string;
  isDayFallback?: boolean | number;
};

export function WeatherSymbolBanner({
  county,
  weatherCode,
  conditionLabel,
  sunrise,
  sunset,
  isDayFallback,
}: WeatherSymbolBannerProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const kind = classifyWmo(weatherCode);
  const { isDay, localClock } = resolveIsDay(sunrise, sunset, isDayFallback);
  const palette = getSkyPalette(kind, isDay);
  const riseTime = sunrise && sunrise.length >= 16 ? sunrise.substring(11, 16) : null;
  const setTime = sunset && sunset.length >= 16 ? sunset.substring(11, 16) : null;

  return (
    <View style={styles.wrap} testID="weather-symbol-banner">
      <LinearGradient colors={palette} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
        <View style={styles.symbolBox}>
          <WeatherGlyphSvg kind={kind} isDay={isDay} />
        </View>
        <View style={styles.metaCol}>
          <View style={styles.timePill}>
            <Lucide name={isDay ? "sun" : "moon"} size={12} color="#FDE047" />
            <Text style={styles.timeText}>
              {isDay ? "DAYLIGHT" : "NIGHT SKY"} • {localClock}
            </Text>
          </View>
          <Text numberOfLines={2} style={styles.conditionTitle}>
            {conditionLabel}
          </Text>
          <Text numberOfLines={1} style={styles.countySub}>
            {county} County{riseTime && setTime ? ` • ${riseTime}–${setTime}` : ""}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    height: 152,
    borderRadius: 0,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
  },
  symbolBox: {
    width: 116,
    height: 116,
    alignItems: "center",
    justifyContent: "center",
  },
  metaCol: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  timePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 0,
  },
  timeText: {
    fontFamily: fonts.b700,
    fontSize: 10,
    letterSpacing: 0.8,
    color: "#FEF08A",
  },
  conditionTitle: {
    fontFamily: fonts.h800,
    fontSize: 21,
    lineHeight: 25,
    color: "#FFFFFF",
  },
  countySub: {
    fontFamily: fonts.b500,
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
  },
});
