import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { LogBox, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { AppProvider } from "@/src/store/AppStore";
import { FloatingButtons, Toast } from "@/src/components/Floating";
import { colors } from "@/src/theme";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync().catch(() => {});

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
        <QueryClientProvider client={queryClient}>
          <KeyboardProvider>
            <AppProvider>
              <StatusBar style="dark" />
              <View style={styles.root}>
                <Stack screenOptions={{ headerShown: false, animation: "slide_from_right", contentStyle: { backgroundColor: colors.surface } }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="search" options={{ animation: "fade_from_bottom" }} />
                  <Stack.Screen name="ai" options={{ animation: "slide_from_bottom" }} />
                </Stack>
                <FloatingButtons />
                <Toast />
              </View>
            </AppProvider>
          </KeyboardProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
