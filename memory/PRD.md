# Mqulima — Mobile App PRD

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
