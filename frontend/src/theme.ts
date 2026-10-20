// Design tokens extracted from https://www.mqulima.com CSS. Light theme only.
import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#FAFBF9", // site page background
  onSurface: "#0F291E", // headings text
  surfaceSecondary: "#FFFFFF", // cards
  onSurfaceSecondary: "#334155", // slate-700
  surfaceTertiary: "#F1F5F9", // inputs, chips
  onSurfaceTertiary: "#475569", // slate-600 body text
  surfaceInverse: "#0F291E",
  onSurfaceInverse: "#FFFFFF",
  muted: "#64748B", // slate-500

  brand: "#1A5438",
  onBrand: "#FFFFFF",
  brandPrimary: "#16A34A", // green CTA
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#85CC14", // lime pill CTA
  onBrandSecondary: "#0B2117",
  brandTertiary: "#E5F5D0", // pale lime badges
  onBrandTertiary: "#35610D",

  success: "#16A34A",
  onSuccess: "#FFFFFF",
  warning: "#F5A623",
  onWarning: "#FFFFFF",
  error: "#DC2626",
  onError: "#FFFFFF",
  info: "#3B66C4",
  onInfo: "#FFFFFF",

  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  divider: "#F1F5F9",

  // Site-specific accents
  forest: "#0F291E", // dark sections
  forestDeep: "#0B2117",
  forestCard: "#16382B",
  greenDark: "#15803D",
  limeText: "#6EA810",
  mint: "#52B788",
  orange: "#F5A623",
  heroBg: "#F4F8F5",
  subtle: "#94A3B8", // slate-400
  whatsapp: "#25D366",
  aiYellow: "#F5C542",
  white: "#FFFFFF",
  overlay: "rgba(11,33,23,0.9)",
  overlaySoft: "rgba(11,33,23,0.3)",
  scrim: "rgba(0,0,0,0.45)",
  whiteA10: "rgba(255,255,255,0.1)",
  whiteA20: "rgba(255,255,255,0.2)",
  whiteA70: "rgba(255,255,255,0.7)",
  whiteA85: "rgba(255,255,255,0.85)",
  limeA20: "rgba(133,204,20,0.2)",
  limeA30: "rgba(133,204,20,0.3)",
  blackA30: "rgba(0,0,0,0.3)",
};

export type ThemeColors = typeof light;

export const fonts = {
  wordmark: "Lora-700",
  h600: "Outfit-600",
  h700: "Outfit-700",
  h800: "Outfit-800",
  h900: "Outfit-900",
  b400: "Jakarta-400",
  b500: "Jakarta-500",
  b600: "Jakarta-600",
  b700: "Jakarta-700",
  b800: "Jakarta-800",
};

export const radius = { sm: 8, md: 12, lg: 24, xl: 28, xxl: 32, full: 999 };
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const defaultScheme = "light" satisfies ColorScheme;
export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };
export const colors = light;

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}
setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = (system === "light" || system === "dark") && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
