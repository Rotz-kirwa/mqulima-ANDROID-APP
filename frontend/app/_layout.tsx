import { onlineManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import NetInfo from "@react-native-community/netinfo";
import { Stack, usePathname, useRouter } from "expo-router";
import { LogBox, Platform, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { Lucide } from "@react-native-vector-icons/lucide";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { asyncStoragePersister, QUERY_CACHE_MAX_AGE_MS, queryClient } from "@/src/query-client";
import { AppProvider, useApp } from "@/src/store/AppStore";
import { FloatingButtons, Toast } from "@/src/components/Floating";
import { OnboardingFlow } from "@/src/components/OnboardingFlow";
import { storage } from "@/src/utils/storage";
import { colors, fonts } from "@/src/theme";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync().catch(() => {});

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
  });
});

function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setOffline(state.isConnected === false || state.isInternetReachable === false);
    });
    return () => unsub();
  }, []);

  if (!offline) return null;
  return (
    <View testID="offline-status-banner" style={styles.offlineBanner}>
      <Lucide name="wifi-off" size={14} color="#92400E" />
      <Text style={styles.offlineText}>Offline mode — showing saved catalog, market & weather data</Text>
    </View>
  );
}

function AppContent() {
  const { ready, onboardingCompleted, completeOnboarding } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const restored = useRef(false);
  const isNavigating = useRef(false);

  // 1. Initial route restoration on cold start / refresh
  useEffect(() => {
    if (!ready || !onboardingCompleted || restored.current) return;

    (async () => {
      try {
        // On web, if the browser refreshed on a specific page, respect window.location
        if (Platform.OS === "web" && typeof window !== "undefined") {
          const webPath = window.location.pathname;
          if (
            webPath &&
            webPath !== "/" &&
            webPath !== "/(tabs)" &&
            webPath !== "/(tabs)/index" &&
            !webPath.includes("onboarding")
          ) {
            await storage.setItem("mqulima_last_app_route", webPath);
            restored.current = true;
            return;
          }
        }

        // On native cold launch or when web is at root, restore saved subpath
        const saved = await storage.getItem<string>("mqulima_last_app_route", "");
        if (
          saved &&
          saved !== "/" &&
          saved !== "/(tabs)" &&
          saved !== "/(tabs)/index" &&
          !saved.includes("onboarding")
        ) {
          isNavigating.current = true;
          router.replace(saved as any);
        }
      } catch {} finally {
        setTimeout(() => {
          restored.current = true;
          isNavigating.current = false;
        }, 500);
      }
    })();
  }, [ready, onboardingCompleted]);

  // 2. Persist active route only AFTER startup restoration is fully complete
  useEffect(() => {
    if (!ready || !onboardingCompleted || !restored.current || isNavigating.current) return;
    if (!pathname || pathname.includes("onboarding")) return;

    // Do NOT overwrite saved route with root "/" unless the user explicitly navigated to Home
    if (pathname === "/" || pathname === "/(tabs)" || pathname === "/(tabs)/index") {
      storage.setItem("mqulima_last_app_route", "/");
      return;
    }

    storage.setItem("mqulima_last_app_route", pathname);
  }, [pathname, ready, onboardingCompleted]);

  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.root}>
        <OfflineBanner />
        {/* Unconditionally mount Stack so Expo Router never unmounts / resets navigation state */}
        <Stack screenOptions={{ headerShown: false, animation: "slide_from_right", contentStyle: { backgroundColor: colors.surface } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
          <Stack.Screen name="search" options={{ animation: "fade_from_bottom" }} />
          <Stack.Screen name="ai" options={{ animation: "slide_from_bottom" }} />
        </Stack>
        <FloatingButtons />
        <Toast />

        {/* Render Onboarding as an overlay on top of Stack */}
        {ready && !onboardingCompleted && (
          <View style={StyleSheet.absoluteFill}>
            <OnboardingFlow onFinish={completeOnboarding} />
          </View>
        )}

        {/* While loading initial state, show a clean splash surface cover without unmounting Stack */}
        {!ready && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]} />
        )}
      </View>
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "Lora-700": require("../assets/fonts/Lora-700.ttf"),
    "Outfit-600": require("../assets/fonts/Outfit-600.ttf"),
    "Outfit-700": require("../assets/fonts/Outfit-700.ttf"),
    "Outfit-800": require("../assets/fonts/Outfit-800.ttf"),
    "Outfit-900": require("../assets/fonts/Outfit-900.ttf"),
    "Jakarta-400": require("../assets/fonts/Jakarta-400.ttf"),
    "Jakarta-500": require("../assets/fonts/Jakarta-500.ttf"),
    "Jakarta-600": require("../assets/fonts/Jakarta-600.ttf"),
    "Jakarta-700": require("../assets/fonts/Jakarta-700.ttf"),
    "Jakarta-800": require("../assets/fonts/Jakarta-800.ttf"),
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister, maxAge: QUERY_CACHE_MAX_AGE_MS, buster: "v1" }}
        >
          <KeyboardProvider>
            <AppProvider>
              <AppContent />
            </AppProvider>
          </KeyboardProvider>
        </PersistQueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  offlineText: {
    fontFamily: fonts.b600,
    fontSize: 11.5,
    color: "#92400E",
  },
});
