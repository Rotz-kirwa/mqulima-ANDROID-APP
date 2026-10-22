# Mqulima — Mobile App PRD

## Current delivery status (2026-10-22 — supersedes historical sections below)
- Full-stack Expo mobile app, FastAPI and MongoDB; existing public site identity retained. All API URLs derive from current environment configuration.
- Forum redesigned with live search/topics/sort, bookmarks, nested replies, drafts, and resolved questions. Phone-sized screenshot smoke checks passed; full E2E was paused by user.
- Complete operations admin implemented at `/admin/login` (access also from More → Admin portal). Owner account is documented in `test_credentials.md`; initial password change required. Admin manages THIS build's database, not the separately hosted live mqulima.com database.
- Admin includes role/status/token-version checks, initial-password rotation, login limits, audit log, catalogue editors, order workflows/manual payment records, customer access, moderation, news, service categories/services/requests, course curriculum, waitlist and contact inbox. See `ADMIN_PLAN.md`. Managed image uploads wired. Build/lint/API-denial smoke checks passed; comprehensive admin testing was paused and remains pending.
- Services (8 categories / 29 services) and courses (3) migrated from local data to Mongo. Public pages and admin now use the same records. Service requests/contact/waitlist submit to backend; payments remain manually arranged, not settlement/refund integration.
- News and article reader refreshed with sharp-edged imagery/cards, a dedicated featured story, explicit Read article buttons, deduplication, live related articles, sharing, and honest error/empty states. TypeScript/lints and screenshots covering featured → reader → category empty state passed. Broader news testing was paused.
- Current task: apply the same sharp editorial style to Academy and course previews. Approved scope: learning-path cards, level filters, clear text-based samples, curriculum and streamlined persistent waitlist. Implementation in progress; testing still required.
- No auth credentials have been changed since the initial admin seed. Never overwrite existing accounts during startup.

## Current architecture additions
- `/backend/routes/{admin,content,media}.py`, `/backend/admin_models.py`, `/backend/operations.py`, `/backend/seed_admin.py`, `/backend/operations_seed.json`.
- `/frontend/app/admin/` + `/frontend/src/admin/`; role-gated mobile workspace.
- `/frontend/src/components/{forum,news,academy}/` reusable feature components.
- Admin publication states apply to public catalogue/news/services/courses; hidden forum posts/replies are filtered publicly. Public course APIs omit non-preview lesson content.

## Current priorities
- P0: finish and verify Academy/course redesign and waitlist.
- P1: resume comprehensive admin, forum, and news E2E verification when requested; native device QA for keyboards/uploads.
- P2: real M-Pesa settlement/refunds; full LMS enrolment/video hosting/certificates; notifications; staff invitations/2FA; forum media uploads.

---
## Historical build notes (retained for context)

## Original problem statement
Frontend-only Expo/React Native app for "Mqulima" (Africa's 360° agriculture ecosystem, "...taking you first class"), replicating https://www.mqulima.com on mobile: same colors (#1a5438, #0F291E, #85CC14, #16A34A, #F5A623), fonts (Outfit headings, Plus Jakarta Sans body, Lora wordmark), copy, imagery. No backend; mock data in /data, single service layer /services/api.ts; local persistence for cart, saved, login. Tabs: Home, AgroShop, News, Forum, More. Floating WhatsApp button. Screens: Home, AgroShop (filters, grid, search, detail w/ variants, cart, checkout), News, Forum (threads, detail, create, comments, likes), Tools, Services (+request form), Academy (coming soon), Mqulima AI (mocked chat), Auth (sign up/in, forgot, profile, orders, saved), About, Contact, Terms/Privacy.

## User choices
- AI chat: mocked canned replies
- Missing site content: realistic placeholders in same structure
- First delivery: all screens with core flows

## Architecture
- expo-router: app/(tabs) [index, shop, news, forum, more]; stack: product/[id], cart, checkout, article/[id], thread/[id], create-post, tools/index, tools/[id], services/index, services/[id], service-request, academy, ai, about, contact, legal, search, auth/*, account/*
- Data: src/data/{home,products,articles,services,forum,tools,pages}.ts
- Service layer: src/services/api.ts (simulated delays; swap for HTTP later)
- State: src/store/AppStore.tsx (context + storage util persistence), React Query for lists (skeletons, pull-to-refresh)
- Web preview proxies mqulima.com images via images.weserv.nl (site sends CORP same-origin); native loads site URLs directly (src/components/Img.tsx)
- NativeTabs on iOS 26+, JS Tabs elsewhere

## Implemented (2026-06)
- All screens above; validation + local success states for checkout, service request, contact, sign up/in, forgot, create post, academy waitlist, trace
- Testing: iteration_1 — 46/46 flows passed
- Real Mqulima AI (Gemini 3.1 Pro via Emergent key, SSE streaming), service detail pages, academy course previews, 189-item catalog

## Backend migration (2026-06, this session)
- FastAPI split into `db.py`, `auth.py`, `seed.py`, `routes/{auth,catalog,forum,orders,ai}.py`; `seed.json` (exported from frontend mock data via `scripts/export_seed.js`) auto-seeds Mongo on first boot
- JWT auth (pwdlib/argon2 + PyJWT, 30-day tokens, `JWT_SECRET` in backend/.env): `POST /api/auth/register|login`, `GET /api/auth/me`
- Catalog: `GET /api/products?category&q&page`, `/products/featured`, `/products/by-ids?ids=`, `/products/{id}`, `/articles?group`, `/articles/{id}` (increments reads), `/search?q`
- Forum (Mongo): `GET/POST /api/threads`, `GET /api/threads/{id}`, `POST /threads/{id}/comments`, `POST /threads/{id}/like` (toggle; auth required for writes, `?mine=true` for own posts)
- Orders: `POST /api/orders` (server-side pricing from catalog, free delivery ≥ KSh 5,000 else 300), `GET /api/orders`
- Frontend `api.ts` now HTTP; token stored via `storage.secure*("auth_token")`; `AppStore` keeps only cart + saved locally and restores session from `/auth/me`
- Checkout requires sign-in; forum like/comment/post require sign-in (redirect to sign-in)
- Services, academy, tools market prices remain static frontend content

## Backlog
- P1: M-Pesa payment integration for orders
- P2: Photo upload for forum posts / AI crop doctor (camera)
- P2: Admin order status updates
