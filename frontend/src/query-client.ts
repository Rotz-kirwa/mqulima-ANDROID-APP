// Shared QueryClient & AsyncStorage persister for offline-first farm catalog,
// weather telemetry, KAMIS market feeds, and forum threads in low-connectivity zones.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";

export const QUERY_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24; // 24 hours

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
