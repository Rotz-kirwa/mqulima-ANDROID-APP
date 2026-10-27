# MQULIMA UNIFIED PLATFORM: PRODUCTION ARCHITECTURE & INTEGRATION LEDGER
## End-to-End Wiring of Standalone Android App with Production Web Backend, Database & APIs

---

### EXECUTIVE SUMMARY
The **Mqulima Standalone Android Mobile Application** (`mqulima-ANDROID-APP`) and the live **Mqulima Web Platform** (`https://mqulima.com`) are unified on a single transactional database and shared service mesh.
All actions taken on the Android handset (account sign up, profile updates, AgroShop order placement, M-Pesa STK push & Paystack payments, AI crop scans, and community discussions) immediately persist to the shared PostgreSQL 16 database and propagate to both the web platform and the Back-Office Admin Console (`https://www.mqulimaadmin.org`).

---

### 1. DUAL-CLIENT AUTHENTICATION SPECIFICATION
The server infrastructure supports dual authentication simultaneously:
- **Web Browser Clients**: Secure HTTP-Only session cookies (`mq_session`).
- **Android Mobile Clients**: Standard `Authorization: Bearer <JWT_TOKEN>` header.
- **Shared JWT Secret**: Both cookie and bearer token decode against `process.env.JWT_SECRET` and resolve to the unified `profiles` and `users` records.

---

### 2. PRODUCTION INFRASTRUCTURE & TOPOLOGY

| Component | Production Identifier / URL | Role & Implementation |
| :--- | :--- | :--- |
| **Main Web Portal** | `https://mqulima.com` (Port `8080`) | TanStack Start + Nitro SSR Web Platform |
| **Admin Console** | `https://www.mqulimaadmin.org` (Port `8081`) | Standalone Back-Office SPA managing 16 business modules |
| **Mobile API Gateway** | `https://mqulima.com/api/v1/` | Base URL for all Android HTTP REST network requests |
| **Primary Database** | PostgreSQL 16 (Render / Drizzle ORM) | Single unified transactional database with triggers |
| **Media CDN** | `https://cdn.mqulima.com` | Cloudflare CDN delivering WebP assets |
| **Object Storage** | Cloudflare R2 / AWS S3 (`mqulima-media`) | Presigned direct upload bucket for camera photos |

---

### 3. LIVE PRODUCTION SERVICES & CREDENTIALS

| Service | Credentials & Identifiers | Active Role |
| :--- | :--- | :--- |
| **Safaricom Daraja M-Pesa** | Shortcode `174379` / `4183765` \| Live STK Push | Triggers instant SIM Toolkit PIN prompt on farmer phone; verifies receipt codes (`ws_CO_...`) |
| **Paystack Gateway** | Live Production Cards (Configured via `PAYSTACK_SECRET_KEY` & `PAYSTACK_PUBLIC_KEY`) | In-app credit/debit card checkout and direct verification |
| **Smooth Sale POS** | `https://technolake.net/smooth-sale-pos/public` | Bi-directional inventory sync across depots (Eldoret, Kitale, Nakuru) |
| **Google Gemini 2.5 Flash** | Model: `gemini-2.5-flash` via `@google/genai` | Multimodal agronomy vision diagnostics & streaming advisor |
| **TextSMS Kenya** | Partner ID: `16948` \| Sender ID: `KIRGIT_AGRI` | Dispatches OTPs, order confirmation SMS, and doctor alerts |
| **Hostinger SMTP** | `smtp.hostinger.com:465` (SSL/TLS) | Branded PDF receipts and agronomist bookings |
| **Open-Meteo Weather** | 47 Kenyan county coordinate registry | Spray window algorithm, FAO ET0 evapotranspiration & GDD indices |

---

### 4. MASTER `/api/v1/` REST CATALOG FOR ANDROID

| Category | Endpoint | Method | Security | Handler |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `/api/v1/auth/register` | `POST` | Public | `handleAuthRegister` (dual-table user & profile creation + SMS) |
| **Auth** | `/api/v1/auth/login` | `POST` | Public | `handleAuthLogin` (bcrypt verification + 30-day mobile JWT) |
| **Auth** | `/api/v1/auth/me` | `GET` | Bearer Token | `handleAuthMe` (returns synchronized profile & farming data) |
| **Auth** | `/api/v1/user/profile` | `PUT` | Bearer Token | `handleUpdateProfile` (updates both `users` and `profiles` records) |
| **Shop** | `/api/v1/products` | `GET` | Public | `handleListProducts` (Smooth Sale stock, filters, pagination) |
| **Shop** | `/api/v1/products/featured`| `GET` | Public | `handleFeaturedProducts` (curated planting season inputs) |
| **Shop** | `/api/v1/products/:id` | `GET` | Public | `handleGetProduct` (product details with packaging variants) |
| **Shop** | `/api/v1/categories` | `GET` | Public | `handleGetCategories` (distinct category counts) |
| **Orders** | `/api/v1/orders` | `POST` | Bearer Token | `handleCreateOrder` (atomic stock reservation, SMS alert) |
| **Orders** | `/api/v1/orders` | `GET` | Bearer Token | `handleGetMyOrders` (farmer order history and statuses) |
| **Payments**| `/api/v1/payments/mpesa/stk-push` | `POST` | Bearer Token | `handleMpesaStkPush` (Daraja Lipa Na M-Pesa STK push prompt) |
| **Payments**| `/api/v1/payments/status/:orderId` | `GET` | Bearer Token | `handlePaymentStatus` (live STK polling & receipt number) |
| **Payments**| `/api/v1/payments/paystack/initialize` | `POST` | Bearer Token | `handlePaystackInitialize` (card checkout session) |
| **Payments**| `/api/v1/payments/paystack/verify` | `POST` | Bearer Token | `handlePaystackVerify` (transaction verification) |
| **Forum** | `/api/v1/forum/feed` | `GET` | Optional Token | `handleForumFeed` (paginated `show_posts` with profiles join) |
| **Forum** | `/api/v1/forum/posts` | `POST` | Bearer Token | `handleCreatePost` (persists new discussion in `show_posts`) |
| **Forum** | `/api/v1/forum/posts/:id` | `GET` | Optional Token | `handleGetPost` (discussion details and threaded comments) |
| **Forum** | `/api/v1/forum/posts/:id/comments` | `POST` | Bearer Token | `handleAddComment` (adds comment to `show_comments`) |
| **Forum** | `/api/v1/forum/posts/:id/like` | `POST` | Bearer Token | `handleToggleLike` (toggles entry in `show_likes`) |
| **Forum** | `/api/v1/forum/posts/:id/bookmark` | `POST` | Bearer Token | `handleBookmarkPost` (persists in `show_bookmarks`) |
| **News** | `/api/v1/news` | `GET` | Public | `handleListNews` (agritech articles from `agritech_news`) |
| **News** | `/api/v1/news/:id` | `GET` | Public | `handleGetNewsArticle` (article body with view increment) |
| **Academy**| `/api/v1/academy/courses`| `GET` | Public | `handleListCourses` (farming masterclasses with syllabus) |
| **Academy**| `/api/v1/academy/waitlist`| `POST` | Public | `handleAcademyWaitlist` (enrollment interest queue) |
| **Services**| `/api/v1/services/categories` | `GET` | Public | `handleListServices` (8 core agricultural pillars) |
| **Services**| `/api/v1/services/booking` | `POST` | Optional Token | `handleServiceBooking` (field specialist booking + SMS) |
| **Tools** | `/api/v1/tools/weather` | `GET` | Public | `handleWeather` (Open-Meteo 47-county spray window) |
| **Tools** | `/api/v1/tools/markets` | `GET` | Public | `handleMarketPrices` (KAMIS wholesale commodity rates) |
| **AI** | `/api/v1/ai/chat` | `POST` | Optional Token | `handleAiChat` (streaming SSE farm advisor) |
| **AI** | `/api/v1/ai/crop-doctor` | `POST` | Optional Token | `handleCropDoctor` (Gemini 2.5 Flash Vision diagnosis) |
| **Upload** | `/api/v1/upload/presign` | `POST` | Bearer Token | `handleUploadPresign` (Cloudflare R2 / S3 presigned PUT URL) |
| **Admin** | `/api/v1/admin/overview` | `GET` | Admin Role | `handleAdminOverview` (metrics, order volume, low stock, activity) |
| **Admin** | `/api/v1/admin/:resource` | `GET` | Admin Role | `handleAdminResourceList` (paginated list for orders, products, users, forum, etc.) |
| **Admin** | `/api/v1/admin/:resource` | `POST` | Admin Role | `handleAdminSaveRecord` (creates new product or article record) |
| **Admin** | `/api/v1/admin/:resource/:id` | `GET` | Admin Role | `handleAdminGetRecord` (retrieves full entity details & comments) |
| **Admin** | `/api/v1/admin/:resource/:id` | `PUT` | Admin Role | `handleAdminSaveRecord` (updates existing product or article) |
| **Admin** | `/api/v1/admin/:resource/:id/state` | `PATCH` | Admin Role | `handleAdminStateUpdate` (updates order status, stock qty, specialist assignment) |
| **Admin** | `/api/v1/admin/forum/:id/moderate` | `PATCH` | Admin Role | `handleAdminForumModeration` (hides/restores community post) |
| **Admin** | `/api/v1/admin/forum/:id/comments/:commentId` | `PATCH` | Admin Role | `handleAdminForumModeration` (hides/restores discussion reply) |

---

### 5. DATABASE AUTHENTICATION & SESSION LIFECYCLE (HARDENED)
1. **Database Persistence**:
   - Authentication connects directly to PostgreSQL 16 on Render (`mqulima_db_icl9`).
   - Registration creates persistent records in authoritative `users` and `profiles` tables with standard bcrypt password hashing (10 salt rounds).
   - Login validates credentials against PostgreSQL bcrypt hashes and issues 30-day mobile JWTs signed with `JWT_SECRET`.
   - Dual-client authentication: Web client uses `mq_session` HttpOnly cookie; mobile app uses `Authorization: Bearer <token>`.
2. **Dual-Target Endpoint Routing**:
   - Primary: `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/me`.
   - Secondary / Direct: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`.
   - Full CORS preflight (`OPTIONS` -> 204) and response headers enabled across all auth endpoints.
3. **Client Session Lifecycle**:
   - Token securely saved to hardware-backed `Expo SecureStore` under `auth_token`.
   - Session restore: On app startup, `api.me()` validates the stored token against the server; on success, the user is restored into `AppStore`; on invalidation (401), the expired token is purged.
   - Clean Logout: `api.logout()` wipes `auth_token` from `SecureStore` and removes cached user accounts from `AsyncStorage`.
   - Accurate Error Surfacing: Removed offline dummy account generation fallbacks. Genuine conflicts (409) and invalid credentials (401) correctly trigger form field error states.

---

### 6. INTEGRATION STATUS: COMPLETE & FULLY HARDENED
1. **Network Layer**: Pure JSON `/api/v1/*` and `/api/*` gateways intercept requests before SSR hydration, ensuring low-latency native responses.
2. **Dual Authentication**: Session cookie for web clients and `Authorization: Bearer <token>` for mobile clients seamlessly decode against the shared `JWT_SECRET`.
3. **Database Consistency**: Direct integration with PostgreSQL 16 schema (`users`, `profiles`, `products`, `orders`, `order_items`, `show_posts`, `show_comments`, `show_likes`, `show_bookmarks`, `agritech_news`, `service_requests`).
4. **Third-Party Services**: Live Safaricom Daraja Lipa Na M-Pesa STK push, Paystack Card verification, Smooth Sale POS stock tracking, Google Gemini 2.5 Flash Vision AI, TextSMS Kenya (`KIRGIT_AGRI`), Hostinger SMTP, and Open-Meteo county weather.
5. **Back-Office & Mobile Admin**: Both the standalone web admin console and the mobile app's native admin screens interface directly with unified database records and workflow state transitions.