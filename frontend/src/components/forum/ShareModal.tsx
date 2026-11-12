import React from "react";
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  Share,
  Text,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lucide } from "@react-native-vector-icons/lucide";
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { ApiThread } from "@/src/services/api";
import { useApp } from "@/src/store/AppStore";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export function buildThreadSharePayload(t: ApiThread) {
  const configured = (process.env.EXPO_PUBLIC_BACKEND_URL || "https://www.mqulima.com").replace(/\/$/, "");
  const publicHost =
    configured.includes("localhost") || configured.includes("127.0.0.1")
      ? "https://www.mqulima.com"
      : configured;

  const url = `${publicHost}/community?post=${encodeURIComponent(t.id)}`;
  const headline = t.title?.trim() || t.text?.trim() || `Farm update by ${t.author}`;
  const locationPart = t.location || t.county ? ` 📍 ${t.location || t.county}` : "";
  const text = `${headline}\n\n— Shared by ${t.author}${locationPart} on Mqulima Forum`;
  const fullMessage = `${text}\n${url}`;

  return { headline, text, url, fullMessage };
}

type ShareChannel = {
  id: string;
  label: string;
  bg: string;
  brandIcon?: string;
  lucideIcon?: any;
  onPress: () => void;
};

export function SharePostModal({
  visible,
  onClose,
  thread,
}: {
  visible: boolean;
  onClose: () => void;
  thread: ApiThread;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { toast } = useApp();

  const { headline, text, url, fullMessage } = buildThreadSharePayload(thread);

  const openExternal = async (targetUrl: string, platformLabel: string) => {
    try {
      await Linking.openURL(targetUrl);
      onClose();
    } catch {
      await Clipboard.setStringAsync(fullMessage);
      toast(`Could not open ${platformLabel}. Post & link copied to clipboard.`);
      onClose();
    }
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(url);
    toast("Discussion link copied to clipboard");
    onClose();
  };

  const handleCopyFull = async () => {
    await Clipboard.setStringAsync(fullMessage);
    toast("Post & link copied — ready to paste anywhere!");
    onClose();
  };

  const handleSystemShare = async () => {
    try {
      if (Platform.OS === "web") {
        const nav = typeof navigator !== "undefined" ? (navigator as any) : null;
        if (nav?.share) {
          await nav.share({ title: headline, text, url });
          onClose();
          return;
        }
        await Clipboard.setStringAsync(fullMessage);
        toast("Post & link copied to share anywhere!");
        onClose();
        return;
      }

      await Share.share({
        title: headline,
        message: fullMessage,
        ...(Platform.OS === "ios" ? { url } : {}),
      });
      onClose();
    } catch {
      toast("Share cancelled or unavailable.");
    }
  };

  const channels: ShareChannel[] = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      bg: "#25D366",
      brandIcon: "whatsapp",
      onPress: () => openExternal(`https://wa.me/?text=${encodeURIComponent(fullMessage)}`, "WhatsApp"),
    },
    {
      id: "facebook",
      label: "Facebook",
      bg: "#1877F2",
      brandIcon: "facebook-f",
      onPress: () =>
        openExternal(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
          "Facebook"
        ),
    },
    {
      id: "x",
      label: "X",
      bg: "#111827",
      brandIcon: "x-twitter",
      onPress: () =>
        openExternal(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
          "X"
        ),
    },
    {
      id: "telegram",
      label: "Telegram",
      bg: "#229ED9",
      brandIcon: "telegram",
      onPress: () =>
        openExternal(
          `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
          "Telegram"
        ),
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      bg: "#0A66C2",
      brandIcon: "linkedin-in",
      onPress: () =>
        openExternal(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
          "LinkedIn"
        ),
    },
    {
      id: "sms",
      label: "SMS",
      bg: "#16A34A",
      lucideIcon: "message-square",
      onPress: () => openExternal(`sms:?body=${encodeURIComponent(fullMessage)}`, "SMS"),
    },
    {
      id: "email",
      label: "Email",
      bg: "#EA580C",
      lucideIcon: "mail",
      onPress: () =>
        openExternal(
          `mailto:?subject=${encodeURIComponent(headline)}&body=${encodeURIComponent(fullMessage)}`,
          "Email"
        ),
    },
    {
      id: "copy-text",
      label: "Copy Text",
      bg: "#6D28D9",
      lucideIcon: "file-text",
      onPress: handleCopyFull,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay} testID={`share-modal-${thread.id}`}>
        <Pressable accessibilityLabel="Close share sheet" style={s.scrim} onPress={onClose} />
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
          <View style={s.handle} />
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>Share Farm Post</Text>
              <Text style={s.subtitle}>Send to WhatsApp, social media, or any app</Text>
            </View>
            <Pressable accessibilityLabel="Close share dialog" onPress={onClose} style={s.closeBtn}>
              <Lucide name="x" size={20} color={colors.onSurface} />
            </Pressable>
          </View>

          <View style={s.previewBox}>
            <Text style={s.previewAuthor} numberOfLines={1}>
              {`${thread.author}${thread.handle ? ` (${thread.handle})` : ""}`}
            </Text>
            <Text style={s.previewBody} numberOfLines={2}>
              {thread.title?.trim() || thread.text?.trim() || "Photo shared on Mqulima Community Forum"}
            </Text>
            <Text style={s.previewLink} numberOfLines={1}>
              {url}
            </Text>
          </View>

          <View style={s.grid}>
            {channels.map((ch) => (
              <Pressable
                key={ch.id}
                testID={`share-channel-${ch.id}`}
                onPress={ch.onPress}
                style={({ pressed }) => [s.channelTile, pressed && s.pressed]}
              >
                <View style={[s.channelCircle, { backgroundColor: ch.bg }]}>
                  {ch.brandIcon ? (
                    <FontAwesome6 name={ch.brandIcon as any} iconStyle="brand" size={20} color="#FFFFFF" />
                  ) : (
                    <Lucide name={ch.lucideIcon} size={20} color="#FFFFFF" />
                  )}
                </View>
                <Text style={s.channelLabel} numberOfLines={1}>
                  {ch.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Bottom paired action buttons: Yellow Copy Link + Green More Apps */}
          <View style={s.actionsRow}>
            <Pressable
              testID="share-copy-link-btn"
              onPress={handleCopyLink}
              style={({ pressed }) => [s.yellowBtn, pressed && s.pressed]}
            >
              <Lucide name="copy" size={16} color="#0B2117" />
              <Text style={s.yellowBtnText}>Copy Link</Text>
            </Pressable>

            <Pressable
              testID="share-more-apps-btn"
              onPress={handleSystemShare}
              style={({ pressed }) => [s.greenBtn, pressed && s.pressed]}
            >
              <Lucide name="share-2" size={16} color="#FFFFFF" />
              <Text style={s.greenBtnText}>More Apps…</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((c) => ({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: c.scrim,
  },
  sheet: {
    backgroundColor: c.surfaceSecondary,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.borderStrong,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontFamily: fonts.h700,
    fontSize: 19,
    color: c.onSurface,
  },
  subtitle: {
    fontFamily: fonts.b400,
    fontSize: 12,
    color: c.muted,
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  previewBox: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: c.heroBg,
    borderWidth: 1,
    borderColor: c.border,
    gap: 4,
  },
  previewAuthor: {
    fontFamily: fonts.b700,
    fontSize: 12,
    color: c.brand,
  },
  previewBody: {
    fontFamily: fonts.b500,
    fontSize: 12.5,
    lineHeight: 18,
    color: c.onSurface,
  },
  previewLink: {
    fontFamily: fonts.b400,
    fontSize: 11,
    color: c.muted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 14,
  },
  channelTile: {
    width: "25%",
    alignItems: "center",
    gap: 6,
  },
  channelCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.12)",
  },
  channelLabel: {
    fontFamily: fonts.b600,
    fontSize: 11,
    color: c.onSurfaceSecondary,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  yellowBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 0,
    backgroundColor: "#FACC15",
    borderWidth: 1,
    borderColor: "#EAB308",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  yellowBtnText: {
    fontFamily: fonts.b800,
    fontSize: 13,
    color: "#0B2117",
  },
  greenBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 0,
    backgroundColor: "#166534",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  greenBtnText: {
    fontFamily: fonts.b800,
    fontSize: 13,
    color: "#FFFFFF",
  },
  pressed: {
    opacity: 0.85,
  },
}));

