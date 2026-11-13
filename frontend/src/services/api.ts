// Unified data-access layer: HTTP calls to the Mqulima Production Platform (/api/v1).
import { type Article, articles as staticArticles } from "@/src/data/articles";
import { type Product, PRODUCT_TAXONOMY } from "@/src/data/products";
import { type Thread, type Comment, threads as staticThreads } from "@/src/data/forum";
import { type ServiceCategory, type SubService, serviceCategories as staticServiceCategories } from "@/src/data/services";
import { type Course } from "@/src/data/academy";
import { storage } from "@/src/utils/storage";
import { uploadForm, type LocalFile } from "@/src/utils/upload";
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
export type ForumFeed = {
  items: ApiThread[];
  total: number;
  next_page: number | null;
  suggestedFarmers?: any[];
  sokoListings?: any[];
  marketPrices?: any[];
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const TRANSIENT_STATUSES = new Set([408, 429, 502, 503, 504]);
const sleepMs = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type RequestOptions = RequestInit & {
  timeoutMs?: number;
  retries?: number;
  idempotent?: boolean;
};

export async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const token = await storage.secureGet(TOKEN_KEY, "");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const method = (init.method || "GET").toUpperCase();
  const hasIdempotencyKey = Boolean(headers["Idempotency-Key"] || headers["idempotency-key"]);
  const canRetry = method === "GET" || method === "HEAD" || hasIdempotencyKey || Boolean(init.idempotent);
  const maxRetries = canRetry ? (init.retries ?? 2) : 0;
  const timeoutMs = init.timeoutMs ?? (path.startsWith("/ai/") ? 45000 : 15000);

  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    if (init.signal) {
      init.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    try {
      const res = await fetch(`${BASE}${path}`, { ...init, headers, signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        return res.json();
      }

      const body = await res.json().catch(() => ({}));
      const detail = Array.isArray(body.detail) ? body.detail[0]?.msg : (body.error || body.message || body.detail);
      const err = new ApiError(res.status, detail ?? `Request failed (${res.status})`);

      if (canRetry && TRANSIENT_STATUSES.has(res.status) && attempt < maxRetries) {
        const retryAfterSec = Number(res.headers.get("retry-after"));
        const backoff = Number.isFinite(retryAfterSec) && retryAfterSec > 0
          ? Math.min(8000, retryAfterSec * 1000)
          : Math.min(8000, 500 * Math.pow(2, attempt)) + Math.floor(Math.random() * 250);
        await sleepMs(backoff);
        continue;
      }
      throw err;
    } catch (err: any) {
      clearTimeout(timer);
      if (err instanceof ApiError) {
        throw err;
      }
      const isTimeout = err?.name === "AbortError";
      lastErr = new ApiError(
        isTimeout ? 408 : 0,
        isTimeout ? "Request timed out on slow network. Please retry." : (err?.message || "Network unavailable")
      );
      if (canRetry && attempt < maxRetries) {
        const backoff = Math.min(8000, 500 * Math.pow(2, attempt)) + Math.floor(Math.random() * 250);
        await sleepMs(backoff);
        continue;
      }
      throw lastErr;
    }
  }
  throw lastErr;
}

const delay = <T,>(data: T, ms = 300): Promise<T> => new Promise((r) => setTimeout(() => r(data), ms));

// =========================================================================
// AgroShop Helpers: Normalization, Category Mapping & Live Backend Sync
// =========================================================================

function normalizeProductImage(img?: string): string {
  if (!img) return `${BACKEND_HOST}/images/placeholders/farm_tools.webp`;
  if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("data:")) return img;
  if (img.startsWith("/")) return `${BACKEND_HOST}${img}`;
  return `${BACKEND_HOST}/${img}`;
}

function mapBackendCategory(cat?: string, sub?: string, name?: string): string {
  const c = (cat || "").toLowerCase();
  const s = (sub || "").toLowerCase();
  const n = (name || "").toLowerCase();

  if (c.includes("seed") || s.includes("seed") || n.includes("seed") || n.includes("spinach") || n.includes("cabbage") || n.includes("tomato") || n.includes("onion") || n.includes("carrot") || n.includes("maize") || n.includes("bean") || n.includes("sukuma") || n.includes("watermelon") || n.includes("capsicum")) {
    return "Seeds";
  }
  if (c.includes("equip") || c.includes("tool") || s.includes("machin") || n.includes("sprayer") || n.includes("knapsack") || n.includes("jembe") || n.includes("panga") || n.includes("incubator") || n.includes("chaff") || n.includes("nozzle") || n.includes("hose")) {
    return "Farm Equipment";
  }
  if (c.includes("fert") || s.includes("fert") || s.includes("foliar") || n.includes("fertilizer") || n.includes("foliar") || n.includes("npk") || n.includes("dap") || n.includes("can ") || n.includes("urea") || n.includes("mavuno") || n.includes("easygro") || n.includes("algreen") || n.includes("hygro") || n.includes("booster")) {
    return "Fertilizers";
  }
  if (s.includes("feed") || s.includes("supplement") || n.includes("feed") || n.includes("mash") || n.includes("meal") || n.includes("layer") || n.includes("starter") || n.includes("grower") || n.includes("kienyeji") || n.includes("molasses") || n.includes("maclik") || n.includes("mineral")) {
    return "Animal Feeds";
  }
  if (s.includes("health") || s.includes("vet") || n.includes("dewormer") || n.includes("vaccine") || n.includes("salve") || n.includes("lick") || n.includes("salt") || n.includes("injection") || n.includes("drench") || n.includes("kupe") || n.includes("tick") || n.includes("nilzan") || n.includes("valbazen") || n.includes("albafas")) {
    return "Animal Health";
  }
  if (c.includes("animal")) {
    if (n.includes("feed") || n.includes("mash") || n.includes("meal") || n.includes("chick")) return "Animal Feeds";
    return "Animal Health";
  }
  if (c.includes("protect") || c.includes("chem") || s.includes("pesticide") || s.includes("fungicide") || s.includes("insecticide") || s.includes("herbicide") || n.includes("weedal") || n.includes("zetanil") || n.includes("dudu") || n.includes("rocket") || n.includes("ridomil")) {
    return "Inputs & Agrochemicals";
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
  const category = mapBackendCategory(p.field || p.category, p.subcategory, name);
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

function cleanHtmlToParagraphs(raw: string): string[] {
  return raw
    .replace(/<\/(p|div|h1|h2|h3|h4|li|blockquote|tr)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function normalizeBackendArticle(a: any): Article {
  const id = String(a.id || a.slug || "");
  const slug = String(a.slug || a.id || "");
  const title = a.title || "Mqulima Agronomy Insight";
  const excerpt = a.excerpt || a.description || a.summary || title;
  const category = a.category || "Agronomy & Farm Tips";
  const group = a.group || category;
  const readTime = a.readTime || `${Math.max(2, Math.ceil((a.content || a.body || "").length / 800))} min read`;
  const rawDate = a.publishedAt || a.createdAt || a.date;
  let date = "Recent";
  if (rawDate) {
    const d = new Date(rawDate);
    date = Number.isNaN(d.getTime())
      ? String(rawDate)
      : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }
  const reads = Number(a.viewCount ?? a.views ?? a.reads ?? 12);
  const rawImg = a.coverImage || a.mediaUrl || a.image || a.imageUrl || "";
  const image = normalizeProductImage(rawImg);
  let body: string[] = [];
  if (Array.isArray(a.body)) {
    body = a.body.flatMap((seg: string) => cleanHtmlToParagraphs(String(seg)));
  } else if (typeof a.body === "string") {
    body = cleanHtmlToParagraphs(a.body);
  } else if (typeof a.content === "string") {
    body = cleanHtmlToParagraphs(a.content);
  }
  if (body.length === 0) body = [excerpt];

  return {
    id,
    slug,
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
    author: a.author || {
      name: "Mqulima Desk",
      role: "Editorial & Agronomy Desk",
      avatarInitials: "MD",
    },
  };
}

function normalizeBackendPost(p: any): ApiThread {
  const id = String(p.id || `t-${Date.now()}`);
  const text = String(p.text || p.body || p.caption || "");
  const title = String(p.title || "");
  const rawTag = String(p.tag || p.category || "Farm Progress");
  const tag = rawTag.charAt(0).toUpperCase() + rawTag.slice(1);
  const author =
    typeof p.author === "string"
      ? p.author
      : p.author?.name || p.authorName || "Mqulima Farmer";
  const rawHandle =
    p.handle ||
    (typeof p.author === "object" ? p.author?.username : undefined) ||
    `@mqulima_${author.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const handle = String(rawHandle).startsWith("@") ? String(rawHandle) : `@${rawHandle}`;
  const rawDate = p.created_at || p.createdAt || p.date || new Date().toISOString();
  const parsedDate = new Date(rawDate);
  const date = Number.isNaN(parsedDate.getTime())
    ? String(rawDate)
    : parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const rawImages: string[] = Array.isArray(p.images) && p.images.length > 0
    ? p.images.filter(Boolean).map((u: any) => String(u))
    : Array.isArray(p.mediaUrls) && p.mediaUrls.length > 0
      ? p.mediaUrls.filter(Boolean).map((u: any) => String(u))
      : p.image
        ? [String(p.image)]
        : [];
  const images = rawImages.map(normalizeProductImage);
  const image = images[0];
  const county = String(p.county || p.location || "Kenya").replace(/^📍\s*/, "");
  const location = String(p.location || p.county || "Kenya").replace(/^📍\s*/, "");
  const likes = Number(p.likes ?? p.like_count ?? 0);
  const comments: Comment[] = Array.isArray(p.comments)
    ? p.comments.map((c: any, idx: number) => ({
        id: String(c.id || `${id}-c-${idx}`),
        author:
          typeof c.author === "string"
            ? c.author
            : c.authorName || c.author?.name || "Mqulima Farmer",
        text: String(c.text || c.body || ""),
        time: String(c.time || c.createdAt || c.created_at || rawDate),
        user_id: c.user_id || c.userId || null,
        parent_id: c.parent_id || c.parentId || null,
      }))
    : [];

  return {
    id,
    title,
    author,
    handle,
    date,
    created_at: Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
    tag,
    text,
    image,
    images,
    county,
    location,
    likes,
    liked: Boolean(p.liked || p.hasLiked),
    saved: Boolean(p.saved || p.hasSaved),
    resolved: Boolean(p.resolved),
    comments,
    user_id: p.user_id || p.userId || null,
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
    const res = await fetch(`${BASE}/products?limit=500`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      const list = data.items || data.products || (Array.isArray(data) ? data : []);
      if (Array.isArray(list) && list.length > 0) {
        remoteProducts = list.map(normalizeBackendProduct);
      }
    }
  } catch (err) {
    console.warn("[AgroShop] Failed to fetch live products from /api/v1/products:", err);
  }

  if (remoteProducts.length === 0) {
    try {
      const res = await fetch(`${BACKEND_HOST}/api/products?limit=500`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.items || data.products || (Array.isArray(data) ? data : []);
        if (Array.isArray(list) && list.length > 0) {
          remoteProducts = list.map(normalizeBackendProduct);
        }
      }
    } catch {}
  }

  const seenIds = new Set<string>();
  const merged: Product[] = [];
  for (const p of remoteProducts) {
    if (!seenIds.has(p.id)) {
      seenIds.add(p.id);
      merged.push(p);
    }
  }

  if (merged.length > 0) {
    liveCatalogCache = merged;
    liveCatalogFetchedAt = now;
  }
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

// Smart multi-token search matcher for products
export function matchProductTokens(p: Product, q: string): boolean {
  const clean = q.trim().toLowerCase();
  if (!clean) return true;
  const tokens = clean.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const name = (p.name || "").toLowerCase();
  const desc = (p.description || "").toLowerCase();
  const brand = (p.brand || "").toLowerCase();
  const cat = (p.category || "").toLowerCase();
  const variants = (p.variants || []).map((v) => (v.label || "").toLowerCase()).join(" ");
  const seller = (p.seller || "").toLowerCase();
  const fullText = `${name} ${desc} ${brand} ${cat} ${variants} ${seller}`;

  return tokens.every((token) => {
    // 1. Direct substring match
    if (fullText.includes(token)) return true;

    // 2. Singular / plural stem
    if (token.endsWith("s") && token.length > 3 && fullText.includes(token.slice(0, -1))) {
      return true;
    }
    if (fullText.includes(`${token}s`)) {
      return true;
    }

    // 3. Common agro synonyms
    if ((token === "fertilizer" || token === "fertiliser") && (fullText.includes("fert") || fullText.includes("npk") || fullText.includes("dap") || fullText.includes("can") || fullText.includes("urea"))) {
      return true;
    }
    if ((token === "seed" || token === "seeds") && (fullText.includes("seed") || fullText.includes("f1") || fullText.includes("hybrid"))) {
      return true;
    }
    if ((token === "spray" || token === "sprayer" || token === "sprayers") && (fullText.includes("sprayer") || fullText.includes("spray") || fullText.includes("knapsack"))) {
      return true;
    }
    if ((token === "feed" || token === "feeds") && (fullText.includes("feed") || fullText.includes("meal") || fullText.includes("mash"))) {
      return true;
    }
    if ((token === "pesticide" || token === "chemical" || token === "chemicals") && (fullText.includes("insecticide") || fullText.includes("fungicide") || fullText.includes("herbicide") || fullText.includes("agrochemical"))) {
      return true;
    }

    return false;
  });
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
      name: body.name.trim(),
      phone: cleanPhone,
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
    const loginPayload = JSON.stringify({ identifier: ident, email: ident, phone: cleanPhone, password });

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

  deleteAccount: async () => {
    try {
      return await request<{ success: boolean; deleted: boolean; message?: string }>("/account", {
        method: "DELETE",
      });
    } catch (err: any) {
      if (err?.status === 404) {
        return await request<{ success: boolean; deleted: boolean; message?: string }>("/auth/me", {
          method: "DELETE",
        });
      }
      throw err;
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

  // ---- 2. AgroShop (Products & Categories) ----
  getProducts: async (category = "All", q = "", page = 1, subcategory?: string) => {
    const all = await getMergedCatalog();
    let filtered = all;

    if (category && category !== "All") {
      filtered = filtered.filter((p) => p.category === category);
    }

    if (subcategory && subcategory !== "all") {
      const catEntry = PRODUCT_TAXONOMY.find((c) => c.id === category);
      const subEntry = catEntry?.subcategories.find((s) => s.id === subcategory);
      if (subEntry && subEntry.keywords.length > 0) {
        filtered = filtered.filter((p) => {
          const name = p.name.toLowerCase();
          const desc = (p.description || "").toLowerCase();
          return subEntry.keywords.some((kw) => name.includes(kw) || desc.includes(kw));
        });
      }
    }

    if (q && q.trim()) {
      filtered = filtered.filter((p) => matchProductTokens(p, q));
    }

    const total = filtered.length;
    const pages = Math.ceil(total / PAGE_SIZE) || 1;
    const items = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    return { items, total, page, pages };
  },

  getFeaturedProducts: async () => {
    try {
      const res = await fetch(`${BASE}/products/featured`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.items || data.products || []);
        if (list.length > 0) {
          return list.map(normalizeBackendProduct);
        }
      }
    } catch {}

    const all = await getMergedCatalog();
    const featured = all.filter((p) => p.featured);
    return featured.length > 0 ? featured.slice(0, 20) : all.slice(0, 12);
  },

  getProduct: async (id: string) => {
    try {
      const res = await fetch(`${BASE}/products/${encodeURIComponent(id)}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        const p = data.product || data;
        if (p && (p.id || p.name)) {
          return normalizeBackendProduct(p);
        }
      }
    } catch {}

    const all = await getMergedCatalog();
    return all.find((p) => p.id === id);
  },

  getProductsByIds: async (ids: string[]) => {
    if (!ids || ids.length === 0) return [];
    try {
      const res = await fetch(`${BASE}/products/by-ids?ids=${encodeURIComponent(ids.join(","))}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map(normalizeBackendProduct);
        }
      }
    } catch {}

    const all = await getMergedCatalog();
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
    try {
      const query = group && group !== "All" ? `?group=${encodeURIComponent(group)}` : "";
      const res = await fetch(`${BASE}/articles${query}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.articles || data.items || []);
        if (Array.isArray(list) && list.length > 0) {
          return list.map(normalizeBackendArticle);
        }
      }
    } catch (err) {
      console.warn("[Articles] Live articles fetch from /articles failed:", err);
    }

    try {
      const res = await fetch(`${BASE}/news${group && group !== "All" ? `?category=${encodeURIComponent(group)}` : ""}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.articles || data.items || []);
        if (Array.isArray(list) && list.length > 0) {
          return list.map(normalizeBackendArticle);
        }
      }
    } catch {}

    if (group && group !== "All") {
      return staticArticles.filter(
        (a) =>
          a.group.toLowerCase() === group.toLowerCase() ||
          a.category.toLowerCase().includes(group.toLowerCase())
      );
    }
    return staticArticles;
  },

  getArticle: async (id: string): Promise<Article | undefined> => {
    try {
      const res = await fetch(`${BASE}/articles/${encodeURIComponent(id)}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.id || data.title)) {
          return normalizeBackendArticle(data);
        }
      }
    } catch {}

    try {
      const res = await fetch(`${BASE}/news/${encodeURIComponent(id)}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.id || data.title)) {
          return normalizeBackendArticle(data);
        }
      }
    } catch {}

    const all = await api.getArticles("All");
    return (
      all.find((a) => a.id === id || a.slug === id) ||
      staticArticles.find((a) => a.id === id || a.slug === id)
    );
  },

  // ---- 4. Community Forum ----
  getThreads: async (): Promise<ApiThread[]> => {
    try {
      const res = await fetch(`${BASE}/threads`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.items || data.posts || []);
        if (Array.isArray(list)) {
          return list.map(normalizeBackendPost);
        }
      }
    } catch (err) {
      console.warn("[Forum] Failed to fetch live threads:", err);
    }
    return [];
  },

  getForumFeed: async (filters: ForumFilters, page = 1): Promise<ForumFeed> => {
    const params = new URLSearchParams();
    if (filters.q?.trim()) params.append("q", filters.q.trim());
    if (filters.tag && filters.tag !== "All") params.append("tag", filters.tag);
    if (filters.sort) params.append("sort", filters.sort);
    if (filters.scope) params.append("scope", filters.scope);
    params.append("page", String(page));

    const token = await storage.secureGet(TOKEN_KEY, "");
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${BASE}/threads/feed?${params.toString()}`, { headers });
    if (!res.ok) {
      throw new ApiError(res.status, `Failed to load forum feed (${res.status})`);
    }
    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items.map(normalizeBackendPost) : [];
    const sokoListings = Array.isArray(data?.sokoListings)
      ? data.sokoListings.map((s: any) => ({
          ...s,
          images: Array.isArray(s.images) ? s.images.map(normalizeProductImage) : [],
        }))
      : [];
    return {
      items,
      total: Number(data?.total ?? items.length),
      next_page: data?.next_page ?? null,
      suggestedFarmers: Array.isArray(data?.suggestedFarmers) ? data.suggestedFarmers : [],
      sokoListings,
      marketPrices: Array.isArray(data?.marketPrices) ? data.marketPrices : [],
    };
  },

  createSokoListing: (body: {
    commodityName: string;
    type: "crop" | "livestock" | "fruit";
    price: number;
    quantity: string;
    location: string;
    description: string;
    images?: string[];
    phone?: string;
  }) =>
    request<{ success: boolean; listing: any }>("/forum/soko", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  submitForumConsultation: (body: {
    name: string;
    phone: string;
    email?: string;
    county: string;
    specialty: string;
    channel: "call" | "whatsapp" | "visit";
    urgency: "normal" | "urgent" | "emergency";
    message: string;
  }) =>
    request<{ success: boolean; ticketId: string; ticket: any }>("/forum/consult", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getDirectMessages: (otherUsername?: string) =>
    request<{ success: boolean; conversations: any[]; messages: any[] }>(
      `/forum/messages${otherUsername ? `?otherUsername=${encodeURIComponent(otherUsername)}` : ""}`
    ),

  sendDirectMessage: (recipientUsername: string, body: string, imageUrl?: string) =>
    request<{ success: boolean; message: any }>("/forum/messages", {
      method: "POST",
      body: JSON.stringify({ recipientUsername, body, imageUrl }),
    }),

  getMyThreads: async () => {
    try {
      const token = await storage.secureGet(TOKEN_KEY, "");
      const headers: Record<string, string> = { Accept: "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${BASE}/threads?scope=mine`, { headers });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.items || []);
        return list.map(normalizeBackendPost);
      }
    } catch {}
    return [];
  },

  getThread: async (id: string) => {
    const token = await storage.secureGet(TOKEN_KEY, "");
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${BASE}/threads/${encodeURIComponent(id)}`, { headers });
    if (!res.ok) return undefined;
    const data = await res.json();
    if (data && data.id) {
      return normalizeBackendPost(data);
    }
    return undefined;
  },

  uploadForumImage: async (file: LocalFile): Promise<{ imageUrl: string; previewUrl: string }> => {
    const token = await storage.secureGet(TOKEN_KEY, "");
    const res = await uploadForm(`${BASE}/forum/upload`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      files: { file },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || (!body.imageUrl && !body.url)) {
      throw new ApiError(res.status, body.error || "Could not upload image. Please try again.");
    }
    const rawUrl = String(body.imageUrl || body.url);
    return {
      imageUrl: rawUrl,
      previewUrl: normalizeProductImage(rawUrl),
    };
  },

  resolveMediaUrl: (url?: string) => (url ? normalizeProductImage(url) : ""),

  createThread: (body: { title?: string; text: string; tag: string; county: string; image?: string; images?: string[] }) =>
    request<ApiThread>("/threads", {
      method: "POST",
      body: JSON.stringify(body),
    }).then(normalizeBackendPost),

  addComment: (threadId: string, text: string, parentId?: string) =>
    request<Comment>(`/threads/${encodeURIComponent(threadId)}/comments`, {
      method: "POST",
      body: JSON.stringify({ text, body: text, parent_id: parentId, parentId }),
    }),

  toggleLike: (threadId: string) =>
    request<{ success: boolean; liked: boolean; likes: number }>(`/threads/${encodeURIComponent(threadId)}/like`, {
      method: "POST",
    }),

  bookmarkThread: (id: string, saved: boolean) =>
    request<{ saved: boolean }>(`/threads/${encodeURIComponent(id)}/bookmark`, {
      method: "PUT",
      body: JSON.stringify({ saved }),
    }),

  resolveThread: (id: string, resolved: boolean) =>
    request<{ resolved: boolean }>(`/threads/${encodeURIComponent(id)}/resolved`, {
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
    const res = await request<any>("/orders", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const order: Order = res.order || res;
    if (order && order.id) {
      try {
        const raw = await storage.getItem("mqulima_orders", "[]");
        const list: Order[] = JSON.parse(raw || "[]");
        const filtered = list.filter((o) => o.id !== order.id);
        filtered.unshift(order);
        await storage.setItem("mqulima_orders", JSON.stringify(filtered));
      } catch {}
      return order;
    }
    throw new ApiError(500, "Unable to place order. Please try again.");
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
    request<{
      orderId: string;
      paid: boolean;
      failed?: boolean;
      cancelled?: boolean;
      status: string;
      receiptNumber?: string | null;
      provider?: string;
      message?: string | null;
    }>(`/payments/status/${encodeURIComponent(orderId)}`),

  initiatePaystack: (
    orderId: string,
    email: string,
    opts?: { channels?: string[]; paymentMethod?: string; callbackUrl?: string }
  ) =>
    request<{ success: boolean; authorizationUrl?: string; accessCode?: string; reference?: string }>(
      "/payments/paystack/initialize",
      {
        method: "POST",
        body: JSON.stringify({ orderId, email, ...opts }),
      }
    ),

  verifyPaystack: (reference: string) =>
    request<{ success: boolean; paid: boolean; reference: string }>("/payments/paystack/verify", {
      method: "POST",
      body: JSON.stringify({ reference }),
    }),

  // ---- 7. Mqulima Academy ----
  getCourses: async (): Promise<Course[]> => {
    try {
      const res = await request<Course[]>("/courses");
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {}
    try {
      const res = await request<Course[]>("/academy/courses");
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {}
    return [];
  },

  getCourse: async (id: string): Promise<Course | undefined> => {
    try {
      const res = await request<Course>(`/courses/${encodeURIComponent(id)}`);
      if (res && res.id) return res;
    } catch {}
    try {
      const res = await request<Course>(`/academy/courses/${encodeURIComponent(id)}`);
      if (res && res.id) return res;
    } catch {}
    const all = await api.getCourses();
    return all.find((c) => c.id === id);
  },

  joinWaitlist: (email: string) =>
    request<{ success: boolean; status: string; message?: string }>("/academy/waitlist", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  // ---- 8. Field Services ----
  getServiceCategories: async (): Promise<ServiceCategory[]> => {
    try {
      const res = await request<ServiceCategory[]>("/services/categories");
      if (Array.isArray(res) && res.length > 0 && res[0].id === "finance") {
        return res.map((c) => ({
          ...c,
          image: normalizeProductImage(c.image),
          subs: (c.subs || []).map((sub) => ({
            ...sub,
            image: normalizeProductImage(sub.image),
          })),
        }));
      }
    } catch (err) {
      console.warn("[Services] Failed to fetch live service categories:", err);
    }
    return staticServiceCategories;
  },

  getServiceCategory: async (id: string): Promise<ServiceCategory | undefined> => {
    try {
      const res = await request<ServiceCategory>(`/services/categories/${encodeURIComponent(id)}`);
      if (res && res.id) {
        return {
          ...res,
          image: normalizeProductImage(res.image),
          subs: (res.subs || []).map((sub) => ({
            ...sub,
            image: normalizeProductImage(sub.image),
          })),
        };
      }
    } catch {}
    const cats = await api.getServiceCategories();
    return cats.find((c) => c.id === id);
  },

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
  getWeather: (county = "Uasin Gishu", forceRefresh = false) =>
    request<any>(
      `/tools/weather?county=${encodeURIComponent(county)}${forceRefresh ? "&refresh=1" : ""}`
    ),

  getMarketPrices: async (forceRefresh = false): Promise<any[]> => {
    try {
      const res = await request<any[]>(
        `/tools/markets${forceRefresh ? "?refresh=1" : ""}`
      );
      if (Array.isArray(res) && res.length > 0) {
        return res.map((m: any) => {
          const entries = Array.isArray(m.entries) ? m.entries : [];
          const primaryHub = entries[0]?.region;
          const hubLabel = m.market
            ? String(m.market)
            : entries.length > 1
            ? `${primaryHub} (+${entries.length - 1} hubs)`
            : primaryHub || "Kenya Avg";
          const numericPrice =
            typeof m.price === "number"
              ? m.price
              : typeof m.avgPrice === "number"
              ? m.avgPrice
              : Number(entries[0]?.price ?? 0);
          const numericChange =
            typeof m.change === "number"
              ? m.change
              : typeof m.changePercent === "number"
              ? m.changePercent
              : 0;
          return {
            ...m,
            id: String(m.id ?? m.name),
            emoji: m.emoji ?? m.icon ?? "🌾",
            category: m.category ?? m.type ?? "General Produce",
            type: m.type ?? m.category ?? "General Produce",
            market: hubLabel,
            price: Math.round(numericPrice),
            change: Number(numericChange.toFixed(1)),
            source: m.source ?? entries[0]?.source ?? "KAMIS Live Feed",
            entries,
          };
        });
      }
    } catch (err) {
      console.warn("[Markets] Failed to fetch live market prices:", err);
    }
    return [];
  },

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
      timeoutMs: 45000,
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

  askAI: async (message: string): Promise<string> => {
    try {
      const res = await fetch(`${BASE}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: "ask_ai", message }),
      });
      if (res.ok) {
        const text = await res.text();
        const lines = text.split("\n");
        let combined = "";
        for (const line of lines) {
          if (line.startsWith("data:") && !line.includes("[DONE]")) {
            try {
              const data = JSON.parse(line.replace("data:", "").trim());
              if (data.delta) combined += data.delta;
            } catch {}
          }
        }
        if (combined.trim()) return combined.trim();
      }
    } catch (err) {
      console.warn("[AI] Live chat query error:", err);
    }
    return "Habari! Mqulima AI is ready to advise on your crops, livestock, soil, pest management, and Kenyan market prices. What would you like to know?";
  },
};

