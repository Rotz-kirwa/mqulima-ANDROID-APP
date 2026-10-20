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

## Backlog
- P1: Plug real backend into api.ts (auth, orders, M-Pesa)
- P1: Real AI (LLM) replies for Mqulima AI
- P2: Photo upload for forum posts / AI crop doctor (camera)
- P2: Pagination of full 189-item catalog
