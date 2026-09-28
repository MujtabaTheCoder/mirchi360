# 🧠 MIRCHI 360 — AI MEMORY & CHANGE LOG
> **Purpose:** Persistent change journal. Updated after every significant code change, bug fix, or deployment.
> **Format:** Newest entries at TOP. Read top-to-bottom for latest state.

---

## 📌 PROJECT SNAPSHOT (Current State)

| Property | Value |
|----------|-------|
| **Project** | Mirchi 360 — Multi-tenant QR Menu & POS System |
| **Repo** | `MujtabaTheCoder/mirchi360` (GitHub) |
| **Deploy** | Vercel (auto-deploy on `main` push) |
| **Database** | Supabase (PostgreSQL + Realtime WebSocket) |
| **Supabase Project** | `hrrqunldyquxsnsufxpa.supabase.co` |
| **Anon Key** | `sb_publishable_tWlff35xenmaucL_HGulqg_qyf9yTaB` |
| **Stack** | React + Vite + TailwindCSS + Supabase JS SDK |
| **Active Portals** | Customer, Kitchen, Manager, Admin |
| **Branches** | Defence (`branch-def`), Qasimabd (`branch-qas`) |

---

## 📝 CHANGE LOG

---

### [2026-09-28 23:01 PKT] — Performance Hardening — GPU Acceleration & React Optimization
- **Files Modified:** `src/index.css`, `src/components/customer/CustomerApp.jsx`, `src/lib/store.jsx`
- **What Changed:**
  - Added GPU hardware acceleration CSS utilities (`.gpu-accelerate`, `.menu-card`, `.order-card`, `.modal-layer`, `.cart-float`, `.status-badge`, `.timer-element`)
  - Applied `translateZ(0)` and `will-change` to root `html/body/#root`
  - Added `prefers-reduced-motion` accessibility media query
  - Refactored `CustomerApp.jsx`: Added `React.memo` for `MenuItemCard` and `OrderStatusBadge` sub-components
  - Added `useMemo` for: `categories`, `filteredItems`, `allTableOrders`, `activeTableOrders`, `cartTotal`
  - Added `useCallback` for: all event handlers (`handleAddToCart`, `updateCartQuantity`, `handlePlaceOrder`, `handleComplaintSubmit`, etc.)
  - Removed `console.log` debug statement (shift change notification)
  - Tightened Supabase Realtime channel: added `broadcast: { self: false }` to reduce echo-back overhead
- **Why:** 60fps mobile UX, prevent full re-renders from timer ticks, reduce WebSocket payload
- **Commit:** `d16f25d` — `perf: GPU acceleration CSS, React.memo/useCallback/useMemo optimizations`
- **Next Steps:** Consider `React.lazy` for Admin/Manager portals for chunk splitting

---

### [2026-09-28 22:51 PKT] — Invoice Counter Reset — Orders Start from #1
- **Files Modified:** `src/lib/store.jsx`
- **What Changed:**
  - `orderCounter` useState init now ALWAYS returns `0` on startup (does not read localStorage)
  - `clearStaleOrdersCache()` already wipes `mirchi_order_counter` to `'0'` on startup
  - In `loadSupabaseData`: when DB returns zero active orders, counter resets to `0` (next order = #1)
  - Also hid 2 remaining database test orders (`status: 'cancelled'`, `notes: '[PURGED_DEMO]'`)
- **Why:** User needed fresh start — invoice numbering should always start from #1 after a full DB wipe
- **Commit:** `598349b` — `fix: invoice always starts from #1, reset order counter when DB is empty`
- **Next Steps:** Permanently delete orders via Supabase SQL Editor (`DELETE FROM orders;`) — anon key cannot DELETE

---

### [2026-09-28 17:17 PKT] — Root Cause Fix — Stale Cache & Broken Orders Query
- **Files Modified:** `src/lib/store.jsx`
- **What Changed:**
  - **CRITICAL FIX:** Removed `.eq('is_archived', false)` from orders query — this column does NOT exist in the database, causing ALL order fetches to fail silently, leaving localStorage stale data visible
  - Replaced with `.neq('status', 'cancelled')` — valid column, filters cancelled orders
  - Added `clearStaleOrdersCache()` function — wipes `mirchi_orders` and `mirchi_order_counter` from localStorage on every startup when Supabase is configured
  - Changed error handling: on query fail → also clear localStorage (not fall back to stale cache)
  - DB result is ALWAYS written to localStorage (even empty array) — DB is authoritative source
- **Why:** Manager/Admin portals kept showing old orders after database wipe because (1) query failed → (2) localStorage never cleared → (3) stale data displayed
- **Commit:** `43f957d` — `fix: resolve stale cache - remove broken is_archived filter`
- **Next Steps:** ✅ Resolved

---

### [2026-09-28 16:48 PKT] — Data Purge — Hidden Old Orders via [PURGED_DEMO] Flag
- **Files Modified:** Database only (via Node.js script)
- **What Changed:**
  - Updated all existing orders: `status = 'cancelled'`, `notes = '[PURGED_DEMO]'`
  - `loadSupabaseData()` in store.jsx already filters out `notes === '[PURGED_DEMO]'` rows
  - `purgeDemoDataFromStorage()` on startup also filters these from localStorage
- **Why:** User wanted clean slate; anon key RLS prevents physical `DELETE`
- **Commit:** N/A (database-only change)
- **Next Steps:** User performed physical DELETE via Supabase SQL Editor Dashboard

---

### [2026-09-28 ~14:00 PKT] — Session Persistence & Guest Checkout Removal
- **Files Modified:** `src/components/customer/CustomerApp.jsx`
- **What Changed:**
  - Removed "Guest / Skip" checkout button entirely
  - Enforced both Name AND Phone as mandatory before order placement
  - If not filled, `CustomerIdentityModal` opens to collect details
  - Removed `pastTableOrders` logic that leaked previous customer's orders to new customer
- **Why:** Business requirement — no anonymous orders; table isolation
- **Commit:** (earlier in session)
- **Next Steps:** ✅ Resolved

---

### [2026-09-28 ~08:00 PKT] — Mobile Order Submission Fix & Offline Queue
- **Files Modified:** `src/lib/store.jsx`
- **What Changed:**
  - Wrapped Supabase INSERT in explicit `try/catch` with 8-second timeout
  - On network timeout → order queued in `mirchi_pending_sync_queue` localStorage key
  - `processOfflineQueue()` runs every 6 seconds to retry queued orders
  - Exponential backoff on retries: `Math.min(60000, 2^retries * 1500)` ms
- **Why:** Mobile devices on weak networks were silently failing order submissions
- **Commit:** (earlier in session)
- **Next Steps:** ✅ Resolved

---

## 🗂️ KNOWN PERMANENT CONSTRAINTS

| Constraint | Detail |
|-----------|--------|
| **Anon key cannot DELETE** | Supabase RLS blocks `DELETE` via `sb_publishable_*` key. Use Dashboard SQL Editor |
| **`is_archived` column does NOT exist** | Never use `.eq('is_archived', ...)` in any query |
| **`order_number` is auto-assigned by DB** | Local counter is overridden after DB confirms INSERT |
| **Order physical delete** | Must be done via: Supabase Dashboard → SQL Editor → `DELETE FROM orders;` |
| **Vercel build required before push** | Always run `npm run build` — zero errors required |

---

## 📋 ENTRY TEMPLATE FOR FUTURE UPDATES

```markdown
### [YYYY-MM-DD HH:MM PKT] — [Scope/Component] — [One-line Summary]
- **Files Modified:** `path/to/file1.jsx`, `path/to/file2.js`
- **What Changed:** Detailed description of what was added/removed/changed
- **Why:** Root cause or business reason
- **Commit:** `git_hash` — `commit message`
- **Next Steps:** Any follow-up work or known issues remaining
```
