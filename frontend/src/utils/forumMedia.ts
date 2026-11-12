import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { api } from "@/src/services/api";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export type PickedForumImagesResult = {
  canceled: boolean;
  imageUrls: string[];
  error?: string;
};

/**
 * Prompts the user for library permission (on native), launches the image picker,
 * validates file sizes, and uploads each selected photo to the forum media endpoint.
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
        error: "Each image must be smaller than 8 MB.",
      };
    }

    const res = await api.uploadForumImage({
      uri: asset.uri,
      name: asset.fileName || "farm-photo.jpg",
      mimeType: asset.mimeType || "image/jpeg",
    });
    uploaded.push(res.imageUrl);
  }

  return { canceled: false, imageUrls: uploaded };
}

