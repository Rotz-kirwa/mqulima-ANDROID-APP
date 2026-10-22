import React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { Logo } from "@/src/components/Logo";

export const topics = [
  { value: "", label: "All topics", icon: "layout-grid" },
  { value: "Question", label: "Questions", icon: "circle-help" },
  { value: "Farming Tips", label: "Farming tips", icon: "lightbulb" },
  { value: "Farm Progress", label: "Farm updates", icon: "sprout" },
  { value: "Harvest Update", label: "Harvests", icon: "wheat" },
  { value: "Success Story", label: "Success stories", icon: "trophy" },
] as const;

export function timeAgo(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return value;
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  if (minutes < 10080) return `${Math.floor(minutes / 1440)}d ago`;
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(new Date(value).getFullYear() !== new Date().getFullYear() ? { year: "numeric" as const } : {}) });
}

export function FarmerAvatar({ name, size = 38, testID }: { name: string; size?: number; testID: string }) {
  const s = useStyles();
  const initials = name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join("").toUpperCase();
  return <View testID={testID} accessibilityLabel={name} style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}><Text style={[s.initials, { fontSize: size * 0.34 }]}>{initials || "M"}</Text></View>;
}

export function TopicBadge({ tag, resolved, testID }: { tag: string; resolved?: boolean; testID: string }) {
  const s = useStyles();
  const { colors } = useTheme();
  const topic = topics.find(t => t.value === tag);
  return <View testID={testID} style={[s.badge, resolved && s.resolved]}><Lucide name={resolved ? "circle-check" : (topic?.icon ?? "messages-square")} size={13} color={resolved ? colors.brand : colors.onBrandTertiary} /><Text style={s.badgeText}>{resolved ? "Resolved" : topic?.label ?? tag}</Text></View>;
}

export function ForumToolbar({ title, onInfo, onBack, right }: { title?: string; onInfo?: () => void; onBack?: () => void; right?: React.ReactNode }) {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return <View testID="forum-toolbar" style={[s.toolbar, { paddingTop: insets.top + 8 }]}>
    {title ? <Pressable testID="forum-back" accessibilityLabel="Back to forum" onPress={onBack ?? (() => router.canGoBack() ? router.back() : router.replace("/(tabs)/forum"))} style={s.iconButton}><Lucide name="arrow-left" size={22} color={colors.onSurface} /></Pressable> : <Logo size={32} />}
    <View style={s.toolbarText}><Text testID="forum-toolbar-title" style={title ? s.screenTitle : s.wordmark}>{title ?? "Mqulima"}</Text>{!title && <Text testID="forum-toolbar-label" style={s.toolbarLabel}>THE FARMERS’ COMMUNITY</Text>}</View>
    {right}
    {onInfo && <Pressable testID="forum-guidelines-button" accessibilityLabel="Community guidelines" onPress={onInfo} style={s.iconButton}><Lucide name="info" size={21} color={colors.brand} /></Pressable>}
  </View>;
}

export function ForumState({ icon = "messages-square", title, description, action, onPress, testID }: { icon?: string; title: string; description: string; action?: string; onPress?: () => void; testID: string }) {
  const s = useStyles();
  const { colors } = useTheme();
  return <View testID={testID} style={s.state}><View style={s.stateIcon}><Lucide name={icon as any} size={26} color={colors.brand} /></View><Text testID={`${testID}-title`} style={s.stateTitle}>{title}</Text><Text testID={`${testID}-description`} style={s.stateText}>{description}</Text>{action && <Pressable testID={`${testID}-action`} onPress={onPress} style={({ pressed }) => [s.stateAction, pressed && s.pressed]}><Text style={s.stateActionText}>{action}</Text><Lucide name="arrow-right" size={16} color={colors.onBrand} /></Pressable>}</View>;
}

export function Guidelines({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const rules = [
    ["heart-handshake", "Be kind. We’re growing together.", "Respect other farmers, their experience, and their questions."],
    ["sprout", "Share what you know", "Add your crop, location, and growing conditions so advice has context."],
    ["shield-check", "Keep the community safe", "No spam or personal attacks. Never share private contact or payment details."],
    ["stethoscope", "Check before you act", "Community advice is not a substitute for a qualified agronomist or veterinarian."],
  ];
  return <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}><View style={s.modalRoot} testID="forum-guidelines-modal"><Pressable testID="forum-guidelines-dismiss" accessibilityLabel="Close guidelines" style={s.scrim} onPress={onClose} /><View style={[s.sheet, { paddingBottom: insets.bottom + 24 }]}><View style={s.sheetHeader}><Text style={s.stateTitle} testID="forum-guidelines-title">A community that grows together</Text><Pressable testID="forum-guidelines-close" accessibilityLabel="Close" onPress={onClose} style={s.iconButton}><Lucide name="x" size={22} color={colors.onSurface} /></Pressable></View><ScrollView>{rules.map(([icon, title, text], index) => <View key={icon} style={s.rule} testID={`forum-guideline-${index}`}><Lucide name={icon as any} size={22} color={colors.brand} /><View style={s.ruleBody}><Text style={s.ruleTitle}>{title}</Text><Text style={s.stateText}>{text}</Text></View></View>)}</ScrollView></View></View></Modal>;
}

const useStyles = makeStyles(c => ({
  avatar: { backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  initials: { fontFamily: fonts.h700, color: c.onBrandTertiary },
  badge: { flexDirection: "row", gap: 5, alignItems: "center", alignSelf: "flex-start", backgroundColor: c.brandTertiary, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7 },
  resolved: { backgroundColor: c.heroBg },
  badgeText: { fontFamily: fonts.b700, fontSize: 10, color: c.onBrandTertiary },
  toolbar: { paddingHorizontal: 20, paddingBottom: 10, minHeight: 66, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: c.surfaceSecondary, borderBottomWidth: 1, borderBottomColor: c.divider },
  toolbarText: { flex: 1, minWidth: 0 },
  wordmark: { fontFamily: fonts.wordmark, fontSize: 23, lineHeight: 28, color: c.brand },
  toolbarLabel: { fontFamily: fonts.b700, fontSize: 8, letterSpacing: 1.5, color: c.muted },
  screenTitle: { fontFamily: fonts.h700, fontSize: 20, color: c.onSurface },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  state: { paddingVertical: 32, paddingHorizontal: 24, alignItems: "center", gap: 12 },
  stateIcon: { padding: 18, borderRadius: 24, backgroundColor: c.brandTertiary },
  stateTitle: { fontFamily: fonts.h700, fontSize: 21, color: c.onSurface, flexShrink: 1 },
  stateText: { fontFamily: fonts.b400, fontSize: 13, lineHeight: 21, color: c.muted },
  stateAction: { minHeight: 46, borderRadius: 24, paddingHorizontal: 20, backgroundColor: c.brand, flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  stateActionText: { fontFamily: fonts.b700, color: c.onBrand, fontSize: 13 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  scrim: { ...{ position: "absolute" as const, top: 0, right: 0, bottom: 0, left: 0 }, backgroundColor: c.scrim },
  sheet: { maxHeight: "85%", backgroundColor: c.surfaceSecondary, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  rule: { flexDirection: "row", gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: c.divider },
  ruleBody: { flex: 1, gap: 4 },
  ruleTitle: { fontFamily: fonts.b700, fontSize: 13, color: c.onSurface },
}));