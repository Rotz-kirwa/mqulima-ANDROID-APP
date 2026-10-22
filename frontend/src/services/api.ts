// Single data-access layer: HTTP calls to the Mqulima FastAPI backend (/api).
import type { Article } from "@/src/data/articles";
import type { Product } from "@/src/data/products";
import type { Thread, Comment } from "@/src/data/forum";
import { getSubService, serviceCategories, ServiceCategory } from "@/src/data/services";
import { courses } from "@/src/data/academy";
import { marketPrices } from "@/src/data/tools";
import { aiReplies, aiFallback } from "@/src/data/pages";
import { storage } from "@/src/utils/storage";
import { fetch as expoFetch } from "expo/fetch";
import { Platform } from "react-native";

export const PAGE_SIZE = 24;
export const TOKEN_KEY = "auth_token";
const BASE = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`;

export type User = { id: string; name: string; email: string; phone: string; county: string };
export type AuthResponse = { access_token: string; user: User };
export type OrderItem = { key: string; productId: string; name: string; image: string; variant?: string | null; price: number; qty: number };
export type Order = { id: string; date: string; items: OrderItem[]; subtotal: number; delivery: number; total: number; county: string; subcounty: string; location: string; phone: string; status: string };
export type ApiThread = Thread & { title?: string; created_at?: string; liked: boolean; saved?: boolean; resolved?: boolean; user_id?: string | null };
export type ForumFilters = { q: string; tag: string; sort: "latest" | "popular" | "unanswered"; scope: "all" | "mine" | "saved" };
export type ForumFeed = { items: ApiThread[]; total: number; next_page: number | null };

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await storage.secureGet(TOKEN_KEY, "");
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(init.headers as Record<string, string>) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = Array.isArray(body.detail) ? body.detail[0]?.msg : body.detail;
    throw new ApiError(res.status, detail ?? `Request failed (${res.status})`);
  }
  return res.json();
}

const delay = <T,>(data: T, ms = 300): Promise<T> => new Promise((r) => setTimeout(() => r(data), ms));

export const api = {
  // ---- Auth ----
  register: (body: { name: string; email: string; phone: string; county: string; password: string }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (email: string, password: string) => request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request<User>("/auth/me"),

  // ---- AgroShop ----
  getProducts: (category = "All", q = "", page = 1) =>
    request<{ items: Product[]; total: number; page: number; pages: number }>(`/products?category=${encodeURIComponent(category)}&q=${encodeURIComponent(q)}&page=${page}`),
  getFeaturedProducts: () => request<Product[]>("/products/featured"),
  getProduct: (id: string) => request<Product>(`/products/${encodeURIComponent(id)}`).catch((e: ApiError) => (e.status === 404 ? undefined : Promise.reject(e))),
  getProductsByIds: (ids: string[]) => (ids.length ? request<Product[]>(`/products/by-ids?ids=${encodeURIComponent(ids.join(","))}`) : Promise.resolve([] as Product[])),

  // ---- News ----
  getArticles: (group = "All") => request<Article[]>(`/articles?group=${encodeURIComponent(group)}`),
  getArticle: (id: string) => request<Article>(`/articles/${encodeURIComponent(id)}`).catch((e: ApiError) => (e.status === 404 ? undefined : Promise.reject(e))),

  // ---- Forum ----
  getThreads: () => request<ApiThread[]>("/threads"),
  getForumFeed: (filters: ForumFilters, page = 1) => request<ForumFeed>(`/threads/feed?q=${encodeURIComponent(filters.q)}&tag=${encodeURIComponent(filters.tag)}&sort=${filters.sort}&scope=${filters.scope}&page=${page}`),
  getMyThreads: () => request<ApiThread[]>("/threads?mine=true"),
  getThread: (id: string) => request<ApiThread>(`/threads/${encodeURIComponent(id)}`).catch((e: ApiError) => (e.status === 404 ? undefined : Promise.reject(e))),
  createThread: (body: { title?: string; text: string; tag: string; county: string }) => request<ApiThread>("/threads", { method: "POST", body: JSON.stringify(body) }),
  addComment: (threadId: string, text: string, parent_id?: string) => request<Comment>(`/threads/${encodeURIComponent(threadId)}/comments`, { method: "POST", body: JSON.stringify({ text, parent_id }) }),
  toggleLike: (threadId: string) => request<{ liked: boolean; likes: number }>(`/threads/${encodeURIComponent(threadId)}/like`, { method: "POST" }),
  bookmarkThread: (id: string, saved: boolean) => request<{ saved: boolean }>(`/threads/${encodeURIComponent(id)}/bookmark`, { method: "PUT", body: JSON.stringify({ saved }) }),
  resolveThread: (id: string, resolved: boolean) => request<{ resolved: boolean }>(`/threads/${encodeURIComponent(id)}/resolved`, { method: "PUT", body: JSON.stringify({ resolved }) }),

  // ---- Orders ----
  createOrder: (body: { items: { productId: string; variant?: string; qty: number }[]; name: string; phone: string; county: string; subcounty: string; location: string }) =>
    request<Order>("/orders", { method: "POST", body: JSON.stringify(body) }),
  getOrders: () => request<Order[]>("/orders"),

  // ---- Search (products + articles from API, services local) ----
  search: async (q: string) => {
    const t = q.trim().toLowerCase();
    const services = t ? serviceCategories.flatMap((c) => c.subs.filter((s) => s.title.toLowerCase().includes(t)).map((s) => ({ ...s, categoryId: c.id }))) : [];
    if (!t) return { products: [] as Product[], articles: [] as Article[], services };
    const r = await request<{ products: Product[]; articles: Article[] }>(`/search?q=${encodeURIComponent(q)}`);
    return { ...r, services };
  },

  // ---- Static content (services, academy, tools) ----
  getServiceCategories: (): Promise<ServiceCategory[]> => delay(serviceCategories),
  getServiceCategory: (id: string): Promise<ServiceCategory | undefined> => delay(serviceCategories.find((c) => c.id === id)),
  getSubService: (id: string) => delay(getSubService(id)),
  getCourses: () => delay(courses),
  getCourse: (id: string) => delay(courses.find((c) => c.id === id)),
  getMarketPrices: () => delay(marketPrices),

  /** Real Mqulima AI (Gemini 3.1 Pro) via backend SSE stream. Calls onDelta for each text chunk. */
  streamAI: async (sessionId: string, message: string, onDelta: (t: string) => void): Promise<void> => {
    const doFetch = (Platform.OS === "web" ? globalThis.fetch : expoFetch) as typeof globalThis.fetch;
    const res = await doFetch(`${BASE}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({ session_id: sessionId, message }),
    });
    if (!res.ok || !res.body) throw new Error("AI request failed");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split("\n\n");
      buf = parts.pop() ?? "";
      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") return;
        const ev = JSON.parse(data);
        if (ev.error) throw new Error(ev.error);
        if (ev.delta) onDelta(ev.delta);
      }
    }
  },

  /** Offline fallback replies (used if the AI server is unreachable). */
  askAI: (message: string): Promise<string> => {
    const m = message.toLowerCase();
    const hit = aiReplies.find((r) => r.keys.some((k) => m.includes(k)));
    return delay(hit ? hit.reply : aiFallback, 1200);
  },
};
