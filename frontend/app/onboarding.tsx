import React from "react";
import { useRouter } from "expo-router";
import { OnboardingFlow } from "@/src/components/OnboardingFlow";
import { useAuth } from "@/src/store/AppStore";

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();

  const handleFinish = async () => {
    await completeOnboarding();
    router.replace("/(tabs)");
  };

  return <OnboardingFlow onFinish={handleFinish} />;
}

