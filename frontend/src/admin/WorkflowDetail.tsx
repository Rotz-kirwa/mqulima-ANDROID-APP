import React, { useState } from "react";
import { Linking, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Field, SelectField } from "@/src/components/Form";
import { useApp } from "@/src/store/AppStore";
import { ksh } from "@/src/data/products";
import { adminApi, RecordData } from "./api";
import { dateLabel, modules } from "./config";
import { AdminButton, ConfirmSheet, DetailRows, StatusBadge, useAdminStyles } from "./UI";

function details(resource: string, record: RecordData): [string, string][] {
  const keys: Record<string, string[]> = { orders: ["name", "phone", "county", "subcounty", "location", "payment", "date"], requests: ["name", "phone", "county", "subcounty", "service", "date", "details"], users: ["name", "email", "phone", "county", "role", "created_at"], inbox: ["name", "contact", "subject", "message", "created_at"], waitlist: ["email", "created_at"], audit: ["action", "actor", "resource", "label", "target_id", "created_at"] };
  return (keys[resource] || []).map(key => [key.replace(/_/g, " "), String(record[key] || "")]);
}

export function WorkflowDetail({ resource, record }: { resource: string; record: RecordData }) {
  const s = useAdminStyles(); const qc = useQueryClient(); const { toast } = useApp();
  const [draft, setDraft] = useState({ status: record.status || "New", notes: record.notes || "", assigned_to: record.assigned_to || "", specialist_contact: record.specialist_contact || "", payment_status: record.payment_status || "Pending", payment_reference: record.payment_reference || "" });
  const [error, setError] = useState(""); const [saving, setSaving] = useState(false); const [confirm, setConfirm] = useState(false);
  const set = (key: keyof typeof draft) => (value: string) => { setDraft(old => ({ ...old, [key]: value })); setError(""); };
  const save = async () => {
    setSaving(true); setError("");
    try { const result = await adminApi.state(resource, record.id, draft); qc.setQueryData(["admin", resource, record.id], result); qc.invalidateQueries(); toast("Record updated"); setConfirm(false); }
    catch (e: any) { setError(e.message || "Could not update this record"); setConfirm(false); } finally { setSaving(false); }
  };
  const transitions: Record<string, string[]> = { Processing: ["Confirmed", "Cancelled"], Confirmed: ["Dispatched", "Cancelled"], Dispatched: ["Delivered"], Delivered: [], Cancelled: [] };
  const statuses = resource === "orders" ? [record.status, ...(transitions[record.status] || [])] : modules[resource].statuses;
  const contact = record.phone || record.contact || record.email;
  return <KeyboardAwareScrollView testID="admin-workflow-detail" keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
    {record.status && <StatusBadge status={record.status} testID="admin-detail-status" />}
    <DetailRows values={details(resource, record)} />
    {resource === "orders" && <View style={s.card}><Text style={s.h2}>Order items</Text>{record.items.map((item: any, index: number) => <View key={`${item.key}-${index}`} testID={`admin-order-item-${index}`} style={s.detailRow}><Text style={s.body}>{item.qty} × {item.name}{item.variant ? ` · ${item.variant}` : ""}</Text><Text style={s.caption}>{ksh(item.price * item.qty)}</Text></View>)}<View style={s.divider} /><Text style={s.body}>Subtotal: {ksh(record.subtotal)}</Text><Text style={s.body}>Delivery: {ksh(record.delivery)}</Text><Text testID="admin-order-total" style={s.h2}>Total: {ksh(record.total)}</Text></View>}
    {!!contact && resource !== "audit" && <AdminButton testID="admin-contact-customer" label={contact.includes("@") ? "Open email app" : "Call customer"} secondary icon={contact.includes("@") ? "mail" : "phone"} onPress={() => Linking.openURL(contact.includes("@") ? `mailto:${encodeURIComponent(contact)}` : `tel:${contact.replace(/[^+\d]/g, "")}`).catch(() => toast("No app available for this contact method."))} />}
    {resource === "audit" ? <Text style={s.caption}>Read-only audit record. Activity entries cannot be edited here.</Text> : resource === "users" && record.role === "admin" ? <Text testID="admin-protected-account" style={s.body}>Administrator accounts are protected from suspension here.</Text> : <View style={s.card}><Text style={s.h2}>{resource === "users" ? "Account access" : "Update workflow"}</Text><SelectField testID="admin-workflow-status" label="Status" value={draft.status} options={statuses} onChange={set("status")} />
      {resource === "requests" && <><Field testID="admin-assigned-to" label="Assigned specialist" value={draft.assigned_to} onChangeText={set("assigned_to")} placeholder="Name of the agronomist or specialist" /><Field testID="admin-specialist-contact" label="Specialist contact" value={draft.specialist_contact} onChangeText={set("specialist_contact")} placeholder="Phone or email" /></>}
      {resource === "orders" && <><View style={s.divider} /><Text style={s.h3}>Manual payment record</Text><Text testID="admin-payment-disclaimer" style={s.caption}>Recording a payment does not collect money or issue a refund. Verify it with your payment provider first.</Text><SelectField testID="admin-payment-status" label="Payment status" value={draft.payment_status} options={["Pending", "Paid", "Refunded"]} onChange={set("payment_status")} /><Field testID="admin-payment-reference" label="Transaction reference" value={draft.payment_reference} onChangeText={set("payment_reference")} /></>}
      {resource !== "users" && <Field testID="admin-workflow-notes" label="Internal notes" value={draft.notes} onChangeText={set("notes")} multiline placeholder="Add context for your team…" />}
      {resource === "users" && <Text style={s.caption}>Suspending a customer immediately revokes their existing sessions. Their orders and content are retained.</Text>}
      {!!error && <Text testID="admin-workflow-error" accessibilityRole="alert" style={s.error}>{error}</Text>}<AdminButton testID="admin-save-workflow" label="Save update" loading={saving} icon="check" onPress={() => setConfirm(true)} />
    </View>}
    <ConfirmSheet title="Apply this update?" message={resource === "users" ? `This account will become ${draft.status}. Existing sessions will be revoked.` : `Save the ${draft.status} status and entered details. This change will be recorded in the activity log.`} open={confirm} onCancel={() => setConfirm(false)} onConfirm={save} loading={saving} />
  </KeyboardAwareScrollView>;
}

export function ForumModeration({ record }: { record: RecordData }) {
  const s = useAdminStyles(); const qc = useQueryClient(); const { toast } = useApp();
  const [reason, setReason] = useState(""); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  const [action, setAction] = useState<{ hidden: boolean; commentId?: string } | null>(null);
  const confirm = (hidden: boolean, commentId?: string) => { if (reason.trim().length < 3) { setError("Enter a short moderation reason before changing visibility."); return; } setError(""); setAction({ hidden, commentId }); };
  const apply = async () => {
    if (!action) return;
    setSaving(true);
    try { const result = await adminApi.moderate(record.id, action.hidden, reason, action.commentId); qc.setQueryData(["admin", "forum", record.id], result); qc.invalidateQueries(); setAction(null); toast(action.hidden ? "Content hidden from the community" : "Content restored"); }
    catch (e: any) { setAction(null); setError(e.message || "Could not moderate this content"); } finally { setSaving(false); }
  };
  return <KeyboardAwareScrollView testID="admin-forum-detail" keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
    <View style={s.card}><StatusBadge status={record.hidden ? "hidden" : "visible"} testID="admin-forum-status" /><Text style={s.h2}>{record.title || "Community discussion"}</Text><Text style={s.body}>{record.text}</Text><Text style={s.caption}>{record.author} · {record.county} · {dateLabel(record.created_at)}</Text></View>
    <View style={s.card}><Text style={s.h2}>Moderation controls</Text><Field testID="admin-moderation-reason" label="Reason for this action" value={reason} onChangeText={v => { setReason(v); setError(""); }} multiline placeholder="Explain why content should be hidden or restored…" /><Text style={s.caption}>Hiding a discussion also hides its replies from public view. Nothing is permanently deleted.</Text>{!!error && <Text testID="admin-moderation-error" style={s.error}>{error}</Text>}<AdminButton testID="admin-moderate-thread" secondary={!!record.hidden} label={record.hidden ? "Restore discussion" : "Hide discussion"} onPress={() => confirm(!record.hidden)} /></View>
    <Text style={s.h2}>Replies ({record.comments.length})</Text>{record.comments.map((comment: any) => <View key={comment.id} style={s.card} testID={`admin-comment-${comment.id}`}><View style={s.row}><Text style={[s.h3, s.flex]}>{comment.author}</Text><StatusBadge status={comment.hidden ? "hidden" : "visible"} testID={`admin-comment-status-${comment.id}`} /></View><Text style={s.body}>{comment.text}</Text>{comment.parent_id && <Text style={s.caption}>Reply to another comment</Text>}<AdminButton testID={`admin-moderate-comment-${comment.id}`} secondary label={comment.hidden ? "Restore reply" : "Hide reply"} onPress={() => confirm(!comment.hidden, comment.id)} /></View>)}
    <ConfirmSheet title={action?.hidden ? "Hide this content?" : "Restore this content?"} message="This updates public visibility and records your action. You can reverse the change later." open={!!action} onCancel={() => setAction(null)} onConfirm={apply} loading={saving} />
  </KeyboardAwareScrollView>;
}