import React, { useEffect } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Stack, usePathname, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useApp } from "@/src/store/AppStore";
import { api } from "@/src/services/api";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { Logo } from "@/src/components/Logo";
import { AdminButton, AdminFeedback } from "@/src/admin/UI";

export default function AdminLayout() {
  const s = useStyles(); const { colors } = useTheme(); const insets = useSafeAreaInsets();
  const { user, ready, signOut } = useApp(); const router = useRouter(); const pathname = usePathname();
  const isLogin = pathname === "/admin/login";
  const session = useQuery({ queryKey: ["admin-session", user?.id], queryFn: api.me, enabled: ready && !!user && !isLogin, staleTime: 0, retry: false });
  useEffect(() => {
    if (ready && !user && !isLogin) router.replace("/admin/login");
    if (!isLogin && session.data?.role === "admin" && session.data.must_change_password && pathname !== "/admin/security") router.replace("/admin/security");
  }, [ready, user, isLogin, session.data, pathname, router]);
  if (isLogin) return <Stack screenOptions={{ headerShown: false }} />;
  if (!ready || !user || session.isPending) return <View style={s.loader}><ActivityIndicator testID="admin-session-loading" color={colors.brand} /></View>;
  if (session.isError || session.data?.role !== "admin") return <View style={[s.loader, { padding: 24 }]} testID="admin-access-denied"><AdminFeedback empty="Staff access only" description="This area is reserved for authorised Mqulima administrators." /><AdminButton testID="admin-switch-account" label="Use an admin account" onPress={async () => { await signOut(); router.replace("/admin/login"); }} /><AdminButton testID="admin-return-public" secondary label="Back to Mqulima" onPress={() => router.replace("/")} /></View>;
  const tabs = [{ path: "/admin", label: "Overview", icon: "layout-dashboard" }, { path: "/admin/manage", label: "Manage", icon: "grip" }, { path: "/admin/audit", label: "Activity", icon: "history" }, { path: "/admin/security", label: "Account", icon: "shield-check" }];
  const mustChange = !!session.data.must_change_password;
  return <View style={s.root} testID="admin-workspace"><View style={[s.header, { paddingTop: insets.top + 10 }]}><Logo size={32} /><View style={s.brand}><Text style={s.word}>Mqulima</Text><Text testID="admin-workspace-label" style={s.caption}>OPERATIONS WORKSPACE</Text></View><Pressable testID="admin-open-public" accessibilityLabel="Open public app" onPress={() => router.replace("/")} style={s.icon}><Lucide name="external-link" size={20} color={colors.brand} /></Pressable></View><View style={s.main}>{mustChange && pathname !== "/admin/security" ? <ActivityIndicator color={colors.brand} /> : <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />}</View>{!mustChange && <View style={[s.bottom, { paddingBottom: Math.max(insets.bottom, 8) }]}>{tabs.map(tab => { const active = tab.path === "/admin" ? pathname === "/admin" : tab.path === "/admin/manage" ? !["/admin", "/admin/audit", "/admin/security"].includes(pathname) : pathname.startsWith(tab.path); return <Pressable key={tab.path} testID={`admin-nav-${tab.label.toLowerCase()}`} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => router.navigate(tab.path as any)} style={s.tab}><View style={[s.tabIcon, active && s.activeIcon]}><Lucide name={tab.icon as any} size={21} color={active ? colors.brand : colors.muted} /></View><Text style={[s.tabText, active && s.activeText]}>{tab.label}</Text></Pressable>; })}</View>}</View>;
}

const useStyles = makeStyles(c => ({
  root: { flex: 1, backgroundColor: c.surface }, main: { flex: 1 },
  loader: { flex: 1, alignItems: "stretch", justifyContent: "center", backgroundColor: c.surface, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.border, backgroundColor: c.surfaceSecondary },
  brand: { flex: 1 }, word: { fontFamily: fonts.wordmark, fontSize: 23, color: c.brand }, caption: { fontFamily: fonts.b700, fontSize: 8, letterSpacing: 1.4, color: c.muted, marginTop: 3 },
  icon: { width: 44, height: 44, justifyContent: "center", alignItems: "center", borderRadius: 12, backgroundColor: c.heroBg },
  bottom: { flexDirection: "row", borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.surfaceSecondary, paddingTop: 8 },
  tab: { flex: 1, minHeight: 52, alignItems: "center", justifyContent: "center", gap: 4 },
  tabIcon: { width: 48, height: 29, borderRadius: 10, alignItems: "center", justifyContent: "center" }, activeIcon: { backgroundColor: c.brandTertiary },
  tabText: { fontFamily: fonts.b600, fontSize: 10, color: c.muted }, activeText: { color: c.brand },
}));