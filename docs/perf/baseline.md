# Performance Baseline (Step 0)

Measured on unmodified `main` (`51a7a47`) against local FastAPI + Uvicorn (`http://127.0.0.1:8080`), MongoDB (`mqulima_db`: `494` products, `7` articles, `3` threads, `0` media), and Expo Web Metro (`http://localhost:8081`) via headless Google Chrome DevTools Protocol.

## 1. Backend API Latency (N=30 requests after 3 warmups)

| Endpoint | p50 (ms) | p95 (ms) | min (ms) | max (ms) |
| --- | ---: | ---: | ---: | ---: |
| `GET /api/v1/products?category=All&page=1&limit=24` | 7.53 | 9.87 | 5.81 | 10.95 |
| `GET /api/v1/products/farm-tools` | 3.26 | 4.09 | 2.15 | 4.47 |
| `GET /api/v1/articles` | 3.91 | 4.93 | 2.92 | 6.95 |
| `GET /api/v1/threads/feed` | 5.02 | 6.10 | 3.77 | 6.95 |

Note: An earlier 40-request burst against `GET /api/v1/threads/feed` triggered `429 Too Many Requests` under the default per-minute limit (`RATE_LIMIT_DEFAULT_PER_MIN=180`).

## 2. Database Writes & Query Plans per `/products` & Core Reads

- **Steady-state DB writes per `GET /api/v1/products?category=All&page=1&limit=24`**: `0` inserts / `0` updates / `0` deletes across 10 requests (`serverStatus.opcounters` delta: `insert: 0, update: 0, delete: 0, query: 10`), because `mqulima_db.products` currently has `494` documents (`>= 300`) and `/home/user/NYOTA-Clients/mqulima-ANDROID-APP/frontend/src/data/products_328.json` exists on this host.
- **Unprimed / non-workspace host write path**: `backend/routes/catalog.py:79-83` runs `count_documents({})` and compares against a hardcoded `/home/user/NYOTA-Clients/mqulima-ANDROID-APP/frontend/src/data/products_328.json` path on every `GET /api/v1/products` request; whenever that path does not exist or `count < 300`, `sync_products_328()` is invoked synchronously in the request path, upserting `328` catalog records (`products_328.json` has `328` items).
- **`GET /api/v1/products` always runs `count_documents({})` (`catalog.py:81`) + `count_documents(f)` (`catalog.py:112`)** per request.
- **`GET /api/v1/articles/{aid}` (`catalog.py:159`)** runs a blocking `find_one_and_update(..., {"$inc": {"reads": 1}})` on every article view.

### `explain("executionStats")` Before Step 1

| Query | Execution Stage | Input Stage | nReturned | Keys Examined | Docs Examined |
| --- | --- | --- | ---: | ---: | ---: |
| `products` list (`status: {$nin: ["draft", "archived"]}`) | `COLLSCAN` | `null` | 494 | 0 | 494 |
| `products` by id (`id: "farm-tools", status: {$nin: [...]}`) | `FETCH` | `IXSCAN` | 1 | 1 | 1 |
| `articles` group+sort (`group: "Seeds", status: {$nin: [...]}` sort `featured: -1, created_at: -1`) | `SORT` | `COLLSCAN` | 0 | 0 | 7 |
| `threads` saved_by (`saved_by: "user-1", hidden: {$ne: true}` sort `created_at: -1`) | `FETCH` | `IXSCAN` (`created_at`) | 0 | 3 | 3 |
| `media` by id (`id: "sample-id"`) | `EOF` | `null` | 0 | 0 | 0 |

## 3. Bulk Catalog Response Size

- **`GET /api/v1/products?limit=500`**: `328,644` bytes uncompressed (`Content-Encoding: None`), returning `494` items in `35.34 ms` server/wire round-trip on loopback.
- On the baseline frontend, `api.ts` calls `getMergedCatalog()` (`GET /products?limit=500`) for list, search, and detail views rather than server-paginated queries (`limit=24`).

## 4. App Cold Start to First Rendered Screen (Stored Token)

Measured in headless Chromium (`412x915`, `http://localhost:8081`) with pre-seeded `auth_token`, `mqulima_user`, and `mqulima_onboarding_completed_v7: true` in `localStorage`. Completion is defined as React rendering the home UI **and** the `!ready` full-viewport splash overlay (`rgb(250, 251, 249)`) disappearing from `(206, 450)`:

- **Localhost `/api/v1/auth/me` (5 runs)**:
  - Runs: `1963.9 ms`, `1940.7 ms`, `1980.9 ms`, `2016.7 ms`, `1950.1 ms`
  - **p50**: `1963.9 ms` (`max: 2016.7 ms`), while DOM mounts underneath around `1428.8–1514.2 ms`.
  - `/api/v1/auth/me` completed before first paint in `5/5` runs.
- **Simulated 1500 ms `/api/v1/auth/me` latency via CDP Fetch interception (3 runs)**:
  - Runs: `3211.6 ms`, `3356.2 ms`, `3078.6 ms` (DOM mounted around `1410.8–1622.2 ms`)
  - **p50**: `3211.6 ms` — confirms `AppStore.tsx:58-81` blocks first rendered screen behind the splash overlay until `/api/v1/auth/me` settles.

## 5. Local Verification Tooling Inventory

- `backend/tests`: `pytest` available in `backend/.venv`.
- Frontend: `tsc`, `eslint`, and Chrome CDP available.
- Mobile UI E2E: `maestro` and `adb` are not installed on this host; `.maestro/` flows will be checked structurally unless a runner is installed.
