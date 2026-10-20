import React from "react";
import { FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Page, useStackBottom } from "@/src/components/Page";
import { ProductCard } from "@/src/components/Cards";
import { Btn, Body } from "@/src/components/ui";
import { products } from "@/src/data/products";
import { fonts, useTheme } from "@/src/theme";
import { useApp } from "@/src/store/AppStore";

export default function Saved() {
  const { colors } = useTheme();
  const router = useRouter();
  const bottom = useStackBottom();
  const { saved } = useApp();
  const items = products.filter((p) => saved.includes(p.id));
  return (
    <Page title="Saved Items" testID="saved-screen">
      <FlatList
        data={items}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottom }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", gap: 10, paddingTop: 48 }} testID="saved-empty">
            <Lucide name="heart" size={40} color={colors.subtle} />
            <Text style={{ fontFamily: fonts.h800, fontSize: 18, color: colors.onSurface }}>No saved items</Text>
            <Body>Tap the heart on any product to save it.</Body>
            <Btn variant="green" label="Browse AgroShop" onPress={() => router.navigate("/(tabs)/shop")} />
          </View>
        }
        renderItem={({ item, index }) => <View style={{ flex: 1, maxWidth: "50%" }}><ProductCard p={item} index={index} /></View>}
      />
    </Page>
  );
}
