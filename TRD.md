# 🔧 MIRCHI 360 — TECHNICAL REQUIREMENTS DOCUMENT (TRD)
> **Version:** 2.0 | **Date:** 2026-09-30 | **Status:** Active Production Source of Truth

---

## 1. TECH STACK SPECIFICATION

| Component | Library / Framework | Version | Purpose |
|---|---|---|---|
| **Core UI Framework** | React | 18.3.1 | Component architecture & Hooks |
| **Build & Bundler** | Vite | 5.4.9 | ES Modules, fast HMR, Rollup production bundle |
| **Styling & CSS** | Tailwind CSS + Vanilla CSS | 3.4.14 | GPU-accelerated styling with custom tokens |
| **Routing** | React Router DOM | 7.18.3 | SPA path routing with lazy-loaded portal chunks |
| **State Management** | React Context API | Native | Centralized `AppContext` in `src/lib/store.jsx` |
| **Database & Realtime** | Supabase JS Client | 2.45.4 | PostgreSQL DB queries, WebSocket Realtime channels |
| **Async Data Querying** | @tanstack/react-query | 5.104.0 | Cached menu querying and background revalidation |
| **Internationalization**| i18next & react-i18next | 26.4.2 / 17.0.15 | Bilingual (English LTR / Urdu RTL) UI support |
| **Iconography** | Lucide React | 0.453.0 | Lightweight vector icons |
| **Hosting & CI/CD** | Vercel | Production | Automated deployments on push to `main` |

---

## 2. PROJECT REPOSITORY STRUCTURE

```
mirchi-360/
├── context/                             ← Historical Context Archive
├── public/
│   ├── locales/{en,ur}/translation.json ← Localization dictionaries
│   └── favicon & static assets
├── src/
│   ├── App.jsx                          ← Root router, Suspense, ErrorBoundary
│   ├── main.jsx                         ← React DOM root mount & TanStack query client
│   ├── index.css                        ← Tailwind utilities, GPU layers, keyframes
│   ├── i18n.js                          ← Internationalization initialization
│   ├── components/
│   │   ├── auth/
│   │   │   ├── ProtectedRoute.jsx       ← Role-based guard with auth-ready check
│   │   │   └── StaffPortal.jsx          ← PIN/Credential login screen
│   │   ├── customer/
│   │   │   ├── CustomerApp.jsx          ← Customer menu, cart drawer, live order tracking
│   │   │   └── CustomerIdentityModal.jsx← Name & optional phone capture with guest quick order
│   │   ├── kitchen/
│   │   │   └── KitchenApp.jsx           ← KDS order queue, prep timer modal, audio chime
│   │   ├── manager/
│   │   │   └── ManagerApp.jsx           ← Active orders, bill payment, shift close, Z-reports
│   │   ├── admin/
│   │   │   └── AdminApp.jsx             ← Multi-branch revenue analytics, menu catalog CRUD
│   │   ├── layout/
│   │   │   └── StaffShell.jsx           ← Unified header & layout for staff portals
│   │   └── shared/
│   │       ├── ErrorBoundary.jsx        ← React lifecycle exception catcher
│   │       └── ShiftDisplay.jsx         ← Real-time shift indicator (Morning/Evening/Night)
│   ├── hooks/
│   │   └── useMenuItems.js              ← Resilient menu fetcher with Supabase + seed fallback
│   └── lib/
│       ├── store.jsx                    ← AppContext, global state, order lifecycle logic
│       ├── supabase.js                  ← Supabase client, tenant constants, UUID mappings
│       ├── staffCredentials.js          ← Offline/fallback staff accounts and PIN hashes
│       ├── initialData.js               ← SEED_DATA: branches, categories, initial menu catalog
│       ├── security.js                  ← XSS sanitizers, PIN validator, param sanitizers
│       └── soundAlerts.js               ← Web Audio synthesized chime for new orders
├── PRD.md                               ← Root Product Requirements Document
├── TRD.md                               ← Root Technical Requirements Document
├── vercel.json                          ← Production SPA rewrites & asset caching headers
└── vite.config.js                       ← Vite build plugins and configuration
```

---

## 3. SUPABASE DATABASE SCHEMA & ENTITY MODELS

### 3.1 Constants & Tenant Identifiers
- **Master Restaurant ID:** `'6b8015e9-95d0-4fd9-ac57-2d8d8cc8c111'`
- **Branch Slugs & UUID Mappings:**
  - `branch-def` (Defence): `'e85c1b88-47a0-47b1-bc82-be2ea60d2ae3'`
  - `branch-qas` (Qasimabad): `'6d9e61c4-4cb5-46a1-af76-75554993ae4a'`

### 3.2 Core Table Specifications

#### 1. `orders`
```sql
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE,
    table_number INT NOT NULL,
    order_number SERIAL,
    status TEXT DEFAULT 'pending', -- 'pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'
    payment TEXT DEFAULT 'Unpaid', -- 'Unpaid', 'Paid'
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    notes TEXT, -- Stores combined notes: "Customer: Name (Phone) | Notes"
    estimated_minutes INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. `order_items`
```sql
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    variant_name TEXT,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal NUMERIC(10, 2) NOT NULL,
    special_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. `complaints`
```sql
CREATE TABLE public.complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    table_number INT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open', -- 'open', 'resolved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. `waiter_calls`
```sql
CREATE TABLE public.waiter_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    table_number INT NOT NULL,
    request_type TEXT DEFAULT 'Customer requested assistance',
    status TEXT DEFAULT 'pending', -- 'pending', 'attended'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. `help_calls`
```sql
CREATE TABLE public.help_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    station_name TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 6. `branch_reports`
```sql
CREATE TABLE public.branch_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    manager_name TEXT NOT NULL,
    shift_name TEXT NOT NULL,
    shift_type TEXT NOT NULL,
    shift_id TEXT,
    report_type TEXT DEFAULT 'ShiftClosing',
    total_shift_sales NUMERIC(10, 2) DEFAULT 0,
    total_orders_count INT DEFAULT 0,
    cancelled_orders_count INT DEFAULT 0,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 7. `order_audit_logs`
```sql
CREATE TABLE public.order_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    performed_by TEXT NOT NULL,
    role TEXT NOT NULL,
    action_type TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 4. REALTIME SYNC & MULTI-TAB BROADCAST RULES

### 4.1 Supabase Realtime Channels
- A dedicated subscription channel listens for PostgreSQL change events:
```javascript
supabase.channel(`mirchi-portal-sync-${Date.now()}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { loadSupabaseData(); })
  .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => { loadSupabaseData(); })
  .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => { loadSupabaseData(); })
  .on('postgres_changes', { event: '*', schema: 'public', table: 'waiter_calls' }, () => { loadSupabaseData(); })
  .on('postgres_changes', { event: '*', schema: 'public', table: 'help_calls' }, () => { loadSupabaseData(); })
  .on('postgres_changes', { event: '*', schema: 'public', table: 'branch_reports' }, () => { loadSupabaseData(); })
```
- Subscriptions are strictly torn down on component unmount via `supabase.removeChannel(channels)` to prevent socket leaks.
- Auto-reconnection handles `TIMED_OUT`, `CHANNEL_ERROR`, and network reconnections.

### 4.2 Cross-Tab Sync via `BroadcastChannel`
- Multi-tab consistency across opened tabs on the same device is handled through `BroadcastChannel('mirchi360_sync_channel')`:
  - `SYNC_ORDERS`: Propagates newly placed orders or status updates immediately.
  - `SYNC_COUNTER`: Synchronizes sequential order numbers.
  - `SYNC_COMPLAINTS`, `SYNC_WAITER_CALLS`, `SYNC_HELP_CALLS`.

---

## 5. NON-NEGOTIABLE ARCHITECTURE RULES
1. **Never Assume Non-Existent Columns:** Do not query `is_archived` on `orders`, `is_active` on `menu_items`, or `shift_closings` table unless verified in PostgreSQL.
2. **Tenant Scoping:** Always apply `eq('restaurant_id', RESTAURANT_ID)` on all operational queries.
3. **Resilient Offline Queuing:** Orders created when disconnected are queued in `mirchi_pending_sync_queue` and retried automatically.
4. **Clean Order Numbers:** Auto-calculated from DB max order sequence with local counter fallback to guarantee continuous sequential numbers.
