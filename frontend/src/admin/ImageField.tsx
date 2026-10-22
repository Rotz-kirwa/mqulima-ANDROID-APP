import React, { useState } from "react";
import { Platform, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "@/src/components/Img";
import { AdminButton, useAdminStyles } from "./UI";
import { adminApi } from "./api";
import { makeStyles } from "@/src/theme";

export function ImageField({ value, onChange, onBusy }: { value: string; onChange: (image: string) => void; onBusy: (busy: boolean) => void }) {
  const s = useAdminStyles(); const imageStyle = useImageStyles(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const choose = async () => {
    setError("");
    try {
      if (Platform.OS !== "web") { const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!permission.granted) { setError("Allow photo access to select a catalogue image."); return; } }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: false, quality: 0.85 });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) { setError("Choose an image smaller than 5 MB."); return; }
      setBusy(true); onBusy(true);
      const image = await adminApi.upload({ uri: asset.uri, name: asset.fileName || "image.jpg", mimeType: asset.mimeType });
      onChange(image);
    } catch (e: any) { setError(e.message || "Could not upload image. Please try again."); }
    finally { setBusy(false); onBusy(false); }
  };
  return <View style={s.card}><Text style={s.h2}>Cover image</Text>{!!value && <Image testID="admin-image-preview" source={{ uri: value }} style={imageStyle.preview} contentFit="contain" />}<Text style={s.caption}>JPEG, PNG or WebP · up to 5 MB. Images are stored securely for public content.</Text>{!!error && <Text testID="admin-image-error" style={s.error}>{error}</Text>}<AdminButton testID="admin-image-upload" label={value ? "Replace image" : "Upload image"} secondary icon="image-plus" onPress={choose} loading={busy} />{!!value && <AdminButton testID="admin-image-remove" label="Remove image from this record" secondary onPress={() => onChange("")} />}</View>;
}
const useImageStyles = makeStyles(c => ({ preview: { width: "100%", height: 170, borderRadius: 12, backgroundColor: c.heroBg } }));