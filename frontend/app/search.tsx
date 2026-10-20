import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Image } from "@/src/components/Img";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lucide } from "@react-native-vector-icons/lucide";
import { ListSkeleton } from "@/src/components/Skeleton";
import { api } from "@/src/services/api";
import { ksh } from "@/src/data/products";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function Search() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const r = useQuery({ queryKey: ["search", q], queryFn: () => api.search(q) });
  const d = r.data;
  const empty = q.trim() && d && !d.products.length && !d.articles.length && !d.services.length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }} testID="search-screen">
      <View style={[s.bar, { paddingTop: insets.top + 8 }]}>
        <Pressable testID="search-back" onPress={() => router.back()} style={s.back}><Lucide name="arrow-left" size={22} color={colors.onSurface} /></Pressable>
        <View style={s.box}>
          <Lucide name="search" size={18} color={colors.muted} />
          <TextInput testID="global-search-input" autoFocus value={q} onChangeText={setQ} placeholder="Search Mqulima..." placeholderTextColor={colors.subtle} style={s.input} returnKeyType="search" />
          {q ? <Pressable testID="search-clear" onPress={() => setQ("")} hitSlop={8}><Lucide name="x" size={18} color={colors.muted} /></Pressable> : null}
        </View>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 96 }}>
        {!q.trim() ? (
          <View style={{ gap: 10 }}>
            <Text style={s.h}>Popular searches</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {["Fertilizer", "Sprayer", "Dairy", "Soil testing", "Chicken feed", "Milk", "Borehole"].map((t) => (
                <Pressable key={t} testID={`search-popular-${t.toLowerCase().replace(/\s/g, "-")}`} onPress={() => setQ(t)} style={s.chip}><Text style={s.chipText}>{t}</Text></Pressable>
              ))}
            </View>
          </View>
        ) : r.isLoading ? (
          <View style={{ marginHorizontal: -16 }}><ListSkeleton count={4} height={56} /></View>
        ) : empty ? (
          <Text style={s.empty} testID="search-empty">No results for “{q}”</Text>
        ) : (
          <>
            {d?.products.length ? <Text style={s.h}>Products ({d.products.length})</Text> : null}
            {d?.products.slice(0, 8).map((p) => (
              <Pressable key={p.id} testID={`search-result-product-${p.id}`} onPress={() => router.push(`/product/${p.id}`)} style={s.row}>
                <Image source={{ uri: p.image }} style={s.thumb} contentFit="contain" />
                <View style={{ flex: 1 }}>
                  <Text style={s.title} numberOfLines={1}>{p.name}</Text>
                  <Text style={s.meta}>{p.category} • {ksh(p.variants?.[0]?.price ?? p.price)}</Text>
                </View>
              </Pressable>
            ))}
            {d?.articles.length ? <Text style={s.h}>Articles ({d.articles.length})</Text> : null}
            {d?.articles.map((a) => (
              <Pressable key={a.id} testID={`search-result-article-${a.id.slice(0, 20)}`} onPress={() => router.push(`/article/${a.id}`)} style={s.row}>
                <Image source={{ uri: a.image }} style={s.thumb} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={s.title} numberOfLines={2}>{a.title}</Text>
                  <Text style={s.meta}>{a.category} • {a.readTime}</Text>
                </View>
              </Pressable>
            ))}
            {d?.services.length ? <Text style={s.h}>Services ({d.services.length})</Text> : null}
            {d?.services.map((sv) => (
              <Pressable key={sv.id} testID={`search-result-service-${sv.id}`} onPress={() => router.push(`/services/${sv.categoryId}`)} style={s.row}>
                <Image source={{ uri: sv.image }} style={s.thumb} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{sv.title}</Text>
                  <Text style={s.meta}>{sv.tag}</Text>
                </View>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  bar: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingBottom: 10, backgroundColor: c.white, borderBottomWidth: 1, borderBottomColor: c.border },
  back: { width: 44, height: 48, alignItems: "center", justifyContent: "center" },
  box: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, height: 48, borderRadius: 12, backgroundColor: c.surfaceTertiary, paddingHorizontal: 12 },
  input: { flex: 1, height: 48, fontFamily: fonts.b500, fontSize: 15, color: c.onSurface },
  h: { fontFamily: fonts.h800, fontSize: 15, color: c.onSurface, marginTop: 6 },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: c.border, backgroundColor: c.white, justifyContent: "center" },
  chipText: { fontFamily: fonts.b600, fontSize: 12, color: c.onSurface },
  row: { flexDirection: "row", gap: 12, alignItems: "center", backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 8, minHeight: 64 },
  thumb: { width: 52, height: 52, borderRadius: 10, backgroundColor: c.white },
  title: { fontFamily: fonts.h700, fontSize: 14, color: c.onSurface },
  meta: { fontFamily: fonts.b500, fontSize: 12, color: c.muted },
  empty: { fontFamily: fonts.b600, fontSize: 14, color: c.muted, textAlign: "center", marginTop: 32 },
}));
