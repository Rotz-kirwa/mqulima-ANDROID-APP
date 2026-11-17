# Mqulima Staging & Production Deployment Plan (`mkulima-hub`)

**Target Production Origin:** `https://www.mqulima.com` (verified live `server: Vercel`, region `cpt1`, configured via [vercel.json](file:///home/user/NYOTA-Clients/mkulima-hub-c7714688/vercel.json))  
**Source Branch:** `feature/mqulima-p0-production-readiness` in `/home/user/NYOTA-Clients/mkulima-hub-c7714688`  
**Constraint:** Do NOT overwrite live payment credentials, print environment secrets, or execute destructive database commands.

---

## Step 1 — Pre-Deploy Quality Gate (Verified Local)
```bash
cd /home/user/NYOTA-Clients/mkulima-hub-c7714688
npm run lint
npx tsc --noEmit
npx vitest run
npm run build
```
- Latest local result: `tsc` `0` errors, `eslint` `0` errors (`27` pre-existing warnings), `vitest` **22/22 files, 228/228 tests passed**, `npm run build` **exit 0** (client `12.94s`, SSR `6.53s`, Nitro Vercel server `25.91s`).

---

## Step 2 — Deploy to Staging / Vercel Preview First
Push `feature/mqulima-p0-production-readiness` to trigger a Vercel Preview URL (or deploy prebuilt `.vercel/output` to preview via `vercel deploy --prebuilt` without `--prod` so live `www.mqulima.com` traffic is untouched):

1. Open a Pull Request from `feature/mqulima-p0-production-readiness` -> `main` (runs `.github/workflows/ci.yml`: `npm run lint`, `npm test`, `npm run build`).
2. Capture the generated Preview URL (`STAGING_URL`, e.g., `https://mkulima-hub-<hash>.vercel.app`).
3. Run non-destructive verification checks against `$STAGING_URL` before touching production:
   ```bash
   # 1. Health & Privacy Policy (expect 200)
   curl -i "$STAGING_URL/api/health"
   curl -I "$STAGING_URL/privacy"

   # 2. CORS allowlist enforcement (expect 403 for untrusted Origin, 204 for mqulima.com)
   curl -i -X OPTIONS -H "Origin: https://evil.example.com" "$STAGING_URL/api/v1/account"
   curl -i -X OPTIONS -H "Origin: https://www.mqulima.com" "$STAGING_URL/api/v1/account"

   # 3. Payment polling auth guard (expect 401 without Bearer token)
   curl -i "$STAGING_URL/api/v1/payments/status/00000000-0000-4000-8000-000000000000"

   # 4. Unauthenticated account deletion guard (expect 401)
   curl -i -X DELETE "$STAGING_URL/api/v1/account"

   # 5. Password recovery anti-enumeration (expect 200 uniform response)
   curl -i -X POST -H "Content-Type: application/json" \
     -d '{"identifier":"nonexistent-smoke-check@example.com"}' \
     "$STAGING_URL/api/v1/auth/forgot-password"
   ```
4. With a disposable test farmer account on staging (never real customer data):
   - Register test farmer -> call `POST /api/v1/auth/forgot-password` -> reset password via OTP (`POST /api/v1/auth/reset-password`) -> log in with new password (`POST /api/v1/auth/login`).
   - Run sandbox M-Pesa/Paystack verification with test keys on staging only, confirm `GET /api/v1/payments/status/:orderId` returns `200` for owner and `403` for another test user.
   - Run `DELETE /api/v1/account` -> verify token immediately returns `401` on `GET /api/v1/auth/me` and post-delete login returns `401`, while order row stays in `orders`.

---

## Step 3 — Promote to Production & Post-Deploy Verification
1. Merge the verified PR into `main` (Vercel auto-deploys production `https://www.mqulima.com`; verify existing Vercel environment variables remain unchanged).
2. Re-run the read-only curl checks (Steps 3.1–3.5 above) substituting `https://www.mqulima.com` for `$STAGING_URL`.
3. **Rollback Plan**: If any regression appears on `/api/health` or `/api/v1/*`, immediately run Vercel instant rollback to the prior production deployment (`vercel rollback` in Vercel dashboard) while investigating — zero destructive DB migrations were added in this release.

