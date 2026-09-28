# 🔧 MIRCHI 360 — TECHNICAL REQUIREMENT DOCUMENT (TRD)
> **Version:** 1.0 | **Date:** 2026-09-28 | **Status:** Active Production

---

## 1. TECH STACK

| Layer | Technology | Version / Notes |
|-------|-----------|----------------|
| **Frontend Framework** | React | v18 (Hooks-based, no class components) |
| **Build Tool** | Vite | v5.4.21 |
| **Styling** | Tailwind CSS | v3 with custom utilities in `src/index.css` |
| **State Management** | React Context API | `AppContext` in `src/lib/store.jsx` |
| **Database** | Supabase (PostgreSQL) | Project: `hrrqunldyquxsnsufxpa` |
| **Realtime** | Supabase Realtime WebSocket | `postgres_changes` on all core tables |
| **Auth** | Custom PIN + Supabase `staff_accounts` | No Supabase Auth (custom session) |
| **i18n** | `react-i18next` | English + Urdu (RTL) |
| **Icons** | `lucide-react` | Tree-shaken per import |
| **Deployment** | Vercel | Auto-deploy on `git push origin main` |
| **Routing** | React Router DOM | Hash/path based SPA routing |

---

## 2. PROJECT STRUCTURE

```
mirchi-360/
├── context/              ← AI Context Engineering (RULES, MEMORY, PRD, TRD)
├── public/
├── src/
│   ├── App.jsx           ← Root router — routes to Customer/Kitchen/Manager/Admin
│   ├── main.jsx          ← Vite entry point
│   ├── index.css         ← Global CSS + Tailwind + GPU acceleration utilities
│   ├── i18n.js           ← i18next setup (en/ur translations)
│   ├── components/
│   │   ├── customer/
│   │   │   ├── CustomerApp.jsx          ← Main customer portal (menu + cart + tracking)
│   │   │   └── CustomerIdentityModal.jsx← Name/phone collection modal
│   │   ├── kitchen/
│   │   │   └── KitchenApp.jsx           ← KDS — order queue + status toggles
│   │   ├── manager/
│   │   │   └── ManagerApp.jsx           ← Active orders, billing, shift close
│   │   ├── admin/
│   │   │   └── AdminApp.jsx             ← Analytics, menu management
│   │   ├── auth/
│   │   │   └── StaffPortal.jsx          ← Login screen for kitchen/manager/admin
│   │   ├── layout/
│   │   └── shared/
│   │       └── ErrorBoundary.jsx        ← React error boundary wrapper
│   ├── hooks/
│   │   └── useMenuItems.js              ← Menu fetcher with Supabase + localStorage fallback
│   └── lib/
│       ├── store.jsx                    ← AppProvider, AppContext, all business logic
│       ├── supabase.js                  ← Supabase client, UUID maps, branch slugs
│       ├── staffCredentials.js          ← Local fallback staff credentials
│       ├── initialData.js               ← SEED_DATA (branches, seed menu items)
│       ├── security.js                  ← Input sanitization, PIN validation
│       └── soundAlerts.js              ← Audio chimes for new orders
├── .env                  ← VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
└── vite.config.js
```

---

## 3. DATABASE SCHEMA

### ⚠️ CRITICAL: Read before writing ANY Supabase query

---

### Table: `orders`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key, auto-generated |
| `order_number` | `integer` | Auto-assigned by DB trigger |
| `restaurant_id` | `uuid` | Always `6b8015e9-95d0-4fd9-ac57-2d8d8cc8c111` |
| `branch_id` | `uuid` | See `BRANCH_UUID_MAP` |
| `table_id` | `uuid` | See `TABLE_UUID_MAP` |
| `table_number` | `integer` | 1–10 |
| `status` | `text` | `pending`, `preparing`, `ready`, `served`, `completed`, `cancelled` |
| `estimated_minutes` | `integer` | Set by kitchen, nullable |
| `total_amount` | `numeric` | PKR value |
| `notes` | `text` | Combined: `"Customer: Name (Phone) | Special notes"` |
| `created_at` | `timestamptz` | Auto-set |
| `updated_at` | `timestamptz` | Updated on status change |

> ❌ **`is_archived` DOES NOT EXIST** — Never use `.eq('is_archived', false)`
> ❌ **`customer_name`, `customer_phone` COLUMNS DO NOT EXIST** — Stored in `notes` field
> ❌ **Anon key CANNOT DELETE rows** — RLS policy blocks DELETE

**Current query (correct):**
```js
supabase.from('orders')
  .select('id, order_number, restaurant_id, branch_id, table_id, table_number, status, estimated_minutes, total_amount, notes, created_at, order_items(...)')
  .neq('status', 'cancelled')
  .order('created_at', { ascending: false })
```

---

### Table: `order_items`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `order_id` | `uuid` | FK → `orders.id` |
| `item_name` | `text` | Menu item name |
| `variant_name` | `text` | nullable |
| `unit_price` | `numeric` | PKR |
| `quantity` | `integer` | |
| `subtotal` | `numeric` | `unit_price * quantity` |
| `special_notes` | `text` | Per-item customer note |

---

### Table: `staff_accounts`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | |
| `username` | `text` | Unique |
| `name` | `text` | Display name |
| `role` | `text` | `kitchen`, `manager`, `admin` |
| `pin_code` | `text` | 4-digit PIN |
| `branch_id` | `uuid` | Assigned branch |
| `privacy_pin` | `text` | Secondary PIN for settlements |
| `is_active` | `boolean` | |

---

### Table: `complaints`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | |
| `restaurant_id` | `uuid` | |
| `branch_id` | `uuid` | |
| `table_number` | `integer` | |
| `message` | `text` | |
| `status` | `text` | `open`, `resolved` |
| `created_at` | `timestamptz` | |

**Query filter:** `.eq('status', 'open')`

---

### Table: `waiter_calls`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | |
| `restaurant_id` | `uuid` | |
| `branch_id` | `uuid` | |
| `table_number` | `integer` | |
| `request_type` | `text` | e.g. `"Customer requested assistance"` |
| `status` | `text` | `pending`, `resolved` |
| `created_at` | `timestamptz` | |

**Query filter:** `.eq('status', 'pending')`

---

### Table: `help_calls`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | |
| `restaurant_id` | `uuid` | |
| `branch_id` | `uuid` | |
| `station_name` | `text` | Kitchen station identifier |
| `message` | `text` | |
| `status` | `text` | `active`, `resolved` |
| `created_at` | `timestamptz` | |

**Query filter:** `.eq('status', 'active')`

---

### Table: `branch_reports`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | |
| `branch_id` | `uuid` | |
| `manager_name` | `text` | |
| `shift_name` | `text` | e.g. `"Evening Shift"` |
| `report_type` | `text` | |
| `total_shift_sales` | `numeric` | |
| `total_orders_count` | `integer` | |
| `cancelled_orders_count` | `integer` | |
| `content` | `jsonb` | Full shift report data |
| `created_at` | `timestamptz` | |

---

### Table: `shift_closings`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | |
| `restaurant_id` | `uuid` | |
| `branch_id` | `uuid` | |
| `opened_at` | `timestamptz` | |
| `closed_at` | `timestamptz` | |
| `manager_name` | `text` | |
| `total_orders_count` | `integer` | |
| `total_gross_revenue` | `numeric` | |
| `cash_revenue` | `numeric` | |
| `card_revenue` | `numeric` | |
| `other_revenue` | `numeric` | |
| `total_discounts` | `numeric` | |
| `cancelled_orders_count` | `integer` | |
| `closed_order_ids` | `uuid[]` | Array of order IDs closed in this shift |
| `date` | `date` | |

---

### Table: `order_audit_logs`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | |
| `order_id` | `uuid` | |
| `branch_id` | `uuid` | |
| `performed_by` | `text` | Staff username |
| `role` | `text` | Staff role |
| `action_type` | `text` | e.g. `status_change`, `payment_received` |
| `details` | `jsonb` | |
| `created_at` | `timestamptz` | |

---

## 4. RLS (ROW LEVEL SECURITY) POLICIES

| Operation | Anon Key | Notes |
|-----------|---------|-------|
| `SELECT` | ✅ Allowed | All tables readable |
| `INSERT` | ✅ Allowed | orders, order_items, complaints, waiter_calls, help_calls |
| `UPDATE` | ✅ Allowed | orders (status, estimated_minutes), complaints (status) |
| `DELETE` | ❌ BLOCKED | Must use Dashboard SQL Editor with service role |

**To physically delete rows:** Supabase Dashboard → SQL Editor → `DELETE FROM orders;`

---

## 5. BRANCH & TABLE UUID MAPPING

```js
// Branch slugs ↔ UUIDs
BRANCH_UUID_MAP = {
  'branch-def': 'e85c1b88-47a0-47b1-bc82-be2ea60d2ae3',  // Defence
  'branch-qas': '6d9e61c4-4cb5-46a1-af76-75554993ae4a'   // Qasimabad
}

// Table UUIDs — Defence branch (10 tables)
TABLE_UUID_MAP['e85c1b88-...'][1..10]

// Table UUIDs — Qasimabad branch (10 tables)
TABLE_UUID_MAP['6d9e61c4-...'][1..10]

// RESTAURANT_ID
'6b8015e9-95d0-4fd9-ac57-2d8d8cc8c111'
```

---

## 6. LOCALSTORAGE KEYS (COMPLETE LIST)

| Key | Value Type | Purpose |
|-----|-----------|---------|
| `mirchi_orders` | `JSON Array` | Cached orders from Supabase (wiped on startup) |
| `mirchi_order_counter` | `String (number)` | Local order number counter (reset to `'0'` on startup) |
| `mirchi_menu_items` | `JSON Array` | Cached menu items |
| `mirchi_complaints` | `JSON Array` | Cached complaints |
| `mirchi_waiter_calls` | `JSON Array` | Cached waiter calls |
| `mirchi_help_calls` | `JSON Array` | Cached help calls |
| `mirchi_branch_reports` | `JSON Array` | Cached branch reports |
| `mirchi_audit_logs` | `JSON Array` | Cached audit logs |
| `mirchi_shift_closings` | `JSON Array` | Cached shift closings |
| `mirchi_active_sessions` | `JSON Array` | Active staff login sessions |
| `mirchi_pending_sync_queue` | `JSON Array` | Offline order retry queue |
| `mirchi_auth_session` | `JSON Object` | Current staff session (persists across refresh) |
| `mirchi_auth_token` | `String` | Base64 encoded session token |
| `mirchi360_auth_token` | `String` | Supabase auth storage key |
| `mirchi_customer_identity` | `JSON Object` | `{ name, phone, skipped }` — saved per customer |

> ⚠️ `mirchi_orders` and `mirchi_order_counter` are **wiped on every startup** when Supabase is configured. DB is authoritative.

---

## 7. STATE MANAGEMENT ARCHITECTURE

```
AppProvider (src/lib/store.jsx)
  └── AppContext (shared across ALL portals)
       ├── selectedBranch        → Branch object { id, name }
       ├── selectedTableNumber   → Integer (from URL ?table=N)
       ├── currentSession        → Staff session or null
       ├── orders                → Array<Order> (from Supabase)
       ├── complaints            → Array<Complaint>
       ├── waiterCalls           → Array<WaiterCall>
       ├── helpCalls             → Array<HelpCall>
       ├── branchReports         → Array<Report>
       ├── auditLogs             → Array<AuditLog>
       ├── shiftClosings         → Array<ShiftClosing>
       ├── menuItems             → Array<MenuItem>
       ├── orderCounter          → Integer (local only, synced from DB)
       ├── activeSessions        → Array<Session>
       └── Functions:
            ├── createOrder()         → INSERT order + order_items
            ├── updateOrderStatus()   → UPDATE orders.status
            ├── markOrderServed()     → UPDATE orders.status = 'served'
            ├── markOrderPaid()       → UPDATE orders.status = 'completed'
            ├── submitComplaint()     → INSERT complaints
            ├── callWaiter()          → INSERT waiter_calls
            ├── loginStaff()          → Auth against DB + localStorage
            ├── logoutStaff()         → Clear session
            ├── closeShift()          → INSERT shift_closings + branch_reports
            ├── saveMenuItem()        → UPSERT menu_items
            ├── loadSupabaseData()    → Full data refresh from Supabase
            └── processOfflineQueue() → Retry queued orders
```

---

## 8. REALTIME SUBSCRIPTION

```js
// One channel per app session
supabase.channel(`mirchi-portal-sync-${Date.now()}`, {
  config: { broadcast: { self: false }, presence: { key: '' } }
})
.on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadSupabaseData)
.on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, loadSupabaseData)
.on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, loadSupabaseData)
.on('postgres_changes', { event: '*', schema: 'public', table: 'waiter_calls' }, loadSupabaseData)
.on('postgres_changes', { event: '*', schema: 'public', table: 'help_calls' }, loadSupabaseData)
.on('postgres_changes', { event: '*', schema: 'public', table: 'branch_reports' }, loadSupabaseData)
.subscribe()

// Auto-reconnect on TIMED_OUT / CHANNEL_ERROR / CLOSED
// Polling fallback: loadSupabaseData() every 6 seconds
// Reconnect triggers: window 'online', window 'focus', document 'visibilitychange'
```

**Supabase client config:**
```js
realtime: { params: { eventsPerSecond: 10 } }
```

---

## 9. PERFORMANCE ARCHITECTURE

### CSS GPU Acceleration (`src/index.css`)

| Class | `will-change` | Purpose |
|-------|-------------|---------|
| `.gpu-accelerate` | `transform, opacity` | General animated elements |
| `.menu-card` | `transform` | Menu item cards + CSS containment |
| `.order-card` | `transform` | Order tracking cards |
| `.modal-layer` | `transform, opacity` | Modals/drawers |
| `.cart-float` | `transform, opacity` | Floating cart button |
| `.status-badge` | `opacity` | Status badge animations |
| `.timer-element` | `contents` | Countdown timers (strict containment) |
| Root `#root` | — | `translateZ(0)` + font smoothing |

### React Optimization (`CustomerApp.jsx`)

| Optimization | Applied To |
|-------------|-----------|
| `React.memo` | `MenuItemCard`, `OrderStatusBadge` |
| `useMemo` | `categories`, `filteredItems`, `allTableOrders`, `activeTableOrders`, `cartTotal` |
| `useCallback` | All event handlers |
| `loading="lazy"` | All menu item `<img>` tags |
| CSS `contain: layout style paint` | `.menu-card` — prevents layout recalc |

### Data Loading Strategy

1. **On startup:** `clearStaleOrdersCache()` wipes `mirchi_orders` localStorage
2. **Immediate:** `loadSupabaseData()` fetches fresh data from DB
3. **Realtime:** Supabase WebSocket fires on any change → `loadSupabaseData()`
4. **Polling backup:** Every 6 seconds → `loadSupabaseData()`
5. **Reconnect triggers:** Online, focus, visibility change

---

## 10. AUTH & SESSION MECHANICS

### Staff Authentication Flow

```
loginStaff({ role, username, pin }) 
  → 1. Try Supabase staff_accounts table (primary)
  → 2. Try /api/auth/login endpoint (unused in current deploy)
  → 3. Fallback to src/lib/staffCredentials.js (hardcoded)
  → applySession(user) → localStorage.setItem('mirchi_auth_session', ...)
```

### Session Persistence

- Sessions stored in `localStorage['mirchi_auth_session']`
- On page reload: synchronously rehydrated from localStorage → no re-login needed
- `authReady` flag starts as `true` (no loading delay)

### Session Isolation (Customer)

- Table URL: `/?table=4&branch=branch-def`
- Table number read from `?table=N` URL param
- Orders filtered client-side by `tableNumber` + `branchId`
- `mirchi_orders` localStorage wiped on every page load → fresh DB fetch
- `mirchi_customer_identity` persists for convenience (name/phone prefill)

### Shift Types (PKT Timezone)

| Shift | Hours | Code |
|-------|-------|------|
| Morning | 06:00–14:00 | `MOR` |
| Evening | 14:00–22:00 | `EVE` |
| Night | 22:00–06:00 | `NIG` |

---

## 11. BUILD & DEPLOY

```bash
# Local development
npm run dev

# Production build (MUST pass before push)
npm run build

# Deploy (auto-triggered by push)
git push origin main
```

**Build output (current):**
- `CustomerApp` chunk: ~40KB gzipped ~11KB
- `AdminApp` chunk: ~61KB gzipped ~12KB
- `index` (main): ~573KB gzipped ~167KB

**Vercel Settings:**
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## 12. ENVIRONMENT VARIABLES

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_SUPABASE_URL` | `https://hrrqunldyquxsnsufxpa.supabase.co` | Set in `.env` and Vercel dashboard |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_tWlff35xenmaucL_HGulqg_qyf9yTaB` | Public key — safe to expose |

---

## 13. OFFLINE ORDER QUEUE

```js
// Queue structure (localStorage['mirchi_pending_sync_queue'])
[{
  ...orderObject,
  retries: 0,
  queuedAt: timestamp,
  nextRetryAt: timestamp
}]

// Retry logic
delay = Math.min(60000, Math.pow(2, retries) * 1500)  // Exponential backoff, max 60s
// Timeout per attempt: 8 seconds
// Processed: every 6 seconds + on network 'online' event
```
