import { request, TOKEN_KEY } from "@/src/services/api";
import { storage } from "@/src/utils/storage";
import { uploadForm, LocalFile } from "@/src/utils/upload";

export type RecordData = Record<string, any>;
export type AdminList = { items: RecordData[]; total: number; page: number; pages: number };
export const adminApi = {
  overview: () => request<RecordData>("/admin/overview"),
  list: (resource: string, q = "", status = "all", page = 1) => request<AdminList>(`/admin/${resource}?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}&page=${page}`),
  get: (resource: string, id: string) => request<{ item: RecordData }>(`/admin/${resource}/${encodeURIComponent(id)}`),
  save: (resource: string, id: string, body: RecordData) => request<{ item: RecordData }>(`/admin/${resource}${id === "new" ? "" : `/${encodeURIComponent(id)}`}`, { method: id === "new" ? "POST" : "PUT", body: JSON.stringify(body) }),
  state: (resource: string, id: string, body: RecordData) => request<{ item: RecordData }>(`/admin/${resource}/${encodeURIComponent(id)}/state`, { method: "PATCH", body: JSON.stringify(body) }),
  moderate: (id: string, hidden: boolean, reason: string, commentId?: string) => request<{ item: RecordData }>(`/admin/forum/${encodeURIComponent(id)}/${commentId ? `comments/${encodeURIComponent(commentId)}` : "moderate"}`, { method: "PATCH", body: JSON.stringify({ hidden, reason }) }),
  upload: async (file: LocalFile) => {
    const token = await storage.secureGet(TOKEN_KEY, "");
    const response = await uploadForm(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/admin/media`, { headers: { Authorization: `Bearer ${token}` }, files: { file } });
    const body = await response.json();
    if (!response.ok) throw new Error(typeof body.detail === "string" ? body.detail : "Could not upload image");
    return body.image as string;
  },
};