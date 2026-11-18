# Step 7 Verification Report (Before vs After)

Measured on branch `perf/step-7-verify` running under **Gunicorn + 2 × `UvicornWorker`** (no `--reload`) with `REDIS_URL=redis://127.0.0.1:6379/0`, MongoDB (`mqulima_db`: `494` products, `7` articles, `3` threads), and Expo Web Metro (`http://localhost:8081`). Baseline numbers are from [baseline.md](./baseline.md) (`51a7a47`).

## 1. Backend API Latency (N=30 after 3 warmups)

| Endpoint | Before p50 / p95 (ms) | After p50 / p95 (ms) | Delta (p50 / p95) |
| --- | ---: | ---: | ---: |
| `GET /api/v1/products?category=All&page=1&limit=24` | 7.53 / 9.87 | 4.22 / 5.92 | -3.31 ms (-44.0%) / -3.95 ms (-40.0%) |
| `GET /api/v1/products/farm-tools` | 3.26 / 4.09 | 3.78 / 4.78 | +0.52 ms / +0.69 ms (Redis rate-limit check included) |
| `GET /api/v1/articles` | 3.91 / 4.93 | 3.59 / 4.17 | -0.32 ms (-8.2%) / -0.76 ms (-15.4%) |
| `GET /api/v1/threads/feed` | 5.02 / 6.10 | 4.06 / 4.32 | -0.96 ms (-19.1%) / -1.78 ms (-29.2%) |

## 2. Database Writes & `explain("executionStats")`

- **`GET /api/v1/products?category=All&page=1&limit=24` opcounters write delta (10 requests)**: `insert: 0, update: 0, delete: 0, query: 10`.
- **`sync_products_328()` request-path check**: Removed from `GET /api/v1/products`; exposed via CLI (`backend/seed.py sync`) and gated by `SYNC_CATALOG_ON_STARTUP` env flag. Zero hardcoded `/home/user/NYOTA-Clients` paths remain in `backend/`.
- **Index `explain("executionStats")` confirmation**:
  - `products_list`: `COLLSCAN` (494 docs) -> `FETCH -> IXSCAN(status_1_category_1)`
  - `products_category`: `FETCH -> IXSCAN(category_1_status_1)`
  - `products_by_id`: `FETCH -> IXSCAN(id_1)` (unique index added)
  - `articles_group_sort`: `SORT -> COLLSCAN` -> `SORT -> FETCH -> IXSCAN(group_1)`
  - `articles_cat_sort`: `COLLSCAN` -> `SORT -> FETCH -> IXSCAN(category_1)`
  - `threads_saved_by`: `IXSCAN(created_at_-1)` (scanned all docs) -> `SORT -> FETCH -> IXSCAN(saved_by_1)` (multikey index)
  - `media_by_id`: `EOF` (no index) -> `EXPRESS_IXSCAN(id_1)` (unique index)

## 3. Catalog Wire Payload Size

- `GET /api/v1/products?limit=500` (raw endpoint preserved for offline cache/compat): `328,644` bytes (`494` items).
- Shop initial load request in browser network trace:
  - **Before (`getMergedCatalog()` -> `/products?limit=500`)**: `328,644` bytes
  - **After (`GET /api/v1/products?category=All&page=1&limit=24`, single request; `totalCountQuery` removed)**: `13,659` bytes (**`-95.8%`** wire transfer).

## 4. Cold Start to First Rendered Screen (Stored Token)

Measured in headless Chromium (`412x915`, `http://localhost:8081`) with seeded `auth_token`, `mqulima_user`, and `mqulima_onboarding_completed_v7: true`:

| Scenario | Before p50 (ms) | After p50 (ms) | Delta |
| --- | ---: | ---: | ---: |
| Localhost `/api/v1/auth/me` (5 runs) | 1963.9 (`max: 2016.7`) | 1611.0 (`runs: 1625.8, 1621.2, 1611.0, 1511.5, 1521.2`) | -352.9 ms (-18.0%) |
| Simulated 1500 ms `/api/v1/auth/me` delay (3 runs) | 3211.6 (`auth/me` finished before paint: 1/1) | 1511.6 (`runs: 1449.5, 1528.8, 1511.6`; `auth/me` finished before paint: 0/1, background completed: 1/1) | -1700.0 ms (-52.9%) |

## 5. Checks & Test Suite Status

- **Backend pytest (`EXPO_PUBLIC_BACKEND_URL=http://localhost:8080 backend/.venv/bin/pytest backend/tests -q`)**:
  - `43 passed, 4 failed, 7 skipped, 1 error` (pre-existing fixtures/expectations vs current DB seed & guest checkout rules: `farmer@mqulima.com` password/seed missing in `mqulima_db`, single seeded `Question` thread so `next_page` is `None`, guest orders allowed returning `201` with 13-char `MQ-*` IDs).
- **Frontend TypeScript (`cd frontend && npx tsc --noEmit`)**: `0` errors (exit code `0`).
- **Frontend ESLint (`eslint` on all touched files)**: `0` errors, `4` pre-existing warnings.
- **Frontend ESLint repo-wide (`cd frontend && yarn lint`)**: `32` problems (`21` errors, `11` warnings — down from `24` errors prior to Step 7 fixes; all remaining `21` errors are pre-existing in untouched files).
- **Maestro UI Flows (`frontend/.maestro/01_shop_checkout_flow.yaml`, `02_crop_doctor_and_tools.yaml`, `03_account_and_navigation.yaml`)**: **Not executed** (`maestro` CLI and `adb` / Android emulator are not installed on this Linux host).
