import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { storage } from "@/src/utils/storage";
import type { Thread, Comment } from "@/src/data/forum";

export type CartItem = { key: string; productId: string; name: string; image: string; variant?: string; price: number; qty: number };
export type User = { name: string; email: string; phone: string; county?: string };
export type Order = { id: string; date: string; items: CartItem[]; total: number; county: string; location: string; status: string };

type State = {
  user: User | null;
  cart: CartItem[];
  saved: string[];
  orders: Order[];
  myThreads: Thread[];
  liked: string[];
  extraComments: Record<string, Comment[]>;
};

const initial: State = { user: null, cart: [], saved: [], orders: [], myThreads: [], liked: [], extraComments: {} };
const KEY = "mqulima_state_v1";

type Ctx = State & {
  ready: boolean;
  signIn: (u: User) => void;
  signOut: () => void;
  addToCart: (item: Omit<CartItem, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  removeFromCart: (key: string) => void;
  toggleSaved: (id: string) => void;
  placeOrder: (county: string, location: string) => Order;
  addThread: (t: Thread) => void;
  toggleLike: (id: string) => void;
  addComment: (threadId: string, c: Comment) => void;
  toast: (msg: string) => void;
  toastMsg: string | null;
};

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [ready, setReady] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    storage.getItem(KEY, "").then((raw) => {
      if (raw) {
        try {
          setState({ ...initial, ...JSON.parse(raw) });
        } catch {}
      }
      setReady(true);
    });
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
      ready,
      toastMsg,
      toast,
      signIn: (u) => setState((s) => ({ ...s, user: u })),
      signOut: () => setState((s) => ({ ...s, user: null })),
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
      toggleSaved: (id) => setState((s) => ({ ...s, saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id] })),
      placeOrder: (county, location) => {
        const total = state.cart.reduce((a, c) => a + c.price * c.qty, 0);
        const order: Order = {
          id: `MQ-${Date.now().toString().slice(-6)}`,
          date: new Date().toISOString(),
          items: state.cart,
          total,
          county,
          location,
          status: "Processing",
        };
        setState((s) => ({ ...s, orders: [order, ...s.orders], cart: [] }));
        return order;
      },
      addThread: (t) => setState((s) => ({ ...s, myThreads: [t, ...s.myThreads] })),
      toggleLike: (id) => setState((s) => ({ ...s, liked: s.liked.includes(id) ? s.liked.filter((x) => x !== id) : [...s.liked, id] })),
      addComment: (threadId, c) =>
        setState((s) => ({ ...s, extraComments: { ...s.extraComments, [threadId]: [...(s.extraComments[threadId] ?? []), c] } })),
    }),
    [state, ready, toastMsg, toast],
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
