import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { storage } from "@/src/utils/storage";
import { api, TOKEN_KEY, User } from "@/src/services/api";
import { queryClient } from "@/src/query-client";

export type { User };
export type CartItem = {
  key: string;
  productId: string;
  name: string;
  image: string;
  variant?: string;
  price: number;
  qty: number;
};

type State = { cart: CartItem[]; saved: string[] };

const initial: State = { cart: [], saved: [] };
const KEY = "mqulima_state_v2";
export const ONBOARDING_KEY = "mqulima_onboarding_completed_v7";

type AuthCtx = {
  user: User | null;
  ready: boolean;
  onboardingCompleted: boolean;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  signIn: (token: string, u: User) => Promise<void>;
  signOut: () => Promise<void>;
};

type CartActionsCtx = {
  addToCart: (item: Omit<CartItem, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
};

type SavedCtx = {
  saved: string[];
  toggleSaved: (id: string) => void;
};

const AuthContext = createContext<AuthCtx | null>(null);
const CartStateContext = createContext<CartItem[] | null>(null);
const CartActionsContext = createContext<CartActionsCtx | null>(null);
const SavedContext = createContext<SavedCtx | null>(null);
const ToastActionContext = createContext<((msg: string) => void) | null>(null);
const ToastStateContext = createContext<string | null>(null);

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastMsg(null), 2400);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastActionContext.Provider value={toast}>
      <ToastStateContext.Provider value={toastMsg}>{children}</ToastStateContext.Provider>
    </ToastActionContext.Provider>
  );
}

function CartAndSavedProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(initial.cart);
  const [saved, setSaved] = useState<string[]>(initial.saved);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const raw = await storage.getItem(KEY, "");
      if (!active) return;
      if (raw) {
        try {
          const parsed = { ...initial, ...JSON.parse(raw) };
          setCart(parsed.cart);
          setSaved(parsed.saved);
        } catch {}
      }
      setHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (hydrated) {
      storage.setItem(KEY, JSON.stringify({ cart, saved }));
    }
  }, [cart, saved, hydrated]);

  const addToCart = useCallback((item: Omit<CartItem, "key" | "qty">, qty = 1) => {
    setCart((prev) => {
      const key = `${item.productId}::${item.variant ?? ""}`;
      const exists = prev.find((c) => c.key === key);
      return exists
        ? prev.map((c) => (c.key === key ? { ...c, qty: c.qty + qty } : c))
        : [...prev, { ...item, key, qty }];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setCart((prev) => (qty <= 0 ? prev.filter((c) => c.key !== key) : prev.map((c) => (c.key === key ? { ...c, qty } : c))));
  }, []);

  const removeFromCart = useCallback((key: string) => {
    setCart((prev) => prev.filter((c) => c.key !== key));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const toggleSaved = useCallback((id: string) => {
    setSaved((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const cartActions = useMemo<CartActionsCtx>(
    () => ({ addToCart, setQty, removeFromCart, clearCart }),
    [addToCart, setQty, removeFromCart, clearCart]
  );

  const savedValue = useMemo<SavedCtx>(() => ({ saved, toggleSaved }), [saved, toggleSaved]);

  return (
    <CartActionsContext.Provider value={cartActions}>
      <CartStateContext.Provider value={cart}>
        <SavedContext.Provider value={savedValue}>{children}</SavedContext.Provider>
      </CartStateContext.Provider>
    </CartActionsContext.Provider>
  );
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const [seenOnboarding, token, cachedUser] = await Promise.all([
        storage.getItem<boolean>(ONBOARDING_KEY, false),
        storage.secureGet(TOKEN_KEY, ""),
        storage.getItem("mqulima_user", ""),
      ]);
      if (!active) return;

      if (seenOnboarding === true) {
        setOnboardingCompleted(true);
      }
      if (token && cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch {}
      }

      // Unblock first paint immediately from local state; verify token and purge legacy keys in background.
      setReady(true);
      storage.removeItem("mqulima_registered_users").catch(() => {});

      if (token) {
        try {
          const u = await Promise.race<User | null>([
            api.me({ timeoutMs: 3000, retries: 0 }),
            new Promise<null>((_, reject) => setTimeout(() => reject(new Error("auth_verify_timeout")), 3000)),
          ]);
          if (active && u) {
            setUser(u);
            await storage.setItem("mqulima_user", JSON.stringify(u));
          }
        } catch (e: any) {
          if (e?.status === 401) {
            await Promise.all([
              storage.secureRemove(TOKEN_KEY),
              storage.removeItem("mqulima_user"),
            ]);
            if (active) setUser(null);
          }
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const completeOnboarding = useCallback(async () => {
    setOnboardingCompleted(true);
    await storage.setItem(ONBOARDING_KEY, true);
  }, []);

  const resetOnboarding = useCallback(async () => {
    setOnboardingCompleted(false);
    await storage.removeItem(ONBOARDING_KEY);
  }, []);

  const signIn = useCallback(async (token: string, u: User) => {
    await storage.secureSet(TOKEN_KEY, token);
    await storage.setItem("mqulima_user", JSON.stringify(u));
    await storage.setItem(ONBOARDING_KEY, true);
    setOnboardingCompleted(true);
    setUser(u);
    queryClient.invalidateQueries();
  }, []);

  const signOut = useCallback(async () => {
    await storage.secureRemove(TOKEN_KEY);
    await storage.removeItem("mqulima_user");
    setUser(null);
    queryClient.removeQueries({ queryKey: ["orders"] });
    queryClient.removeQueries({ queryKey: ["my-threads"] });
    queryClient.invalidateQueries({ queryKey: ["forum-feed"] });
    queryClient.invalidateQueries({ queryKey: ["thread"] });
    queryClient.invalidateQueries({ queryKey: ["threads"] });
  }, []);

  const authValue = useMemo<AuthCtx>(
    () => ({ user, ready, onboardingCompleted, completeOnboarding, resetOnboarding, signIn, signOut }),
    [user, ready, onboardingCompleted, completeOnboarding, resetOnboarding, signIn, signOut]
  );

  return (
    <AuthContext.Provider value={authValue}>
      <ToastProvider>
        <CartAndSavedProvider>
          {children}
        </CartAndSavedProvider>
      </ToastProvider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AppProvider");
  return ctx;
}

export function useCartState() {
  const cart = useContext(CartStateContext);
  if (!cart) throw new Error("useCartState must be used inside AppProvider");
  return cart;
}

export function useCartActions() {
  const actions = useContext(CartActionsContext);
  if (!actions) throw new Error("useCartActions must be used inside AppProvider");
  return actions;
}

export function useCart() {
  const cart = useCartState();
  const actions = useCartActions();
  return useMemo(() => ({ cart, ...actions }), [cart, actions]);
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used inside AppProvider");
  return ctx;
}

export function useToast() {
  const toast = useContext(ToastActionContext);
  if (!toast) throw new Error("useToast must be used inside AppProvider");
  return toast;
}

export function useToastMessage() {
  return useContext(ToastStateContext);
}

/** Backward-compatible composed selector; prefer useAuth/useCart/useSaved/useToast for render isolation. */
export function useApp() {
  const auth = useAuth();
  const cart = useCart();
  const saved = useSaved();
  const toast = useToast();
  const toastMsg = useToastMessage();
  return { ...auth, ...cart, ...saved, toast, toastMsg };
}

export const cartCount = (cart: CartItem[]) => cart.reduce((a, c) => a + c.qty, 0);
export const cartTotal = (cart: CartItem[]) => cart.reduce((a, c) => a + c.price * c.qty, 0);
