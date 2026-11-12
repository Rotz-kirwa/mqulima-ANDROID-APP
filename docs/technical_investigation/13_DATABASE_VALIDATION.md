# Database Validation Report
## Mqulima Ecosystem — P0 Phase 4

**Date:** 2026-11-09  
**Branch:** `feature/mqulima-p0-production-readiness`  
**Database:** PostgreSQL 16 on Render.com  

---

## Connection Verification

```
Host: dpg-db72463l550s73ah4sh0-a.oregon-postgres.render.com
Database: mqulima_db_icl9
PostgreSQL version: 16
SSL: enabled
Migrations applied: 66
Tables: 88
Connection status: ✅ CONNECTED
```

---

## Row Counts (Verified 2026-11-09 13:36 UTC)

| Table | Row Count | Notes |
|-------|-----------|-------|
| `users` | 8 | 7 real users + 1 P0 test user |
| `orders` | 4 | 4 real orders (Sep 2026) |
| `order_items` | 4 | Matches orders (1 item each) |
| `products` (active) | **196** | Live Kirgit Agri Depot inventory |
| `products` (total) | 330 | Includes draft/inactive |
| `commodity_price_board` | **265** | Live KAMIS-sourced market prices |

---

## Live Products Sample

```
 NEFLUK 125ML         KES 450   stock:  8
 DUOTECH 1L           KES 4000  stock:  4
 P-FORCE 500ML        KES 500   stock: 12
 NILZAN SUPER 125ML   KES 450   stock: 15
 ALBAFAS 1L           KES 1000  stock: 13
```

---

## Live Market Prices Sample

| Commodity | Region | Price (KES) |
|-----------|--------|------------|
| (commodity 98415fd7) | Nairobi (Wakulima) | 94 |
| (commodity 24624aea) | Nandi (Tinderet) | 34 |
| (commodity 24624aea) | Murang'a (Factory) | 35 |
| (commodity ee4860e1) | Nakuru (Milton) | 3,204 |
| (commodity ee4860e1) | Nairobi (Industrial) | 3,685 |

---

## Recent Users

| Email | Created |
|-------|---------|
| `p0test1794231246@mqulima.test` | 2026-11-09 (P0 test) |
| `comments.ke@gmail.com` | 2026-10-29 |
| `kosgenics@gmail.com` | 2026-10-23 |
| `rotzeliud@gmail.com` | 2026-10-16 |
| `eliudkirwa451@gmail.com` | 2026-10-15 |

---

## Recent Orders

| Order ID | Total | Status | Payment Method | Date |
|----------|-------|--------|---------------|------|
| 2464721f | KES 4,550 | pending | mpesa | 2026-09-15 |
| 113c3237 | KES 2,450 | pending | paystack | 2026-09-12 |
| 272ac328 | KES 2,450 | pending | mpesa | 2026-09-12 |
| 5cd17906 | KES 2,450 | pending | ncba | 2026-09-12 |

> [!NOTE]
> All 4 orders are in `pending` status — indicating payments were initiated but not completed. This may reflect test transactions or incomplete M-Pesa/Paystack callback handling. The STK Push flow requires the M-Pesa callback URL to be reachable from Safaricom's servers, which requires production deployment.

---

## Schema Integrity

### Critical Tables — Verified Present

| Table | Purpose | Status |
|-------|---------|--------|
| `users` | User accounts | ✅ |
| `profiles` | Extended user profiles | ✅ |
| `products` | Product catalogue | ✅ |
| `product_variants` | SKU variants | ✅ |
| `orders` | Order records | ✅ |
| `order_items` | Line items | ✅ |
| `commodity_price_board` | Market prices | ✅ |
| `commodities` | KAMIS commodity definitions | ✅ |
| `admin_users` | Admin console accounts | ✅ |
| `admin_sessions` | Admin JWT sessions | ✅ |
| `subscriptions` | Newsletter/academy subscriptions | ✅ |
| `posts` | Community forum posts | ✅ |

### Migration State

```
66 migrations applied — no pending migrations
Drizzle ORM schema in sync with database
```

---

## Backup Status

> [!WARNING]
> No automated backup schedule has been verified for the Render.com PostgreSQL instance. Render provides daily backups on paid plans. Confirm the backup retention period in the Render dashboard and enable point-in-time recovery before production launch.

---

## Recommendations

1. **Rotate Paystack keys** — the keys previously hardcoded are now removed from code but must be rotated in the Paystack dashboard and updated in Render environment variables.
2. **Implement order status update** — all 4 real orders are `pending`. Investigate whether M-Pesa/Paystack callbacks were received and implement a reconciliation job.
3. **Add market prices public API** — 265 market price entries exist but no consumer-facing API endpoint exposes them to the Android app.
4. **Confirm Render backup schedule** — verify daily backups are enabled and test restore procedure before production.
5. **Smooth Sale POS IP whitelist** — contact Smooth Sale POS to whitelist Render egress IPs to restore automated inventory sync.

---

**Classification: DATABASE VALIDATED ✅**

