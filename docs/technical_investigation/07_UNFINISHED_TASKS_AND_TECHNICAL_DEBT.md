# 07 — UNFINISHED TASKS, BUGS & TECHNICAL DEBT LEDGER
## Comprehensive Engineering Quality Audit & Risk Register

---

### 1. High-Priority Bugs & Compiler Failures

#### 1. TypeScript Compiler Errors in Backend Gateway (`mkulima-hub-c7714688`)
Running `npx tsc --noEmit` in `mkulima-hub-c7714688` reveals **13 active compiler errors across 10 files**. These must be resolved before production deployment:

1. **`src/lib/api-v1/orders.ts:156`**:
   - *Error*: `error TS2353: Object literal may only specify known properties, and 'orderTotal' does not exist in type 'SendOrderConfirmedSmsParams'.`
   - *Cause*: `sendOrderConfirmedSms` expects `total` (or `amount`), but `orders.ts` passes `orderTotal: finalTotal`.
   - *Consequence*: Causes order confirmation SMS failures or typescript build rejections during CI/CD.

2. **`src/lib/api-v1/auth.ts:92`**:
   - *Error*: `error TS2353: Object literal may only specify known properties, and 'farmSizeAcres' does not exist in type '...'.`
   - *Cause*: `performSignUp` parameter interface lacks `farmSizeAcres` or requires explicit cast.
   - *Consequence*: Blocks clean typechecking.

3. **`src/lib/api-v1/products.ts:165`**:
   - *Error*: `error TS2551: Property 'base_price' does not exist on type '...'. Did you mean 'basePrice'?`
   - *Cause*: Drizzle ORM schema returns camelCase `basePrice`, while the code references snake_case `p.base_price`.
   - *Consequence*: Evaluates to `0` price if fallback fails.

4. **`src/lib/api-v1/admin.ts:672` & `689`**:
   - *Error*: `error TS2769: No overload matches this call... Type '{ variants: any; }' is not assignable to ParameterOrFragment<never>.`
   - *Cause*: An unstringified JavaScript object `{ variants }` is passed directly into a raw PostgreSQL tagged template literal.
   - *Consequence*: Runtime database query failure when mobile admin saves new or updated product records.

5. **`src/components/mqulima/tools/WeatherPanel.tsx:140` & `179`**:
   - *Error*: `error TS2304: Cannot find name 'WeatherViewModel'` and `error TS7006: Parameter 't' implicitly has an 'any' type.`
   - *Cause*: Missing type import in web weather UI component.

6. **`src/lib/api/market-sync.server.ts:576`**:
   - *Error*: `error TS2339: Property 'unitKgMultiplier' does not exist on type 'never'.`
   - *Cause*: Incomplete type narrowing on benchmark commodity lookup.

7. **`src/routes/api/admin/subscriptions/*.ts` (4 files)**:
   - *Error*: `error TS2345: Argument of type '"subscriptions.read"' is not assignable to parameter of type 'AdminPermission'.`
   - *Cause*: The `AdminPermission` union in `src/lib/rbac.server.ts` was not updated when subscriptions permission scopes were introduced.

---

### 2. Architectural Weaknesses & Structural Incompatibilities

#### 1. Dual Backend Ambiguity & Local Environment Variable Divergence
- **Current State**:
  - `mqulima-ANDROID-APP/frontend/.env` points to `http://localhost:8001` (the Python FastAPI / MongoDB process).
  - `mkulima-hub-c7714688` runs on port `8080` (TanStack Start / PostgreSQL 16).
- **The Risk**:
  If a developer tests the mobile app locally using default configurations, all new user registrations, orders, and discussions write to local MongoDB and are **completely invisible** to the web platform, web admin, and live database.
- **Architectural Remedy**:
  Officially retire the legacy Python backend in `mqulima-ANDROID-APP/backend/`. Update `frontend/.env` to point exclusively to the unified API gateway:
  ```env
  EXPO_PUBLIC_BACKEND_URL=http://localhost:8080
  ```

#### 2. Monolithic Community Route File (`src/routes/community.tsx`)
- **Current State**:
  `mkulima-hub-c7714688/src/routes/community.tsx` is over **327 KB** (>8,000 lines of code in a single file).
- **The Risk**:
  Houses full UI layouts, feed states, modal controllers, and database calls in one file. Creates significant risk of accidental regressions, slow IDE type evaluations, and complex merge conflicts.
- **Remedy**:
  Refactor into modular subcomponents inside `src/components/community/`.

#### 3. Password Reset / OTP Recovery on Android is Currently UI-Only
- **Current State**:
  `mqulima-ANDROID-APP/frontend/app/auth/forgot.tsx` validates email formatting and displays a success toast after a simulated `setTimeout` delay, without dispatching a network call.
- **Backend Capability Available**:
  The backend already has full email OTP recovery implemented via `src/routes/api/auth/recovery.ts` and database table `recovery_tokens`.
- **Remedy**:
  Connect `app/auth/forgot.tsx` to `POST /api/auth/recovery` to issue genuine OTP tokens.

#### 4. Hardcoded JWT Fallback Secret Risk
- **Current State**:
  `src/lib/config.server.ts:70` falls back to `"dev-only-secret-key-32chars-minimum!"` if `JWT_SECRET` is unset in non-production environments.
- **Remedy**:
  Enforce strict fatal startup exception if `JWT_SECRET` is omitted in any environment.

---

### 3. Missing Infrastructure for Production Release

1. **Push Notifications (Android & iOS)**:
   - The Android client currently lacks an active push notification service (Expo Notifications / Firebase Cloud Messaging).
   - Order status changes and forum reply alerts currently depend solely on transactional SMS via TextSMS Kenya.
2. **Native Build & Keystore Configuration**:
   - `mqulima-ANDROID-APP/frontend` lacks an `eas.json` configuration file for Expo Application Services (EAS Build).
   - Production Android App Bundle (`.aab`) signing keystores and Google Play Console credentials must be provisioned.
3. **Automated End-to-End Cross-Project Integration Tests**:
   - Vitest runs 219 tests against the web application and PostgreSQL database.
   - Pytest runs 48 tests against the Python backend.
   - However, no automated CI/CD test currently spins up the web server and executes the Android TypeScript test suite against `/api/v1/*` in a single combined pipeline.

