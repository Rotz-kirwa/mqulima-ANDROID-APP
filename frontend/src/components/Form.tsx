import React, { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, TextInputProps, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export const PHONE_RE = /^(\+?254|0)[17]\d{8}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Field({ label, error, testID, ...rest }: TextInputProps & { label: string; error?: string; testID?: string }) {
  const s = useStyles();
  const { colors } = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        testID={testID}
        placeholderTextColor={colors.subtle}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={[s.input, focus && { borderColor: colors.brandPrimary }, !!error && { borderColor: colors.error }, rest.multiline && { minHeight: 110, textAlignVertical: "top", paddingTop: 12 }]}
        {...rest}
      />
      {error ? <Text testID={testID ? `${testID}-error` : undefined} style={s.error}>{error}</Text> : null}
    </View>
  );
}

export function SelectField({ label, value, options, onChange, error, testID, placeholder = "Select" }: { label: string; value: string; options: string[]; onChange: (v: string) => void; error?: string; testID?: string; placeholder?: string }) {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <Pressable testID={testID} onPress={() => setOpen(true)} style={[s.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, !!error && { borderColor: colors.error }]}>
        <Text style={{ fontFamily: fonts.b500, fontSize: 14, color: value ? colors.onSurface : colors.subtle }}>{value || placeholder}</Text>
        <Lucide name="chevron-down" size={18} color={colors.muted} />
      </Pressable>
      {error ? <Text testID={testID ? `${testID}-error` : undefined} style={s.error}>{error}</Text> : null}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: colors.scrim }} onPress={() => setOpen(false)} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>{label}</Text>
          <ScrollView style={{ maxHeight: 420 }}>
            {options.map((o) => (
              <Pressable key={o} testID={`${testID}-option-${o.replace(/\s+/g, "-").toLowerCase()}`} onPress={() => { onChange(o); setOpen(false); }} style={s.option}>
                <Text style={[s.optionText, o === value && { color: colors.brandPrimary, fontFamily: fonts.b700 }]}>{o}</Text>
                {o === value ? <Lucide name="check" size={18} color={colors.brandPrimary} /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

export function SuccessState({ title, text, children, testID }: { title: string; text: string; children?: React.ReactNode; testID?: string }) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View testID={testID} style={{ alignItems: "center", padding: 24, gap: 12 }}>
      <View style={s.successIcon}><Lucide name="circle-check" size={40} color={colors.brandPrimary} /></View>
      <Text style={s.successTitle}>{title}</Text>
      <Text style={s.successText}>{text}</Text>
      <View style={{ gap: 10, alignSelf: "stretch", marginTop: 8 }}>{children}</View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  label: { fontFamily: fonts.b700, fontSize: 13, color: c.onSurface },
  input: { minHeight: 50, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 14, backgroundColor: c.surfaceSecondary, fontFamily: fonts.b500, fontSize: 14, color: c.onSurface },
  error: { fontFamily: fonts.b600, fontSize: 12, color: c.error },
  sheet: { backgroundColor: c.surfaceSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 8 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: 12 },
  sheetTitle: { fontFamily: fonts.h800, fontSize: 18, color: c.onSurface, marginBottom: 8 },
  option: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: c.divider },
  optionText: { fontFamily: fonts.b500, fontSize: 15, color: c.onSurface },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  successTitle: { fontFamily: fonts.h900, fontSize: 24, color: c.onSurface, textAlign: "center" },
  successText: { fontFamily: fonts.b400, fontSize: 14, color: c.onSurfaceTertiary, textAlign: "center", lineHeight: 21 },
}));
