import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { storage } from "@/src/utils/storage";
import { api, TOKEN_KEY, User } from "@/src/services/api";
import { queryClient } from "@/src/query-client";

export type { User };
export type CartItem = { key: string; productId: string; name: string; image: string; variant?: string; price: number; qty: number };

type State = { cart: CartItem[]; saved: string[] };

const initial: State = { cart: [], saved: [] };
const KEY = "mqulima_state_v2";

type Ctx = State & {
  user: User | null;
  ready: boolean;
  signIn: (token: string, u: User) => Promise<void>;
  signOut: () => Promise<void>;
  addToCart: (item: Omit<CartItem, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  toggleSaved: (id: string) => void;
  toast: (msg: string) => void;
  toastMsg: string | null;
};

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const raw = await storage.getItem(KEY, "");
      if (raw) {
        try {
          setState({ ...initial, ...JSON.parse(raw) });
        } catch {}
      }
      // Restore session from the stored JWT (user object is cached for instant paint, then refreshed).
      const token = await storage.secureGet(TOKEN_KEY, "");
      if (token) {
        const cached = await storage.getItem("mqulima_user", "");
        if (cached) {
          try {
            setUser(JSON.parse(cached));
          } catch {}
        }
        try {
          const u = await api.me();
          if (u) {
            setUser(u);
            await storage.setItem("mqulima_user", JSON.stringify(u));
          }
        } catch (e: any) {
          if (e?.status === 401) {
            await storage.secureRemove(TOKEN_KEY);
            await storage.removeItem("mqulima_user");
            setUser(null);
          }
        }
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (ready) storage.setItem(KEY, JSON.stringify(state));
  }, [state, ready]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastMsg(null), 2400);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      user,
      ready,
      toastMsg,
      toast,
      signIn: async (token, u) => {
        await storage.secureSet(TOKEN_KEY, token);
        await storage.setItem("mqulima_user", JSON.stringify(u));
        setUser(u);
        queryClient.invalidateQueries();
      },
      signOut: async () => {
        await storage.secureRemove(TOKEN_KEY);
        await storage.removeItem("mqulima_user");
        setUser(null);
        queryClient.removeQueries({ queryKey: ["orders"] });
        queryClient.removeQueries({ queryKey: ["my-threads"] });
        queryClient.removeQueries({ queryKey: ["admin"] });
        queryClient.removeQueries({ queryKey: ["admin-session"] });
        queryClient.invalidateQueries({ queryKey: ["forum-feed"] });
        queryClient.invalidateQueries({ queryKey: ["thread"] });
        queryClient.invalidateQueries({ queryKey: ["threads"] });
      },
      addToCart: (item, qty = 1) =>
        setState((s) => {
          const key = `${item.productId}::${item.variant ?? ""}`;
          const exists = s.cart.find((c) => c.key === key);
          const cart = exists
            ? s.cart.map((c) => (c.key === key ? { ...c, qty: c.qty + qty } : c))
            : [...s.cart, { ...item, key, qty }];
          return { ...s, cart };
        }),
      setQty: (key, qty) =>
        setState((s) => ({ ...s, cart: qty <= 0 ? s.cart.filter((c) => c.key !== key) : s.cart.map((c) => (c.key === key ? { ...c, qty } : c)) })),
      removeFromCart: (key) => setState((s) => ({ ...s, cart: s.cart.filter((c) => c.key !== key) })),
      clearCart: () => setState((s) => ({ ...s, cart: [] })),
      toggleSaved: (id) => setState((s) => ({ ...s, saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id] })),
    }),
    [state, user, ready, toastMsg, toast],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export const cartCount = (cart: CartItem[]) => cart.reduce((a, c) => a + c.qty, 0);
export const cartTotal = (cart: CartItem[]) => cart.reduce((a, c) => a + c.price * c.qty, 0);
