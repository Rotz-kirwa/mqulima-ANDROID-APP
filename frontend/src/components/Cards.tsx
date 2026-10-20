import React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "@/src/components/Img";
import { useRouter } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Product, ksh } from "@/src/data/products";
import { Article } from "@/src/data/articles";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { useApp } from "@/src/store/AppStore";
import { Btn } from "./ui";

export function ProductCard({ p, index = 0 }: { p: Product; index?: number }) {
  const router = useRouter();
  const s = useStyles();
  const { colors } = useTheme();
  const { addToCart, toast, saved, toggleSaved } = useApp();
  const isSaved = saved.includes(p.id);
  const price = p.variants?.[0]?.price ?? p.price;
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 50)} style={s.card}>
      <Pressable testID={`product-card-${p.id}`} onPress={() => router.push(`/product/${p.id}`)}>
        <View style={s.imgWrap}>
          <Image source={{ uri: p.image }} style={s.img} contentFit="contain" transition={250} />
          <Pressable testID={`product-save-${p.id}`} hitSlop={8} onPress={() => { toggleSaved(p.id); toast(isSaved ? "Removed from saved" : "Saved for later"); }} style={s.heart}>
            <Lucide name="heart" size={16} color={isSaved ? colors.error : colors.muted} />
          </Pressable>
        </View>
        <View style={{ padding: 10, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={s.cat} numberOfLines={1}>{p.category}</Text>
            <Lucide name="badge-check" size={12} color={colors.brandPrimary} />
          </View>
          <Text style={s.name} numberOfLines={2}>{p.name}</Text>
          <Text style={[s.stock, p.stock <= 10 && { color: colors.orange }]}>{p.stock <= 10 ? `Only ${p.stock} left` : "In Stock"}</Text>
          <Text style={s.price}>{ksh(price)}</Text>
        </View>
      </Pressable>
      <View style={{ paddingHorizontal: 10, paddingBottom: 10 }}>
        <Btn
          testID={`product-add-${p.id}`}
          small full variant="green" label="Add to Cart" icon="shopping-cart"
          onPress={() => { addToCart({ productId: p.id, name: p.name, image: p.image, price, variant: p.variants?.[0]?.label }); toast("Added to cart"); }}
        />
      </View>
    </Animated.View>
  );
}

export function ArticleCard({ a, index = 0 }: { a: Article; index?: number }) {
  const router = useRouter();
  const s = useStyles();
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 60)} style={s.article}>
      <Pressable testID={`article-card-${a.id.slice(0, 24)}`} onPress={() => router.push(`/article/${a.id}`)}>
        <View>
          <Image source={{ uri: a.image }} style={{ width: "100%", aspectRatio: 16 / 10 }} contentFit="cover" transition={300} />
          <View style={s.catPill}><Text style={s.catPillText}>{a.category}</Text></View>
        </View>
        <View style={{ padding: 20, gap: 8 }}>
          <Text style={s.read}>{a.readTime}</Text>
          <Text style={s.aTitle} numberOfLines={2}>{a.title}</Text>
          <Text style={s.aEx} numberOfLines={3}>{a.excerpt}</Text>
          <Btn label="Read article" icon="arrow-up-right" full small onPress={() => router.push(`/article/${a.id}`)} style={{ marginTop: 8 }} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const useStyles = makeStyles((c) => ({
  card: { flex: 1, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, borderRadius: 16, overflow: "hidden" },
  imgWrap: { backgroundColor: c.white, height: 150, padding: 10 },
  img: { width: "100%", height: "100%" },
  heart: { position: "absolute", top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: c.white, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: c.border },
  cat: { fontFamily: fonts.b600, fontSize: 10, color: c.muted, flexShrink: 1 },
  name: { fontFamily: fonts.h800, fontSize: 14, color: c.onSurface, lineHeight: 18, minHeight: 36 },
  stock: { fontFamily: fonts.b600, fontSize: 11, color: c.brandPrimary },
  price: { fontFamily: fonts.h900, fontSize: 16, color: c.onSurface },
  article: { backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, borderRadius: 28, overflow: "hidden" },
  catPill: { position: "absolute", left: 16, top: 16, backgroundColor: c.forest, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  catPillText: { color: c.white, fontFamily: fonts.b700, fontSize: 10, letterSpacing: 0.6, textTransform: "uppercase" },
  read: { fontFamily: fonts.b700, fontSize: 10, color: c.subtle, textTransform: "uppercase", letterSpacing: 0.6 },
  aTitle: { fontFamily: fonts.h700, fontSize: 16, color: c.onSurface, lineHeight: 21 },
  aEx: { fontFamily: fonts.b400, fontSize: 12, color: c.onSurfaceTertiary, lineHeight: 18 },
}));
