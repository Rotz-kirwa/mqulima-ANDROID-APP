# Mqulima Google Play Store Listing & Release Assets

**Package Name (`applicationId`)**: `com.mqulima.app`  
**Target Environment**: Android (Google Play Store — Production backend live at `https://www.mqulima.com`; awaiting interactive `eas login`, EAS project linking/signing, AAB build, and Play Console screenshots/upload)

---

## 1. Store Listing Copy

- **App Name** (15 / 30 chars): `Mqulima`
- **Short Description** (78 / 80 chars):
  `Kenya agro-inputs, AI crop doctor, live market prices & weather in one app.`
- **App Category**: Business / Productivity (or Shopping / Agriculture sub-tags)
- **Content Rating**: PEGI 3 / Everyone (no gambling, no adult content; e-commerce purchases require adult account checkout)
- **Free / Paid**: Free

### Full Description (2,051 / 4,000 chars)

**Mqulima — Taking you first class.**

Mqulima connects farmers, agro-vets, cooperatives, and agribusinesses across Kenya with verified agricultural inputs, agronomic expertise, market intelligence, and mobile payments in one fast Android app.

**What you can do with Mqulima:**

- **Certified Agro-Input Marketplace (`Shop`)**: Browse seeds, fertilizers, crop protection products, animal health supplies, farm equipment, and irrigation kits with county delivery checkout via M-Pesa STK Push and Paystack.
- **AI Crop Doctor & Agronomy Assistant (`Crop Doctor`)**: Snap or upload a crop photo for rapid symptom assessment and practical treatment guidance, or ask agronomic questions anytime.
- **Daily Market Commodity Prices & Farm Tools (`Tools & Markets`)**: Track Kenyan wholesale commodity price snapshots and use built-in livestock nutrition, crop yield, and soil advisories.
- **County Farm Weather & Advisories**: Location-aware forecasts for agricultural planning across Kenyan counties.
- **Mqulima Academy & Professional Services**: Enroll in structured farming guides and request agronomic, veterinary, soil analysis, or value-addition services directly in the app.
- **Farmer Forum & Agro News**: Connect with fellow farmers and extension specialists, share field photos, and follow regional agricultural news.
- **Resilient Offline Access**: Browse recently cached shop catalogs, market data, news, and advisories with clear cached-data indicators when rural connectivity drops.

**Account & Privacy Controls:**
You manage your own account in-app. Sign in securely, recover access via email/SMS verification OTP, view order history, or permanently delete your account and personal profile directly from the Account screen while statutory financial transaction records are safely retained as required by law.

---

## 2. Privacy Policy, Support & Data Safety Metadata

- **Privacy Policy URL**: `https://www.mqulima.com/privacy`
  - *Current Deployment Status*: Live in Production (`HTTP 200` on `https://www.mqulima.com/privacy`).
- **Account Deletion URL / Path**:
  - In-app: **More -> Account -> Delete Account** (`DELETE /api/v1/account`)
  - Web contact fallback: `mailto:mqulima@mqulima.com` / `https://www.mqulima.com/privacy#priv-7`
- **Support Email**: `mqulima@mqulima.com`
- **Support Phone / WhatsApp**: `+254 723 346 134`
- **Support Website**: `https://www.mqulima.com`
- **Physical Address**: Junction, along Eldoret–Iten Highway, Kenya
- **Declared Runtime Permissions (`app.json`)**:
  - `CAMERA` (Crop Doctor photo diagnosis & forum photos)
  - `ACCESS_COARSE_LOCATION` / `ACCESS_FINE_LOCATION` (County weather forecast & delivery accuracy)
  - `INTERNET` (API & media communication)
  - Explicitly blocked: `RECORD_AUDIO`, `READ_MEDIA_VIDEO`

---

## 3. Prepared Visual Assets (`docs/release/play-store-assets/`)

| Asset | File | Dimensions | Status |
|---|---|---|---|
| Play Store Hi-Res Icon | `store-icon-512x512.png` | 512 x 512 PNG | Ready (vector-rendered from canonical Mqulima logo) |
| Feature Graphic | `feature-graphic-1024x500.png` | 1024 x 500 PNG | Ready |
| Adaptive Foreground Icon | `adaptive-icon-foreground-1024x1024.png` | 1024 x 1024 PNG | Ready (also synced to `frontend/assets/images/adaptive-icon.png`) |
| Adaptive Monochrome Icon | `adaptive-icon-monochrome-1024x1024.png` | 1024 x 1024 PNG | Ready |
| App Launcher Icon (Square) | `../../frontend/assets/images/icon.png` | 1024 x 1024 PNG | Updated from template placeholder to Mqulima logo |
| App Splash Emblem | `../../frontend/assets/images/splash-image.png` | 512 x 512 PNG | Updated from template placeholder to Mqulima logo |
| Phone Screenshots (min 2, recommended 4-8) | `screenshots/` | 9:16 portrait (min 1080px) | **Pending Physical Android Device QA (Phase 5)** — will be captured from the verified Preview APK build |

