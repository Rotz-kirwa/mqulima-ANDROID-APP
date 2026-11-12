import React from "react";
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { fonts } from "@/src/theme";

type AcademyCtaButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "yellow" | "green";
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Shared Academy action button implementing the yellow standalone /
 * alternating yellow-and-green paired button palette.
 */
export function AcademyCtaButton({
  label,
  onPress,
  variant = "yellow",
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  testID,
  accessibilityLabel,
  style,
}: AcademyCtaButtonProps) {
  const isYellow = variant === "yellow";
  const fg = isYellow ? "#0B2117" : "#FFFFFF";
  const isDisabled = disabled || loading;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        isYellow ? styles.yellow : styles.green,
        fullWidth ? styles.full : styles.pair,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        icon && <Lucide name={icon as any} size={17} color={fg} />
      )}
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 0,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  pair: {
    flex: 1,
    minWidth: 144,
  },
  full: {
    width: "100%",
    minHeight: 52,
  },
  yellow: {
    backgroundColor: "#FACC15",
    borderColor: "#EAB308",
  },
  green: {
    backgroundColor: "#166534",
    borderColor: "#22C55E",
  },
  disabled: {
    opacity: 0.72,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  text: {
    fontFamily: fonts.b800,
    fontSize: 14,
  },
});

