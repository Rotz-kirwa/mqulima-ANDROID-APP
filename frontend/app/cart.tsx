import React from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Image } from "@/src/components/Img";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Page } from "@/src/components/Page";
import { Btn, Body } from "@/src/components/ui";
import { ksh } from "@/src/data/products";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { cartTotal, useApp } from "@/src/store/AppStore";

export default function Cart() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cart, setQty, removeFromCart } = useApp();
  const total = cartTotal(cart);

  return (
    <Page title="My Cart" testID="cart-screen">
      <FlatList
        data={cart}
        keyExtractor={(c) => c.key}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 160 + insets.bottom }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", gap: 12, paddingTop: 48 }} testID="cart-empty">
            <View style={s.emptyIcon}><Lucide name="shopping-cart" size={36} color={colors.brandPrimary} /></View>
            <Text style={s.emptyTitle}>Your cart is empty</Text>
            <Body style={{ textAlign: "center" }}>Browse certified seeds, fertilizers, feeds and farm tools.</Body>
            <Btn testID="cart-browse-btn" variant="green" label="Browse AgroShop" onPress={() => router.navigate("/(tabs)/shop")} />
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.row} testID={`cart-item-${item.productId}`}>
            <Image source={{ uri: item.image }} style={s.img} contentFit="contain" />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.name} numberOfLines={2}>{item.name}</Text>
              {item.variant ? <Text style={s.variant}>{item.variant}</Text> : null}
              <Text style={s.price}>{ksh(item.price * item.qty)}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={s.stepper}>
                  <Pressable testID={`cart-minus-${item.productId}`} onPress={() => setQty(item.key, item.qty - 1)} style={s.stepBtn}><Lucide name="minus" size={16} color={colors.onSurface} /></Pressable>
                  <Text style={s.qty} testID={`cart-qty-${item.productId}`}>{item.qty}</Text>
                  <Pressable testID={`cart-plus-${item.productId}`} onPress={() => setQty(item.key, item.qty + 1)} style={s.stepBtn}><Lucide name="plus" size={16} color={colors.onSurface} /></Pressable>
                </View>
                <Pressable testID={`cart-remove-${item.productId}`} onPress={() => removeFromCart(item.key)} style={s.stepBtn}>
                  <Lucide name="trash-2" size={18} color={colors.error} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
      {cart.length ? (
        <View style={[s.bar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={s.totalL}>Subtotal</Text>
            <Text style={s.total} testID="cart-total">{ksh(total)}</Text>
          </View>
          <Text style={s.note}>{total >= 5000 ? "🎉 You qualify for free delivery" : `Add ${ksh(5000 - total)} more for free delivery`}</Text>
          <Btn testID="cart-checkout-btn" full variant="green" label="Proceed to Checkout" onPress={() => router.push("/checkout")} />
        </View>
      ) : null}
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontFamily: fonts.h900, fontSize: 22, color: c.onSurface },
  row: { flexDirection: "row", gap: 12, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 20, padding: 12 },
  img: { width: 84, height: 84, borderRadius: 12, backgroundColor: c.white },
  name: { fontFamily: fonts.h700, fontSize: 14, color: c.onSurface },
  variant: { fontFamily: fonts.b600, fontSize: 12, color: c.muted },
  price: { fontFamily: fonts.h900, fontSize: 16, color: c.brand },
  stepper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: c.border, borderRadius: 12 },
  stepBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  qty: { minWidth: 28, textAlign: "center", fontFamily: fonts.h800, fontSize: 15, color: c.onSurface },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, gap: 8, padding: 16, backgroundColor: c.white, borderTopWidth: 1, borderTopColor: c.border },
  totalL: { fontFamily: fonts.b600, fontSize: 15, color: c.onSurfaceTertiary },
  total: { fontFamily: fonts.h900, fontSize: 20, color: c.onSurface },
  note: { fontFamily: fonts.b600, fontSize: 12, color: c.brandPrimary },
}));
