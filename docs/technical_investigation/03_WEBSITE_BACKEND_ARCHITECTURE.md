# 03 — WEBSITE & BACKEND ARCHITECTURE AUDIT
## Mqulima Web Platform, Admin Console & Database (`mkulima-hub-c7714688`)

---

### 1. Technology Stack & Platform Overview

| Component | Technology | Version | Location |
| :--- | :--- | :--- | :--- |
| **Monorepo Workspaces** | npm / Bun Workspaces | Root + `admin/` | `package.json` |
| **Web SSR Framework** | TanStack Start (React Start) | `1.167.50` | `src/start.ts`, `src/server.ts` |
| **Web Routing** | TanStack Router (File-based) | `1.168.25` | `src/routes/`, `src/router.tsx` |
| **UI Framework** | React 19 + Tailwind CSS v4 | `19.2.0` / `4.2.1` | `src/components/`, `admin/src/` |
| **Component Primitives** | Radix UI Primitive Suite | Full Suite | `package.json` |
| **Server Engine** | Nitro / Vite HTTP Engine | `3.0.260429-beta` / `7.3.1` | `src/server.ts`, `vite.config.ts` |
| **Admin Console** | Standalone React 19 SPA | `19.2.0` (Port `8081`) | `admin/` |
| **Database Driver** | postgres (pnpm `postgres`) | `3.4.9` | `src/db/index.ts` |
| **ORM / Query Schema** | Drizzle ORM (PostgreSQL) | `0.45.2` | `src/db/schema/` |
| **Primary Database** | PostgreSQL 16 (Render Managed) | `16.x` | `mqulima_db_icl9` |
| **Authentication Engine**| `jose` (JWT) + `bcryptjs` | `6.2.3` / `3.0.3` | `src/lib/auth-server.ts` |
| **Rate Limiter** | Upstash Redis REST Client | `1.38.0` / `2.0.8` | `src/lib/rate-limit.server.ts` |
| **AI Vision Engine** | Google Gemini 2.5 Flash (`@google/genai`)| `2.10.0` | `src/lib/api/crop-doctor.server.ts` |

---

### 2. Web Application & SSR Architecture

#### Execution Flow & Hydration
1. **Server Boot (`src/start.ts`)**: Initializes `@tanstack/react-start` server handlers and mounts error normalization wrappers.
2. **Server Middleware (`src/server.ts`)**:
   - Enforces CORS origin validation against allowed domains (`www.mqulima.com`, `admin.mqulima.com`, `mqulima.vercel.app`, `localhost:3000`, `localhost:8080`, `localhost:8081`).
   - Handles low-level HTTP error normalization, catching unhandled SSR hydration errors and outputting diagnostic logs.
3. **Router Registry (`src/router.tsx`)**: Compiles file routes under `src/routes/` into `src/routeTree.gen.ts`.
4. **Root Context Wrapper (`src/routes/__root.tsx`)**:
   - Injects `AuthProvider` (session cookie reader), `CartProvider` (e-commerce cart drawer state), `WhatsAppButton`, and global toast alerts.
5. **Route Hierarchy**:
   - `index.tsx`: Public portal homepage (Hero Carousel, Live Stats Bar, Categories Grid, Featured Inputs, Testimonials).
   - `shop.tsx` & `shop/`: AgroShop catalog, faceted filter sidebar, cart drawer, checkout dialog, and M-Pesa prompt.
   - `ai.tsx`: Interactive AI Crop Doctor workspace supporting camera uploads and disease diagnosis.
   - `academy.tsx`: Agricultural masterclasses and course chapter previews.
   - `community.tsx`: Social forum (Show and Pulse feeds) supporting posts, likes, comments, and moderation reporting.
   - `services.tsx`: Agribusiness services booking platform with WhatsApp quotation integration.
   - `tools.tsx`: Open-Meteo county weather forecasts and agricultural spray window indices.
   - `auth.sign-in.tsx` & `auth.sign-up.tsx`: Farmer authentication portals.

---

### 3. Standalone Admin Console Architecture (`/admin`)

Located in `mkulima-hub-c7714688/admin`, this is an independent workspace package (`mqulima-admin`):
- **Development Runtime**: Listens on port `8081` with strict port binding; proxies `/api` requests to `http://localhost:8080`.
- **Application Controller (`admin/src/App.tsx`)**: Manages session state via `localStorage` key `mqulima_admin_token`, rendering the executive layout (`Topbar`, obsidian-emerald `Sidebar`) and switching across 17 lazy-loaded administrative modules.
- **API Client (`admin/src/lib/api.ts`)**: Central HTTP client (`adminFetch`) that injects `Authorization: Bearer <token>` and dispatches global `admin_unauthorized` events on HTTP 401 to force session re-authentication.
- **Core Modules (`admin/src/components/modules/`)**:
  1. `DashboardHomeModule.tsx`: Executive activity feed, live orders count, platform gross merchandise value (GMV), operational calendar.
  2. `CustomersModule.tsx`: Farmer profile directory, Kenyan National ID verification, farming fields, acreages, and account lifecycle management.
  3. `ProductsStockModule.tsx`: Catalog pricing, inventory level adjustments, stock status toggles, Smooth Sale POS inventory sync triggers.
  4. `OrdersQuotationsModule.tsx`: Order dispatch pipeline, delivery status transitions (*pending*, *confirmed*, *processing*, *dispatched*, *delivered*, *cancelled*), PDF quotation generation.
  5. `PaymentsModule.tsx`: Comprehensive transaction ledger, Safaricom M-Pesa receipt verification, orphaned payment resolution, exportable financial statements.
  6. `ServiceRequestsModule.tsx`: Agronomy consultation, soil sampling, and tractor mechanization dispatch management.
  7. `NewsCMSModule.tsx`: Agritech news publishing, markdown article editing, media attachment management.
  8. `ForumModerationModule.tsx`: Moderation queue for flagged community posts and comments with hide/restore controls.
  9. `SubscriptionsModule.tsx`: Centralized subscriber management across newsletters, masterclasses, and SMS alerts.
  10. `BusinessProfileModule.tsx`: Corporate legal entity records, VAT/PIN details, warehouse depot configurations.
  11. `VisitorAnalyticsModule.tsx`: Google Analytics 4 telemetry and traffic overview.
  12. *Additional Modules*: `CommodityTrendsModule`, `InquiriesModule`, `MarketPricesModule`, `AcademyExtensionModule`, `AIForecastsModule`, `FeaturedCollectionModule`.

---

### 4. Database Schema & Persistence Architecture

The primary database is a **PostgreSQL 16** managed cluster hosted on Render (`mqulima_db_icl9`).
It contains **88 tables and views**, governed by **66 applied SQL migrations** (`db/migrations/`).

#### Dual User Tables Architecture & Trigger Synchronization
A defining characteristic of the Mqulima database is the intentional division between Kenyan identity records and social platform accounts:
1. `users` Table: Stores authoritative Kenyan farmer identity data: `first_name`, `last_name`, `email`, `phone_number`, `national_id`, `county`, `delivery_location`, `farming_type`, `farm_size_acres`.
2. `profiles` Table: Stores platform-wide social accounts, system roles (`role`), avatars, bios, and reputation scores.
3. **Bi-directional Synchronization Triggers**:
   - `sync_users_to_profiles()`: Executes `AFTER INSERT OR UPDATE OR DELETE ON users`. Automatically provisions or updates the corresponding `profiles` row.
   - `sync_profiles_to_users()`: Executes `AFTER UPDATE ON profiles`. Syncs profile alterations back to `users`.
   - **Recursion Guard**: Both triggers include `IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;` to prevent infinite trigger loop deadlocks.

#### Core Entity Matrix

| Table Name | Primary Key | Key Foreign Keys | Purpose & Responsibilities | Live Record Count |
| :--- | :--- | :--- | :--- | :--- |
| `users` | `id` (UUID) | None | Authoritative farmer identity & registration record | 7 |
| `profiles` | `id` (UUID) | None | Platform accounts, system roles, reputation scores | 8 |
| `products` | `id` (UUID) | `category_id` $\rightarrow$ `product_categories.id` | Marketplace agricultural products catalog | 330 |
| `product_variants`| `id` (UUID) | `product_id` $\rightarrow$ `products.id` | SKU variations for product sizing/packaging | Populated |
| `orders` | `id` (UUID) | `user_id` $\rightarrow$ `profiles.id` | Customer purchase orders, delivery address, status | 4 |
| `order_items` | `id` (UUID) | `order_id` $\rightarrow$ `orders.id`, `product_id` $\rightarrow$ `products.id`| Itemized product breakdown per order | Populated |
| `payments` | `id` (UUID) | `order_id` $\rightarrow$ `orders.id` | M-Pesa & Paystack transaction ledger | Populated |
| `service_requests`| `id` (UUID) | `user_id` $\rightarrow$ `profiles.id`, `service_id` $\rightarrow$ `services.id`| Farmer agronomy & mechanization bookings | Active |
| `services` | `id` (UUID) | None | Catalog of 8 core agricultural service pillars | Active |
| `show_posts` | `id` (UUID) | `user_id` $\rightarrow$ `profiles.id`, `author_id` $\rightarrow$ `profiles.id` | Community forum farmer moment posts | Active |
| `show_comments`| `id` (UUID) | `post_id` $\rightarrow$ `show_posts.id`, `user_id` $\rightarrow$ `profiles.id`| Threaded discussion comments | Active |
| `show_likes` | `id` (UUID) | `post_id` $\rightarrow$ `show_posts.id`, `user_id` $\rightarrow$ `profiles.id`| Forum post like tracking | Active |
| `agritech_news`| `id` (VARCHAR) | `author_id` | Agritech news articles & CMS editorial content | Active |
| `courses` | `id` (UUID) | None | Mqulima Academy masterclass course catalog | Active |
| `course_chapters`| `id` (UUID) | `course_id` $\rightarrow$ `courses.id` | Course chapters and syllabus modules | Active |
| `chapter_lessons`| `id` (UUID) | `chapter_id` $\rightarrow$ `course_chapters.id` | Individual lesson content and previews | Active |
| `pos_auth_tokens`| `id` (UUID) | None | OAuth2 token cache for Smooth Sale POS | 1 |
| `pos_sync_logs` | `id` (UUID) | None | History and telemetry of POS stock sync jobs | Active |
| `sms_logs` | `id` (UUID) | None | Audit log of all transactional SMS dispatches | Active |

---

### 5. Third-Party Integrations & External Service Mesh

#### 1. Safaricom Daraja M-Pesa API
- **Implementation**: `src/lib/api/mpesa.server.ts`, `src/lib/mpesa-helpers.server.ts`, `src/routes/api/mpesa/callback.ts`.
- **Credentials**: Configured in `.env` (`MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_SHORTCODE=4183765`).
- **Mechanics**: Dispatches `CustomerPayBillOnline` STK Push to farmer mobile phone; receives asynchronous callbacks via `/api/mpesa/callback`, validating callback security tokens and updating `payments` and `orders` atomically.

#### 2. Paystack Payment Gateway
- **Implementation**: `src/routes/api/payments/paystack/webhook.ts`, `src/lib/api-v1/payments.ts`.
- **Credentials**: Live production keys configured (`PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`).
- **Mechanics**: Initializes secure hosted card checkout sessions; handles HMAC-SHA512 webhook events for card verification.

#### 3. TextSMS Kenya Bulk SMS API
- **Implementation**: `src/lib/sms-service.server.ts`, `src/order-sms.server.ts`.
- **Credentials**: Partner ID `16948`, Sender ID `KIRGIT_AGRI`, API Key configured.
- **Mechanics**: Sends transactional SMS for user registration welcome messages, order placement confirmations, and payment receipts. Features an automatic fallback mode (`TEXTSMS_MOCK_MODE`) that logs simulated messages to `sms_logs` table if credentials fail.

#### 4. Google Gemini 2.5 Flash Vision AI
- **Implementation**: `src/lib/api/crop-doctor.server.ts`, `src/routes/api/ai/chat.ts`.
- **Credentials**: `GEMINI_API_KEY` using `@google/genai`.
- **Mechanics**: Executes multimodal vision prompts analyzing plant photo uploads; returns structured JSON diagnostics with identified disease, confidence scores, organic controls, and chemical treatments.

#### 5. Smooth Sale POS Inventory Synchronization
- **Implementation**: `src/services/pos/smoothSale.service.ts`, `src/jobs/productSync.job.ts`, `src/routes/api/shop/pos-sync.ts`.
- **Credentials**: Client ID `4`, Client Secret, username `api-v1` on `https://technolake.net/smooth-sale-pos/public`.
- **Mechanics**: Executes OAuth2 password-grant token acquisition with in-database caching (`pos_auth_tokens`). Synchronizes catalog stock and pricing across Eldoret, Kitale, and Nakuru store locations every 30 minutes via background timer.

#### 6. Open-Meteo Weather Intelligence
- **Implementation**: `src/lib/weather-service.ts`, `src/routes/tools.tsx`.
- **Mechanics**: Public REST API integration querying meteorological parameters for all 47 Kenyan county geographic coordinates; computes spray windows, evapotranspiration rates ($ET_0$), and soil moisture levels.

---

### 6. Deployment & Infrastructure Configuration

1. **Render Web Service (`render.yaml`)**:
   - Environment: `node`
   - Build Command: `bun install --frozen-lockfile && bun run build`
   - Start Command: `bun run start` (spawning `node dist/server/index.mjs`)
   - Region: Oregon (`oregon-postgres.render.com`)
2. **Vercel Serverless Rules (`vercel.json`)**:
   - Declares custom routing rewrites, HTTP cache-control headers, and serverless function memory allocations (1024MB, 30s timeout).

