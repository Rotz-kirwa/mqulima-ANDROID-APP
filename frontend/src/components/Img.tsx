import React from "react";
import { Platform } from "react-native";
import { Image as ExpoImage, ImageProps } from "expo-image";

// mqulima.com sends `Cross-Origin-Resource-Policy: same-origin`, which only browsers enforce.
// Native (iOS/Android) loads the site URLs directly; the web preview goes through a public image proxy.
const proxy = (uri: string) =>
  Platform.OS === "web" && uri.startsWith("https://www.mqulima.com")
    ? `https://images.weserv.nl/?url=${encodeURIComponent(uri.replace("https://", ""))}&output=webp`
    : uri;

export function Image(props: ImageProps) {
  const src = props.source as { uri?: string } | undefined;
  const source = src && typeof src === "object" && "uri" in src && src.uri ? { ...src, uri: proxy(src.uri) } : props.source;
  return <ExpoImage cachePolicy="memory-disk" {...props} source={source} />;
}
