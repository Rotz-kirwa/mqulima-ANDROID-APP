import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "@/src/components/Img";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Page } from "@/src/components/Page";
import { Skeleton } from "@/src/components/Skeleton";
import { Btn, Body, Pill } from "@/src/components/ui";
import { api } from "@/src/services/api";
import { ksh } from "@/src/data/products";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { useApp } from "@/src/store/AppStore";

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addToCart, toast, saved, toggleSaved } = useApp();
  const q = useQuery({ queryKey: ["product", id], queryFn: () => api.getProduct(id) });
  const [vi, setVi] = useState(0);
  const [qty, setQty] = useState(1);
  const p = q.data;

  if (q.isLoading) {
    return (
      <Page title="Product">
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton style={{ height: 300, borderRadius: 24 }} />
          <Skeleton style={{ height: 24, width: "80%" }} />
          <Skeleton style={{ height: 20, width: "40%" }} />
        </View>
      </Page>
    );
  }
  if (!p) {
    return (
      <Page title="Product">
        <View style={{ padding: 24, alignItems: "center", gap: 12 }}>
          <Text style={s.name}>Product Not Found</Text>
          <Btn label="Back to AgroShop" onPress={() => router.navigate("/(tabs)/shop")} />
        </View>
      </Page>
    );
  }
  const variant = p.variants?.[vi];
  const price = variant?.price ?? p.price;
  const isSaved = saved.includes(p.id);
  const add = () => {
    addToCart({ productId: p.id, name: p.name, image: p.image, price, variant: variant?.label }, qty);
    toast("Added to cart");
  };

  return (
    <Page title="Product Details" testID="product-detail-screen">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        <View style={s.imgWrap}>
          <Image source={{ uri: p.image }} style={{ width: "100%", height: "100%" }} contentFit="contain" transition={300} />
          <Pressable testID="product-detail-save" onPress={() => { toggleSaved(p.id); toast(isSaved ? "Removed from saved" : "Saved for later"); }} style={s.heart}>
            <Lucide name="heart" size={20} color={isSaved ? colors.error : colors.muted} />
          </Pressable>
        </View>
        <View style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Pill label={p.category} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Lucide name="badge-check" size={14} color={colors.brandPrimary} />
              <Text style={s.verified}>Verified</Text>
            </View>
          </View>
          <Text style={s.name} testID="product-detail-name">{p.name}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            {Array.from({ length: 5 }).map((_, i) => <Lucide key={i} name="star" size={14} color={i < Math.round(p.rating) ? colors.orange : colors.border} />)}
            <Text style={s.meta}> {p.rating.toFixed(1)}</Text>
            <Text style={[s.meta, { marginLeft: 8, color: p.stock <= 10 ? colors.orange : colors.brandPrimary }]}>{p.stock <= 10 ? `Only ${p.stock} left` : "In Stock"}</Text>
          </View>
          <Text style={s.price} testID="product-detail-price">{ksh(price)}</Text>
          {p.variants ? (
            <View style={{ gap: 8 }}>
              <Text style={s.label}>Select Size / Variant</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {p.variants.map((v, i) => (
                  <Pressable key={v.label} testID={`variant-${v.label.toLowerCase()}`} onPress={() => setVi(i)} style={[s.variant, i === vi && s.variantActive]}>
                    <Text style={[s.variantText, i === vi && { color: colors.white }]}>{v.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
          <View style={{ gap: 8 }}>
            <Text style={s.label}>Quantity</Text>
            <View style={s.stepper}>
              <Pressable testID="qty-minus" onPress={() => setQty((x) => Math.max(1, x - 1))} style={s.stepBtn}><Lucide name="minus" size={18} color={colors.onSurface} /></Pressable>
              <Text style={s.qty} testID="qty-value">{qty}</Text>
              <Pressable testID="qty-plus" onPress={() => setQty((x) => Math.min(p.stock, x + 1))} style={s.stepBtn}><Lucide name="plus" size={18} color={colors.onSurface} /></Pressable>
            </View>
          </View>
          <Text style={s.label}>Description</Text>
          <Body>{p.description}</Body>
          <View style={s.trust}>
            {[["truck", "Free delivery on orders above KSh 5,000"], ["shield-check", "Secure M-Pesa escrow payments"], ["headset", "Agronomist phone guidance included"]].map(([ic, t]) => (
              <View key={t} style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                <Lucide name={ic as any} size={18} color={colors.brandPrimary} />
                <Text style={s.trustText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={[s.bar, { paddingBottom: insets.bottom + 12 }]}>
        <Btn testID="product-add-to-cart-btn" variant="outline" label="Add to Cart" icon="shopping-cart" onPress={add} style={{ flex: 1 }} />
        <Btn testID="product-buy-now-btn" variant="green" label="Buy Now" onPress={() => { add(); router.push("/cart"); }} style={{ flex: 1 }} />
      </View>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  imgWrap: { height: 320, backgroundColor: c.white, padding: 24, borderBottomWidth: 1, borderBottomColor: c.border },
  heart: { position: "absolute", top: 16, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" },
  verified: { fontFamily: fonts.b700, fontSize: 12, color: c.brandPrimary },
  name: { fontFamily: fonts.h900, fontSize: 24, lineHeight: 28, color: c.onSurface },
  meta: { fontFamily: fonts.b600, fontSize: 12, color: c.muted },
  price: { fontFamily: fonts.h900, fontSize: 28, color: c.brand },
  label: { fontFamily: fonts.b700, fontSize: 13, color: c.onSurface },
  variant: { minHeight: 44, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.white, justifyContent: "center" },
  variantActive: { backgroundColor: c.forest, borderColor: c.forest },
  variantText: { fontFamily: fonts.b700, fontSize: 13, color: c.onSurface },
  stepper: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", borderWidth: 1, borderColor: c.border, borderRadius: 12, backgroundColor: c.white },
  stepBtn: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  qty: { minWidth: 40, textAlign: "center", fontFamily: fonts.h800, fontSize: 16, color: c.onSurface },
  trust: { backgroundColor: c.brandTertiary, borderRadius: 20, padding: 16, gap: 12 },
  trustText: { fontFamily: fonts.b600, fontSize: 13, color: c.onBrandTertiary, flexShrink: 1 },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: c.white, borderTopWidth: 1, borderTopColor: c.border },
}));
