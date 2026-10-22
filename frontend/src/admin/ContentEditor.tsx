import React, { useState } from "react";
import { Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Field, SelectField } from "@/src/components/Form";
import { useTheme } from "@/src/theme";
import { useApp } from "@/src/store/AppStore";
import { adminApi, RecordData } from "./api";
import { FieldSpec, modules } from "./config";
import { AdminButton, ConfirmSheet, StatusBadge, useAdminStyles } from "./UI";
import { CourseBuilder, ServiceStepsEditor, VariantsEditor } from "./StructuredEditors";
import { ImageField } from "./ImageField";

export function ContentEditor({ resource, record }: { resource: string; record: RecordData }) {
  const s = useAdminStyles(); const { colors } = useTheme(); const qc = useQueryClient(); const router = useRouter(); const { toast } = useApp(); const config = modules[resource];
  const [draft, setDraft] = useState<RecordData>({ ...config.initial, ...record });
  const [error, setError] = useState(""); const [saving, setSaving] = useState(false); const [uploading, setUploading] = useState(false); const [confirm, setConfirm] = useState(false);
  const categories = useQuery({ queryKey: ["admin", "category-options"], queryFn: async () => { const first = await adminApi.list("service-categories"); let items = first.items; for (let page = 2; page <= first.pages; page++) items = [...items, ...(await adminApi.list("service-categories", "", "all", page)).items]; return items; }, enabled: resource === "services" });
  const update = (key: string, value: any) => { setDraft(old => ({ ...old, [key]: value })); setError(""); };
  const save = async () => {
    if (saving || uploading) return;
    const missing = config.fields?.find(field => field.required && (draft[field.key] === undefined || draft[field.key] === null || String(draft[field.key]).trim() === ""));
    if (missing) { setError(`${missing.label} is required.`); setConfirm(false); return; }
    const body = { ...draft };
    for (const field of config.fields || []) if (field.type === "number") { const number = Number(body[field.key]); if (!Number.isFinite(number) || number < 0) { setError(`${field.label} must be a valid positive number.`); setConfirm(false); return; } body[field.key] = number; }
    if (resource === "products") { body.variants = (body.variants || []).map((v: any) => ({ label: v.label, price: Number(v.price) })); }
    setSaving(true); setError("");
    try { const result = await adminApi.save(resource, record.id, body); setDraft(result.item); qc.invalidateQueries(); toast(`${config.singular} saved`); setConfirm(false); if (record.id === "new") router.replace(`/admin/${resource}/${result.item.id}` as any); }
    catch (e: any) { setConfirm(false); setError(e.message || "Could not save your changes."); } finally { setSaving(false); }
  };
  const renderField = (field: FieldSpec) => {
    const value = draft[field.key]; const id = `admin-field-${field.key}`;
    if (field.type === "toggle") return <View key={field.key} style={s.row}><Text style={[s.body, s.flex]}>{field.label}</Text><Switch testID={id} value={!!value} onValueChange={v => update(field.key, v)} trackColor={{ false: colors.borderStrong, true: colors.brand }} /></View>;
    if (field.type === "select") { const isCategory = field.key === "category_id"; const options = isCategory ? (categories.data || []).map(item => item.title) : field.options || []; const selected = isCategory ? categories.data?.find(item => item.id === value)?.title || "" : value; return <SelectField key={field.key} testID={id} label={field.label} value={selected || ""} options={options} onChange={v => update(field.key, isCategory ? categories.data?.find(item => item.title === v)?.id : v)} />; }
    const separator = field.type === "paragraphs" ? "\n\n" : "\n";
    const array = field.type === "paragraphs" || field.type === "lines";
    return <View key={field.key} style={{ gap: 6 }}><Field testID={id} label={field.label} value={array ? (value || []).join(separator) : String(value ?? "")} onChangeText={v => update(field.key, array ? v.split(separator) : v)} multiline={["paragraphs", "lines", "long"].includes(field.type || "")} keyboardType={field.type === "number" ? "decimal-pad" : "default"} />{field.hint && <Text style={s.caption}>{field.hint}</Text>}</View>;
  };
  return <><KeyboardAwareScrollView testID="admin-content-editor" keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}><View style={s.card}><Text style={s.h2}>Publication</Text><Text style={s.caption}>Drafts and archived records are not shown in the public app.</Text><SelectField testID="admin-publication-select" label="Visibility" value={draft.status || "draft"} options={["draft", "published", "archived"]} onChange={value => update("status", value)} /><StatusBadge status={draft.status || "draft"} testID="admin-editor-status" /></View><View style={s.card}><Text style={s.h2}>{config.singular} details</Text>{categories.isError && <Text style={s.error}>Could not load service categories. Please reopen this editor.</Text>}{config.fields?.map(renderField)}</View>{resource === "products" && <VariantsEditor value={draft.variants || []} onChange={value => update("variants", value)} />}{resource === "services" && <ServiceStepsEditor value={draft.steps || []} onChange={value => update("steps", value)} />}{resource === "courses" && <CourseBuilder value={draft.modules || []} onChange={value => update("modules", value)} />}<ImageField value={draft.image || ""} onChange={value => update("image", value)} onBusy={setUploading} />{!!error && <Text testID="admin-editor-error" accessibilityRole="alert" style={s.error}>{error}</Text>}<AdminButton testID="admin-save-record" label={saving ? "Saving changes…" : "Save changes"} loading={saving || uploading} icon="check" onPress={() => draft.status === "archived" && record.status !== "archived" ? setConfirm(true) : save()} /><Text style={s.caption}>Changes are saved to the database and recorded in the activity log.</Text></KeyboardAwareScrollView><ConfirmSheet title={`Archive this ${config.singular.toLowerCase()}?`} message="It will be removed from public listings. Historical records remain intact and you can publish it again later." open={confirm} loading={saving} onCancel={() => setConfirm(false)} onConfirm={save} /></>;
}