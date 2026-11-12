import React from "react";
import { useRouter } from "expo-router";
import { OnboardingFlow } from "@/src/components/OnboardingFlow";
import { useApp } from "@/src/store/AppStore";

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useApp();

  const handleFinish = async () => {
    await completeOnboarding();
    router.replace("/(tabs)");
  };

  return <OnboardingFlow onFinish={handleFinish} />;
}

