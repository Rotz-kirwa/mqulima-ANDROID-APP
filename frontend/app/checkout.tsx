import React, { useState, useEffect, useRef } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Lucide } from "@react-native-vector-icons/lucide";
import Animated, {
  Easing,
  FadeInDown,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Page } from "@/src/components/Page";
import { Image } from "@/src/components/Img";
import { PaymentMethodSelector, type CheckoutPaymentMethod } from "@/src/components/PaymentMethodSelector";
import { PaystackWebModal } from "@/src/components/PaystackWebModal";
import { Btn } from "@/src/components/ui";
import { Field, SelectField, SuccessState, PHONE_RE } from "@/src/components/Form";
import { counties } from "@/src/data/home";
import { ksh } from "@/src/data/products";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { cartCount, cartTotal, useApp } from "@/src/store/AppStore";
import { api, Order } from "@/src/services/api";

const FREE_DELIVERY_THRESHOLD = 5000;
const POLL_MAX_ATTEMPTS = 30;
const POLL_INTERVAL_MS = 3000;

function PulsingPaymentHalo({ color }: { color: string }) {
  const s = useStyles();
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.45 - pulse.value * 0.35,
    transform: [{ scale: 1 + pulse.value * 0.35 }],
  }));

  return <Animated.View pointerEvents="none" style={[s.pulseRing, { backgroundColor: color }, haloStyle]} />;
}

export default function Checkout() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderId?: string;
    reference?: string;
    trxref?: string;
    method?: string;
  }>();
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
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("mpesa");
  const [forcePaystackForMpesa, setForcePaystackForMpesa] = useState(false);
  const isDirectMpesa = paymentMethod === "mpesa" && !forcePaystackForMpesa;
  const isPaystackMethod =
    paymentMethod === "airtel" ||
    paymentMethod === "visa" ||
    paymentMethod === "mastercard" ||
    (paymentMethod === "mpesa" && forcePaystackForMpesa);
  const methodLabel =
    paymentMethod === "mpesa"
      ? "M-Pesa"
      : paymentMethod === "airtel"
      ? "Airtel Money"
      : paymentMethod === "visa"
      ? "Visa"
      : paymentMethod === "mastercard"
      ? "Mastercard"
      : "Pay on Delivery";
  const isMobileMoneyMethod = paymentMethod === "mpesa" || paymentMethod === "airtel";
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);

  // Live payment verification state
  const [stkStatus, setStkStatus] = useState<"idle" | "prompting" | "waiting_pin" | "paid" | "failed">("idle");
  const [stkMessage, setStkMessage] = useState("");
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [orderCancelled, setOrderCancelled] = useState(false);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [payReference, setPayReference] = useState<string | null>(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [checkoutPhone, setCheckoutPhone] = useState(user?.phone ?? "");
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [checkingNow, setCheckingNow] = useState(false);
  const pollTimer = useRef<any>(null);
  const countdownTimer = useRef<any>(null);
  const fallbackTimer = useRef<any>(null);
  const handledCallbackRef = useRef<string | null>(null);

  const itemCount = cartCount(cart);
  const total = cartTotal(cart);
  const delivery = total >= FREE_DELIVERY_THRESHOLD || total === 0 ? 0 : 300;
  const grandTotal = total + delivery;
  const freeProgress = Math.min(1, total / FREE_DELIVERY_THRESHOLD);
  const amountToFree = Math.max(0, FREE_DELIVERY_THRESHOLD - total);

  const deliveryReady =
    f.name.trim().length >= 3 &&
    PHONE_RE.test(f.phone.replace(/[\s\-()]/g, "")) &&
    !!f.county &&
    !!f.subcounty.trim() &&
    !!f.location.trim();

  const set = (k: keyof typeof f) => (v: string) => {
    setF((x) => ({ ...x, [k]: v }));
    setErrors((prev) => {
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });
  };

  const stopPolling = () => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
    if (fallbackTimer.current) {
      clearTimeout(fallbackTimer.current);
      fallbackTimer.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const applyPaymentStatus = (res: Awaited<ReturnType<typeof api.getPaymentStatus>>) => {
    if (res.paid) {
      stopPolling();
      setStkStatus("paid");
      setOrderCancelled(false);
      setReceiptNumber(res.receiptNumber || null);
      setStkMessage("Payment confirmed! A confirmation SMS has been sent.");
      clearCart();
      qc.invalidateQueries({ queryKey: ["orders"] });
      return true;
    }
    if (res.failed || res.cancelled || res.status?.toLowerCase() === "failed") {
      stopPolling();
      setStkStatus("failed");
      setOrderCancelled(true);
      setStkMessage(res.message || "Payment was cancelled or declined. No charge was made.");
      qc.invalidateQueries({ queryKey: ["orders"] });
      return true;
    }
    return false;
  };

  const pollPayment = (orderId: string) => {
    stopPolling();
    let attempts = 0;
    setSecondsLeft(Math.round((POLL_MAX_ATTEMPTS * POLL_INTERVAL_MS) / 1000));

    countdownTimer.current = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    pollTimer.current = setInterval(async () => {
      attempts++;
      if (attempts > POLL_MAX_ATTEMPTS) {
        stopPolling();
        setStkStatus("failed");
        setStkMessage("Payment confirmation timed out. If you didn't enter your PIN or closed checkout, no charge was confirmed.");
        return;
      }
      try {
        const res = await api.getPaymentStatus(orderId);
        applyPaymentStatus(res);
      } catch {}
    }, POLL_INTERVAL_MS);
  };

  useEffect(() => {
    const orderIdParam = typeof params.orderId === "string" ? params.orderId.trim() : "";
    const refParam =
      typeof params.reference === "string" && params.reference.trim()
        ? params.reference.trim()
        : typeof params.trxref === "string" && params.trxref.trim()
        ? params.trxref.trim()
        : "";
    if (!orderIdParam || !refParam) return;
    const key = `${orderIdParam}:${refParam}`;
    if (handledCallbackRef.current === key) return;
    handledCallbackRef.current = key;

    const m = typeof params.method === "string" ? params.method : "";

    (async () => {
      try {
        const list = await api.getOrders().catch(() => []);
        if (m === "mpesa" || m === "airtel" || m === "visa" || m === "mastercard") {
          setPaymentMethod(m);
          if (m === "mpesa") setForcePaystackForMpesa(true);
        }
        const matched = Array.isArray(list) ? list.find((item) => item.id === orderIdParam) : undefined;
        setOrder(
          matched || {
            id: orderIdParam,
            date: new Date().toISOString(),
            status: "Pending Payment",
            paymentStatus: "Pending",
            items: [],
            subtotal: total,
            delivery,
            total: grandTotal || total,
            county: f.county || "Kenya",
            subcounty: f.subcounty || "",
            location: f.location || f.county || "Delivery",
            phone: f.phone || user?.phone || "",
          }
        );
        setPayReference(refParam);
        setStkStatus("prompting");
        setStkMessage("Verifying your Paystack payment...");
        await api.verifyPaystack(refParam).catch(() => null);
        const statusRes = await api.getPaymentStatus(orderIdParam);
        if (!applyPaymentStatus(statusRes)) {
          setStkStatus("waiting_pin");
          setStkMessage("Checking Paystack confirmation status...");
          pollPayment(orderIdParam);
        }
      } catch {
        setStkStatus("failed");
        setStkMessage("Could not verify Paystack payment automatically. Tap Check Status or Retry.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.orderId, params.reference, params.trxref]);

  const handleCheckNow = async () => {
    if (!order || checkingNow) return;
    setCheckingNow(true);
    try {
      const res = await api.getPaymentStatus(order.id);
      const finished = applyPaymentStatus(res);
      if (!finished) {
        toast(
          isDirectMpesa
            ? "Payment not confirmed yet — enter your M-Pesa PIN on your phone and check again."
            : "Payment not confirmed yet — complete checkout on Paystack and check again."
        );
      }
    } catch {
      toast("Could not reach payment gateway right now.");
    } finally {
      setCheckingNow(false);
    }
  };

  const paystackChannelsFor = (m: CheckoutPaymentMethod): string[] =>
    m === "mpesa" || m === "airtel" ? ["mobile_money"] : ["card"];

  const openPaystackUrl = (url: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.assign(url);
      return;
    }
    setPayUrl(url);
    setPayModalOpen(true);
  };

  const triggerMpesaStkCheckout = async (targetOrder: Order, phone: string) => {
    setForcePaystackForMpesa(false);
    setOrder(targetOrder);
    setOrderCancelled(false);
    setStkStatus("prompting");
    setStkMessage(`Sending M-Pesa STK Push prompt to ${phone}...`);
    try {
      const res = await api.initiateMpesaStkPush(targetOrder.id, phone);
      if (res.success) {
        setStkStatus("waiting_pin");
        setStkMessage(
          res.message || `Check your phone (${phone}) and enter your M-Pesa PIN to complete payment.`
        );
        pollPayment(targetOrder.id);
      } else {
        setStkStatus("failed");
        setStkMessage("Could not send M-Pesa STK Push to your phone. Tap Retry or try Paystack.");
      }
    } catch (e: any) {
      if (e?.status === 409) {
        setOrderCancelled(true);
      }
      setStkStatus("failed");
      setStkMessage(e?.message || "M-Pesa STK Push request failed. Tap Retry or try Paystack.");
    }
  };

  const triggerPaystackCheckout = async (targetOrder: Order, method: CheckoutPaymentMethod) => {
    if (method === "mpesa") {
      setForcePaystackForMpesa(true);
    }
    const label =
      method === "mpesa"
        ? "Paystack M-Pesa"
        : method === "airtel"
        ? "Paystack Airtel Money"
        : `Paystack ${method === "visa" ? "Visa" : "Mastercard"}`;
    const callbackUrl =
      Platform.OS === "web" && typeof window !== "undefined"
        ? `${window.location.origin}/checkout?orderId=${encodeURIComponent(targetOrder.id)}&method=${method}`
        : undefined;
    try {
      const res = await api.initiatePaystack(targetOrder.id, user?.email || "", {
        channels: paystackChannelsFor(method),
        paymentMethod: method,
        callbackUrl,
      });
      if (res.success && res.authorizationUrl) {
        setOrderCancelled(false);
        setPayUrl(res.authorizationUrl);
        setPayReference(res.reference || null);

        if (Platform.OS === "web" && typeof window !== "undefined") {
          window.location.assign(res.authorizationUrl);
          if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
          fallbackTimer.current = setTimeout(() => {
            setOrder(targetOrder);
            setStkStatus("waiting_pin");
            setStkMessage(`Complete your ${label} payment (${ksh(targetOrder.total)}) on Paystack, then return here.`);
            pollPayment(targetOrder.id);
          }, 1500);
          return;
        }

        setOrder(targetOrder);
        setStkStatus("waiting_pin");
        setStkMessage(`Complete your ${label} payment (${ksh(targetOrder.total)}) in Paystack.`);
        setPayModalOpen(true);
        pollPayment(targetOrder.id);
      } else {
        setOrder(targetOrder);
        setStkStatus("failed");
        setStkMessage(`Could not initialize ${label} checkout. Please try again.`);
      }
    } catch (e: any) {
      setOrder(targetOrder);
      setStkStatus("failed");
      setStkMessage(e?.message || `Failed to initialize ${label} checkout.`);
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
    const cleanPhone = f.phone.replace(/[\s\-()]/g, "");
    if (!PHONE_RE.test(cleanPhone)) e.phone = "Enter a valid Kenyan phone number e.g. 0712 345 678";
    if (!f.county) e.county = "Select your county";
    if (!f.subcounty.trim()) e.subcounty = "Enter your subcounty / town";
    if (!f.location.trim()) e.location = "Enter your specific delivery location or landmark";
    setErrors(e);
    if (Object.keys(e).length) {
      toast("Please complete the highlighted delivery details");
      return;
    }

    setCheckoutPhone(cleanPhone);
    setLoading(true);
    try {
      const o = await api.createOrder({
        items: cart.map((c) => ({ productId: c.productId, variant: c.variant, qty: c.qty })),
        name: f.name.trim(),
        phone: cleanPhone,
        county: f.county,
        subcounty: f.subcounty.trim(),
        location: f.location.trim(),
        paymentMethod,
      });

      setOrderCancelled(false);
      setForcePaystackForMpesa(false);
      qc.invalidateQueries({ queryKey: ["orders"] });

      if (paymentMethod === "manual") {
        setOrder(o);
        clearCart();
      } else if (paymentMethod === "mpesa") {
        await triggerMpesaStkCheckout(o, cleanPhone);
      } else {
        await triggerPaystackCheckout(o, paymentMethod);
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

  const handleRetryPayment = async () => {
    if (!order || paymentMethod === "manual") return;
    const cleanPhone = checkoutPhone || f.phone.replace(/[\s\-()]/g, "");
    if (orderCancelled && cart.length > 0) {
      setStkStatus("prompting");
      try {
        const o = await api.createOrder({
          items: cart.map((c) => ({ productId: c.productId, variant: c.variant, qty: c.qty })),
          name: f.name.trim(),
          phone: cleanPhone,
          county: f.county,
          subcounty: f.subcounty.trim(),
          location: f.location.trim(),
          paymentMethod,
        });
        setOrderCancelled(false);
        qc.invalidateQueries({ queryKey: ["orders"] });
        if (paymentMethod === "mpesa" && !forcePaystackForMpesa) {
          await triggerMpesaStkCheckout(o, cleanPhone);
        } else {
          await triggerPaystackCheckout(o, paymentMethod);
        }
      } catch (err: any) {
        setStkStatus("failed");
        setStkMessage(err?.message || "Could not re-initiate order. Please check your cart.");
      }
      return;
    }
    if (paymentMethod === "mpesa" && !forcePaystackForMpesa) {
      await triggerMpesaStkCheckout(order, cleanPhone);
      return;
    }
    await triggerPaystackCheckout(order, paymentMethod);
  };

  const switchPaymentMethod = () => {
    stopPolling();
    setPayModalOpen(false);
    setForcePaystackForMpesa(false);
    setOrder(null);
    setStkStatus("idle");
    setStkMessage("");
    setPayUrl(null);
    setPayReference(null);
    setOrderCancelled(false);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  };

  if (order) {
    const isOrderConfirmed = paymentMethod === "manual" || stkStatus === "paid";
    if (isOrderConfirmed) {
      const isPaidOrder = stkStatus === "paid";
      return (
        <Page title={isPaidOrder ? "Order Confirmed" : "Order Reserved (Unpaid)"} testID="checkout-success-screen">
          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
            <Animated.View entering={FadeInDown.duration(260)}>
              <SuccessState
                testID="checkout-success"
                title={isPaidOrder ? "Payment Confirmed & Order Placed!" : "Order Reserved — Pay on Delivery"}
                text={
                  isPaidOrder
                    ? `Order #${order.id.slice(0, 8).toUpperCase()} • ${ksh(order.total)}\nPayment verified cleanly. Delivering to ${order.location}, ${order.county}.`
                    : `Order #${order.id.slice(0, 8).toUpperCase()} • ${ksh(order.total)}\nNo M-Pesa STK Push was sent. Pay cash upon delivery to ${order.location}, ${order.county}.`
                }
              >
                <View style={s.receiptCard}>
                  <View style={s.receiptRow}>
                    <Text style={s.receiptLabel}>Order Reference</Text>
                    <Text style={s.receiptVal}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                  </View>
                  <View style={s.receiptRow}>
                    <Text style={s.receiptLabel}>Payment Status</Text>
                    <View style={[s.paidPill, !isPaidOrder && { backgroundColor: "#FEF3C7" }]}>
                      <Lucide
                        name={isPaidOrder ? "shield-check" : "clock"}
                        size={13}
                        color={isPaidOrder ? colors.brandPrimary : "#B45309"}
                      />
                      <Text style={[s.paidPillText, !isPaidOrder && { color: "#B45309" }]}>
                        {isPaidOrder ? "Paid & Verified" : "Unpaid • Pay on Delivery"}
                      </Text>
                    </View>
                  </View>
                  {stkStatus === "paid" && (
                    <View style={s.receiptRow}>
                      <Text style={s.receiptLabel}>Receipt Number</Text>
                      <Text style={[s.receiptVal, { color: colors.brandPrimary }]}>{receiptNumber || "Confirmed"}</Text>
                    </View>
                  )}
                  <View style={s.receiptRow}>
                    <Text style={s.receiptLabel}>SMS Updates</Text>
                    <Text style={s.receiptVal}>{order.phone || checkoutPhone}</Text>
                  </View>
                </View>

                <Btn testID="checkout-view-orders-btn" full variant="green" label="View My Orders" onPress={() => router.replace("/account/orders")} />
                <Btn testID="checkout-continue-btn" full variant="outline" label="Continue Shopping" onPress={() => router.navigate("/(tabs)/shop")} />
              </SuccessState>
            </Animated.View>
          </ScrollView>
        </Page>
      );
    }

    const isFailed = stkStatus === "failed";
    return (
      <Page title={isFailed ? "Payment Incomplete" : "Complete Payment"} testID="checkout-pending-screen">
        <ScrollView contentContainerStyle={[s.pendingWrap, { paddingBottom: insets.bottom + 32 }]}>
          <Animated.View entering={FadeInDown.duration(240)} style={{ alignItems: "center", width: "100%", gap: 14 }}>
            <View style={s.pendingHeroWrap}>
              {!isFailed ? <PulsingPaymentHalo color={colors.orange} /> : null}
              <View style={[s.pendingIconCircle, isFailed && s.failedIconCircle]}>
                <Lucide
                  name={isFailed ? "alert-circle" : isMobileMoneyMethod ? "smartphone" : "credit-card"}
                  size={34}
                  color={isFailed ? colors.error : colors.orange}
                />
              </View>
            </View>

            <View style={{ alignItems: "center", gap: 6 }}>
              <Text style={s.pendingTitle} testID="checkout-payment-title">
                {isFailed ? "Payment Not Completed" : "Complete Payment to Confirm Order"}
              </Text>
              <Text style={s.pendingSub}>
                Order #{order.id.slice(0, 8).toUpperCase()} • {ksh(order.total)}
              </Text>
            </View>

            {/* Live step progress card */}
            <View style={[s.stkBox, isFailed && s.stkBoxFailed]}>
              <View style={s.stkTopRow}>
                <View style={s.stkHeader}>
                  <Lucide
                    name={isFailed ? "x-circle" : "clock"}
                    size={18}
                    color={isFailed ? colors.error : colors.orange}
                  />
                  <Text style={s.stkTitle}>
                    {isFailed
                      ? "Payment Cancelled or Unconfirmed"
                      : isDirectMpesa
                      ? stkStatus === "waiting_pin"
                        ? "Enter M-Pesa PIN on Your Phone"
                        : "Sending M-Pesa STK Push..."
                      : stkStatus === "waiting_pin"
                      ? "Awaiting Paystack Confirmation"
                      : "Connecting to Paystack..."}
                  </Text>
                </View>
                {!isFailed ? (
                  <View style={s.timerPill}>
                    <Text style={s.timerPillText}>{formatTimer(secondsLeft)}</Text>
                  </View>
                ) : null}
              </View>

              {!isFailed ? (
                <View style={{ gap: 10, marginTop: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <ActivityIndicator color={colors.brandPrimary} />
                    <Text style={[s.stkDesc, { flex: 1 }]}>
                      {stkMessage ||
                        (isDirectMpesa
                          ? `Approve the M-Pesa STK Push prompt sent to ${checkoutPhone} to confirm your order.`
                          : `Complete your ${methodLabel} payment on Paystack to confirm your order.`)}
                    </Text>
                  </View>

                  <View style={s.liveSteps}>
                    <View style={s.liveStepRow}>
                      <Lucide name="check-circle-2" size={15} color={colors.brandPrimary} />
                      <Text style={s.liveStepDone}>Order reserved ({ksh(order.total)})</Text>
                    </View>
                    <View style={s.liveStepRow}>
                      <Lucide name={stkStatus === "waiting_pin" ? "loader" : "radio"} size={15} color={colors.orange} />
                      <Text style={s.liveStepActive}>
                        {isDirectMpesa
                          ? `Enter M-Pesa PIN on ${checkoutPhone}`
                          : `Complete ${methodLabel} checkout on Paystack`}
                      </Text>
                    </View>
                    <View style={s.liveStepRow}>
                      <Lucide name="circle" size={15} color={colors.subtle} />
                      <Text style={s.liveStepMuted}>SMS receipt & dispatch confirmation</Text>
                    </View>
                  </View>

                  {isMobileMoneyMethod ? (
                    <View style={s.tipBox}>
                      <Lucide name="info" size={14} color={colors.forest} />
                      <Text style={s.tipText}>
                        {isDirectMpesa
                          ? `Keep your phone unlocked to approve the Safaricom STK Push for ${ksh(order.total)}.`
                          : `Enter your number and approve the ${methodLabel} prompt inside Paystack, then tap Check Status below.`}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <Text style={[s.stkDesc, { color: colors.error, marginTop: 2 }]}>{stkMessage}</Text>
              )}

              {payUrl && isPaystackMethod && !isFailed ? (
                <Btn small variant="green" label="Open Paystack Payment Page" onPress={() => openPaystackUrl(payUrl)} style={{ marginTop: 6 }} />
              ) : null}
            </View>

            <PaystackWebModal
              visible={payModalOpen}
              url={payUrl}
              methodLabel={methodLabel}
              onClose={() => setPayModalOpen(false)}
              onCompleteReference={async (cbRef) => {
                setPayModalOpen(false);
                const refToVerify = cbRef || payReference;
                if (refToVerify) {
                  await api.verifyPaystack(refToVerify).catch(() => null);
                }
                const st = await api.getPaymentStatus(order.id).catch(() => null);
                if (st) applyPaymentStatus(st);
              }}
            />

            <View style={{ width: "100%", gap: 10 }}>
              {isFailed ? (
                <>
                  <Btn
                    testID="checkout-retry-pay-btn"
                    full
                    variant="green"
                    icon="refresh-cw"
                    label={isPaystackMethod ? `Retry ${methodLabel} Payment` : "Retry M-Pesa STK Push"}
                    onPress={handleRetryPayment}
                  />
                  {paymentMethod === "mpesa" && !orderCancelled ? (
                    <Btn
                      full
                      variant="outline"
                      icon="credit-card"
                      label="Pay via Paystack M-Pesa Page Instead"
                      onPress={() => triggerPaystackCheckout(order, "mpesa")}
                    />
                  ) : null}
                  <Btn
                    full
                    variant="yellow"
                    icon="arrow-left-right"
                    label="Switch Payment Method"
                    onPress={switchPaymentMethod}
                  />
                </>
              ) : (
                <>
                  <Btn
                    full
                    variant="green"
                    icon="refresh-cw"
                    label="I've Completed Payment — Check Status"
                    loading={checkingNow}
                    onPress={handleCheckNow}
                  />
                  {isDirectMpesa ? (
                    <Btn
                      full
                      variant="outline"
                      icon="credit-card"
                      label="No STK Prompt? Pay via Paystack Page"
                      onPress={() => triggerPaystackCheckout(order, "mpesa")}
                    />
                  ) : null}
                </>
              )}

              <Btn testID="checkout-back-cart-btn" full variant="outline" label="Return to Cart" onPress={() => { stopPolling(); router.replace("/cart"); }} />
              <Btn testID="checkout-view-orders-btn" full variant="outline" label="View Order History" onPress={() => { stopPolling(); router.replace("/account/orders"); }} />
            </View>
          </Animated.View>
        </ScrollView>
      </Page>
    );
  }

  const ctaLabel = !cart.length
    ? "Cart is empty — Browse AgroShop"
    : !user
    ? "Sign In to Place Order"
    : paymentMethod === "manual"
    ? `Reserve Cash-on-Delivery (${ksh(grandTotal)})`
    : paymentMethod === "mpesa"
    ? `Pay ${ksh(grandTotal)} via M-Pesa STK Push`
    : `Pay ${ksh(grandTotal)} via ${methodLabel}`;

  return (
    <Page title="Checkout" testID="checkout-screen">
      {/* 3-Step Visual Checkout Progress Header */}
      <View style={s.stepperBar}>
        <View style={s.stepItem}>
          <View style={[s.stepDot, deliveryReady ? s.stepDotDone : s.stepDotActive]}>
            <Lucide name={deliveryReady ? "check" : "map-pin"} size={12} color="#FFFFFF" />
          </View>
          <Text style={[s.stepLabel, deliveryReady ? s.stepLabelDone : s.stepLabelActive]}>Delivery</Text>
        </View>
        <View style={[s.stepLine, deliveryReady && s.stepLineActive]} />
        <View style={s.stepItem}>
          <View style={[s.stepDot, deliveryReady ? s.stepDotActive : s.stepDotIdle]}>
            <Lucide name="wallet" size={12} color={deliveryReady ? "#FFFFFF" : colors.muted} />
          </View>
          <Text style={[s.stepLabel, deliveryReady && s.stepLabelActive]}>Payment</Text>
        </View>
        <View style={s.stepLine} />
        <View style={s.stepItem}>
          <View style={[s.stepDot, s.stepDotIdle]}>
            <Lucide name="shield-check" size={12} color={colors.muted} />
          </View>
          <Text style={s.stepLabel}>Confirm</Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={36}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: insets.bottom + 128 }}
      >
        {!user ? (
          <View style={s.notice} testID="checkout-signin-notice">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Lucide name="lock" size={16} color={colors.onBrandTertiary} />
              <Text style={[s.noticeText, { flex: 1 }]}>Sign in with your Mqulima account to track orders and pay securely.</Text>
            </View>
            <Btn testID="checkout-signin-btn" small variant="green" label="Sign In / Join Us" onPress={() => router.push("/auth/sign-in")} />
          </View>
        ) : null}

        {/* Free Delivery Progress Pill */}
        {cart.length > 0 && (
          <View style={[s.deliveryBanner, delivery === 0 && s.deliveryBannerUnlocked]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Lucide
                name={delivery === 0 ? "truck" : "sparkles"}
                size={16}
                color={delivery === 0 ? colors.brandPrimary : colors.forest}
              />
              <Text style={s.deliveryBannerText}>
                {delivery === 0
                  ? "Free delivery unlocked! You saved KSh 300."
                  : `Add ${ksh(amountToFree)} more for FREE delivery across Kenya`}
              </Text>
            </View>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${Math.round(freeProgress * 100)}%` }]} />
            </View>
          </View>
        )}

        {/* Collapsible Visual Order Summary Card */}
        <View style={s.sectionCard} testID="checkout-summary">
          <Pressable
            onPress={() => setSummaryOpen((prev) => !prev)}
            style={s.cardHeaderRow}
          >
            <View style={s.cardTitleLeft}>
              <View style={[s.sectionIconCircle, { backgroundColor: "#DCFCE7" }]}>
                <Lucide name="shopping-bag" size={16} color={colors.brandPrimary} />
              </View>
              <View>
                <Text style={s.cardHeading}>Order Summary</Text>
                <Text style={s.cardSubHeading}>
                  {itemCount} {itemCount === 1 ? "item" : "items"} • {delivery ? `${ksh(delivery)} delivery` : "Free delivery"}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={s.total} testID="checkout-total">{ksh(grandTotal)}</Text>
              <Lucide name={summaryOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} />
            </View>
          </Pressable>

          {summaryOpen && (
            <View style={s.summaryBody}>
              {cart.map((c) => (
                <View key={c.key} style={s.summaryItemRow}>
                  <Image source={{ uri: c.image }} style={s.itemThumb} contentFit="contain" />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.lineName} numberOfLines={2}>{c.name}</Text>
                    <Text style={s.itemMeta}>
                      Qty {c.qty}{c.variant ? ` • ${c.variant}` : ""}
                    </Text>
                  </View>
                  <Text style={s.lineVal}>{ksh(c.price * c.qty)}</Text>
                </View>
              ))}
              <View style={s.divider} />
              <View style={s.line}>
                <Text style={s.lineName}>Subtotal</Text>
                <Text style={s.lineVal}>{ksh(total)}</Text>
              </View>
              <View style={s.line}>
                <Text style={s.lineName}>Delivery Fee</Text>
                <Text style={[s.lineVal, delivery === 0 && { color: colors.brandPrimary }]}>
                  {delivery ? ksh(delivery) : "FREE"}
                </Text>
              </View>
              <View style={[s.line, s.totalLine]}>
                <Text style={s.h3}>Total Payable</Text>
                <Text style={s.total}>{ksh(grandTotal)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Section 1: Delivery Details Card */}
        <View style={s.sectionCard}>
          <View style={s.cardTitleLeft}>
            <View style={[s.sectionIconCircle, { backgroundColor: "#DBEAFE" }]}>
              <Lucide name="map-pin" size={16} color="#2563EB" />
            </View>
            <View>
              <Text style={s.cardHeading}>Delivery Details</Text>
              <Text style={s.cardSubHeading}>Where should we dispatch your order?</Text>
            </View>
          </View>

          <View style={{ gap: 12, marginTop: 4 }}>
            <Field
              testID="checkout-name-input"
              label="Full Names"
              value={f.name}
              onChangeText={set("name")}
              placeholder="e.g. Kiprono Rotich"
              error={errors.name}
              autoCapitalize="words"
            />
            <Field
              testID="checkout-phone-input"
              label="Phone Number (M-Pesa & SMS)"
              value={f.phone}
              onChangeText={set("phone")}
              placeholder="0712 345 678"
              keyboardType="phone-pad"
              error={errors.phone}
            />
            <SelectField
              testID="checkout-county-select"
              label="County"
              value={f.county}
              options={counties}
              onChange={set("county")}
              error={errors.county}
              placeholder="Select county"
            />
            <Field
              testID="checkout-subcounty-input"
              label="Subcounty / Nearest Town"
              value={f.subcounty}
              onChangeText={set("subcounty")}
              placeholder="e.g. Kapseret / Eldoret Town"
              error={errors.subcounty}
            />
            <Field
              testID="checkout-location-input"
              label="Delivery Landmark / Village"
              value={f.location}
              onChangeText={set("location")}
              placeholder="e.g. Near Sirikwa Junction, Plot 4"
              error={errors.location}
            />
          </View>
        </View>

        {/* Section 2: Payment Method Selector matching Website Vector Brand Logos */}
        <PaymentMethodSelector
          value={paymentMethod}
          onChange={setPaymentMethod}
          phonePreview={f.phone}
        />
      </KeyboardAwareScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={[s.stickyBar, { paddingBottom: Math.max(12, insets.bottom + 8) }]}>
        <View style={s.stickyTopRow}>
          <View>
            <Text style={s.stickyTotalLabel}>Total ({itemCount} {itemCount === 1 ? "item" : "items"})</Text>
            <Text style={s.stickyTotalVal}>{ksh(grandTotal)}</Text>
          </View>
          <View style={s.trustPill}>
            <Lucide name="shield-check" size={13} color={colors.brandPrimary} />
            <Text style={s.trustText}>Only charged on confirmation</Text>
          </View>
        </View>
        <Btn
          testID="checkout-place-order-btn"
          full
          variant="green"
          icon={isMobileMoneyMethod ? "smartphone" : isPaystackMethod ? "credit-card" : "check"}
          label={ctaLabel}
          loading={loading}
          onPress={cart.length ? submit : () => router.navigate("/(tabs)/shop")}
        />
      </View>
    </Page>
  );
}

const useStyles = makeStyles((c) => ({
  stepperBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.white,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  stepItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepDot: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  stepDotActive: { backgroundColor: c.forest },
  stepDotDone: { backgroundColor: c.brandPrimary },
  stepDotIdle: { backgroundColor: c.surfaceTertiary },
  stepLabel: { fontFamily: fonts.b600, fontSize: 12, color: c.muted },
  stepLabelActive: { fontFamily: fonts.b700, color: c.onSurface },
  stepLabelDone: { fontFamily: fonts.b700, color: c.brandPrimary },
  stepLine: { flex: 1, height: 2, backgroundColor: c.border, marginHorizontal: 8, borderRadius: 1 },
  stepLineActive: { backgroundColor: c.brandPrimary },

  notice: { backgroundColor: c.brandTertiary, borderRadius: 16, padding: 14, gap: 10 },
  noticeText: { fontFamily: fonts.b600, fontSize: 13, color: c.onBrandTertiary },

  deliveryBanner: {
    backgroundColor: c.white,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  deliveryBannerUnlocked: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  deliveryBannerText: { fontFamily: fonts.b700, fontSize: 12.5, color: c.onSurface, flexShrink: 1 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: c.surfaceTertiary, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: c.brandPrimary },

  sectionCard: {
    backgroundColor: c.white,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  cardTitleLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  sectionIconCircle: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  cardHeading: { fontFamily: fonts.h800, fontSize: 16, color: c.onSurface },
  cardSubHeading: { fontFamily: fonts.b500, fontSize: 12, color: c.muted },

  summaryBody: { gap: 10, paddingTop: 4 },
  summaryItemRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  itemThumb: { width: 42, height: 42, borderRadius: 8, backgroundColor: c.surfaceTertiary, borderWidth: 1, borderColor: c.border },
  itemMeta: { fontFamily: fonts.b500, fontSize: 11.5, color: c.muted },
  divider: { height: 1, backgroundColor: c.border, marginVertical: 2 },
  h3: { fontFamily: fonts.h800, fontSize: 15, color: c.onSurface },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  totalLine: { borderTopWidth: 1, borderTopColor: c.border, paddingTop: 10 },
  lineName: { fontFamily: fonts.b600, fontSize: 13, color: c.onSurfaceSecondary, flexShrink: 1 },
  lineVal: { fontFamily: fonts.b700, fontSize: 13, color: c.onSurface },
  total: { fontFamily: fonts.h900, fontSize: 17, color: c.brand },

  stickyBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: c.white,
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
    shadowColor: "#0F291E",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  stickyTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  stickyTotalLabel: { fontFamily: fonts.b600, fontSize: 11, color: c.muted },
  stickyTotalVal: { fontFamily: fonts.h900, fontSize: 18, color: c.onSurface },
  trustPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#F0FDF4", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  trustText: { fontFamily: fonts.b700, fontSize: 11, color: c.brandPrimary },

  stkBox: { padding: 16, borderRadius: 18, backgroundColor: c.white, borderWidth: 1, borderColor: c.border, width: "100%", gap: 8 },
  stkBoxFailed: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  stkTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  stkHeader: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  stkTitle: { fontFamily: fonts.h700, fontSize: 14, color: c.onSurface },
  stkDesc: { fontFamily: fonts.b500, fontSize: 12.5, color: c.onSurfaceSecondary, lineHeight: 18 },
  timerPill: { backgroundColor: "#FEF3C7", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  timerPillText: { fontFamily: fonts.b800, fontSize: 12, color: "#B45309" },
  liveSteps: { gap: 8, paddingTop: 4, borderTopWidth: 1, borderTopColor: c.border },
  liveStepRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveStepDone: { fontFamily: fonts.b600, fontSize: 12.5, color: c.brandPrimary },
  liveStepActive: { fontFamily: fonts.b700, fontSize: 12.5, color: c.onSurface },
  liveStepMuted: { fontFamily: fonts.b500, fontSize: 12.5, color: c.muted },
  tipBox: { flexDirection: "row", alignItems: "flex-start", gap: 7, backgroundColor: c.heroBg, borderRadius: 12, padding: 10, marginTop: 2 },
  tipText: { fontFamily: fonts.b500, fontSize: 11.5, color: c.forest, flex: 1, lineHeight: 16 },

  pendingWrap: { padding: 20, alignItems: "center", gap: 14 },
  pendingHeroWrap: { width: 88, height: 88, alignItems: "center", justifyContent: "center", marginTop: 8 },
  pulseRing: { position: "absolute", width: 76, height: 76, borderRadius: 38 },
  pendingIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#FEF3C7", alignItems: "center", justifyContent: "center" },
  failedIconCircle: { backgroundColor: "#FEE2E2" },
  pendingTitle: { fontFamily: fonts.h900, fontSize: 21, color: c.onSurface, textAlign: "center" },
  pendingSub: { fontFamily: fonts.b600, fontSize: 14, color: c.onSurfaceTertiary, textAlign: "center" },

  receiptCard: { backgroundColor: c.white, borderWidth: 1, borderColor: c.border, borderRadius: 18, padding: 14, gap: 10, marginBottom: 4 },
  receiptRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  receiptLabel: { fontFamily: fonts.b500, fontSize: 12.5, color: c.muted },
  receiptVal: { fontFamily: fonts.b700, fontSize: 13, color: c.onSurface },
  paidPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#DCFCE7", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  paidPillText: { fontFamily: fonts.b700, fontSize: 11.5, color: c.brandPrimary },
}));
