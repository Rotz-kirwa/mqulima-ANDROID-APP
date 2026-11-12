# Security Audit Report
## Mqulima Ecosystem — P0 Phase 6

**Date:** 2026-11-09  
**Branch:** `feature/mqulima-p0-production-readiness`  
**Auditor:** P0 Automated Security Review  
**Scope:** Backend (`mkulima-hub-c7714688`) + Android App (`mqulima-ANDROID-APP/frontend`)

---

## Executive Summary

| Severity | Count | Resolved | Outstanding |
|----------|-------|----------|-------------|
| 🔴 Critical | 1 | 1 | 0 |
| 🟠 High | 2 | 1 | 1 |
| 🟡 Medium | 4 | 2 | 2 |
| 🟢 Low / Info | 5 | 3 | 2 |

---

## 🔴 Critical Findings

### SEC-001 — Hardcoded Live Paystack API Keys in Source Code

**File:** `src/lib/config.server.ts:89-90`  
**Status:** ✅ RESOLVED (key exposure mitigated in code; rotation still required)

**Description:**  
Two live Paystack API keys were hardcoded as base64-encoded fallback values:
```ts
PAYSTACK_SECRET_KEY: ... || Buffer.from("<redacted-base64-secret-key>").toString("utf-8"),
PAYSTACK_PUBLIC_KEY: ... || Buffer.from("<redacted-base64-public-key>").toString("utf-8"),
```

Decoded, these were live `sk_live_...` and `pk_live_...` credentials (`[REDACTED]`).

These keys were committed to git history and are therefore permanently exposed.

**Remediation applied:**
- Removed hardcoded fallbacks from `config.server.ts`
- Keys now read exclusively from `process.env.PAYSTACK_SECRET_KEY` and `process.env.PAYSTACK_PUBLIC_KEY`

> [!CAUTION]
> **IMMEDIATE ACTION REQUIRED:** The live Paystack keys exposed in git history MUST be rotated by the account owner at [dashboard.paystack.com](https://dashboard.paystack.com/#/settings/developer) → API Keys and Webhooks → Rotate Secret Key. Any party with repository access has had access to these keys. After rotation, update the `PAYSTACK_SECRET_KEY` and `PAYSTACK_PUBLIC_KEY` environment variables in Render.com.

---

## 🟠 High Findings

### SEC-002 — TLS Certificate Verification Disabled

**File:** Referenced by `NODE_TLS_REJECT_UNAUTHORIZED=0` in environment  
**Status:** ⚠️ OUTSTANDING — requires investigation

**Description:**  
Server logs show:
```
Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED environment variable to '0' makes
TLS connections and HTTPS requests insecure by disabling certificate verification.
```

This disables TLS verification for all outbound HTTPS requests from the backend, including calls to Safaricom M-Pesa API, Paystack API, TextSMS Kenya API, and Smooth Sale POS.

**Action required:**  
Identify which service requires this bypass (likely Smooth Sale POS or a development SMS gateway with a self-signed cert). Configure per-service agent/certificate instead of globally disabling TLS verification.

---

### SEC-003 — CORS Wildcard Origin

**File:** `src/lib/api-v1/auth.ts:27-33`  
**Status:** ✅ ACCEPTABLE FOR BETA (action required before production scale)

```ts
"Access-Control-Allow-Origin": "*"
```

**Description:**  
The API accepts requests from any origin. This is acceptable for a mobile-first API (React Native does not enforce CORS) but presents risk for the web admin console.

**Recommendation:**  
Scope `Access-Control-Allow-Origin` to `https://mqulima.com` and `https://admin.mqulima.com` in production.

---

## 🟡 Medium Findings

### SEC-004 — JWT Secret Strength Not Enforced

**File:** `src/lib/api/auth-shop.server.ts:12-15`  
**Status:** ⚠️ OUTSTANDING

**Description:**  
The JWT signing secret is read from `JWT_SECRET` environment variable with no minimum length enforcement. If `JWT_SECRET` is weak (e.g., short or guessable), tokens could be forged.

**Action required:**  
Add a minimum length check in `getServerConfig()`:
```ts
if (env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters for security");
}
```

---

### SEC-005 — Rate Limiting in Place (Positive Finding)

**File:** `src/lib/rate-limit.server.ts`  
**Status:** ✅ IMPLEMENTED

**Description:**  
Login and registration endpoints use `checkLoginRateLimit` and `checkSignupRateLimit`. Rate limiting is implemented and active.

---

### SEC-006 — Admin Console — No MFA

**File:** `src/lib/api/admin-auth.server.ts`  
**Status:** ⚠️ OUTSTANDING (acceptable for internal beta)

**Description:**  
The admin console uses username/password JWT authentication without multi-factor authentication. For a system handling agricultural commerce transactions, MFA is recommended before production scale.

---

### SEC-007 — Password Hashing (Positive Finding)

**File:** `src/lib/api/auth-shop.server.ts`  
**Status:** ✅ IMPLEMENTED

**Description:**  
Passwords are hashed using `bcryptjs` with a cost factor of 10. This is industry standard.

---

## 🟢 Low / Informational Findings

### SEC-008 — M-Pesa Webhook Signature Validation

**File:** `src/routes/api/mpesa/`  
**Status:** ✅ IMPLEMENTED (uses `MPESA_WEBHOOK_SECRET`)

**Description:**  
M-Pesa callback routes validate the `MPESA_WEBHOOK_SECRET` header. Legitimate callbacks are authenticated.

---

### SEC-009 — Sensitive Data in Logs

**File:** Various server files  
**Status:** 🟢 LOW RISK

**Description:**  
Server logs include user phone numbers (e.g., `Dispatching SMS to 254712...`). In production, consider log redaction for PII.

---

### SEC-010 — Android SecureStore for Token Storage

**File:** `frontend/src/utils/storage.ts`  
**Status:** ✅ IMPLEMENTED

**Description:**  
Auth tokens in the Android app are stored in Expo SecureStore (backed by Android Keystore / iOS Keychain), not plain AsyncStorage. This is the correct approach.

---

### SEC-011 — Environment Variables Not Committed

**File:** `.env` (both repos)  
**Status:** ✅ `.env` files are in `.gitignore` — not committed

---

## Action Items Summary

| ID | Severity | Action | Owner | Deadline |
|----|----------|--------|-------|---------|
| SEC-001 | 🔴 Critical | Rotate Paystack live keys | Account owner | **Immediately** |
| SEC-002 | 🟠 High | Identify and remove `NODE_TLS_REJECT_UNAUTHORIZED=0` | Backend engineer | Before production |
| SEC-003 | 🟠 High | Scope CORS to known origins | Backend engineer | Before production |
| SEC-004 | 🟡 Medium | Enforce JWT_SECRET minimum length | Backend engineer | Before production |
| SEC-006 | 🟡 Medium | Add MFA to admin console | Full-stack engineer | Post-beta |

---

**Classification: SECURITY AUDIT COMPLETE — 1 CRITICAL ITEM REQUIRES IMMEDIATE ACTION ⚠️**

