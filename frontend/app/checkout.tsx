import React, { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Page } from "@/src/components/Page";
import { Btn } from "@/src/components/ui";
import { Field, SelectField, SuccessState, PHONE_RE } from "@/src/components/Form";
import { counties } from "@/src/data/home";
import { ksh } from "@/src/data/products";
import { fonts, makeStyles } from "@/src/theme";
import { cartTotal, Order, useApp } from "@/src/store/AppStore";


export default function Checkout() {
  const s = useStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cart, placeOrder, user } = useApp();
  const [f, setF] = useState({ name: user?.name ?? "", phone: user?.phone ?? "", county: user?.county ?? "", subcounty: "", location: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const total = cartTotal(cart);
  const delivery = total >= 5000 || total === 0 ? 0 : 300;
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  const submit = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 3) e.name = "Enter your full names";
    if (!PHONE_RE.test(f.phone.replace(/\s/g, ""))) e.phone = "Enter a valid phone number e.g. 0712345678";
    if (!f.county) e.county = "Select your county";
    if (!f.subcounty.trim()) e.subcounty = "Enter your subcounty";
    if (!f.location.trim()) e.location = "Enter your location name";
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    setTimeout(() => {
      setOrder(placeOrder(f.county, f.location));
      setLoading(false);
    }, 900);
  };

  if (order) {
    return (
      <Page title="Order Placed" testID="checkout-success-screen">
        <SuccessState testID="checkout-success" title="Order placed successfully!" text={`Order ${order.id} • ${ksh(order.total)}\nWe'll call ${f.phone} to confirm payment via M-Pesa and delivery to ${f.location}, ${f.county}.`}>
          <Btn testID="checkout-view-orders-btn" full variant="green" label="View My Orders" onPress={() => router.replace("/account/orders")} />
          <Btn testID="checkout-continue-btn" full variant="outline" label="Continue Shopping" onPress={() => router.navigate("/(tabs)/shop")} />
        </SuccessState>
      </Page>
    );
  }

  return (
    <Page title="Checkout" testID="checkout-screen">
      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 32 }}>
        <Text style={s.h2}>Delivery Details</Text>
        <Field testID="checkout-name-input" label="Full Names" value={f.name} onChangeText={set("name")} placeholder="e.g. Kosgei Kiprono" error={errors.name} autoCapitalize="words" />
        <Field testID="checkout-phone-input" label="Phone Number" value={f.phone} onChangeText={set("phone")} placeholder="0712 345 678" keyboardType="phone-pad" error={errors.phone} />
        <SelectField testID="checkout-county-select" label="County" value={f.county} options={counties} onChange={set("county")} error={errors.county} placeholder="Select county" />
        <Field testID="checkout-subcounty-input" label="Subcounty" value={f.subcounty} onChangeText={set("subcounty")} placeholder="e.g. Kapseret" error={errors.subcounty} />
        <Field testID="checkout-location-input" label="Location Name" value={f.location} onChangeText={set("location")} placeholder="e.g. Langas, near the market" error={errors.location} />
        <View style={s.summary} testID="checkout-summary">
          <Text style={s.h3}>Order Summary</Text>
          {cart.map((c) => (
            <View key={c.key} style={s.line}>
              <Text style={s.lineName} numberOfLines={1}>{c.qty} × {c.name}{c.variant ? ` (${c.variant})` : ""}</Text>
              <Text style={s.lineVal}>{ksh(c.price * c.qty)}</Text>
            </View>
          ))}
          <View style={s.line}><Text style={s.lineName}>Delivery</Text><Text style={s.lineVal}>{delivery ? ksh(delivery) : "FREE"}</Text></View>
          <View style={[s.line, { borderTopWidth: 1, borderTopColor: "#E2E8F0", paddingTop: 10 }]}>
            <Text style={s.h3}>Total</Text>
            <Text style={s.total} testID="checkout-total">{ksh(total + delivery)}</Text>
          </View>
          <Text style={s.lineName}>Payment: M-Pesa on confirmation (secure escrow)</Text>
        </View>
        <Btn testID="checkout-place-order-btn" full variant="green" label={cart.length ? "Place Order" : "Cart is empty"} loading={loading} onPress={cart.length ? submit : () => router.navigate("/(tabs)/shop")} />
      </KeyboardAwareScrollView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  h2: { fontFamily: fonts.h900, fontSize: 22, color: c.onSurface },
  h3: { fontFamily: fonts.h800, fontSize: 16, color: c.onSurface },
  summary: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 20, padding: 16, gap: 10 },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  lineName: { fontFamily: fonts.b500, fontSize: 13, color: c.onSurfaceTertiary, flexShrink: 1 },
  lineVal: { fontFamily: fonts.b700, fontSize: 13, color: c.onSurface },
  total: { fontFamily: fonts.h900, fontSize: 18, color: c.brand },
}));
