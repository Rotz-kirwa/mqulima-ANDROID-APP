import { Platform } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import { fetch as expoFetch } from "expo/fetch";

export type CompressionProfile = "crop-doctor" | "forum";

export type CompressedImageResult = {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  sizeBytes?: number;
  mimeType: "image/jpeg";
};

const PROFILE_LIMITS: Record<CompressionProfile, { maxEdge: number; quality: number; targetBytes: number }> = {
  "crop-doctor": { maxEdge: 1024, quality: 0.72, targetBytes: 350 * 1024 },
  forum: { maxEdge: 1280, quality: 0.78, targetBytes: 500 * 1024 },
};

async function measureUriBytes(uri: string): Promise<number | undefined> {
  try {
    const res = Platform.OS === "web" ? await fetch(uri) : await expoFetch(uri);
    const blob = await res.blob();
    return blob.size;
  } catch {
    return undefined;
  }
}

/**
 * Compresses camera or gallery images on-device before transmitting over cellular networks.
 * Caps resolution to 1024px (AI diagnosis) or 1280px (forum posts) with adaptive second-pass shrink.
 */
export async function compressImageAsset(
  sourceUri: string,
  options: {
    profile?: CompressionProfile;
    width?: number;
    height?: number;
    includeBase64?: boolean;
  } = {}
): Promise<CompressedImageResult> {
  const profile = options.profile ?? "forum";
  const cfg = PROFILE_LIMITS[profile];

  const actions: ImageManipulator.Action[] = [];
  const srcW = options.width || 0;
  const srcH = options.height || 0;
  if (srcW > cfg.maxEdge || srcH > cfg.maxEdge) {
    if (srcW >= srcH) actions.push({ resize: { width: cfg.maxEdge } });
    else actions.push({ resize: { height: cfg.maxEdge } });
  } else if (!srcW && !srcH) {
    // Unknown dimensions (e.g. web picker) — constrain width safely.
    actions.push({ resize: { width: cfg.maxEdge } });
  }

  let out = await ImageManipulator.manipulateAsync(sourceUri, actions, {
    compress: cfg.quality,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: Boolean(options.includeBase64),
  });

  let sizeBytes = out.base64
    ? Math.floor((out.base64.length * 3) / 4)
    : await measureUriBytes(out.uri);

  if (sizeBytes && sizeBytes > cfg.targetBytes) {
    const secondPass = await ImageManipulator.manipulateAsync(
      out.uri,
      [{ resize: { width: Math.min(840, cfg.maxEdge) } }],
      {
        compress: 0.56,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: Boolean(options.includeBase64),
      }
    );
    out = secondPass;
    sizeBytes = out.base64
      ? Math.floor((out.base64.length * 3) / 4)
      : await measureUriBytes(out.uri);
  }

  return {
    uri: out.uri,
    width: out.width,
    height: out.height,
    base64: out.base64,
    sizeBytes,
    mimeType: "image/jpeg",
  };
}

