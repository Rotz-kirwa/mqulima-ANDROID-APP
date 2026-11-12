# Android ↔ Backend Integration Report
## Mqulima Ecosystem — P0 Phase 3

**Date:** 2026-11-09  
**Branch:** `feature/mqulima-p0-production-readiness`

---

## Overview

This report documents the integration alignment between the Mqulima Android application (`mqulima-ANDROID-APP/frontend`) and the unified REST gateway backend (`mkulima-hub-c7714688`).

---

## Architecture

```
Android App (Expo SDK 57 / React Native)
    └── EXPO_PUBLIC_BACKEND_URL (env var)
            │
            ▼
    http://[host]:8080           ← Unified REST Gateway (TanStack Start / Nitro / Vite)
            │
            ├── /api/v1/auth/*   ← Authentication (JWT + bcrypt)
            ├── /api/v1/products ← Product catalogue
            ├── /api/v1/orders   ← Order management
            ├── /api/v1/admin/*  ← Admin console (admin-only JWT)
            ├── /api/ai/*        ← Gemini AI endpoints
            ├── /api/mpesa/*     ← M-Pesa STK Push callbacks
            └── /api/payments/*  ← Paystack webhooks
                    │
                    ▼
            PostgreSQL 16 (Render.com)
            88 tables, 66 migrations
```

---

## Legacy Backend Status

| Component | Technology | Status |
|-----------|-----------|--------|
| Legacy Python backend | FastAPI + MongoDB (port 8001) | **Decommissioned for mobile** |
| Unified REST gateway | TanStack Start + PostgreSQL (port 8080) | **Active — production target** |

The `backend/` directory in `mqulima-ANDROID-APP` contains the legacy Python FastAPI server. It is NOT used by the Android `frontend/` application. The Android app communicates exclusively with the TanStack Start gateway.

---

## Environment Variable Alignment

### Before P0 (Incorrect)

```env
# frontend/.env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001   # ← points to defunct FastAPI
```

### After P0 (Correct)

```env
# frontend/.env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8080   # ← unified REST gateway
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=<paystack-public-key>
EXPO_PUBLIC_CDN_URL=https://cdn.mqulima.com
EXPO_PUBLIC_MPESA_SHORTCODE=174379
```

> [!IMPORTANT]
> For production builds (EAS Build / Expo Application Services), `EXPO_PUBLIC_BACKEND_URL` must be set to the production Render.com domain: `https://mqulima.onrender.com` (or the custom domain). Configure this in `eas.json` per-profile.

---

## API Client (`frontend/src/services/api.ts`)

The Android app uses a centralised API service that reads `EXPO_PUBLIC_BACKEND_URL` at build time via Expo's public environment variable system.

### Implemented API Methods

| Method | Endpoint | Auth Required |
|--------|----------|--------------|
| `register(data)` | `POST /api/v1/auth/register` | No |
| `login(identifier, password)` | `POST /api/v1/auth/login` | No |
| `getProducts(params)` | `GET /api/v1/products` | No |
| `getProduct(id)` | `GET /api/v1/products/:id` | No |
| `createOrder(data)` | `POST /api/v1/orders` | ✅ JWT Bearer |
| `getOrders()` | `GET /api/v1/orders` | ✅ JWT Bearer |
| `askAI(prompt)` | `POST /api/ai/chat` | Optional |
| `streamAI(session, prompt, cb)` | `POST /api/ai/stream` | Optional |

### Authentication Flow

```
1. User registers → POST /api/v1/auth/register → JWT token returned
2. Token stored in Expo SecureStore (key: "mq_auth_token")
3. All subsequent authenticated requests include:
   Authorization: Bearer <token>
4. Token expiry: 7 days (configurable via JWT_EXPIRY env var)
```

---

## Verified Integration Tests

### Registration

```
POST /api/v1/auth/register
Body: { firstName, lastName, email, phoneNumber, county, deliveryLocation, farmingType, password }
Result: { success: true, token: "eyJ...", name: "...", email: "..." }
Side-effect: Welcome SMS dispatched via TextSMS Kenya (confirmed: Message ID 994220494)
```

### Login

```
POST /api/v1/auth/login
Body: { identifier: "email_or_phone", password: "..." }
Result: { success: true, token: "eyJ...", user: { id, name, email, phone, role } }
```

### Products

```
GET /api/v1/products?limit=5&status=active
Result: { products: [...], total: 196, page: 1 }
Sample product: { id, name, price (KES), stock, category, image, rating }
```

---

## Known Issues and Outstanding Items

### 1. Production URL Not Configured in EAS

The `frontend/eas.json` does not currently set `EXPO_PUBLIC_BACKEND_URL` for production builds. This must be configured before any EAS Build submission.

**Action required:**
```json
// eas.json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_BACKEND_URL": "https://mqulima.onrender.com"
      }
    }
  }
}
```

### 2. Smooth Sale POS Sync — IP Whitelist Required

The Smooth Sale POS OAuth2 endpoint (`technolake.net`) is protected by Imunify360 bot-protection. The Render.com egress IP must be whitelisted by the Smooth Sale POS provider.

**Error observed:** `403: Access denied by Imunify360 bot-protection`  
**Impact:** Products not syncing from POS in real-time (manual uploads still work)  
**Action required:** Contact Smooth Sale POS support with Render egress IPs

### 3. Market Prices API Endpoint

Market price board data exists (265 entries in `commodity_price_board` table) but the data is currently only exposed through the admin console API (`/api/admin/market-prices`). A public consumer API endpoint for the Android app is not yet implemented.

**Action required:** Create `GET /api/v1/market/prices` route in `src/routes/api/v1/$.ts`

### 4. Paystack Keys Rotation (Critical Security)

The Paystack live keys that were hardcoded in `config.server.ts` are now removed, but must be rotated by the account owner. Until rotated, Paystack payments are potentially at risk.

---

## CORS Configuration

The backend applies CORS headers to all `/api/v1/*` responses:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Cache-Control
```

This permits the Android app (and any client) to call the API. For production, `Access-Control-Allow-Origin` should be scoped to known origins.

---

**Classification: PHASE 3 INTEGRATION ALIGNED ✅**

