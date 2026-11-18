// Shared QueryClient & AsyncStorage persister for offline-first news, market prices,
// and forum feeds in low-connectivity zones. Product catalog/search queries are excluded
// from persistence to avoid serializing large payloads to AsyncStorage (adopt react-native-mmkv
// only when targeting custom native dev-client/EAS builds without Expo Go compatibility).
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { Query, QueryClient } from "@tanstack/react-query";

export const QUERY_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24; // 24 hours

const EXCLUDED_PERSIST_KEYS = new Set([
  "products",
  "product",
  "search",
  "saved-products",
  "products-catalog-total-count",
]);

export function shouldDehydratePersistedQuery(query: Query): boolean {
  const rootKey = String(query.queryKey?.[0] ?? "");
  if (EXCLUDED_PERSIST_KEYS.has(rootKey)) {
    return false;
  }
  return query.state.status === "success";
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: QUERY_CACHE_MAX_AGE_MS,
      staleTime: 1000 * 60 * 5,
      retry: 2,
      networkMode: "offlineFirst",
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
      networkMode: "online",
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "MQULIMA_QUERY_CACHE_V1",
  throttleTime: 1500,
});

export const QUERY_PERSIST_OPTIONS = {
  persister: asyncStoragePersister,
  maxAge: QUERY_CACHE_MAX_AGE_MS,
  buster: "v2",
  dehydrateOptions: {
    shouldDehydrateQuery: shouldDehydratePersistedQuery,
  },
};
