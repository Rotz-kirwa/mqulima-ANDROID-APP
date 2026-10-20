import React from "react";
import { Pressable, Text, View, StyleProp, ViewStyle, ActivityIndicator, TextStyle } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Image } from "@/src/components/Img";
import { fonts, makeStyles, useTheme } from "@/src/theme";

type BtnVariant = "lime" | "green" | "orange" | "ghostDark" | "outline";

export function Btn({
  label, onPress, variant = "lime", icon = "arrow-right", testID, style, loading, full, small,
}: {
  label: string; onPress?: () => void; variant?: BtnVariant; icon?: string | null; testID?: string;
  style?: StyleProp<ViewStyle>; loading?: boolean; full?: boolean; small?: boolean;
}) {
  const { colors } = useTheme();
  const map = {
    lime: { bg: colors.brandSecondary, fg: colors.onBrandSecondary, bd: colors.brandSecondary },
    green: { bg: colors.brandPrimary, fg: colors.white, bd: colors.brandPrimary },
    orange: { bg: colors.orange, fg: colors.white, bd: colors.orange },
    ghostDark: { bg: colors.whiteA10, fg: colors.white, bd: colors.whiteA20 },
    outline: { bg: colors.surfaceSecondary, fg: colors.onSurface, bd: colors.border },
  }[variant];
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        {
          minHeight: small ? 40 : 48, paddingHorizontal: small ? 16 : 22, borderRadius: 999, flexDirection: "row",
          alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: map.bg, borderWidth: 1, borderColor: map.bd,
          alignSelf: full ? "stretch" : "flex-start", transform: [{ scale: pressed ? 0.97 : 1 }], opacity: pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={map.fg} />
      ) : (
        <>
          <Text style={{ color: map.fg, fontFamily: fonts.b700, fontSize: small ? 12 : 13 }}>{label}</Text>
          {icon ? <Lucide name={icon as any} size={16} color={map.fg} /> : null}
        </>
      )}
    </Pressable>
  );
}

export function Pill({ label, dark, testID }: { label: string; dark?: boolean; testID?: string }) {
  const s = usePillStyles();
  return (
    <View testID={testID} style={[s.pill, dark && s.pillDark]}>
      <Text style={[s.text, dark && s.textDark]}>{label}</Text>
    </View>
  );
}
const usePillStyles = makeStyles((c) => ({
  pill: { alignSelf: "flex-start", backgroundColor: c.brandTertiary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 4 },
  pillDark: { backgroundColor: c.limeA20, borderWidth: 1, borderColor: c.limeA30 },
  text: { color: c.onBrandTertiary, fontFamily: fonts.b800, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase" },
  textDark: { color: c.brandSecondary },
}));

export function SectionTitle({
  badge, title, highlight, dark, style, size = 30,
}: { badge?: string; title: string; highlight?: string; dark?: boolean; style?: StyleProp<ViewStyle>; size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={[{ gap: 10 }, style]}>
      {badge ? <Pill label={badge} dark={dark} /> : null}
      <Text style={{ fontFamily: fonts.h900, fontSize: size, lineHeight: size * 1.15, color: dark ? colors.white : colors.onSurface, letterSpacing: -0.5 }}>
        {title}
        {highlight ? <Text style={{ color: dark ? colors.brandSecondary : colors.limeText }}>{` ${highlight}`}</Text> : null}
      </Text>
    </View>
  );
}

export function Body({ children, style, dark }: { children: React.ReactNode; style?: StyleProp<TextStyle>; dark?: boolean }) {
  const { colors } = useTheme();
  return <Text style={[{ fontFamily: fonts.b400, fontSize: 14, lineHeight: 22, color: dark ? colors.whiteA85 : colors.onSurfaceTertiary }, style]}>{children}</Text>;
}

export function Avatar({ uri, size = 40 }: { uri: string; size?: number }) {
  const { colors } = useTheme();
  return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.brand }} transition={200} />;
}

export function Chip({ label, active, onPress, testID }: { label: string; active: boolean; onPress: () => void; testID?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={{
        height: 36, flexShrink: 0, paddingHorizontal: 14, borderRadius: 999, justifyContent: "center", borderWidth: 1,
        backgroundColor: active ? colors.forest : colors.surfaceSecondary, borderColor: active ? colors.forest : colors.border,
      }}
    >
      <Text style={{ fontFamily: fonts.b700, fontSize: 12, color: active ? colors.white : colors.onSurfaceSecondary }}>{label}</Text>
    </Pressable>
  );
}
