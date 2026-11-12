import React from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, G, Path, Rect, Text as SvgText } from "react-native-svg";
import { Lucide } from "@react-native-vector-icons/lucide";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export type CheckoutPaymentMethod =
  | "mpesa"
  | "airtel"
  | "visa"
  | "mastercard"
  | "manual";

type TileConfig = {
  id: Exclude<CheckoutPaymentMethod, "manual">;
  label: string;
  accent: string;
  footerTextColor?: string;
  renderLogo: () => React.ReactNode;
};

function MpesaSvgLogo() {
  return (
    <Svg width={128} height={42} viewBox="0 0 128 42">
      {/* Subtle Lipa Na eyebrow */}
      <SvgText
        x="64"
        y="10"
        textAnchor="middle"
        fill="#64748B"
        fontSize="7"
        fontWeight="700"
        letterSpacing="1.6"
      >
        LIPA NA
      </SvgText>
      {/* M- wordmark */}
      <SvgText
        x="40"
        y="31"
        textAnchor="end"
        fill="#00A859"
        fontSize="20"
        fontWeight="900"
        letterSpacing="-0.5"
      >
        M-
      </SvgText>
      {/* Signature Safaricom red banknote / wireless emblem */}
      <G transform="translate(43, 14) skewX(-12)">
        <Rect x="0" y="0" width="13" height="18" rx="2.5" fill="#E60000" />
        <Rect x="2.5" y="3.5" width="8" height="3" rx="1" fill="#FFFFFF" opacity={0.92} />
        <Circle cx="6.5" cy="11.5" r="2.2" fill="#FFFFFF" opacity={0.92} />
      </G>
      {/* PESA wordmark */}
      <SvgText
        x="58"
        y="31"
        textAnchor="start"
        fill="#00A859"
        fontSize="20"
        fontWeight="900"
        letterSpacing="-0.5"
      >
        PESA
      </SvgText>
    </Svg>
  );
}

function AirtelMoneySvgLogo() {
  return (
    <Svg width={128} height={42} viewBox="0 0 128 42">
      {/* Airtel crimson circular wave badge */}
      <Circle cx="34" cy="17" r="10.5" fill="#ED1C24" />
      <Path
        d="M36.5 11.5C32.2 11.5 29 14.3 29 17.5C29 20.1 31.1 22 33.7 22C36 22 37.9 20.5 38.4 18.6C38.7 17.5 38 16.5 37 16.5C35.8 16.5 35.1 17.6 34.1 17.6C33.1 17.6 32.5 16.9 32.6 15.9C32.8 14.4 34.4 13.5 36.2 13.7C37.2 13.8 38 13.2 38 12.4C38 11.8 37.4 11.5 36.5 11.5Z"
        fill="#FFFFFF"
      />
      <SvgText
        x="49"
        y="22"
        fill="#ED1C24"
        fontSize="17"
        fontWeight="900"
        letterSpacing="-0.3"
      >
        airtel
      </SvgText>
      <SvgText
        x="72"
        y="34"
        textAnchor="middle"
        fill="#475569"
        fontSize="7.5"
        fontWeight="800"
        letterSpacing="2.2"
      >
        MONEY
      </SvgText>
    </Svg>
  );
}

function VisaSvgLogo() {
  return (
    <Svg width={116} height={42} viewBox="0 0 116 42">
      {/* Decorative blue card hairline bars */}
      <Rect x="22" y="6" width="72" height="2" rx="1" fill="#1A1F71" opacity={0.18} />
      {/* Gold left wing tip matching classic Visa 'V' mark */}
      <Path d="M25 13H34.5L38 22.5L32.8 22.5L25 13Z" fill="#F7B600" />
      <SvgText
        x="61"
        y="29"
        textAnchor="middle"
        fill="#1A1F71"
        fontSize="24"
        fontWeight="900"
        fontStyle="italic"
        letterSpacing="-1"
      >
        VISA
      </SvgText>
      <Rect x="22" y="34" width="72" height="2" rx="1" fill="#F7B600" opacity={0.75} />
    </Svg>
  );
}

function MastercardSvgLogo() {
  return (
    <Svg width={124} height={42} viewBox="0 0 124 42">
      {/* Left Crimson Circle */}
      <Circle cx="52" cy="16.5" r="11" fill="#EB001B" />
      {/* Right Amber Circle */}
      <Circle cx="72" cy="16.5" r="11" fill="#F79E1B" opacity={0.94} />
      {/* Precision Interlocking Overlap */}
      <Path
        d="M62 7.8C64.9 10 66.8 13 66.8 16.5C66.8 20 64.9 23 62 25.2C59.1 23 57.2 20 57.2 16.5C57.2 13 59.1 10 62 7.8Z"
        fill="#FF5F00"
      />
      <SvgText
        x="62"
        y="37"
        textAnchor="middle"
        fill="#334155"
        fontSize="8.5"
        fontWeight="800"
        letterSpacing="0.4"
      >
        mastercard
      </SvgText>
    </Svg>
  );
}

const SECTIONS: { title: string; tiles: TileConfig[] }[] = [
  {
    title: "Mobile Payments",
    tiles: [
      { id: "mpesa", label: "M-Pesa", accent: "#00A859", renderLogo: () => <MpesaSvgLogo /> },
      { id: "airtel", label: "Airtel Money", accent: "#ED1C24", renderLogo: () => <AirtelMoneySvgLogo /> },
    ],
  },
  {
    title: "Cards",
    tiles: [
      { id: "visa", label: "Visa", accent: "#1A1F71", renderLogo: () => <VisaSvgLogo /> },
      { id: "mastercard", label: "Mastercard", accent: "#EB001B", renderLogo: () => <MastercardSvgLogo /> },
    ],
  },
];

export function PaymentMethodSelector({
  value,
  onChange,
  phonePreview,
}: {
  value: CheckoutPaymentMethod;
  onChange: (method: CheckoutPaymentMethod) => void;
  phonePreview?: string;
}) {
  const s = useStyles();
  const { colors } = useTheme();

  return (
    <View style={s.card}>
      {/* Header Row matching Website */}
      <View style={s.headerRow}>
        <View style={s.headerLeft}>
          <View style={s.headerIconBox}>
            <Lucide name="credit-card" size={16} color="#16A34A" />
          </View>
          <Text style={s.headerTitle}>Payment Method</Text>
        </View>
        <View style={s.unifiedBadge}>
          <Lucide name="shield-check" size={12} color="#1D4ED8" />
          <Text style={s.unifiedBadgeText}>Secured Checkout</Text>
        </View>
      </View>

      {/* Info Banner */}
      <View style={s.infoStrip}>
        <Text style={s.infoText}>
          {value === "mpesa"
            ? `Pay seamlessly with Paystack M-Pesa${phonePreview?.trim() ? ` (${phonePreview.trim()})` : ""}.`
            : value === "airtel"
            ? "Pay seamlessly with Airtel Money powered by Paystack."
            : value === "manual"
            ? "Pay cash or M-Pesa upon physical inspection when your order arrives."
            : "Complete encrypted Visa or Mastercard checkout securely via Paystack."}
        </Text>
      </View>

      {/* 2 Category Sections with Brand Tiles */}
      <View style={{ gap: 12 }}>
        {SECTIONS.map((sec) => (
          <View key={sec.title} style={{ gap: 7 }}>
            <View style={s.catHeaderBar}>
              <Text style={s.catHeaderText}>{sec.title}</Text>
            </View>
            <View style={s.gridRow}>
              {sec.tiles.map((tile) => {
                const selected = value === tile.id;
                return (
                  <Pressable
                    key={tile.id}
                    testID={`payment-method-${tile.id}`}
                    onPress={() => onChange(tile.id)}
                    style={({ pressed }) => [
                      s.tile,
                      selected && {
                        borderColor: tile.accent,
                        borderWidth: 2,
                        shadowColor: tile.accent,
                        shadowOpacity: 0.18,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 3 },
                        elevation: 4,
                      },
                      pressed && { transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <View style={s.logoArea}>
                      {selected ? (
                        <View style={[s.checkCorner, { backgroundColor: tile.accent }]}>
                          <Lucide name="check" size={11} color="#FFFFFF" />
                        </View>
                      ) : null}
                      {tile.renderLogo()}
                    </View>
                    <View
                      style={[
                        s.tileFooter,
                        { backgroundColor: selected ? tile.accent : "#457B9D" },
                      ]}
                    >
                      <Text
                        style={[
                          s.tileFooterText,
                          selected && tile.footerTextColor ? { color: tile.footerTextColor } : null,
                        ]}
                      >
                        {tile.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      {/* Clean Pay on Delivery secondary row */}
      <Pressable
        testID="payment-method-manual"
        onPress={() => onChange("manual")}
        style={({ pressed }) => [
          s.manualRow,
          value === "manual" && s.manualRowActive,
          pressed && { opacity: 0.9 },
        ]}
      >
        <View style={[s.manualIconBox, value === "manual" && { backgroundColor: "#EA580C" }]}>
          <Lucide name="truck" size={16} color={value === "manual" ? "#FFFFFF" : "#EA580C"} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.manualTitle}>Pay on Delivery / Counter Cash</Text>
          <Text style={s.manualSub}>Pay when inputs arrive at your location</Text>
        </View>
        <View style={[s.radioOuter, value === "manual" && { borderColor: colors.brandPrimary }]}>
          {value === "manual" ? <View style={s.radioInner} /> : null}
        </View>
      </Pressable>
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
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 9 },
  headerIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#F0FAF4",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: fonts.h800,
    fontSize: 13.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: c.onSurface,
  },
  unifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  unifiedBadgeText: { fontFamily: fonts.b700, fontSize: 10, color: "#1D4ED8" },

  infoStrip: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  infoText: { fontFamily: fonts.b500, fontSize: 11.5, color: c.onSurfaceSecondary, lineHeight: 16 },

  catHeaderBar: {
    backgroundColor: "#DCE5EC",
    borderRadius: 7,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  catHeaderText: {
    fontFamily: fonts.b800,
    fontSize: 10.5,
    color: "#4A6572",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  gridRow: { flexDirection: "row", gap: 10 },
  tile: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: c.border,
    backgroundColor: c.white,
  },
  logoArea: {
    height: 62,
    backgroundColor: c.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    position: "relative",
  },
  checkCorner: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  tileFooter: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tileFooterText: { fontFamily: fonts.b700, fontSize: 11.5, color: c.white },

  manualRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: c.border,
    borderRadius: 14,
    padding: 11,
    backgroundColor: "#FAFAFA",
  },
  manualRowActive: {
    borderColor: c.brandPrimary,
    backgroundColor: "#F0FDF4",
  },
  manualIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
  },
  manualTitle: { fontFamily: fonts.h700, fontSize: 13, color: c.onSurface },
  manualSub: { fontFamily: fonts.b500, fontSize: 11, color: c.muted },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: c.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.brandPrimary },
}));

