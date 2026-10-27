import React, { useState, useEffect, useRef } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Page } from "@/src/components/Page";
import { Btn } from "@/src/components/ui";
import { Field, SelectField, SuccessState, PHONE_RE } from "@/src/components/Form";
import { counties } from "@/src/data/home";
import { ksh } from "@/src/data/products";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { cartTotal, useApp } from "@/src/store/AppStore";
import { api, Order } from "@/src/services/api";

export default function Checkout() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { cart, clearCart, user, toast } = useApp();
  const [f, setF] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    county: user?.county ?? "",
    subcounty: "",
    location: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card" | "manual">("mpesa");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  // M-Pesa STK push live state
  const [stkStatus, setStkStatus] = useState<"idle" | "prompting" | "waiting_pin" | "paid" | "failed">("idle");
  const [stkMessage, setStkMessage] = useState("");
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const pollTimer = useRef<any>(null);

  const total = cartTotal(cart);
  const delivery = total >= 5000 || total === 0 ? 0 : 300;
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  const pollPayment = (orderId: string) => {
    let attempts = 0;
    pollTimer.current = setInterval(async () => {
      attempts++;
      if (attempts > 30) {
        clearInterval(pollTimer.current);
        if (stkStatus !== "paid") {
          setStkStatus("idle");
          setStkMessage("Payment verification timed out. If you completed payment, our team will confirm your order.");
        }
        return;
      }
      try {
        const res = await api.getPaymentStatus(orderId);
        if (res.paid) {
          clearInterval(pollTimer.current);
          setStkStatus("paid");
          setReceiptNumber(res.receiptNumber || null);
          setStkMessage("M-Pesa payment confirmed successfully!");
          qc.invalidateQueries({ queryKey: ["orders"] });
        }
      } catch (e) {}
    }, 3000);
  };

  const triggerMpesaStk = async (orderId: string, phoneNum: string) => {
    setStkStatus("prompting");
    setStkMessage("Sending Lipa Na M-Pesa prompt to your phone...");
    try {
      const res = await api.initiateMpesaStkPush(orderId, phoneNum);
      if (res.success) {
        setStkStatus("waiting_pin");
        setStkMessage("Check your phone and enter your M-Pesa PIN to complete payment.");
        pollPayment(orderId);
      } else {
        setStkStatus("failed");
        setStkMessage(res.message || "Could not trigger M-Pesa STK push.");
      }
    } catch (e: any) {
      setStkStatus("failed");
      setStkMessage(e.message || "Failed to connect to Safaricom Daraja M-Pesa gateway.");
    }
  };

  const submit = async () => {
    if (!user) {
      toast("Sign in to place your order");
      router.push("/auth/sign-in");
      return;
    }
    const e: Record<string, string> = {};
    if (f.name.trim().length < 3) e.name = "Enter your full names";
    if (!PHONE_RE.test(f.phone.replace(/\s/g, ""))) e.phone = "Enter a valid Kenyan phone number e.g. 0712345678";
    if (!f.county) e.county = "Select your county";
    if (!f.subcounty.trim()) e.subcounty = "Enter your subcounty / town";
    if (!f.location.trim()) e.location = "Enter your specific delivery location or landmark";
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const o = await api.createOrder({
        items: cart.map((c) => ({ productId: c.productId, variant: c.variant, qty: c.qty })),
        name: f.name.trim(),
        phone: f.phone.replace(/\s/g, ""),
        county: f.county,
        subcounty: f.subcounty.trim(),
        location: f.location.trim(),
        paymentMethod,
      });

      clearCart();
      qc.invalidateQueries({ queryKey: ["orders"] });
      setOrder(o);

      if (paymentMethod === "mpesa") {
        triggerMpesaStk(o.id, f.phone.replace(/\s/g, ""));
      }
    } catch (ex: any) {
      if (ex?.status === 401) {
        toast("Session expired — please sign in again");
        router.push("/auth/sign-in");
      } else {
        setErrors({ location: ex?.message ?? "Could not place order. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  if (order) {
    return (
      <Page title="Order Placed" testID="checkout-success-screen">
        <SuccessState
          testID="checkout-success"
          title={stkStatus === "paid" ? "Payment Confirmed & Order Placed!" : "Order Placed Successfully!"}
          text={`Order ${order.id} • ${ksh(order.total)}\nDelivering to ${order.location}, ${order.county}.`}
        >
          {paymentMethod === "mpesa" && (
            <View style={s.stkBox}>
              <View style={s.stkHeader}>
                <Lucide
                  name={stkStatus === "paid" ? "circle-check" : stkStatus === "failed" ? "alert-circle" : "smartphone"}
                  size={20}
                  color={stkStatus === "paid" ? colors.brandPrimary : stkStatus === "failed" ? colors.error : colors.orange}
                />
                <Text style={s.stkTitle}>
                  {stkStatus === "paid"
                    ? "M-Pesa Verified"
                    : stkStatus === "waiting_pin"
                    ? "Awaiting M-Pesa PIN"
                    : stkStatus === "failed"
                    ? "Payment Unconfirmed"
                    : "Lipa Na M-Pesa"}
                </Text>
              </View>

              {stkStatus === "waiting_pin" && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 8 }}>
                  <ActivityIndicator color={colors.brandPrimary} />
                  <Text style={s.stkDesc}>{stkMessage}</Text>
                </View>
              )}

              {stkStatus === "paid" && (
                <View style={{ marginVertical: 6 }}>
                  <Text style={[s.stkDesc, { color: colors.brandPrimary, fontFamily: fonts.b700 }]}>
                    Receipt: {receiptNumber || "Verified"}
                  </Text>
                  <Text style={s.stkDesc}>SMS confirmation sent to {order.phone}.</Text>
                </View>
              )}

              {stkStatus === "failed" && (
                <View style={{ marginVertical: 6, gap: 8 }}>
                  <Text style={[s.stkDesc, { color: colors.error }]}>{stkMessage}</Text>
                  <Btn
                    small
                    variant="green"
                    label="Retry M-Pesa STK Push"
                    onPress={() => triggerMpesaStk(order.id, order.phone)}
                  />
                </View>
              )}
            </View>
          )}

          <Btn testID="checkout-view-orders-btn" full variant="green" label="View My Orders" onPress={() => router.replace("/account/orders")} />
          <Btn testID="checkout-continue-btn" full variant="outline" label="Continue Shopping" onPress={() => router.navigate("/(tabs)/shop")} />
        </SuccessState>
      </Page>
    );
  }

  return (
    <Page title="Checkout" testID="checkout-screen">
      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 32 }}>
        {!user ? (
          <View style={s.notice} testID="checkout-signin-notice">
            <Text style={s.noticeText}>You need a verified Mqulima account to place an order.</Text>
            <Btn testID="checkout-signin-btn" small variant="green" label="Sign In / Join Us" onPress={() => router.push("/auth/sign-in")} />
          </View>
        ) : null}

        <Text style={s.h2}>Delivery Details</Text>
        <Field testID="checkout-name-input" label="Full Names" value={f.name} onChangeText={set("name")} placeholder="e.g. Kiprono Rotich" error={errors.name} autoCapitalize="words" />
        <Field testID="checkout-phone-input" label="Phone Number (Safaricom / Airtel)" value={f.phone} onChangeText={set("phone")} placeholder="0712 345 678" keyboardType="phone-pad" error={errors.phone} />
        <SelectField testID="checkout-county-select" label="County" value={f.county} options={counties} onChange={set("county")} error={errors.county} placeholder="Select county" />
        <Field testID="checkout-subcounty-input" label="Subcounty / Nearest Town" value={f.subcounty} onChangeText={set("subcounty")} placeholder="e.g. Kapseret / Eldoret Town" error={errors.subcounty} />
        <Field testID="checkout-location-input" label="Delivery Landmark / Village" value={f.location} onChangeText={set("location")} placeholder="e.g. Near Sirikwa Junction, Plot 4" error={errors.location} />

        <Text style={s.h2}>Payment Method</Text>
        <View style={s.payOptions}>
          <Pressable
            onPress={() => setPaymentMethod("mpesa")}
            style={[s.payCard, paymentMethod === "mpesa" && s.payCardActive]}
          >
            <Lucide name="smartphone" size={20} color={paymentMethod === "mpesa" ? colors.brandPrimary : colors.muted} />
            <View style={{ flex: 1 }}>
              <Text style={s.payTitle}>Lipa Na M-Pesa (STK Push)</Text>
              <Text style={s.paySub}>Instant PIN prompt sent to your Safaricom line</Text>
            </View>
            {paymentMethod === "mpesa" && <Lucide name="circle-check" size={18} color={colors.brandPrimary} />}
          </Pressable>

          <Pressable
            onPress={() => setPaymentMethod("card")}
            style={[s.payCard, paymentMethod === "card" && s.payCardActive]}
          >
            <Lucide name="credit-card" size={20} color={paymentMethod === "card" ? colors.brandPrimary : colors.muted} />
            <View style={{ flex: 1 }}>
              <Text style={s.payTitle}>Debit / Credit Card (Paystack)</Text>
              <Text style={s.paySub}>Secure Visa & Mastercard gateway</Text>
            </View>
            {paymentMethod === "card" && <Lucide name="circle-check" size={18} color={colors.brandPrimary} />}
          </Pressable>

          <Pressable
            onPress={() => setPaymentMethod("manual")}
            style={[s.payCard, paymentMethod === "manual" && s.payCardActive]}
          >
            <Lucide name="truck" size={20} color={paymentMethod === "manual" ? colors.brandPrimary : colors.muted} />
            <View style={{ flex: 1 }}>
              <Text style={s.payTitle}>Pay on Delivery / Bank Transfer</Text>
              <Text style={s.paySub}>Settle payment upon physical input inspection</Text>
            </View>
            {paymentMethod === "manual" && <Lucide name="circle-check" size={18} color={colors.brandPrimary} />}
          </Pressable>
        </View>

        <View style={s.summary} testID="checkout-summary">
          <Text style={s.h3}>Order Summary</Text>
          {cart.map((c) => (
            <View key={c.key} style={s.line}>
              <Text style={s.lineName} numberOfLines={1}>{c.qty} × {c.name}{c.variant ? ` (${c.variant})` : ""}</Text>
              <Text style={s.lineVal}>{ksh(c.price * c.qty)}</Text>
            </View>
          ))}
          <View style={s.line}>
            <Text style={s.lineName}>Delivery</Text>
            <Text style={s.lineVal}>{delivery ? ksh(delivery) : "FREE (Orders over KSh 5,000)"}</Text>
          </View>
          <View style={[s.line, s.totalLine]}>
            <Text style={s.h3}>Total</Text>
            <Text style={s.total} testID="checkout-total">{ksh(total + delivery)}</Text>
          </View>
        </View>

        <Btn
          testID="checkout-place-order-btn"
          full
          variant="green"
          label={cart.length ? (user ? (paymentMethod === "mpesa" ? "Place Order & Pay via M-Pesa" : "Complete Order") : "Sign In to Place Order") : "Cart is empty"}
          loading={loading}
          onPress={cart.length ? submit : () => router.navigate("/(tabs)/shop")}
        />
      </KeyboardAwareScrollView>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  h2: { fontFamily: fonts.h900, fontSize: 20, color: c.onSurface, marginTop: 4 },
  h3: { fontFamily: fonts.h800, fontSize: 16, color: c.onSurface },
  notice: { backgroundColor: c.brandTertiary, borderRadius: 16, padding: 14, gap: 10 },
  noticeText: { fontFamily: fonts.b600, fontSize: 13, color: c.onBrandTertiary },
  summary: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 20, padding: 16, gap: 10 },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  totalLine: { borderTopWidth: 1, borderTopColor: c.border, paddingTop: 10 },
  lineName: { fontFamily: fonts.b500, fontSize: 13, color: c.onSurfaceTertiary, flexShrink: 1 },
  lineVal: { fontFamily: fonts.b700, fontSize: 13, color: c.onSurface },
  total: { fontFamily: fonts.h900, fontSize: 18, color: c.brand },
  payOptions: { gap: 10 },
  payCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.white },
  payCardActive: { borderColor: c.brandPrimary, backgroundColor: c.heroBg },
  payTitle: { fontFamily: fonts.b700, fontSize: 14, color: c.onSurface },
  paySub: { fontFamily: fonts.b400, fontSize: 11, color: c.muted, marginTop: 2 },
  stkBox: { padding: 14, borderRadius: 16, backgroundColor: c.surfaceTertiary, borderWidth: 1, borderColor: c.border, width: "100%", gap: 6 },
  stkHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  stkTitle: { fontFamily: fonts.b700, fontSize: 14, color: c.onSurface },
  stkDesc: { fontFamily: fonts.b500, fontSize: 12, color: c.onSurfaceSecondary },
}));
