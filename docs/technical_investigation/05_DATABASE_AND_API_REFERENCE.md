# 05 — DATABASE & API REFERENCE SPECIFICATION
## Authoritative Schema Definitions, Data Dictionary & REST Contracts

---

### 1. Database Entity-Relationship Definitions

The authoritative persistence store is **PostgreSQL 16** (`mqulima_db_icl9`). Primary identifiers are RFC 4122 standard UUIDs (`gen_random_uuid()`), and soft-deletion is governed by timestamp columns (`deleted_at IS NULL`).

#### 1. Farmer Identity & Accounts

##### Table: `users`
Authoritative Kenyan farmer identity and KYC record.
- `id` (UUID, PK): `gen_random_uuid()`
- `first_name` (VARCHAR 100, NOT NULL)
- `last_name` (VARCHAR 100, NOT NULL)
- `email` (VARCHAR 255, UNIQUE, NOT NULL)
- `phone_number` (VARCHAR 30, UNIQUE, NOT NULL)
- `national_id` (VARCHAR 50, UNIQUE, NULLABLE)
- `county` (VARCHAR 100, NOT NULL)
- `delivery_location` (VARCHAR 255, NOT NULL)
- `farming_type` (VARCHAR 50, NOT NULL): `'Crops'`, `'Livestock'`, `'Mixed'`, `'Poultry'`, `'Fish Farming'`, `'Other'`
- `specify_farming_type` (VARCHAR 100, NULLABLE)
- `farm_size_acres` (NUMERIC 8,2, DEFAULT 1.0)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())
- `deleted_at` (TIMESTAMPTZ, NULLABLE)

##### Table: `profiles`
Platform-wide social and administrative user accounts (synchronized via triggers with `users`).
- `id` (UUID, PK): Matches `users.id`
- `email` (VARCHAR 255, UNIQUE, NOT NULL)
- `password_hash` (VARCHAR 255, NOT NULL): bcrypt hash (10 salt rounds)
- `full_name` (VARCHAR 255, NOT NULL)
- `phone` (VARCHAR 50, NULLABLE)
- `avatar_url` (VARCHAR 500, NULLABLE)
- `role` (VARCHAR 50, DEFAULT `'farmer'`): `'super_admin'`, `'admin'`, `'operations_manager'`, `'finance'`, `'content_editor'`, `'support_agent'`, `'sales_agent'`, `'retailer'`, `'farmer'`
- `county_region` (VARCHAR 100, NULLABLE)
- `reputation_score` (INTEGER, DEFAULT 0)
- `years_farming` (INTEGER, DEFAULT 0)
- `crops` (TEXT[], NULLABLE)
- `livestock` (TEXT[], NULLABLE)
- `status` (VARCHAR 50, DEFAULT `'active'`): `'active'`, `'suspended'`, `'pending'`
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())
- `deleted_at` (TIMESTAMPTZ, NULLABLE)

---

#### 2. Agro-Marketplace Catalog & Inventory

##### Table: `products`
- `id` (UUID, PK): `gen_random_uuid()`
- `external_product_id` (VARCHAR 100, UNIQUE, NULLABLE): Correlates with Smooth Sale POS
- `name` (VARCHAR 255, NOT NULL)
- `slug` (VARCHAR 255, UNIQUE, NOT NULL)
- `category_id` (UUID, FK $\rightarrow$ `product_categories.id`, NULLABLE)
- `subcategory_id` (UUID, FK $\rightarrow$ `shop_subcategories.id`, NULLABLE)
- `field` (VARCHAR 100, NULLABLE): E.g., `'Seeds'`, `'Fertilizers'`, `'Animal Feeds'`
- `subcategory` (VARCHAR 100, NULLABLE)
- `description` (TEXT, NULLABLE)
- `base_price` (NUMERIC 12,2, NOT NULL)
- `stock_qty` (INTEGER, DEFAULT 0, NOT NULL)
- `status` (VARCHAR 50, DEFAULT `'active'`): `'active'`, `'out_of_stock'`, `'draft'`, `'archived'`
- `brand` (VARCHAR 100, NULLABLE)
- `seller` (VARCHAR 100, DEFAULT `'Verified Agrovet Partner'`)
- `county` (VARCHAR 100, DEFAULT `'Kenya'`)
- `unit` (VARCHAR 50, DEFAULT `'Unit'`): E.g., `'50kg Bag'`, `'1L Bottle'`, `'Packet'`
- `image_urls` (TEXT[], NULLABLE)
- `is_featured` (BOOLEAN, DEFAULT FALSE)
- `avg_rating` (NUMERIC 3,2, DEFAULT 5.0)
- `rating_count` (INTEGER, DEFAULT 0)
- `metadata` (JSONB, NULLABLE): Stores variations, POS location stock breakdown
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())
- `deleted_at` (TIMESTAMPTZ, NULLABLE)

##### Table: `product_variants`
- `id` (UUID, PK): `gen_random_uuid()`
- `product_id` (UUID, FK $\rightarrow$ `products.id` ON DELETE CASCADE)
- `external_variation_id` (VARCHAR 100, NULLABLE)
- `sku` (VARCHAR 100, NULLABLE)
- `variant_label` (VARCHAR 100, NOT NULL): E.g., `'25kg'`, `'50kg'`, `'100ml'`, `'500ml'`
- `price` (NUMERIC 12,2, NOT NULL)
- `stock_qty` (INTEGER, DEFAULT 0)
- `location` (VARCHAR 100, NULLABLE): Depot branch (Eldoret, Kitale, Nakuru)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())

---

#### 3. Orders, Checkout & Transactions

##### Table: `orders`
- `id` (UUID, PK): `gen_random_uuid()`
- `user_id` (UUID, FK $\rightarrow$ `profiles.id`, NOT NULL)
- `sales_agent_id` (UUID, FK $\rightarrow$ `profiles.id`, NULLABLE)
- `items` (JSONB, NOT NULL): Array of ordered line items with snapshot pricing
- `subtotal` (NUMERIC 12,2, NOT NULL)
- `total` (NUMERIC 12,2, NOT NULL)
- `delivery_fee` (NUMERIC 12,2, DEFAULT 0.0)
- `status` (VARCHAR 50, DEFAULT `'pending'`): `'pending'`, `'confirmed'`, `'processing'`, `'dispatched'`, `'delivered'`, `'cancelled'`
- `payment_method` (VARCHAR 50, DEFAULT `'mpesa'`): `'mpesa'`, `'paystack'`, `'ncba'`, `'cash_on_delivery'`
- `payment_status` (VARCHAR 50, DEFAULT `'pending'`): `'pending'`, `'paid'`, `'failed'`, `'refunded'`
- `payment_reference` (VARCHAR 100, NULLABLE)
- `delivery_address` (TEXT, NOT NULL)
- `checkout_channel` (VARCHAR 50, DEFAULT `'mobile_app'`): `'mobile_app'`, `'website'`, `'pos'`
- `notes` (TEXT, NULLABLE)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())
- `deleted_at` (TIMESTAMPTZ, NULLABLE)

##### Table: `order_items`
Relational normalization of order line items for reporting and analytics.
- `id` (UUID, PK): `gen_random_uuid()`
- `order_id` (UUID, FK $\rightarrow$ `orders.id` ON DELETE CASCADE)
- `product_id` (UUID, FK $\rightarrow$ `products.id` ON DELETE RESTRICT)
- `variant_id` (UUID, FK $\rightarrow$ `product_variants.id`, NULLABLE)
- `quantity` (INTEGER, NOT NULL)
- `unit_price` (NUMERIC 12,2, NOT NULL)
- `total_price` (NUMERIC 12,2, NOT NULL)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())

##### Table: `payments`
- `id` (UUID, PK): `gen_random_uuid()`
- `order_id` (UUID, FK $\rightarrow$ `orders.id` ON DELETE CASCADE)
- `provider` (VARCHAR 50, NOT NULL): `'mpesa'`, `'paystack'`, `'ncba'`, `'manual'`
- `provider_ref` (VARCHAR 150, NOT NULL): CheckoutRequestID / Paystack reference
- `receipt_number` (VARCHAR 100, NULLABLE): Safaricom M-Pesa receipt (e.g., `'ws_CO_...'`)
- `phone_number` (VARCHAR 50, NULLABLE)
- `amount` (NUMERIC 12,2, NOT NULL)
- `currency` (VARCHAR 10, DEFAULT `'KES'`)
- `status` (VARCHAR 50, DEFAULT `'pending'`): `'pending'`, `'completed'`, `'paid'`, `'failed'`, `'cancelled'`
- `raw_payload` (JSONB, NULLABLE): Complete Safaricom/Paystack webhook callback body
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())

---

#### 4. Community Forum, Extension & Agronomy

##### Table: `show_posts` (Forum Threads)
- `id` (UUID, PK): `gen_random_uuid()`
- `user_id` (UUID, FK $\rightarrow$ `profiles.id`)
- `author_id` (UUID, FK $\rightarrow$ `profiles.id`)
- `title` (VARCHAR 255, NOT NULL)
- `body` (TEXT, NOT NULL)
- `type` (VARCHAR 50, DEFAULT `'discussion'`): `'moment'`, `'question'`, `'discussion'`, `'guide'`
- `category` (VARCHAR 100, DEFAULT `'Crops'`)
- `location` (VARCHAR 100, NULLABLE)
- `images` (TEXT[], NULLABLE)
- `likes_count` (INTEGER, DEFAULT 0)
- `comments_count` (INTEGER, DEFAULT 0)
- `is_resolved` (BOOLEAN, DEFAULT FALSE)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())
- `deleted_at` (TIMESTAMPTZ, NULLABLE): Soft delete (moderated/hidden)

##### Table: `show_comments`
- `id` (UUID, PK): `gen_random_uuid()`
- `post_id` (UUID, FK $\rightarrow$ `show_posts.id` ON DELETE CASCADE)
- `user_id` (UUID, FK $\rightarrow$ `profiles.id`)
- `parent_id` (UUID, FK $\rightarrow$ `show_comments.id`, NULLABLE): Supports nested replies
- `body` (TEXT, NOT NULL)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `deleted_at` (TIMESTAMPTZ, NULLABLE)

##### Table: `service_requests`
- `id` (UUID, PK): `gen_random_uuid()`
- `user_id` (UUID, FK $\rightarrow$ `profiles.id`, NULLABLE)
- `service_id` (UUID, FK $\rightarrow$ `services.id`, NULLABLE)
- `contact_name` (VARCHAR 255, NOT NULL)
- `contact_phone` (VARCHAR 50, NOT NULL)
- `location` (VARCHAR 255, NOT NULL)
- `scheduled_date` (DATE, NULLABLE)
- `status` (VARCHAR 50, DEFAULT `'pending'`): `'pending'`, `'assigned'`, `'in_progress'`, `'completed'`, `'cancelled'`
- `assigned_specialist_id` (UUID, FK $\rightarrow$ `profiles.id`, NULLABLE)
- `notes` (TEXT, NULLABLE)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())

---

### 2. Complete REST API Endpoint Reference (`/api/v1/*`)

All native mobile communication routes through the TanStack Start wildcard route `src/routes/api/v1/$.ts` delegating to `src/lib/api-v1/router.ts`.

#### Authentication Endpoints
- **`POST /api/v1/auth/register`**
  - *Payload*: `{ firstName, lastName, email, phoneNumber, nationalId?, county, deliveryLocation, farmingType, password }`
  - *Response (201)*: `{ success: true, access_token: string, token: string, user: UserObject }`
  - *Error (400/409)*: `{ success: false, error: string, details?: object }`
- **`POST /api/v1/auth/login`**
  - *Payload*: `{ identifier: string, password: string }`
  - *Response (200)*: `{ success: true, access_token: string, token: string, user: UserObject }`
  - *Error (401)*: `{ success: false, error: "Incorrect email/phone or password" }`
- **`GET /api/v1/auth/me`**
  - *Headers*: `Authorization: Bearer <token>`
  - *Response (200)*: `{ success: true, user: UserObject }`
  - *Error (401)*: `{ success: false, error: "Unauthorized. Please sign in to continue." }`
- **`PUT /api/v1/user/profile`**
  - *Headers*: `Authorization: Bearer <token>`
  - *Payload*: `{ name?, phone?, county?, deliveryLocation? }`
  - *Response (200)*: `{ success: true, user: UserObject }`

#### AgroShop Catalog Endpoints
- **`GET /api/v1/products`**
  - *Query Params*: `category=All&subcategory=All&q=&page=1&limit=24`
  - *Response (200)*: `{ success: true, items: Product[], total: number, page: number, pages: number }`
- **`GET /api/v1/products/featured`**
  - *Response (200)*: `{ success: true, items: Product[] }`
- **`GET /api/v1/products/:id`**
  - *Response (200)*: `{ success: true, product: ProductDetail }`
- **`GET /api/v1/categories`**
  - *Response (200)*: `{ success: true, categories: CategoryItem[] }`

#### Orders & Payments Endpoints
- **`POST /api/v1/orders`**
  - *Headers*: `Authorization: Bearer <token>`
  - *Payload*: `{ items: [{ productId, variant?, qty }], name, phone, county, subcounty, location, paymentMethod }`
  - *Response (200)*: `{ success: true, order: OrderObject }`
- **`GET /api/v1/orders`**
  - *Headers*: `Authorization: Bearer <token>`
  - *Response (200)*: `OrderObject[]`
- **`POST /api/v1/payments/mpesa/stk-push`**
  - *Headers*: `Authorization: Bearer <token>`
  - *Payload*: `{ orderId: string, phone: string }`
  - *Response (200)*: `{ success: true, checkoutRequestId: string, message: string }`
- **`GET /api/v1/payments/status/:orderId`**
  - *Response (200)*: `{ orderId: string, paid: boolean, status: string, receiptNumber: string | null, provider: string }`
- **`POST /api/v1/payments/paystack/initialize`**
  - *Headers*: `Authorization: Bearer <token>`
  - *Payload*: `{ orderId: string, email: string }`
  - *Response (200)*: `{ success: true, authorizationUrl: string, accessCode: string, reference: string }`

#### Agronomy, Community & AI Endpoints
- **`GET /api/v1/forum/feed`**
  - *Query Params*: `q=&tag=All&sort=latest&scope=all&page=1`
  - *Response (200)*: `{ items: ApiThread[], total: number, next_page: number | null }`
- **`POST /api/v1/forum/posts`**
  - *Headers*: `Authorization: Bearer <token>`
  - *Payload*: `{ title, text, tag, county, image? }`
  - *Response (201)*: `ApiThread`
- **`POST /api/v1/ai/chat`**
  - *Payload*: `{ session_id: string, message: string }`
  - *Response (200)*: `Content-Type: text/event-stream` (SSE delta tokens)
- **`POST /api/v1/ai/crop-doctor`**
  - *Headers*: `Authorization: Bearer <token>`
  - *Payload*: `{ crop: string, symptoms: object, imageBase64?: string, county?: string }`
  - *Response (200)*: `{ success: true, diagnosis: PathogenDiagnosticJSON }`
- **`GET /api/v1/tools/weather?county=Uasin+Gishu`**
  - *Response (200)*: `WeatherViewModel` (Temperature, humidity, precipitation, spray window rating)

