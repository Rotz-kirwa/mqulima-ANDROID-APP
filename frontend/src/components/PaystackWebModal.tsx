import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Lucide } from "@react-native-vector-icons/lucide";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export interface PaystackWebModalProps {
  visible: boolean;
  url: string | null;
  methodLabel: string;
  onClose: () => void;
  onCompleteReference: (reference?: string) => void;
}

function extractPaystackRef(navUrl: string): string | undefined {
  try {
    const parsed = new URL(navUrl);
    return parsed.searchParams.get("reference") || parsed.searchParams.get("trxref") || undefined;
  } catch {
    return undefined;
  }
}

function isPaystackCallbackUrl(navUrl: string): boolean {
  if (!navUrl) return false;
  try {
    const parsed = new URL(navUrl);
    if (/(^|\.)paystack\.(com|co)$/i.test(parsed.hostname)) return false;
    return (
      parsed.pathname.includes("/payments/paystack/callback") ||
      (parsed.pathname.endsWith("/checkout") &&
        (parsed.searchParams.has("reference") || parsed.searchParams.has("trxref"))) ||
      (/(^|\.)mqulima\.com$/i.test(parsed.hostname) &&
        (parsed.searchParams.has("reference") || parsed.searchParams.has("trxref")))
    );
  } catch {
    return navUrl.includes("/payments/paystack/callback");
  }
}

export function PaystackWebModal({
  visible,
  url,
  methodLabel,
  onClose,
  onCompleteReference,
}: PaystackWebModalProps) {
  const s = useStyles();
  const { colors } = useTheme();
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (visible && url) {
      completedRef.current = false;
    }
  }, [visible, url]);

  if (!visible || !url) return null;

  const handleNavigationUrl = (navUrl: string) => {
    if (completedRef.current) return;
    if (isPaystackCallbackUrl(navUrl)) {
      completedRef.current = true;
      onCompleteReference(extractPaystackRef(navUrl));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.lockBadge}>
              <Lucide name="lock" size={14} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.title} numberOfLines={1}>
                Paystack • {methodLabel}
              </Text>
              <Text style={s.sub} numberOfLines={1}>
                Enter your payment details securely
              </Text>
            </View>
          </View>
          <View style={s.headerActions}>
            <Pressable
              onPress={() => {
                Linking.openURL(url).catch(() => {});
              }}
              style={s.browserBtn}
              hitSlop={8}
            >
              <Lucide name="external-link" size={13} color="#15803D" />
              <Text style={s.browserBtnText}>Browser</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                completedRef.current = false;
                onClose();
              }}
              style={s.closeBtn}
              hitSlop={10}
            >
              <Lucide name="x" size={18} color={colors.onSurface} />
            </Pressable>
          </View>
        </View>

        <View style={s.webWrap}>
          {pageLoading ? (
            <View style={s.loaderBar}>
              <ActivityIndicator size="small" color={colors.brandPrimary} />
              <Text style={s.loaderText}>Loading Paystack checkout...</Text>
            </View>
          ) : null}
          {loadError ? (
            <View style={[s.loaderBar, { backgroundColor: "#FEF2F2" }]}>
              <Lucide name="alert-circle" size={16} color="#DC2626" />
              <Text style={[s.loaderText, { color: "#991B1B" }]}>
                Checkout page failed to load. Tap Browser above to complete payment.
              </Text>
            </View>
          ) : null}
          <WebView
            key={url}
            source={{ uri: url }}
            style={s.webview}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            javaScriptCanOpenWindowsAutomatically
            setSupportMultipleWindows={false}
            thirdPartyCookiesEnabled
            sharedCookiesEnabled
            mixedContentMode="compatibility"
            onLoadStart={() => {
              setPageLoading(true);
              setLoadError(false);
            }}
            onLoadEnd={() => setPageLoading(false)}
            onError={() => {
              setPageLoading(false);
              setLoadError(true);
            }}
            onHttpError={({ nativeEvent }) => {
              if (nativeEvent.statusCode >= 500) {
                setLoadError(true);
              }
            }}
            onNavigationStateChange={(navState) => handleNavigationUrl(navState.url)}
            onShouldStartLoadWithRequest={(req) => {
              if (isPaystackCallbackUrl(req.url)) {
                handleNavigationUrl(req.url);
                return false;
              }
              if (!/^https?:\/\//i.test(req.url) && !req.url.startsWith("about:")) {
                Linking.openURL(req.url).catch(() => {});
                return false;
              }
              return true;
            }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const useStyles = makeStyles((c) => ({
  safe: { flex: 1, backgroundColor: c.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    backgroundColor: c.white,
    gap: 10,
  },
  headerLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  lockBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: fonts.h800, fontSize: 15, color: c.onSurface },
  sub: { fontFamily: fonts.b500, fontSize: 11.5, color: c.muted },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  browserBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  browserBtnText: { fontFamily: fonts.b700, fontSize: 12, color: "#15803D" },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: c.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  webWrap: { flex: 1, backgroundColor: c.surface },
  loaderBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    backgroundColor: "#F0FDF4",
    borderBottomWidth: 1,
    borderBottomColor: "#BBF7D0",
  },
  loaderText: { fontFamily: fonts.b600, fontSize: 12.5, color: "#15803D" },
  webview: { flex: 1, backgroundColor: c.white },
}));
