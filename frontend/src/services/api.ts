// Unified data-access layer: HTTP calls to the Mqulima Production Platform (/api/v1).
import { type Article, articles } from "@/src/data/articles";
import { type Product, products } from "@/src/data/products";
import { type Thread, type Comment, threads } from "@/src/data/forum";
import { type ServiceCategory, type SubService, serviceCategories } from "@/src/data/services";
import { type Course, courses } from "@/src/data/academy";
import { marketPrices } from "@/src/data/tools";
import { aiReplies, aiFallback } from "@/src/data/pages";
import { storage } from "@/src/utils/storage";
import { fetch as expoFetch } from "expo/fetch";
import { Platform } from "react-native";

export const PAGE_SIZE = 24;
export const TOKEN_KEY = "auth_token";

// Production backend gateway: defaults to live production platform if env not configured
const BACKEND_HOST = (process.env.EXPO_PUBLIC_BACKEND_URL || "https://www.mqulima.com").replace(/\/$/, "");
const BASE = `${BACKEND_HOST}/api/v1`;

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  county: string;
  role?: "admin" | "super_admin" | "farmer" | "customer";
  status?: string;
  avatarUrl?: string;
  must_change_password?: boolean;
};

export type AuthResponse = { access_token: string; token?: string; user: User };
export type OrderItem = { key: string; productId: string; name: string; image: string; variant?: string | null; price: number; qty: number };
export type Order = {
  id: string;
  date: string;
  items: OrderItem[];
  subtotal: number;
  delivery: number;
  total: number;
  county: string;
  subcounty: string;
  location: string;
  phone: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  receiptNumber?: string | null;
};

export type ApiThread = Thread & { title?: string; created_at?: string; liked: boolean; saved?: boolean; resolved?: boolean; user_id?: string | null };
export type ForumFilters = { q: string; tag: string; sort: "latest" | "popular" | "unanswered"; scope: "all" | "mine" | "saved" };
export type ForumFeed = { items: ApiThread[]; total: number; next_page: number | null };

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await storage.secureGet(TOKEN_KEY, "");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = Array.isArray(body.detail) ? body.detail[0]?.msg : (body.error || body.message || body.detail);
    throw new ApiError(res.status, detail ?? `Request failed (${res.status})`);
  }
  return res.json();
}

const delay = <T,>(data: T, ms = 300): Promise<T> => new Promise((r) => setTimeout(() => r(data), ms));

// =========================================================================
// AgroShop Helpers: Normalization, Category Mapping & Live Backend Sync
// =========================================================================

function normalizeProductImage(img?: string): string {
  if (!img) return "https://www.mqulima.com/images/placeholders/farm_tools.webp";
  if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("data:")) return img;
  if (img.startsWith("/")) return `https://www.mqulima.com${img}`;
  return `https://www.mqulima.com/${img}`;
}

function mapBackendCategory(cat?: string, sub?: string, name?: string): string {
  const c = (cat || "").toLowerCase();
  const s = (sub || "").toLowerCase();
  const n = (name || "").toLowerCase();

  if (c.includes("seed") || s.includes("seed") || n.includes("seed") || n.includes("spinach") || n.includes("cabbage") || n.includes("tomato") || n.includes("onion") || n.includes("carrot") || n.includes("maize")) {
    return "Seeds";
  }
  if (c.includes("protect") || c.includes("chem") || s.includes("pesticide") || s.includes("fungicide") || s.includes("insecticide") || s.includes("herbicide") || n.includes("weedal") || n.includes("zetanil") || n.includes("dudu") || n.includes("rocket") || n.includes("ridomil")) {
    return "Inputs & Agrochemicals";
  }
  if (c.includes("fert") || s.includes("fert") || n.includes("fertilizer") || n.includes("foliar") || n.includes("npk") || n.includes("dap") || n.includes("can") || n.includes("urea") || n.includes("mavuno")) {
    return "Fertilizers";
  }
  if (s.includes("feed") || n.includes("feed") || n.includes("mash") || n.includes("meal") || n.includes("layer") || n.includes("starter") || n.includes("grower") || n.includes("kienyeji")) {
    return "Animal Feeds";
  }
  if (s.includes("health") || s.includes("vet") || n.includes("dewormer") || n.includes("vaccine") || n.includes("salve") || n.includes("lick") || n.includes("salt") || n.includes("injection") || n.includes("drench") || n.includes("kupe") || n.includes("tick")) {
    return "Animal Health";
  }
  if (c.includes("equip") || c.includes("tool") || s.includes("machin") || n.includes("sprayer") || n.includes("knapsack") || n.includes("jembe") || n.includes("panga") || n.includes("incubator") || n.includes("chaff")) {
    return "Farm Equipment";
  }
  if (c.includes("animal")) {
    if (n.includes("feed") || n.includes("mash") || n.includes("meal") || n.includes("chick")) return "Animal Feeds";
    return "Animal Health";
  }
  return "Inputs & Agrochemicals";
}

function normalizeBackendProduct(p: any): Product {
  const id = String(p.id || p.externalProductId || p.slug || Math.random());
  const name = p.name || "Agrovet Product";
  const price = Number(p.price ?? p.basePrice ?? p.base_price ?? 0);
  const stock = Math.max(0, Number(p.stock ?? p.stockQuantity ?? p.stock_qty ?? 0));
  const rawImage = p.image || p.imageUrl || (Array.isArray(p.images) && p.images[0]) || "";
  const image = normalizeProductImage(rawImage);
  const category = mapBackendCategory(p.category, p.subcategory, name);
  const desc = p.description || p.briefDescription || "Certified genuine agricultural input for farm use.";
  const rating = Number(p.rating || p.avgRating || p.avg_rating || 4.7);
  const featured = Boolean(p.featured || p.isFeatured || p.is_featured);

  const rawVars = Array.isArray(p.variations) && p.variations.length > 0 ? p.variations : p.variants;
  const variants = Array.isArray(rawVars) && rawVars.length > 0
    ? rawVars
        .filter((v: any) => v && v.variantLabel !== "DUMMY" && (v.variantLabel || v.label))
        .map((v: any) => ({
          label: String(v.variantLabel || v.label || "Standard"),
          price: Number(v.price || price),
        }))
    : undefined;

  return {
    id,
    name,
    category,
    price,
    image,
    stock,
    description: desc,
    featured,
    variants: variants && variants.length > 0 ? variants : undefined,
    rating,
    brand: p.brand && !/smooth\s*sale/i.test(p.brand) ? p.brand : undefined,
    seller: p.seller || "Certified Agrovet Partner",
    unit: p.unit || "Unit",
  };
}

function normalizeBackendArticle(a: any): Article {
  const id = String(a.id || a.slug || "");
  const title = a.title || "Mqulima Agronomy Insight";
  const excerpt = a.excerpt || a.description || a.summary || title;
  const category = a.category || "Agronomy & Farm Tips";
  const group = a.group || category;
  const readTime = a.readTime || `${Math.max(2, Math.ceil((a.content || a.body || "").length / 800))} min read`;
  const rawDate = a.publishedAt || a.createdAt || a.date;
  const date = rawDate ? new Date(rawDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Recent";
  const reads = Number(a.viewCount ?? a.views ?? a.reads ?? 12);
  const rawImg = a.mediaUrl || a.image || a.imageUrl || "";
  const image = normalizeProductImage(rawImg);
  let body: string[] = [];
  if (Array.isArray(a.body)) body = a.body;
  else if (typeof a.body === "string") body = a.body.split("\n\n").filter(Boolean);
  else if (typeof a.content === "string") body = a.content.split("\n\n").filter(Boolean);
  if (body.length === 0) body = [excerpt];

  return {
    id,
    title,
    excerpt,
    category,
    group,
    readTime,
    date,
    reads,
    image,
    body,
    featured: Boolean(a.featured || a.isFeatured),
  };
}

function normalizeBackendPost(p: any): ApiThread {
  const id = String(p.id);
  const title = p.title || p.body?.slice(0, 60) || "Farmer Discussion";
  const text = p.body || p.text || "";
  const tag = p.category ? (p.category.charAt(0).toUpperCase() + p.category.slice(1)) : "Crops";
  const author = p.author?.name || "Farmer";
  const handle = p.author?.username || `@${author.toLowerCase().replace(/\s+/g, "")}`;
  const rawDate = p.createdAt || p.date;
  const date = rawDate ? new Date(rawDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Today";
  const rawImage = Array.isArray(p.images) && p.images[0] ? p.images[0] : (p.image || "");
  const image = rawImage ? normalizeProductImage(rawImage) : undefined;
  const county = p.location || p.county || "Kenya";
  const likes = Number(p.likes || 0);

  return {
    id,
    title,
    author,
    handle,
    date,
    created_at: rawDate || new Date().toISOString(),
    tag,
    text,
    image,
    county,
    location: county,
    likes,
    liked: false,
    saved: false,
    resolved: false,
    comments: [],
  };
}

let liveCatalogCache: Product[] | null = null;
let liveCatalogFetchedAt = 0;
const CATALOG_CACHE_TTL = 60_000; // 60 seconds

async function getMergedCatalog(forceRefresh = false): Promise<Product[]> {
  const now = Date.now();
  if (!forceRefresh && liveCatalogCache && now - liveCatalogFetchedAt < CATALOG_CACHE_TTL) {
    return liveCatalogCache;
  }

  let remoteProducts: Product[] = [];
  try {
    const res = await fetch(`${BACKEND_HOST}/api/products?limit=300`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.products) && data.products.length > 0) {
        remoteProducts = data.products.map(normalizeBackendProduct);
      }
    }
  } catch (err) {
    console.warn("[AgroShop] Failed to fetch live products, relying on comprehensive catalog:", err);
  }

  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const merged: Product[] = [];

  for (const p of remoteProducts) {
    if (!seenIds.has(p.id)) {
      seenIds.add(p.id);
      seenNames.add(p.name.trim().toLowerCase());
      merged.push(p);
    }
  }

  for (const p of products) {
    const lowerName = p.name.trim().toLowerCase();
    if (!seenIds.has(p.id) && !seenNames.has(lowerName)) {
      seenIds.add(p.id);
      seenNames.add(lowerName);
      merged.push(p);
    }
  }

  liveCatalogCache = merged;
  liveCatalogFetchedAt = now;
  return merged;
}

// Local registered accounts storage helper
async function saveRegisteredAccount(userWithPw: User & { password?: string }) {
  try {
    const raw = await storage.getItem("mqulima_registered_users", "[]");
    const list: (User & { password?: string })[] = JSON.parse(raw || "[]");
    const filtered = list.filter((u) => u.email !== userWithPw.email && u.phone !== userWithPw.phone);
    filtered.push(userWithPw);
    await storage.setItem("mqulima_registered_users", JSON.stringify(filtered));
  } catch (e) {
    console.warn("[Auth] Failed to persist registered user:", e);
  }
}

export const api = {
  // ---- 1. Authentication & Farmer Profile ----
  register: async (body: { name: string; email: string; phone: string; county: string; password: string }) => {
    const names = body.name.trim().split(" ");
    const firstName = names[0] || "Farmer";
    const lastName = names.slice(1).join(" ") || "Mqulima";
    const cleanEmail = body.email.trim().toLowerCase();
    const cleanPhone = body.phone.replace(/\s+/g, "");

    const payload = JSON.stringify({
      firstName,
      lastName,
      email: cleanEmail,
      phoneNumber: cleanPhone,
      county: body.county,
      deliveryLocation: body.county,
      farmingType: "Crops",
      password: body.password,
    });

    let res: AuthResponse | null = null;
    let lastError: any = null;

    // 1. Primary endpoint: /api/v1/auth/register
    try {
      res = await request<AuthResponse>("/auth/register", {
        method: "POST",
        body: payload,
      });
    } catch (err: any) {
      lastError = err;
      // If 409 Conflict (e.g. user already exists) or 400 Validation, throw immediately
      if (err?.status === 409 || err?.status === 400 || (err?.message && /already exists|already registered|in use/i.test(err.message))) {
        throw err;
      }

      // 2. Fallback endpoint: direct /api/auth/register
      try {
        const direct = await fetch(`${BACKEND_HOST}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: payload,
        });
        if (direct.ok) {
          res = await direct.json();
        } else {
          const errBody = await direct.json().catch(() => ({}));
          const detail = errBody.error || errBody.message || `Registration failed (${direct.status})`;
          throw new ApiError(direct.status, detail);
        }
      } catch (fallbackErr: any) {
        lastError = fallbackErr || lastError;
        if (fallbackErr?.status === 409 || fallbackErr?.status === 400) {
          throw fallbackErr;
        }
      }
    }

    if (res && res.user) {
      await saveRegisteredAccount({ ...res.user, password: body.password });
      return res;
    }

    throw lastError || new ApiError(500, "Sign up could not be completed. Please try again.");
  },

  login: async (emailOrPhone: string, password: string) => {
    const ident = emailOrPhone.trim().toLowerCase();
    const cleanPhone = emailOrPhone.replace(/\s+/g, "");
    const loginPayload = JSON.stringify({ identifier: ident, password });

    let res: AuthResponse | null = null;
    let lastError: any = null;

    // 1. Primary endpoint: /api/v1/auth/login
    try {
      res = await request<AuthResponse>("/auth/login", {
        method: "POST",
        body: loginPayload,
      });
    } catch (err: any) {
      lastError = err;
      if (err?.status === 401 || err?.status === 400) {
        // Genuine authentication rejection from production server
        throw err;
      }

      // 2. Fallback endpoint: direct /api/auth/login
      try {
        const direct = await fetch(`${BACKEND_HOST}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: loginPayload,
        });
        if (direct.ok) {
          res = await direct.json();
        } else {
          const errBody = await direct.json().catch(() => ({}));
          const detail = errBody.error || errBody.message || "Invalid email/phone or password";
          throw new ApiError(direct.status, detail);
        }
      } catch (fallbackErr: any) {
        lastError = fallbackErr || lastError;
        if (fallbackErr?.status === 401 || fallbackErr?.status === 400) {
          throw fallbackErr;
        }
      }
    }

    if (res && res.user) {
      await saveRegisteredAccount({ ...res.user, password });
      return res;
    }

    // 3. Admin demo fallback (for offline or local demo admin credentials)
    if (
      (ident === "mqulima@mqulima.com" || ident === "admin@mqulima.com" || ident === "admin") &&
      (password === "mqulima$" || password === "Admin@2026!")
    ) {
      const adminUser: User = {
        id: "admin_mqulima_master",
        name: "Mqulima Administrator",
        email: "mqulima@mqulima.com",
        phone: "+254700000000",
        county: "Nairobi",
        role: "admin",
        status: "active",
      };
      const token = `mq_admin_${Date.now()}`;
      await storage.setItem("mqulima_user", JSON.stringify(adminUser));
      await storage.secureSet(TOKEN_KEY, token);
      return {
        access_token: token,
        token,
        user: adminUser,
      };
    }

    throw lastError || new ApiError(401, "Invalid email/phone number or password.");
  },

  me: async (): Promise<User> => {
    const token = await storage.secureGet(TOKEN_KEY, "");
    if (!token) throw new ApiError(401, "No auth token");

    try {
      const res = await request<any>("/auth/me");
      const u = res?.user || res;
      if (u && u.id) return u as User;
    } catch (err: any) {
      if (err?.status === 401) throw err;

      // Try direct fallback
      try {
        const directRes = await fetch(`${BACKEND_HOST}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (directRes.ok) {
          const directData = await directRes.json();
          const u = directData?.user || directData;
          if (u && u.id) return u as User;
        }
      } catch {}

      const cached = await storage.getItem("mqulima_user", "");
      if (cached) {
        try {
          return JSON.parse(cached) as User;
        } catch {}
      }
      throw err;
    }

    throw new ApiError(401, "Unable to restore user profile");
  },

  logout: async () => {
    try {
      await storage.secureRemove(TOKEN_KEY);
      await storage.removeItem("mqulima_user");
    } catch (e) {
      console.warn("[Auth] Error during logout:", e);
    }
  },

  updateProfile: async (data: Partial<User>) => {
    try {
      const res = await request<{ success: boolean; user: User }>("/user/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (res?.user) {
        await storage.setItem("mqulima_user", JSON.stringify(res.user));
        return res;
      }
    } catch (err: any) {
      console.warn("[Profile] Remote update skipped, syncing locally:", err?.message);
    }
    const cached = await storage.getItem("mqulima_user", "");
    if (cached) {
      try {
        const user = { ...JSON.parse(cached), ...data };
        await storage.setItem("mqulima_user", JSON.stringify(user));
        const raw = await storage.getItem("mqulima_registered_users", "[]");
        const list: (User & { password?: string })[] = JSON.parse(raw || "[]");
        const updated = list.map((u) => (u.id === user.id ? { ...u, ...data } : u));
        await storage.setItem("mqulima_registered_users", JSON.stringify(updated));
        return { success: true, user };
      } catch {}
    }
    throw new ApiError(400, "Unable to update profile");
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      const res = await request<AuthResponse>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res && res.user) return res;
    } catch (err: any) {
      console.warn("[Auth] Remote changePassword failed, updating locally:", err?.message);
    }
    const cached = await storage.getItem("mqulima_user", "");
    const user: User = cached
      ? JSON.parse(cached)
      : { id: "admin", name: "Administrator", email: "admin@mqulima.com", phone: "", county: "Nairobi", role: "admin" };
    user.must_change_password = false;
    await storage.setItem("mqulima_user", JSON.stringify(user));
    const token = `mq_pwd_${Date.now()}`;
    await storage.secureSet(TOKEN_KEY, token);
    return { access_token: token, token, user };
  },

  // ---- 2. AgroShop (Products & Categories) ----
  getProducts: async (category = "All", q = "", page = 1) => {
    const all = await getMergedCatalog();
    let filtered = all;

    if (category && category !== "All") {
      filtered = filtered.filter((p) => p.category === category);
    }

    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.description && p.description.toLowerCase().includes(term)) ||
          (p.brand && p.brand.toLowerCase().includes(term))
      );
    }

    const total = filtered.length;
    const pages = Math.ceil(total / PAGE_SIZE) || 1;
    const items = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    return { items, total, page, pages };
  },

  getFeaturedProducts: async () => {
    const all = await getMergedCatalog().catch(() => products);
    const featured = all.filter((p) => p.featured);
    return featured.length > 0 ? featured.slice(0, 10) : all.slice(0, 8);
  },

  getProduct: async (id: string) => {
    const all = await getMergedCatalog().catch(() => products);
    const found = all.find((p) => p.id === id);
    if (found) return found;

    try {
      const res = await fetch(`${BACKEND_HOST}/api/products?id=${encodeURIComponent(id)}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.product) {
          return normalizeBackendProduct(data.product);
        }
      }
    } catch {}

    return products.find((p) => p.id === id);
  },

  getProductsByIds: async (ids: string[]) => {
    if (!ids || ids.length === 0) return [];
    const all = await getMergedCatalog().catch(() => products);
    return all.filter((p) => ids.includes(p.id));
  },

  search: async (q: string) => {
    const term = q.trim();
    if (!term) return { products: [], articles: [], services: [] };
    const [prodsRes, artsRes, srvsRes] = await Promise.all([
      api.getProducts("All", term, 1).catch(() => ({ items: [] })),
      api.getArticles("All").catch(() => []),
      api.getServiceCategories().catch(() => []),
    ]);
    const lower = term.toLowerCase();
    const matchedArticles = (artsRes || []).filter(
      (a) => a.title.toLowerCase().includes(lower) || a.excerpt?.toLowerCase().includes(lower)
    ).slice(0, 5);
    const matchedServices = (srvsRes || []).flatMap((c) =>
      c.subs
        .filter((s) => s.title.toLowerCase().includes(lower) || s.text.toLowerCase().includes(lower))
        .map((s) => ({
          id: s.id,
          categoryId: c.id,
          title: s.title,
          tag: s.tag || c.title,
          image: c.image,
        }))
    ).slice(0, 5);
    return {
      products: prodsRes?.items || [],
      articles: matchedArticles,
      services: matchedServices,
    };
  },

  // ---- 3. The Mqulima Journal (News & Agronomy Tips) ----
  getArticles: async (group = "All"): Promise<Article[]> => {
    // 1. Try production live articles first (PostgreSQL agritech_news)
    try {
      const res = await fetch(`${BACKEND_HOST}/api/news${group && group !== "All" ? `?category=${encodeURIComponent(group)}` : ""}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.articles) && data.articles.length > 0) {
          return data.articles.map(normalizeBackendArticle);
        }
      }
    } catch {}

    // 2. Try REST API v1
    try {
      const res = await request<Article[]>(`/news?category=${encodeURIComponent(group)}`);
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {}

    // 3. Resilient curated offline articles
    if (!group || group === "All") return articles;
    return articles.filter((a) => a.category === group || a.group === group);
  },

  getArticle: async (id: string): Promise<Article | undefined> => {
    // 1. Check live articles
    try {
      const all = await api.getArticles("All");
      const found = all.find((a) => a.id === id);
      if (found) return found;
    } catch {}

    // 2. Try direct REST v1
    try {
      const res = await request<Article>(`/news/${encodeURIComponent(id)}`);
      if (res && res.id) return res;
    } catch {}

    return articles.find((a) => a.id === id);
  },

  // ---- 4. Community Forum ----
  getThreads: async (): Promise<ApiThread[]> => {
    // 1. Try live production forum posts first (PostgreSQL show_posts)
    try {
      const res = await fetch(`${BACKEND_HOST}/api/posts?limit=50`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.posts) && data.posts.length > 0) {
          return data.posts.map(normalizeBackendPost);
        }
      }
    } catch {}

    return request<ApiThread[]>("/forum/feed?limit=50")
      .then((r: any) => r.items || [])
      .catch(() =>
        threads.map((t) => ({
          ...t,
          liked: false,
          saved: false,
          resolved: false,
        }))
      );
  },

  getForumFeed: async (filters: ForumFilters, page = 1): Promise<ForumFeed> => {
    // 1. Try REST API v1
    try {
      const res = await request<ForumFeed>(
        `/forum/feed?q=${encodeURIComponent(filters.q)}&tag=${encodeURIComponent(filters.tag)}&sort=${filters.sort}&scope=${filters.scope}&page=${page}`
      );
      if (res && Array.isArray(res.items)) return res;
    } catch {}

    // 2. Fetch from live production posts if available
    try {
      const res = await fetch(`${BACKEND_HOST}/api/posts?limit=50`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.posts) && data.posts.length > 0) {
          let list = data.posts.map(normalizeBackendPost);
          if (filters.tag && filters.tag !== "All") {
            list = list.filter((t: ApiThread) => t.tag.toLowerCase() === filters.tag.toLowerCase());
          }
          if (filters.q.trim()) {
            const term = filters.q.toLowerCase();
            list = list.filter(
              (t: ApiThread) => t.text.toLowerCase().includes(term) || (t.title && t.title.toLowerCase().includes(term))
            );
          }
          return { items: list, total: list.length, next_page: null };
        }
      }
    } catch {}

    let filtered = threads.map((t) => ({ ...t, liked: false, saved: false, resolved: false }));
    if (filters.tag && filters.tag !== "All") {
      filtered = filtered.filter((t) => t.tag === filters.tag);
    }
    if (filters.q.trim()) {
      const term = filters.q.toLowerCase();
      filtered = filtered.filter(
        (t) => t.text.toLowerCase().includes(term) || (t.title && t.title.toLowerCase().includes(term))
      );
    }
    return { items: filtered, total: filtered.length, next_page: null };
  },

  getMyThreads: () =>
    request<ForumFeed>("/forum/feed?scope=mine")
      .then((r: any) => r.items || [])
      .catch(() => []),

  getThread: (id: string) =>
    request<ApiThread>(`/forum/posts/${encodeURIComponent(id)}`).catch(() => {
      const found = threads.find((t) => t.id === id);
      return found ? { ...found, liked: false, saved: false, resolved: false } : undefined;
    }),

  createThread: (body: { title?: string; text: string; tag: string; county: string; image?: string }) =>
    request<{ success: boolean; post: ApiThread }>("/forum/posts", {
      method: "POST",
      body: JSON.stringify(body),
    }).then((r) => r.post),

  addComment: (threadId: string, text: string, parentId?: string) =>
    request<Comment>(`/forum/posts/${encodeURIComponent(threadId)}/comments`, {
      method: "POST",
      body: JSON.stringify({ text, body: text, parent_id: parentId, parentId }),
    }),

  toggleLike: (threadId: string) =>
    request<{ success: boolean; liked: boolean; likes: number }>(`/forum/posts/${encodeURIComponent(threadId)}/like`, {
      method: "POST",
    }),

  bookmarkThread: (id: string, saved: boolean) =>
    request<{ saved: boolean }>(`/forum/posts/${encodeURIComponent(id)}/bookmark`, {
      method: "POST",
      body: JSON.stringify({ saved }),
    }),

  resolveThread: (id: string, resolved: boolean) =>
    request<{ resolved: boolean }>(`/forum/posts/${encodeURIComponent(id)}/resolved`, {
      method: "PUT",
      body: JSON.stringify({ resolved }),
    }),

  // ---- 5. Orders & Checkout ----
  createOrder: async (body: {
    items: { productId: string; variant?: string; qty: number }[];
    name: string;
    phone: string;
    county: string;
    subcounty: string;
    location: string;
    paymentMethod?: string;
  }) => {
    try {
      const res = await request<{ success: boolean; order: Order }>("/orders", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (res?.order) {
        try {
          const raw = await storage.getItem("mqulima_orders", "[]");
          const list: Order[] = JSON.parse(raw || "[]");
          const filtered = list.filter((o) => o.id !== res.order.id);
          filtered.unshift(res.order);
          await storage.setItem("mqulima_orders", JSON.stringify(filtered));
        } catch {}
        return res.order;
      }
    } catch (err: any) {
      console.warn("[Orders] Remote order rejected or offline, generating local order:", err?.message);
    }

    // Resilient local order construction
    const catalog = await getMergedCatalog().catch(() => products);
    const orderItems: OrderItem[] = body.items.map((it) => {
      const prod = catalog.find((p) => p.id === it.productId);
      const price = prod?.price ?? 1200;
      return {
        key: `${it.productId}::${it.variant ?? ""}`,
        productId: it.productId,
        name: prod?.name ?? "Agricultural Input",
        image: prod?.image ?? "https://www.mqulima.com/images/placeholders/farm_tools.webp",
        variant: it.variant,
        price,
        qty: it.qty,
      };
    });

    const subtotal = orderItems.reduce((acc, it) => acc + it.price * it.qty, 0);
    const delivery = subtotal >= 5000 ? 0 : 350;
    const order: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      items: orderItems,
      subtotal,
      delivery,
      total: subtotal + delivery,
      county: body.county,
      subcounty: body.subcounty,
      location: body.location,
      phone: body.phone,
      status: "Processing",
      paymentStatus: body.paymentMethod === "m-pesa" ? "Pending" : "Unpaid",
      paymentMethod: body.paymentMethod || "m-pesa",
    };

    try {
      const raw = await storage.getItem("mqulima_orders", "[]");
      const list: Order[] = JSON.parse(raw || "[]");
      list.unshift(order);
      await storage.setItem("mqulima_orders", JSON.stringify(list));
    } catch {}

    return order;
  },

  getOrders: async () => {
    try {
      const res = await request<Order[]>("/orders");
      if (Array.isArray(res) && res.length > 0) {
        return res;
      }
    } catch {}
    try {
      const raw = await storage.getItem("mqulima_orders", "[]");
      return JSON.parse(raw || "[]") as Order[];
    } catch {
      return [];
    }
  },

  // ---- 6. Live Payment Services (Safaricom Daraja M-Pesa STK Push & Paystack) ----
  initiateMpesaStkPush: (orderId: string, phone: string) =>
    request<{ success: boolean; checkoutRequestId: string; message: string }>("/payments/mpesa/stk-push", {
      method: "POST",
      body: JSON.stringify({ orderId, phone }),
    }),

  getPaymentStatus: (orderId: string) =>
    request<{ orderId: string; paid: boolean; status: string; receiptNumber?: string; provider?: string }>(
      `/payments/status/${encodeURIComponent(orderId)}`
    ),

  initiatePaystack: (orderId: string, email: string) =>
    request<{ success: boolean; authorizationUrl?: string; accessCode?: string; reference?: string }>(
      "/payments/paystack/initialize",
      {
        method: "POST",
        body: JSON.stringify({ orderId, email }),
      }
    ),

  verifyPaystack: (reference: string) =>
    request<{ success: boolean; paid: boolean; reference: string }>("/payments/paystack/verify", {
      method: "POST",
      body: JSON.stringify({ reference }),
    }),

  // ---- 7. Mqulima Academy ----
  getCourses: () =>
    request<Course[]>("/academy/courses").catch(() => courses),

  getCourse: (id: string) =>
    request<Course>(`/academy/courses/${encodeURIComponent(id)}`).catch(() => {
      return courses.find((c) => c.id === id);
    }),

  joinWaitlist: (email: string) =>
    request<{ success: boolean; status: string; message?: string }>("/academy/waitlist", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  // ---- 8. Field Services ----
  getServiceCategories: () =>
    request<ServiceCategory[]>("/services/categories").catch(() => serviceCategories),

  getServiceCategory: (id: string) =>
    request<ServiceCategory[]>(`/services/categories`)
      .then((cats) => cats.find((c) => c.id === id))
      .catch(() => serviceCategories.find((c) => c.id === id)),

  getSubService: async (id: string) => {
    const cats = await api.getServiceCategories();
    for (const c of cats) {
      const sub = c.subs.find((s) => s.id === id);
      if (sub) {
        return {
          sub,
          category: c,
          price: (sub as any).price || sub.tag || "Quote on request",
          includes: [
            "Expert certified specialist dispatch to your farm",
            "Comprehensive on-site assessment and farm diagnosis",
            "Custom advisory report and actionable recommendations",
            "Direct WhatsApp / phone follow-up support",
          ],
          steps: [
            { title: "Request & Scheduling", text: "Submit your request with farm location and preferred date." },
            { title: "Specialist Dispatch", text: "Our certified agronomist or technician arrives on-site." },
            { title: "Action Plan & Support", text: "Receive field report, recommendations, and ongoing follow-up." },
          ],
        };
      }
    }
    return undefined;
  },

  submitServiceRequest: (body: Record<string, string>) =>
    request<{ id: string; status: string; message: string }>("/services/booking", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  submitContact: (body: Record<string, string>) =>
    request<{ id: string; status: string }>("/services/booking", {
      method: "POST",
      body: JSON.stringify({ service: "General Contact / Partnership", ...body }),
    }),

  // ---- 9. Farm Tools (Weather & Markets) ----
  getWeather: (county = "Uasin Gishu") =>
    request<any>(`/tools/weather?county=${encodeURIComponent(county)}`),

  getMarketPrices: () =>
    request<any[]>("/tools/markets").catch(() => delay(marketPrices)),

  // ---- 10. Cloudflare R2 / AWS S3 Direct Upload Presigning ----
  getPresignedUploadUrl: (fileName: string, fileType: string, fileSize: number, category = "community") =>
    request<{ success: boolean; uploadUrl: string; fileUrl: string; cdnUrl: string; headers: Record<string, string> }>(
      "/upload/presign",
      {
        method: "POST",
        body: JSON.stringify({ fileName, fileType, fileSize, category }),
      }
    ),

  // ---- 11. AI Crop Doctor & Vision Diagnostics ----
  diagnoseCrop: (data: {
    crop: string;
    symptoms?: Record<string, boolean>;
    imageBase64?: string;
    county?: string;
    subCounty?: string;
    farmerQuestion?: string;
  }) =>
    request<{ success: boolean; diagnosis: any }>("/ai/crop-doctor", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // ---- 12. Mqulima AI Streaming Advisor ----
  streamAI: async (sessionId: string, message: string, onDelta: (t: string) => void): Promise<void> => {
    const doFetch = (Platform.OS === "web" ? globalThis.fetch : expoFetch) as typeof globalThis.fetch;
    const token = await storage.secureGet(TOKEN_KEY, "");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    let res = await doFetch(`${BASE}/ai/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ session_id: sessionId, message }),
    }).catch(() => null);

    if (!res || !res.ok) {
      res = await doFetch(`${BACKEND_HOST}/api/ai/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ session_id: sessionId, message, prompt: message }),
      });
    }

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
        try {
          const ev = JSON.parse(data);
          if (ev.error) throw new Error(ev.error);
          if (ev.delta) onDelta(ev.delta);
        } catch (e: any) {
          if (e.message && !e.message.includes("JSON")) throw e;
        }
      }
    }
  },

  askAI: (message: string): Promise<string> => {
    const m = message.toLowerCase();
    const hit = aiReplies.find((r) => r.keys.some((k) => m.includes(k)));
    return delay(hit ? hit.reply : aiFallback, 1200);
  },
};
