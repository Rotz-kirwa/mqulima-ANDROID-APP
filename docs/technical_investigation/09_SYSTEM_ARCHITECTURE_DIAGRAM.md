# 09 — SYSTEM ARCHITECTURE DIAGRAMS
## Visual Architecture, Workflows & Cross-Platform Topologies

---

### 1. Overall System Topology

```mermaid
graph TD
    subgraph MobileClient["Android / Mobile Client Tier"]
        AndroidUI["React Native Expo UI<br/>(Expo Router 57 / React 19)"]
        Store["Client State & Caching<br/>(AppStore / AsyncStorage / SecureStore)"]
        ApiModule["API Client (src/services/api.ts)<br/>HTTP Bearer Token Client"]
        AndroidUI <--> Store
        AndroidUI --> ApiModule
    end

    subgraph WebClient["Web & Admin Client Tier"]
        WebSSR["Public Web Portal (TanStack Start)<br/>SSR Hydration / React 19"]
        AdminSPA["Admin Console SPA (Port 8081)<br/>React 19 / Vite / Tailwind v4"]
    end

    subgraph ServerGateway["API & Server Gateway (Port 8080)"]
        Nitro["Nitro / Vite HTTP Server (src/server.ts)<br/>CORS & Error Normalizer"]
        V1Gateway["Unified REST Gateway: /api/v1/*<br/>(src/routes/api/v1/$.ts)"]
        AdminGateway["Admin REST Routes: /api/admin/*<br/>(src/routes/api/admin/*.ts)"]
        AuthGuard["Auth & RBAC Middleware<br/>(auth-helper.ts / rbac.server.ts)"]
        
        Nitro --> V1Gateway
        Nitro --> AdminGateway
        V1Gateway --> AuthGuard
        AdminGateway --> AuthGuard
    end

    subgraph Persistence["Authoritative Persistence Tier"]
        Postgres[("PostgreSQL 16 Database<br/>mqulima_db_icl9 (Render)")]
        Triggers["Bi-directional SQL Triggers<br/>users <--> profiles"]
        S3Storage["Cloudflare R2 / AWS S3<br/>mqulima-media Bucket"]
        
        Postgres <--> Triggers
    end

    subgraph ExternalServices["Third-Party Integration Mesh"]
        Mpesa["Safaricom Daraja M-Pesa<br/>Lipa Na M-Pesa STK Push"]
        Paystack["Paystack Gateway<br/>Live Cards & Webhooks"]
        TextSMS["TextSMS Kenya Bulk API<br/>Sender ID: KIRGIT_AGRI"]
        Gemini["Google Gemini 2.5 Flash<br/>Multimodal Vision & Streaming AI"]
        OpenMeteo["Open-Meteo Weather API<br/>47 Kenyan Counties"]
        SmoothSale["Smooth Sale POS API<br/>Depot Inventory Sync"]
    end

    ApiModule -->|REST API / Bearer JWT| Nitro
    WebSSR -->|SSR Data Functions| Nitro
    AdminSPA -->|REST API / Admin Token| Nitro

    AuthGuard --> Postgres
    AuthGuard --> S3Storage

    V1Gateway --> Mpesa
    V1Gateway --> Paystack
    V1Gateway --> TextSMS
    V1Gateway --> Gemini
    V1Gateway --> OpenMeteo
    AdminGateway --> SmoothSale
```

---

### 2. Dual-Client Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    participant Mobile as Android App (api.ts)
    participant Web as Web Client (auth.sign-in.tsx)
    participant Gateway as Server Gateway (server.ts)
    participant Auth as Auth Handler (auth.ts)
    participant DB as PostgreSQL (profiles / users)

    alt Mobile Client Authentication
        Mobile->>Gateway: POST /api/v1/auth/login { identifier, password }
        Gateway->>Auth: handleAuthLogin(request)
        Auth->>DB: Query profiles by email or normalized phone
        DB-->>Auth: Profile Record with bcrypt hash
        Auth->>Auth: bcrypt.compare(password, hash)
        Auth->>Auth: signUserToken(userId, email, role) via jose
        Auth-->>Mobile: HTTP 200 { access_token: JWT, user: UserData }
        Mobile->>Mobile: SecureStore.setItem("auth_token", JWT)
    else Web Client Authentication
        Web->>Gateway: POST /api/auth/login { identifier, password }
        Gateway->>Auth: handleWebLogin(request)
        Auth->>DB: Query profiles
        DB-->>Auth: Profile Record
        Auth->>Auth: Verify bcrypt hash & generate JWT
        Auth-->>Web: Set-Cookie: mq_session=JWT; HttpOnly; SameSite=Lax
    end
```

---

### 3. Order Placement & M-Pesa STK Push Payment Lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant Farmer as Farmer Handset
    participant App as Android App (app/checkout.tsx)
    participant Server as Mqulima Gateway (/api/v1)
    participant DB as PostgreSQL 16
    participant Daraja as Safaricom Daraja API
    participant SMS as TextSMS Kenya

    Farmer->>App: Submits Delivery Details & Selects "M-Pesa"
    App->>Server: POST /api/v1/orders (Bearer JWT)
    Server->>DB: Atomic Tx: Lock products FOR UPDATE, verify stock, insert orders & order_items
    DB-->>Server: Created Order (ID: ORD-XXXX)
    Server-->>App: HTTP 200 { success: true, order: ORD-XXXX }

    App->>Server: POST /api/v1/payments/mpesa/stk-push { orderId, phone }
    Server->>Daraja: Dispatches stkpush/v1/processrequest
    Daraja-->>Server: HTTP 200 { ResponseCode: "0", CheckoutRequestID: "ws_CO_..." }
    Server->>DB: INSERT INTO payments (status: 'pending', provider_ref: 'ws_CO_...')
    Server-->>App: HTTP 200 { checkoutRequestId: "ws_CO_...", message: "Prompt sent" }

    Daraja->>Farmer: Instant SIM Toolkit PIN Prompt on Handset
    Farmer->>Daraja: Enters Secret M-Pesa PIN
    
    Daraja->>Server: Asynchronous Webhook POST /api/mpesa/callback
    Server->>Server: Verify Webhook Signature & parse ResultCode
    alt Payment Succeeded (ResultCode == 0)
        Server->>DB: UPDATE payments SET status = 'paid', receipt_number = '...'
        Server->>DB: UPDATE orders SET payment_status = 'paid', status = 'confirmed'
        Server->>SMS: Dispatch Order Confirmation SMS to Farmer
    else Payment Cancelled or Failed
        Server->>DB: UPDATE payments SET status = 'failed'
    end

    loop Every 3 seconds (max 30 attempts)
        App->>Server: GET /api/v1/payments/status/ORD-XXXX
        Server->>DB: Check payments and orders table
        DB-->>Server: Payment status
        Server-->>App: { paid: true, receiptNumber: "QW12..." }
    end
    App->>Farmer: Renders "Payment Confirmed & Order Placed!"
```

---

### 4. Database Entity-Relationship Architecture

```mermaid
erDiagram
    users ||--|| profiles : "syncs via bi-directional triggers"
    profiles ||--o{ orders : "places"
    orders ||--|{ order_items : "contains"
    products ||--o{ order_items : "referenced in"
    products ||--o{ product_variants : "has packaging SKUs"
    orders ||--o{ payments : "paid via"
    profiles ||--o{ show_posts : "authors"
    show_posts ||--o{ show_comments : "receives"
    show_posts ||--o{ show_likes : "liked by"
    profiles ||--o{ service_requests : "requests"
    services ||--o{ service_requests : "categorizes"
    courses ||--|{ course_chapters : "divided into"
    course_chapters ||--|{ chapter_lessons : "contains"

    users {
        uuid id PK
        string first_name
        string last_name
        string email UK
        string phone_number UK
        string county
        string farming_type
    }

    profiles {
        uuid id PK
        string email UK
        string password_hash
        string full_name
        string role
        string status
    }

    products {
        uuid id PK
        string name
        string slug UK
        numeric base_price
        integer stock_qty
        string status
        boolean is_featured
    }

    orders {
        uuid id PK
        uuid user_id FK
        numeric subtotal
        numeric total
        string status
        string payment_status
        string payment_method
        text delivery_address
    }

    payments {
        uuid id PK
        uuid order_id FK
        string provider
        string provider_ref
        string receipt_number
        numeric amount
        string status
    }
```

---

### 5. Multimodal AI Crop Doctor Vision Diagnostic Flow

```mermaid
sequenceDiagram
    autonumber
    participant Farmer as Farmer Handset
    participant Camera as Native Camera / Image Picker
    participant App as Android Client (app/ai.tsx)
    participant Server as Mqulima Gateway (/api/v1/ai/crop-doctor)
    participant Gemini as Google Gemini 2.5 Flash Vision API

    Farmer->>Camera: Takes Photo of Diseased Maize Leaf
    Camera-->>App: Local Image URI
    App->>App: Convert Image to Base64 String
    Farmer->>App: Submits Crop Type ("Maize") and Symptoms
    App->>Server: POST /api/v1/ai/crop-doctor { crop: "Maize", imageBase64, county: "Trans Nzoia" }
    Server->>Gemini: Prompts Gemini 2.5 Flash Vision with Kenyan Agronomy Context
    Gemini-->>Server: Structured Diagnostic JSON
    Note over Server,Gemini: Identified: Northern Corn Leaf Blight<br/>Confidence: 94%<br/>Organic: Trichoderma spray, crop rotation<br/>Chemical: Azoxystrobin + Difenoconazole<br/>Prevention: Certified resistant seed
    Server-->>App: HTTP 200 { success: true, diagnosis: {...} }
    App->>Farmer: Renders Diagnosis, Remedy Checklist & Verified Inputs
```

