import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { api } from "@/src/services/api";
import { compressImageAsset } from "@/src/utils/mediaCompress";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

export type PickedForumImagesResult = {
  canceled: boolean;
  imageUrls: string[];
  error?: string;
};

/**
 * Prompts the user for library permission (on native), picks photos,
 * compresses payloads on-device via expo-image-manipulator, and uploads to forum media.
 */
export async function pickAndUploadForumImages(
  maxSelection = 1
): Promise<PickedForumImagesResult> {
  if (Platform.OS !== "web") {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return {
        canceled: true,
        imageUrls: [],
        error: "Allow photo access in device settings to attach farm photos.",
      };
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: maxSelection > 1,
    selectionLimit: maxSelection > 1 ? maxSelection : 1,
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.length) {
    return { canceled: true, imageUrls: [] };
  }

  const uploaded: string[] = [];
  for (const asset of result.assets.slice(0, Math.max(1, maxSelection))) {
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
      return {
        canceled: false,
        imageUrls: uploaded,
        error: "Each image must be smaller than 12 MB.",
      };
    }

    const compressed = await compressImageAsset(asset.uri, {
      profile: "forum",
      width: asset.width,
      height: asset.height,
    });

    const res = await api.uploadForumImage({
      uri: compressed.uri,
      name: (asset.fileName || "farm-photo").replace(/\.[^.]+$/, "") + ".jpg",
      mimeType: compressed.mimeType,
    });
    uploaded.push(res.imageUrl);
  }

  return { canceled: false, imageUrls: uploaded };
}
