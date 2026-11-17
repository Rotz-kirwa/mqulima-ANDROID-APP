import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const FRONTEND_DIR = path.resolve(import.meta.dirname, "..");

function readRel(relPath) {
  return fs.readFileSync(path.join(FRONTEND_DIR, relPath), "utf8");
}

test("app.json targets Expo SDK defaults without Android SDK 35 pins and declares least-privilege permissions", () => {
  const appConfig = JSON.parse(readRel("app.json"));
  const android = appConfig.expo.android;
  assert.equal(appConfig.expo.name, "Mqulima");
  assert.equal(android.package, "com.mqulima.app");
  assert.deepEqual(android.blockedPermissions, [
    "android.permission.RECORD_AUDIO",
    "android.permission.READ_MEDIA_VIDEO",
  ]);

  const buildPropsPlugin = appConfig.expo.plugins.find(
    (entry) => Array.isArray(entry) && entry[0] === "expo-build-properties"
  );
  assert.ok(buildPropsPlugin, "expo-build-properties plugin must be configured");
  assert.equal(buildPropsPlugin[1]?.android?.compileSdkVersion, undefined);
  assert.equal(buildPropsPlugin[1]?.android?.targetSdkVersion, undefined);
  assert.equal(buildPropsPlugin[1]?.android?.enableProguardInReleaseBuilds, true);
  assert.equal(buildPropsPlugin[1]?.android?.enableShrinkResourcesInReleaseBuilds, true);
});

test("eas.json points production and preview profiles to https://www.mqulima.com without sandbox M-Pesa shortcode", () => {
  const eas = JSON.parse(readRel("eas.json"));
  assert.equal(eas.build.preview.android.buildType, "apk");
  assert.equal(eas.build.preview.env.EXPO_PUBLIC_BACKEND_URL, "https://www.mqulima.com");
  assert.equal(eas.build.production.android.buildType, "app-bundle");
  assert.equal(eas.build.production.env.EXPO_PUBLIC_BACKEND_URL, "https://www.mqulima.com");
  assert.equal(eas.build.production.env.EXPO_PUBLIC_MPESA_SHORTCODE, undefined);
});

test("mobile api.ts implements real account deletion, password recovery, and removes plaintext password storage", () => {
  const apiSrc = readRel("src/services/api.ts");
  assert.match(apiSrc, /deleteAccount:\s*async\s*\(\)\s*=>/);
  assert.match(apiSrc, /request<[^>]+>\("\/account",\s*\{\s*method:\s*"DELETE"/);
  assert.match(apiSrc, /request<[^>]+>\("\/auth\/forgot-password"/);
  assert.match(apiSrc, /request<[^>]+>\("\/auth\/reset-password"/);
  assert.doesNotMatch(apiSrc, /setItem\(["']mqulima_registered_users["']/);
});

test("mobile screens connect forgot-password OTP flow, cached-order warning, and official mqulima.com/privacy link", () => {
  const forgotSrc = readRel("app/auth/forgot.tsx");
  const legalSrc = readRel("app/legal.tsx");
  const ordersSrc = readRel("app/account/orders.tsx");
  const checkoutSrc = readRel("app/checkout.tsx");

  assert.match(forgotSrc, /api\.forgotPassword\(/);
  assert.match(forgotSrc, /api\.resetPassword\(/);
  assert.match(legalSrc, /https:\/\/www\.mqulima\.com\/privacy/);
  assert.match(ordersSrc, /cached order snapshot/i);
  assert.match(checkoutSrc, /api\.initiatePaystackMobileMoney\(/);
  assert.match(checkoutSrc, /api\.initiatePaystack\(/);
  assert.match(checkoutSrc, /Order Reserved — Pay on Delivery/);
});
