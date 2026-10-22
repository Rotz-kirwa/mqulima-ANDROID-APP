import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/src/admin/api";
import { modules } from "@/src/admin/config";
import { AdminFeedback, AdminHeading, useAdminStyles } from "@/src/admin/UI";
import { ContentEditor } from "@/src/admin/ContentEditor";
import { ForumModeration, WorkflowDetail } from "@/src/admin/WorkflowDetail";
import { useTheme } from "@/src/theme";

export default function AdminRecord() {
  const { resource, id } = useLocalSearchParams<{ resource: string; id: string }>();
  const s = useAdminStyles(); const { colors } = useTheme(); const config = modules[resource];
  const q = useQuery({ queryKey: ["admin", resource, id], queryFn: () => adminApi.get(resource, id), enabled: id !== "new" && !!config });
  const record = id === "new" ? { ...config?.initial, id: "new" } : q.data?.item;
  if (!config || (id === "new" && !config.editable)) return <AdminFeedback empty="Record not found" description="Choose a record from the management list." />;
  return <View testID={`admin-detail-${resource}`} style={s.root}><AdminHeading back title={`${id === "new" ? "New " : config.editable ? "Edit " : ""}${config.singular.toLowerCase()}`} subtitle={id === "new" ? "Create a new record for your ecosystem." : `${config.title} / ${id.slice(0, 20)}`} />{id !== "new" && q.isPending ? <ActivityIndicator testID="admin-detail-loading" color={colors.brand} /> : q.isError ? <AdminFeedback error={q.error.message} retry={() => q.refetch()} /> : record ? config.editable ? <ContentEditor key={`${resource}-${id}`} resource={resource} record={record} /> : resource === "forum" ? <ForumModeration key={id} record={record} /> : <WorkflowDetail key={id} resource={resource} record={record} /> : null}</View>;
}