# Mqulima — Google Play Store Production Readiness & Implementation Report

**Updated:** 2026-11-13  
**Mobile Workspace:** `mqulima-ANDROID-APP` (`feature/mqulima-p0-production-readiness`)  
**Canonical Production Backend Workspace:** `mkulima-hub-c7714688` (`feature/mqulima-p0-production-readiness` — `https://www.mqulima.com`)  
**Target Package ID:** `com.mqulima.app`  
**Target Android API Compliance:** Expo SDK 57 defaults (Android API 36 target, mandatory August 31, 2026)

---

## Executive Implementation Verdict

> **Status:** **Backend API v1 + Privacy + Mobile Client Hardened — Blocked on Deployment, EAS Account Auth (`eas login`), Store Assets & Credential Audit**
>
> All code-level security blockers in both `mkulima-hub-c7714688` and `mqulima-ANDROID-APP/frontend` have been implemented and verified with unit/integration/static test suites. Production Play Store submission and `.aab` generation remain paused pending your approval and resolution of deployment, Expo EAS authentication, and store asset blockers.

---

## 1. Files Changed Across Repositories

### Canonical Production Backend (`mkulima-hub-c7714688`)
- [src/lib/api-v1/cors.ts](file:///home/user/NYOTA-Clients/mkulima-hub-c7714688/src/lib/api-v1/cors.ts) *(new)*: Explicit origin allowlist helper replacing wildcard `*` CORS across `/api/v1/*`.
- [src/lib/api-v1/router.ts](file:///home/user/NYOTA-Clients/mkulima-hub-c7714688/src/lib/api-v1/router.ts): Wired `corsOptionsResponse`, `applyCorsHeaders`, `DELETE /api/v1/account`, `DELETE /api/v1/auth/me`, `POST /api/v1/auth/forgot-password`, and `POST /api/v1/auth/reset-password`.
- [src/lib/api-v1/auth.ts](file:///home/user/NYOTA-Clients/mkulima-hub-c7714688/src/lib/api-v1/auth.ts): Implemented `handleDeleteAccount`, `handleForgotPassword`, and `handleResetPassword`; removed wildcard `CORS_HEADERS`.
- [src/lib/auth-recovery-ops.server.ts](file:///home/user/NYOTA-Clients/mkulima-hub-c7714688/src/lib/auth-recovery-ops.server.ts) *(new)* & [src/lib/auth-recovery.server.ts](file:///home/user/NYOTA-Clients/mkulima-hub-c7714688/src/lib/auth-recovery.server.ts): Extracted server-only `executePasswordRecoveryRequest` and `executePasswordResetWithCode` (rate limiting, anti-enumeration timing jitter, single-use SHA-256 hashed 6-digit OTP + 32-byte tokens, 10-min expiry, bcrypt password updates).
- [src/lib/api/markets-ops.server.ts](file:///home/user/NYOTA-Clients/mkulima-hub-c7714688/src/lib/api/markets-ops.server.ts) *(new)*, [src/lib/api/markets.server.ts](file:///home/user/NYOTA-Clients/mkulima-hub-c7714688/src/lib/api/markets.server.ts), [src/lib/api/market-sync.server.ts](file:///home/user/NYOTA-Clients/mkulima-hub-c7714688/src/lib/api/market-sync.server.ts), & [src/lib/api-v1/tools.ts](file:///home/user/NYOTA-Clients/mkulima-hub-c7714688/src/lib/api-v1/tools.ts): Isolated `postgres` / `db.server.ts` database queries out of client-referenced `createServerFn` facade into `markets-ops.server.ts`, fixing Vite/Rollup client bundling while preserving all PostgreSQL KAMIS queries.
- [src/lib/api-v1/auth-helper.ts](file:///home/user/NYOTA-Clients/mkulima-hub-c7714688/src/lib/api-v1/auth-helper.ts) & [src/lib/auth-server.ts](file:///home/user/NYOTA-Clients/mkulima-hub-c7714688/src/lib/auth-server.ts): Enforced `deleted_at IS NULL` and `COALESCE(status, 'active') <> 'deleted'` on JWT and cookie session resolution.
- [src/lib/api-v1/payments.ts](file:///home/user/NYOTA-Clients/mkulima-hub-c7714688/src/lib/api-v1/payments.ts): Enforced `authenticateRequest` (`401`) and order ownership (`403`) on `handlePaymentStatus` and `handlePaystackVerify`.
- [src/lib/mpesa-helpers.server.ts](file:///home/user/NYOTA-Clients/mkulima-hub-c7714688/src/lib/mpesa-helpers.server.ts) & [src/routes/api/mpesa/callback.ts](file:///home/user/NYOTA-Clients/mkulima-hub-c7714688/src/routes/api/mpesa/callback.ts): Upgraded webhook token check to `crypto.timingSafeEqual` and returned HTTP `401` on missing/invalid callback token.
- [src/routes/privacy.tsx](file:///home/user/NYOTA-Clients/mkulima-hub-c7714688/src/routes/privacy.tsx) *(new)*, [src/components/mqulima/Footer.tsx](file:///home/user/NYOTA-Clients/mkulima-hub-c7714688/src/components/mqulima/Footer.tsx), [src/lib/sitemap.server.ts](file:///home/user/NYOTA-Clients/mkulima-hub-c7714688/src/lib/sitemap.server.ts), [src/routeTree.gen.ts](file:///home/user/NYOTA-Clients/mkulima-hub-c7714688/src/routeTree.gen.ts): Published `/privacy` (`https://www.mqulima.com/privacy`), updated footer & sitemap links.
- [tests/api-v1-auth.test.ts](file:///home/user/NYOTA-Clients/mkulima-hub-c7714688/tests/api-v1-auth.test.ts) & [tests/api-v1-security-hardening.test.ts](file:///home/user/NYOTA-Clients/mkulima-hub-c7714688/tests/api-v1-security-hardening.test.ts) *(new)*: Regression suites for explicit CORS, account deletion + token revocation + ledger retention, password recovery anti-enumeration/OTP reset, payment auth/ownership, and M-Pesa/Paystack webhooks.

### Mobile Application (`mqulima-ANDROID-APP`)
- [frontend/app.json](file:///home/user/NYOTA-Clients/mqulima-ANDROID-APP/frontend/app.json): Removed manual Android SDK 35 pins (restoring Expo SDK 57 API 36 defaults), configured least-privilege permissions and blocked `RECORD_AUDIO` / `READ_MEDIA_VIDEO`.
- [frontend/eas.json](file:///home/user/NYOTA-Clients/mqulima-ANDROID-APP/frontend/eas.json): Removed sandbox M-Pesa shortcode `174379` from `production.env`; confirmed HTTPS production URLs (`https://www.mqulima.com`).
- [frontend/src/services/api.ts](file:///home/user/NYOTA-Clients/mqulima-ANDROID-APP/frontend/src/services/api.ts) & [frontend/src/store/AppStore.tsx](file:///home/user/NYOTA-Clients/mqulima-ANDROID-APP/frontend/src/store/AppStore.tsx): Removed plaintext `mqulima_registered_users` password storage and added startup/logout purge; stopped error masking on `deleteAccount`; stopped falling back to unverified cached orders; added `resetPassword` client method.
- [frontend/app/auth/forgot.tsx](file:///home/user/NYOTA-Clients/mqulima-ANDROID-APP/frontend/app/auth/forgot.tsx): Connected 2-step OTP request + reset flow (`POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password`) with web fallback if offline/404.
- [frontend/app/account/index.tsx](file:///home/user/NYOTA-Clients/mqulima-ANDROID-APP/frontend/app/account/index.tsx) & [frontend/app/account/orders.tsx](file:///home/user/NYOTA-Clients/mqulima-ANDROID-APP/frontend/app/account/orders.tsx): Surfaced real account deletion failures; added offline cached-snapshot warning banner and `(Cached)` status tag.
- [frontend/app/legal.tsx](file:///home/user/NYOTA-Clients/mqulima-ANDROID-APP/frontend/app/legal.tsx) & [frontend/src/data/pages.ts](file:///home/user/NYOTA-Clients/mqulima-ANDROID-APP/frontend/src/data/pages.ts): Linked `https://www.mqulima.com/privacy` and `/terms`; aligned in-app privacy disclosures with actual camera/location/payment behavior.
- [frontend/scripts/verify-release-readiness.mjs](file:///home/user/NYOTA-Clients/mqulima-ANDROID-APP/frontend/scripts/verify-release-readiness.mjs) *(new)*: Node test suite asserting Android release config, API deletion/recovery wiring, no plaintext password caching, and privacy link.

---

## 2. API Endpoints & Security Controls Added

| Surface | Endpoint / Control | Security Behaviour |
|---|---|---|
| Account Deletion | `DELETE /api/v1/account` & `DELETE /api/v1/auth/me` | Requires `authenticateRequest` (`401`), blocks `admin`/`super_admin` (`403`), atomically soft-deletes & anonymizes PII in `profiles` & `users`, clears `mq_session` cookie (`Max-Age=0`), revokes tokens via `deleted_at IS NULL` check, deletes `recovery_tokens` & `email_verifications`, **retains `orders` and `payments` transaction rows**. |
| Password Recovery | `POST /api/v1/auth/forgot-password` & `POST /api/v1/auth/reset-password` | IP + identifier rate limits (`429`), timing jitter + uniform `200` anti-enumeration message, single-use SHA-256 hashed 6-digit OTP & 32-byte token (10-min TTL, attempt lock at 5 failures), `bcrypt` hash update across `profiles`/`users`. |
| Payment Polling | `GET /api/v1/payments/status/:orderId` & `POST /api/v1/payments/paystack/verify` | Enforces `authenticateRequest` (`401`) and order ownership (`order.user_id === user.id` or admin, `403` otherwise, `404` if missing). |
| Webhook Auth | `POST /api/mpesa/callback` & `POST /api/payments/paystack/webhook` | M-Pesa verifies callback token via `crypto.timingSafeEqual` (HTTP `401` on mismatch); Paystack validates `x-paystack-signature` HMAC-SHA512 before processing. |
| CORS Policy | All `/api/v1/*` routes | Replaced wildcard `*` with explicit allowlist (`mqulima.com`, `www.mqulima.com`, `admin.mqulima.com`, `mqulima.onrender.com`, `ALLOWED_ORIGINS`/`APP_URL`, localhost in non-production only); untrusted preflight returns `403`. |
| Privacy Policy | `GET /privacy` (`https://www.mqulima.com/privacy`) | Public web policy aligned with Kenya DPA 2019, `CAMERA`/`LOCATION` permissions, 7-year financial retention, and self-service deletion. |

---

## 3. Dual-Backend Ownership Matrix (No Migration / No Deletion Performed)

Both backends remain intact. Neither MongoDB (`mqulima-ANDROID-APP/backend`) nor PostgreSQL (`mkulima-hub-c7714688`) was deleted, migrated, or rewritten.

| Business Entity | Canonical Production Owner | Role of Secondary Backend (`backend/` FastAPI + MongoDB) |
|---|---|---|
| **Users & Auth** | `mkulima-hub` PostgreSQL (`profiles`, `users`, `recovery_tokens`) | Legacy/dev FastAPI (`pyjwt` + `argon2`, separate DB, **not** synced with web). |
| **Products & Inventory** | `mkulima-hub` PostgreSQL (`products`, stock mutations) | Legacy/dev seed & test catalog only; unused in production APK/AAB builds. |
| **Orders & Fulfilment** | `mkulima-hub` PostgreSQL (`orders`, `order_items`) | Legacy/dev FastAPI order collection; not connected to production web/admin fulfilment. |
| **Payments** | `mkulima-hub` (Daraja M-Pesa STK/callback + Paystack) | **None** — FastAPI backend lacks M-Pesa/Paystack gateway integration. |
| **Agricultural Services & Advice** | `mkulima-hub` (Services, Open-Meteo, KAMIS market data, Gemini Crop Doctor, SMS) | Local agronomic fallback & Gemini Crop Doctor endpoints (available for dev testing only). |

---

## 4. Verification Results (Latest Runs)

| Repository | Command / Check | Scope | Result |
|---|---|---|---|
| `mkulima-hub-c7714688` | `npx tsc --noEmit` | Full TypeScript compilation (with updated `routeTree.gen.ts`) | **PASS** (0 errors) |
| `mkulima-hub-c7714688` | `npm run lint` | ESLint check across codebase | **PASS** (0 errors, 27 pre-existing warnings) |
| `mkulima-hub-c7714688` | `npx vitest run` | All 22 Vitest suites (incl. `api-v1-security-hardening.test.ts` & `api-v1-auth.test.ts`) | **PASS** (**22/22 files, 228/228 tests**) *(SMS DB log queries warn `ECONNREFUSED 127.0.0.1:5432` in offline sandbox; controller/webhook/SQL flows verified via harness)* |
| `mkulima-hub-c7714688` | `npm run build` | Production Vite + SSR + Nitro (Vercel) build | **PASS** (Client `12.94s`, SSR `6.53s`, Nitro `25.91s`; zero `postgres` browser leak) |
| `mqulima-ANDROID-APP/frontend` | `node --test ./scripts/verify-release-readiness.mjs` | Release config, endpoints, storage hygiene & privacy links | **PASS** (4/4 tests passed) |
| `mqulima-ANDROID-APP/frontend` | `npx tsc --noEmit` | Expo / React Native TypeScript strict check | **PASS** (0 errors) |
| `mqulima-ANDROID-APP/frontend` | `npx expo lint` | ESLint / Expo rules | **PASS** (0 errors) |
| `mqulima-ANDROID-APP/frontend` | `npx expo-doctor` | Expo SDK 57 compatibility & project config checks | **PASS** (**20/20 checks**) |
| `mqulima-ANDROID-APP/backend` | `.venv/bin/pytest tests/test_production_hardening.py -v` | FastAPI hardening unit tests | **PASS** (7/7 passed) |
| `mqulima-ANDROID-APP/backend` | `.venv/bin/pytest tests/ -v` | Legacy integration tests (`test_mqulima_backend.py`, etc.) | **FAIL / ERROR** (7 passed, 18 failed, 30 errors — requires a live running FastAPI server) |

---

## 5. Remaining Blockers Before Production `.aab` & Play Store Submission

1. **EAS Authentication (`Not logged in`)**: Verified via `npx --yes eas-cli@latest whoami` (`Not logged in`; no `EXPO_TOKEN` in environment). Because no Expo session or `extra.eas.projectId` exists locally, EAS project linking and cloud preview APK build could not run here without risking unauthorized or duplicate project creation.
2. **`mkulima-hub` Staging & Production Deployment**: Changes on branch `feature/mqulima-p0-production-readiness` in `mkulima-hub-c7714688` now pass `npm run build`, `npx tsc --noEmit`, `npm run lint`, and `npx vitest run` cleanly, and are ready for Vercel staging preview -> production deployment (`https://www.mqulima.com/privacy` currently still serves `404` from the prior live build). See [STAGING_AND_PRODUCTION_DEPLOYMENT_PLAN.md](file:///home/user/NYOTA-Clients/mqulima-ANDROID-APP/docs/release/STAGING_AND_PRODUCTION_DEPLOYMENT_PLAN.md).
3. **Production Payment Key Hygiene**: Audit Render env (`PAYSTACK_SECRET_KEY`, Safaricom Daraja credentials) and verify removing fallback Paystack code paths before launch (left untouched per release instructions).
4. **Google Play Listing & Signing Assets**:
   - Export `1024x1024` `icon.png` and `adaptive-icon.png` (currently `512x512`).
   - Create `1024x500` Feature Graphic and `>= 2` real Android device screenshots.
   - Add Google Play App Signing SHA-256 fingerprint to `https://www.mqulima.com/.well-known/assetlinks.json`.

---

## 6. Preview APK Build & Physical-Device Testing Instructions

### Step A — Safely Link EAS (Without Duplicating Existing Projects) & Build Preview APK
Run from a terminal signed into your Mqulima Expo organization/account:
```bash
cd /home/user/NYOTA-Clients/mqulima-ANDROID-APP/frontend

# 1. Authenticate and inspect existing projects first so you do NOT create a duplicate
npx eas-cli login
npx eas-cli project:list

# 2. If @your-org/mqulima already exists on Expo, put its UUID in app.json ("extra": { "eas": { "projectId": "..." } })
#    Otherwise link once cleanly:
npx eas-cli init

# 3. Build the installable preview APK (targets https://www.mqulima.com)
npx eas-cli build --platform android --profile preview
```

### Step B — Install & Test Preview APK on a Physical Android Device
1. Download the `.apk` from the EAS build link or install directly via USB debugging (`adb install -r mqulima-preview.apk`).
2. Verify end-to-end flows on device against deployed `https://www.mqulima.com`:
   - **Onboarding & Navigation**: Confirm Mqulima branding (`#245B35`, `#F8F6EF`, `#C49A45`), tab persistence, and layout edge-to-edge behavior.
   - **Auth & Forgot Password**: Register, Sign In, Sign Out, then trigger **Forgot Password** -> enter 6-digit OTP -> reset password -> sign in with new password.
   - **Privacy Policy**: Open **Legal / Terms & Privacy** (`legal.tsx`) -> tap **View Full Privacy Policy (`mqulima.com/privacy`)** -> verify page loads.
   - **Marketplace & Payments**: Add item to cart, run M-Pesa STK Push and Paystack verification, confirm order appears in Order History, then toggle Airplane Mode and confirm cached-snapshot warning banner + `(Cached)` label appear cleanly.
   - **Permissions & Crop Doctor**: Test camera/photo upload and county location detection; confirm runtime permission prompts match declarations.
   - **Account Deletion**: Go to **Account -> Delete Account** -> confirm deletion succeeds, session is revoked, and re-login fails.

---

## Production AAB Readiness Status

**Wait for your explicit approval + EAS login + `mkulima-hub` deployment** before generating the signed production Android App Bundle (`eas build --platform android --profile production`).
