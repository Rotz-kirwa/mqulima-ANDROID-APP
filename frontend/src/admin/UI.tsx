import React from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export function AdminButton({ label, onPress, testID, loading, secondary, danger, icon }: { label: string; onPress: () => void; testID: string; loading?: boolean; secondary?: boolean; danger?: boolean; icon?: string }) {
  const s = useAdminStyles(); const { colors } = useTheme();
  return <Pressable testID={testID} accessibilityRole="button" disabled={loading} accessibilityState={{ disabled: !!loading }} onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondaryButton, danger && s.dangerButton, (pressed || loading) && s.pressed]}>{loading ? <ActivityIndicator color={secondary ? colors.brand : colors.onBrand} /> : <>{icon && <Lucide name={icon as any} size={17} color={secondary ? colors.brand : colors.onBrand} />}<Text style={[s.buttonText, secondary && s.secondaryText]}>{label}</Text></>}</Pressable>;
}

export function StatusBadge({ status, testID }: { status: string; testID: string }) {
  const s = useAdminStyles();
  const bad = ["suspended", "hidden", "Cancelled", "archived"].includes(status);
  const good = ["active", "visible", "published", "Delivered", "Completed", "Resolved", "Paid"].includes(status);
  return <View testID={testID} style={[s.status, good && s.statusGood]}><View style={[s.statusDot, bad && s.badDot, good && s.goodDot]} /><Text style={[s.statusText, bad && s.badText, good && s.goodText]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text></View>;
}

export function AdminHeading({ title, subtitle, back, action }: { title: string; subtitle?: string; back?: boolean; action?: React.ReactNode }) {
  const s = useAdminStyles(); const { colors } = useTheme(); const router = useRouter();
  return <View style={s.heading}><View style={s.headingRow}>{back && <Pressable testID="admin-module-back" accessibilityLabel="Back" onPress={() => router.canGoBack() ? router.back() : router.replace("/admin/manage")} style={s.iconButton}><Lucide name="arrow-left" size={21} color={colors.brand} /></Pressable>}<Text testID="admin-page-title" style={s.h1}>{title}</Text>{action}</View>{subtitle && <Text testID="admin-page-subtitle" style={s.caption}>{subtitle}</Text>}</View>;
}

export function AdminFeedback({ error, retry, empty, description }: { error?: string; retry?: () => void; empty?: string; description?: string }) {
  const s = useAdminStyles(); const { colors } = useTheme();
  return <View testID={error ? "admin-error-state" : "admin-empty-state"} style={s.feedback}><View style={s.feedbackIcon}><Lucide name={error ? "wifi-off" : "inbox"} size={27} color={colors.brand} /></View><Text style={s.h2}>{error ? "Something needs attention" : empty}</Text><Text testID="admin-feedback-message" style={s.body}>{error || description}</Text>{retry && <AdminButton testID="admin-retry" label="Try again" onPress={retry} secondary />}</View>;
}

export function ConfirmSheet({ title, message, open, onCancel, onConfirm, loading }: { title: string; message: string; open: boolean; onCancel: () => void; onConfirm: () => void; loading?: boolean }) {
  const s = useAdminStyles(); const insets = useSafeAreaInsets();
  return <Modal visible={open} transparent animationType="slide" onRequestClose={onCancel}><View style={s.modal} testID="admin-confirm-modal"><Pressable testID="admin-confirm-dismiss" accessibilityLabel="Cancel change" onPress={onCancel} style={s.scrim} /><View style={[s.sheet, { paddingBottom: insets.bottom + 24 }]}><Text testID="admin-confirm-title" style={s.h2}>{title}</Text><Text testID="admin-confirm-description" style={s.body}>{message}</Text><AdminButton testID="admin-confirm-apply" label="Confirm change" loading={loading} onPress={onConfirm} /><AdminButton testID="admin-confirm-cancel" label="Keep as it is" secondary onPress={onCancel} /></View></View></Modal>;
}

export function DetailRows({ values }: { values: [string, string][] }) {
  const s = useAdminStyles();
  return <View style={s.card}>{values.map(([label, value], index) => <View key={label} testID={`admin-detail-${index}`} style={s.detailRow}><Text style={s.eyebrow}>{label}</Text><Text selectable style={s.body}>{value || "Not provided"}</Text></View>)}</View>;
}

export function FilterStrip({ statuses, value, onChange }: { statuses: string[]; value: string; onChange: (value: string) => void }) {
  const s = useAdminStyles();
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>{["all", ...statuses].map(status => <Pressable key={status} testID={`admin-filter-${status.replace(/\s/g, "-").toLowerCase()}`} onPress={() => onChange(status)} accessibilityState={{ selected: value === status }} style={[s.filter, value === status && s.filterActive]}><Text style={[s.filterText, value === status && s.filterActiveText]}>{status === "all" ? "All records" : status.charAt(0).toUpperCase() + status.slice(1)}</Text></Pressable>)}</ScrollView>;
}

export const useAdminStyles = makeStyles(c => ({
  root: { flex: 1, backgroundColor: c.surface }, flex: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 32 },
  heading: { gap: 7, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 18 },
  headingRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  h1: { fontFamily: fonts.h700, fontSize: 28, lineHeight: 34, color: c.onSurface, letterSpacing: -0.6, flex: 1 },
  h2: { fontFamily: fonts.h700, fontSize: 20, lineHeight: 27, color: c.onSurface },
  h3: { fontFamily: fonts.h600, fontSize: 16, lineHeight: 22, color: c.onSurface },
  body: { fontFamily: fonts.b400, fontSize: 13, lineHeight: 22, color: c.onSurfaceSecondary },
  caption: { fontFamily: fonts.b500, fontSize: 11, lineHeight: 18, color: c.muted },
  eyebrow: { fontFamily: fonts.b700, fontSize: 10, color: c.muted, letterSpacing: 0.8, textTransform: "uppercase" },
  card: { backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, borderRadius: 18, padding: 16, gap: 12 },
  button: { minHeight: 50, backgroundColor: c.brand, borderRadius: 13, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  buttonText: { fontFamily: fonts.b700, fontSize: 13, color: c.onBrand },
  secondaryButton: { backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  secondaryText: { color: c.brand }, dangerButton: { backgroundColor: c.error },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  status: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: c.surfaceTertiary, alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7 },
  statusGood: { backgroundColor: c.brandTertiary },
  statusText: { fontFamily: fonts.b600, fontSize: 10, color: c.onSurfaceTertiary },
  statusDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: c.muted },
  badDot: { backgroundColor: c.error }, goodDot: { backgroundColor: c.brand }, badText: { color: c.error }, goodText: { color: c.brand },
  feedback: { padding: 28, alignItems: "center", gap: 16 },
  feedbackIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  modal: { flex: 1, justifyContent: "flex-end" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.scrim },
  sheet: { padding: 24, gap: 18, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: c.surfaceSecondary },
  detailRow: { gap: 5, paddingVertical: 6 },
  filters: { paddingHorizontal: 20, gap: 8, paddingBottom: 16 },
  filter: { minHeight: 44, borderRadius: 24, borderWidth: 1, borderColor: c.border, paddingHorizontal: 15, justifyContent: "center", backgroundColor: c.surfaceSecondary },
  filterActive: { backgroundColor: c.brand, borderColor: c.brand },
  filterText: { fontFamily: fonts.b600, fontSize: 11, color: c.muted },
  filterActiveText: { color: c.onBrand },
  error: { fontFamily: fonts.b600, fontSize: 12, lineHeight: 20, color: c.error },
  divider: { height: 1, backgroundColor: c.border },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
}));