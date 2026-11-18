# Mqulima Android — Full Production Performance & Reliability Audit

Date: 2026-11-18
Base Revision: `perf/step-7-verify` (including prior Steps 0–7 optimizations)

---

## Executive Summary

Previous optimization passes (`perf/step-0-baseline` through `perf/step-7-verify`) eliminated request-path DB catalog writes, added MongoDB `IXSCAN` indexes, switched AgroShop to server pagination (`limit=24`, `useInfiniteQuery`), unblocked startup first-paint from `/auth/me`, split `AppStore` into isolated contexts, added bounded LRU + ETag media caching, and configured Gunicorn/Redis/Sentry hardening.

This end-to-end audit across the entire Expo SDK 57 / React Native 0.86 frontend and FastAPI backend identifies **remaining confirmed bottlenecks, financial reliability risks, lifecycle leaks, and security hygiene gaps** together with concrete remediations.

---

## 1. Confirmed Bottlenecks & Reliability / Security Findings

### A. Commerce & Payment Idempotency, Double-Tap Guards, and Overlapping Polls (Critical)
- **Affected files**: `frontend/app/checkout.tsx`, `frontend/src/services/api.ts`, `backend/routes/orders.py`, `backend/db.py`
- **Root causes**:
  1. `checkout.tsx:handleRetryPayment()` has no synchronous lock, allowing rapid taps to trigger duplicate `createOrder` / `initiatePaystackMobileMoney` / `initiatePaystack` requests; `submit()` relies only on React `loading` state rather than a synchronous `ref` lock before the next commit.
  2. `api.createOrder`, `api.initiateMpesaStkPush`, `api.initiatePaystack`, and `api.initiatePaystackMobileMoney` do not transmit an `Idempotency-Key` header even though CORS (`backend/server.py:99`) already permits it.
  3. `backend/routes/orders.py:create_order` has no `Idempotency-Key` deduplication check or unique index, so retried or duplicated submission payloads decrement stock and insert duplicate orders.
  4. `checkout.tsx:pollPayment()` uses `setInterval(..., 3000)` without tracking in-flight `getPaymentStatus` promises or aborting via `AbortController` on unmount/stop, risking overlapping status requests on high-latency cellular networks and out-of-order state resolution.
- **Expected impact**: Eliminates duplicate orders/double stock reservation under flaky mobile networks and double-taps; cancels orphaned gateway polls immediately when leaving checkout.
- **Fixes**:
  - Support optional `Idempotency-Key` header in `backend/routes/orders.py:create_order` backed by a sparse/partial unique index on `orders.idempotency_key` (`backend/db.py`).
  - Add synchronous ref guards + stable per-attempt `Idempotency-Key` generation in `frontend/app/checkout.tsx` and explicit `retries: 0` on non-idempotent payment mutations in `frontend/src/services/api.ts`.
  - Replace `setInterval` in `pollPayment` with non-overlapping chained `setTimeout` + `AbortController` (`signal` forwarded to `api.getPaymentStatus`).

### B. Unencrypted PII Persistence & Inconsistent TanStack Query Policies (High)
- **Affected files**: `frontend/src/query-client.ts`, `frontend/src/services/api.ts`, `frontend/src/store/AppStore.tsx`
- **Root causes**:
  1. `query-client.ts:EXCLUDED_PERSIST_KEYS` excludes product/search queries, yet `"orders"` (names, phones, delivery addresses, totals, payment statuses), `"my-threads"`, and `"payment-status"` remain eligible for serialization into plaintext `AsyncStorage` (`MQULIMA_QUERY_CACHE_V1`).
  2. `api.ts:createOrder` also duplicates full order objects into plaintext `AsyncStorage` (`mqulima_orders`), which `AppStore.signOut()` does not remove (only `api.logout()` did).
  3. All queries inherit a single flat `staleTime: 5 min` rather than data-appropriate lifetimes (categories/services vs products/articles vs live orders/weather).
- **Expected impact**: Prevents stale payment status from persisting on disk and prevents private customer PII from being written to unencrypted `AsyncStorage`.
- **Fixes**:
  - Exclude `"orders"`, `"my-threads"`, `"payment-status"`, and `"auth"` from `EXCLUDED_PERSIST_KEYS` in `query-client.ts`, remove plaintext `mqulima_orders` AsyncStorage writes in `api.ts`, clean any legacy `"mqulima_orders"` on startup/`signOut` in `AppStore.tsx`, and define semantic `QUERY_STALE_TIMES`.

### C. Raw `fetch()` Bypassing Timeouts, Cancellation & In-Flight Deduplication (High)
- **Affected files**: `frontend/src/services/api.ts`, `frontend/app/(tabs)/forum.tsx`, `frontend/app/(tabs)/shop.tsx`, `frontend/app/search.tsx`, `frontend/app/product/[id].tsx`
- **Root causes**:
  1. Core GET methods (`getProducts`, `getFeaturedProducts`, `getProduct`, `getProductsByIds`, `search`, `getArticles`, `getArticle`, `getThreads`, `getForumFeed`) call bare `fetch()` directly instead of a timeout-bounded, signal-aware helper — leaving catalog/forum requests without timeouts or `AbortSignal` cancellation when filters change or screens unmount.
  2. `forum.tsx:83` queries `["forum-latest-articles"]` while `index.tsx` and `news.tsx` query `["articles", "All"]`, causing redundant duplicate `/api/v1/articles` requests on app navigation.
- **Expected impact**: Cancels superseded filter/search requests immediately on fast typing/navigation, prevents indefinite cellular socket hangs, and removes duplicate article fetches across tabs.
- **Fixes**:
  - Introduce a shared `fetchWithTimeout` helper (`12 s` default timeout, chained external `AbortSignal`, plus in-flight GET coalescing for identical URL+method calls) in `api.ts` and forward `{ signal }` from TanStack `queryFn` callbacks.
  - Unify `forum.tsx` article query key to `["articles", "All"]` with `QUERY_STALE_TIMES.ARTICLES`.

### D. Off-Screen Timers, Reanimated Loop Overhead & Card Re-Renders (Medium-High)
- **Affected files**: `frontend/app/(tabs)/_layout.tsx`, `frontend/app/(tabs)/news.tsx`, `frontend/app/(tabs)/index.tsx`, `frontend/app/(tabs)/forum.tsx`, `frontend/src/components/Cards.tsx`, `frontend/src/components/FeaturedCollectionCarousel.tsx`, `frontend/src/components/Floating.tsx`, `frontend/src/components/ThreadCard.tsx`
- **Root causes**:
  1. `Tabs` in `(tabs)/_layout.tsx` omits `freezeOnBlur: true`, allowing off-screen tabs to process store/query updates while hidden.
  2. `news.tsx` runs two intervals (Featured 5 s, Testimonials 6 s) continuously even when `!focused`, and resets `visibleCount` inside `useEffect` (triggering an extra render + `react-hooks/set-state-in-effect`).
  3. `FeaturedCollectionCarousel.tsx` runs a 3 s `setInterval` even when Home is blurred, and resets `pageIndex` inside `useEffect` (`react-hooks/set-state-in-effect`).
  4. `Floating.tsx` starts an infinite Reanimated `withRepeat` ring pulse without `cancelAnimation(ring)` cleanup or background pause (`AppState`).
  5. `ProductCard` (`Cards.tsx`) allocates `FadeInDown` entering animations on recycled grid cells and subscribes to the full `saved` array instead of a stable primitive / lookup. `ThreadCard` is un-memoized and `(tabs)/forum.tsx` `FlatList` omits `initialNumToRender`/`maxToRenderPerBatch`/`windowSize`/`removeClippedSubviews`.
- **Expected impact**: Eliminates background tab CPU wakeups/timers, fixes cascading renders, reduces Android GC/UI-thread frame drops during Shop and Forum scrolling.

### E. Android Image Memory & Proxy Sizing + WebView Lifecycle (Medium)
- **Affected files**: `frontend/src/components/Img.tsx`, `frontend/src/components/PaystackWebModal.tsx`
- **Root causes**:
  1. `Img.tsx` omits `allowDownscaling` on `expo-image`, decoding large product/article bitmaps above display container size; Web proxy (`images.weserv.nl`) omits quality/width caps.
  2. `PaystackWebModal.tsx` sets `setPageLoading(true)` inside `useEffect` (extra render + `react-hooks/set-state-in-effect`) and lacks explicit WebView error recovery (`onError` / `onHttpError`).

---

## 2. Potential Bottlenecks Requiring Device Profiling
- **Expo Font Preloading vs Native Startup Time (`frontend/app/_layout.tsx`)**: 10 font weights (`Lora`, `Outfit`, `Jakarta`) load synchronously via `useFonts` before returning the React tree (`if (!loaded && !error) return null`). On low-end Android devices, cold TTF parsing should be profiled with Android Studio CPU profiler; pruning unused font weights (if any) would cut cold-start TTI further.
- **Large In-Memory Static Fallbacks (`frontend/src/data/products_328.json`, `articles.ts`, `services.ts`)**: `api.ts` statically imports fallback datasets at module evaluation time. Moving offline fallbacks to dynamic `import()` inside `catch` blocks would shrink initial JS parse/RAM footprint on Hermes (verify Metro bundle splitting behavior in release APK builds).
- **Home Vertical `ScrollView` (`frontend/app/(tabs)/index.tsx`)**: Renders all 9 marketing/ecosystem sections eagerly. Converting outer sections to a `FlatList`/`SectionList` would reduce initial off-screen view allocations on 2 GB RAM devices if Home TTI profiling shows pressure.

