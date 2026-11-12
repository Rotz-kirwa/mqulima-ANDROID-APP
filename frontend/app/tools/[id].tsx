import React, { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lucide } from "@react-native-vector-icons/lucide";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Page, useStackBottom } from "@/src/components/Page";
import { Btn, Body, Chip } from "@/src/components/ui";
import { SelectField } from "@/src/components/Form";
import { ListSkeleton } from "@/src/components/Skeleton";
import { api } from "@/src/services/api";
import { WeatherSymbolBanner, getForecastIconProps } from "@/src/components/tools/WeatherSymbolBanner";
import { counties } from "@/src/data/home";
import { marketFilters, marketPrices, tools, weather } from "@/src/data/tools";
import { fonts, makeStyles, useTheme } from "@/src/theme";

function Weather() {
  const s = useStyles();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [county, setCounty] = useState("Uasin Gishu");
  const [unit, setUnit] = useState<"C" | "F">("C");
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const t = (c: number) => (unit === "C" ? `${Math.round(c)}°` : `${Math.round(c * 1.8 + 32)}°`);

  const q = useQuery({
    queryKey: ["weather", county],
    queryFn: () => api.getWeather(county),
    staleTime: 1000 * 60 * 5,
  });

  const handleForceRefresh = async () => {
    setManualRefreshing(true);
    try {
      const fresh = await api.getWeather(county, true);
      queryClient.setQueryData(["weather", county], fresh);
    } catch {
      await q.refetch();
    } finally {
      setManualRefreshing(false);
    }
  };

  const wxData = q.data;
  const currentTemp = wxData?.current?.temperature_2m ?? weather.temp;
  const conditionLabel = wxData?.conditionLabel ?? weather.condition;
  const humidity = wxData?.current?.relative_humidity_2m ?? 65;
  const wind = wxData?.current?.wind_speed_10m ?? 8;
  const advisory = wxData?.advisory;
  const isFetchingNow = manualRefreshing || q.isFetching;
  const sourceLabel = wxData?.sourceLabel ?? "Open-Meteo Live";
  const observedAt = wxData?.observedAt;
  const soilDepthLabel = wxData?.soilDepthLabel ?? "Root Zone (0-9cm)";

  const weekForecast = wxData?.daily?.map((d: any) => ({
    d: d.dayLabel,
    hi: d.tempMax,
    lo: d.tempMin,
    condition: d.conditionLabel,
    weatherCode: d.weatherCode,
  })) ?? weather.week;

  return (
    <View style={{ gap: 16 }}>
      <SelectField testID="weather-county-select" label="County" value={county} options={counties} onChange={setCounty} />
      <View style={s.wxCard} testID="weather-current">
        <WeatherSymbolBanner
          county={county}
          weatherCode={wxData?.current?.weather_code ?? 2}
          conditionLabel={conditionLabel}
          sunrise={wxData?.daily?.[0]?.sunrise}
          sunset={wxData?.daily?.[0]?.sunset}
          isDayFallback={wxData?.isDay ?? wxData?.current?.is_day}
        />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <Text style={[s.wxLoc, { flex: 1 }]}>{county} County, Kenya</Text>
          {Boolean(advisory?.sprayWindow) && (
            <View style={[s.live, { backgroundColor: advisory.sprayWindow === "IDEAL" ? colors.forest : colors.orange }]}>
              <Text style={s.liveText}>{advisory.sprayWindow === "IDEAL" ? "SPRAY WINDOW OPEN" : "SPRAY RESTRICTED"}</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <Text style={s.wxTemp}>{t(currentTemp)}{unit}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable
              testID="weather-refresh-btn"
              onPress={handleForceRefresh}
              disabled={isFetchingNow}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 0,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceSecondary,
                opacity: isFetchingNow ? 0.6 : 1,
              }}
            >
              <Lucide name="refresh-cw" size={14} color={colors.brandPrimary} />
              <Text style={{ fontFamily: fonts.b700, fontSize: 12, color: colors.brandPrimary }}>
                {isFetchingNow ? "Updating" : "Refresh"}
              </Text>
            </Pressable>
            {(["C", "F"] as const).map((u) => <Chip key={u} testID={`weather-unit-${u}`} label={`°${u}`} active={unit === u} onPress={() => setUnit(u)} />)}
          </View>
        </View>
        <Text style={s.muted}>{conditionLabel} • Wind {wind} km/h • Humidity {humidity}%</Text>
        <Text testID="weather-source-meta" style={[s.muted, { fontSize: 11 }]}>
          Source: {sourceLabel}{observedAt ? ` • Observed ${observedAt}` : ""}
        </Text>
        {Boolean(advisory?.sprayWindowText) && (
          <View style={{ backgroundColor: colors.surfaceSecondary, padding: 10, borderRadius: 12, marginTop: 4 }}>
            <Text style={{ fontFamily: fonts.b500, fontSize: 12, color: colors.onSurfaceSecondary }}>{advisory.sprayWindowText}</Text>
          </View>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {weekForecast.map((d: any, idx: number) => {
          const icon = getForecastIconProps(d.weatherCode ?? 2);
          return (
            <View key={`${d.d}-${idx}`} style={s.day}>
              <Text style={s.muted}>{d.d}</Text>
              <Lucide name={icon.name} size={22} color={icon.color} />
              <Text style={s.dayT}>{t(d.hi)} / {t(d.lo)}</Text>
            </View>
          );
        })}
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
          <Text style={s.hlS}>{soilDepthLabel}</Text>
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

function matchesMarketCategory(category: string, filter: string): boolean {
  if (filter === "All Varieties") return true;
  const cat = category.toLowerCase();
  const f = filter.toLowerCase();
  if (cat === f) return true;
  if (f === "fruits") return cat.includes("fruit");
  if (f === "horticulture") return cat.includes("horticulture") || cat.includes("tuber");
  if (f === "cash") return cat.includes("cash") || cat.includes("input");
  return cat.includes(f);
}

function Markets() {
  const s = useStyles();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("All Varieties");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const q = useQuery({
    queryKey: ["markets"],
    queryFn: () => api.getMarketPrices(),
    staleTime: 1000 * 60 * 5,
  });

  const handleForceRefresh = async () => {
    setManualRefreshing(true);
    try {
      const fresh = await api.getMarketPrices(true);
      if (fresh.length > 0) queryClient.setQueryData(["markets"], fresh);
    } catch {
      await q.refetch();
    } finally {
      setManualRefreshing(false);
    }
  };

  const rawList = q.data && q.data.length > 0 ? q.data : marketPrices;
  const searchTerm = search.trim().toLowerCase();
  const filtered = rawList.filter((m: any) => {
    const catOk = matchesMarketCategory(String(m.category ?? m.type ?? ""), filter);
    if (!catOk) return false;
    if (!searchTerm) return true;
    const nameMatch = String(m.name ?? "").toLowerCase().includes(searchTerm);
    const hubMatch = String(m.market ?? "").toLowerCase().includes(searchTerm);
    const entryMatch = Array.isArray(m.entries)
      ? m.entries.some((e: any) => String(e.region ?? "").toLowerCase().includes(searchTerm))
      : false;
    return nameMatch || hubMatch || entryMatch;
  });

  const isUpdating = manualRefreshing || q.isFetching;

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            height: 46,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 0,
            backgroundColor: colors.surfaceSecondary,
          }}
        >
          <Lucide name="search" size={16} color={colors.subtle} />
          <TextInput
            testID="markets-search-input"
            placeholder="Search commodity or hub..."
            placeholderTextColor={colors.subtle}
            value={search}
            onChangeText={setSearch}
            style={{
              flex: 1,
              fontFamily: fonts.b500,
              fontSize: 13,
              color: colors.onSurface,
              paddingVertical: 0,
            }}
          />
          {Boolean(search) && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Lucide name="x" size={15} color={colors.muted} />
            </Pressable>
          )}
        </View>
        <Pressable
          testID="markets-refresh-btn"
          onPress={handleForceRefresh}
          disabled={isUpdating}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 12,
            height: 46,
            borderRadius: 0,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surfaceSecondary,
            opacity: isUpdating ? 0.6 : 1,
          }}
        >
          <Lucide name="refresh-cw" size={14} color={colors.brandPrimary} />
          <Text style={{ fontFamily: fonts.b700, fontSize: 12, color: colors.brandPrimary }}>
            {isUpdating ? "Syncing" : "Refresh"}
          </Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {marketFilters.map((f) => (
          <Pressable
            key={f}
            testID={`markets-filter-${f}`}
            onPress={() => setFilter(f)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 0,
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

      <Text testID="markets-summary-count" style={[s.muted, { fontSize: 11 }]}>
        {filtered.length} {filtered.length === 1 ? "commodity" : "commodities"} • KAMIS Kenya Market Feed
      </Text>

      {q.isLoading && !q.data ? (
        <ListSkeleton count={5} />
      ) : filtered.length === 0 ? (
        <View style={[s.mRow, { justifyContent: "center", paddingVertical: 24 }]}>
          <Text style={s.muted}>No commodities match "{search || filter}".</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {filtered.map((item: any, i: number) => {
            const rowKey = String(item.id ?? `${item.name}-${i}`);
            const emoji = item.emoji ?? item.icon ?? "🌾";
            const hubLabel = item.market ?? item.entries?.[0]?.region ?? "Kenya Avg";
            const unitLabel = item.unit ?? "kg";
            const priceVal = Number(item.price ?? item.avgPrice ?? item.entries?.[0]?.price ?? 0);
            const changeVal = Number(item.change ?? item.changePercent ?? 0);
            const entries = Array.isArray(item.entries) ? item.entries : [];
            const isExpanded = expandedId === rowKey;

            return (
              <Pressable
                key={rowKey}
                testID={`market-item-${i}`}
                onPress={() => entries.length > 0 && setExpandedId(isExpanded ? null : rowKey)}
                style={[s.mRow, { flexDirection: "column", alignItems: "stretch", gap: 8 }]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Text style={{ fontSize: 24 }}>{emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.mName}>{item.name}</Text>
                    <Text style={s.muted}>{hubLabel} · per {unitLabel}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[s.mPrice, { color: colors.brandPrimary }]}>
                      KES {priceVal.toLocaleString("en-US")}
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: fonts.b600, color: changeVal >= 0 ? colors.brandPrimary : colors.error }}>
                      {changeVal >= 0 ? `+${changeVal}%` : `${changeVal}%`}
                    </Text>
                  </View>
                </View>
                {isExpanded && entries.length > 0 && (
                  <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, gap: 6 }}>
                    {entries.map((e: any, eIdx: number) => (
                      <View key={`${e.region}-${eIdx}`} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={[s.muted, { fontSize: 12 }]}>{e.region}</Text>
                        <Text style={{ fontFamily: fonts.b700, fontSize: 12, color: colors.onSurface }}>
                          KES {Number(e.price ?? 0).toLocaleString("en-US")}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      )}
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
  const queryClient = useQueryClient();
  const tool = tools.find((t) => t.id === id);
  const [refreshing, setRefreshing] = useState(false);
  const body = { weather: <Weather />, markets: <Markets />, "weather-advisory": <Advisory /> }[id ?? ""];

  const handlePullRefresh = async () => {
    setRefreshing(true);
    try {
      if (id === "weather") {
        await queryClient.refetchQueries({ queryKey: ["weather"] });
      } else if (id === "markets") {
        await queryClient.refetchQueries({ queryKey: ["markets"] });
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Page title={tool?.title ?? "Tool"} testID={`tool-screen-${id}`}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: bottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handlePullRefresh} tintColor={colors.brandPrimary} colors={[colors.brandPrimary]} />}
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
}));
