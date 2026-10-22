import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import { modules } from "@/src/admin/config";
import { AdminHeading, useAdminStyles } from "@/src/admin/UI";
import { useTheme } from "@/src/theme";

export default function Manage() {
  const s = useAdminStyles(); const { colors } = useTheme(); const router = useRouter();
  return <View testID="admin-manage-screen" style={s.root}><AdminHeading title="Manage Mqulima" subtitle="Everything behind a thriving farming ecosystem." /><ScrollView contentContainerStyle={s.content}>{["Commerce", "Operations", "Community", "Content", "Learning"].map(group => <View key={group} style={{ gap: 12 }}><Text testID={`admin-group-${group}`} style={s.eyebrow}>{group}</Text>{Object.entries(modules).filter(([, module]) => module.group === group).map(([key, module]) => <Pressable key={key} testID={`admin-module-${key}`} onPress={() => router.push(`/admin/${key}` as any)} style={({ pressed }) => [s.card, s.row, pressed && s.pressed]}><View style={s.feedbackIcon}><Lucide name={module.icon as any} size={24} color={colors.brand} /></View><View style={s.flex}><Text style={s.h3}>{module.title}</Text><Text style={s.caption}>{module.description}</Text></View><Lucide name="chevron-right" size={18} color={colors.muted} /></Pressable>)}</View>)}</ScrollView></View>;
}