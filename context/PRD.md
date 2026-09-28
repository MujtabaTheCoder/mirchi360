# 📋 MIRCHI 360 — PRODUCT REQUIREMENT DOCUMENT (PRD)
> **Version:** 1.0 | **Date:** 2026-09-28 | **Status:** Active Production

---

## 1. BUSINESS OVERVIEW

**Mirchi 360** is a high-concurrency, multi-tenant, real-time Point-of-Sale (POS) and Digital QR Menu system built for restaurant chains. It enables:

- Customers to scan a QR code at their table and order directly from their mobile phones
- Kitchen staff to see live order queues on a Kitchen Display System (KDS)
- Managers to monitor active orders, settle bills, close shifts, and generate Z-Reports
- Admins to view analytics, manage menu catalog, and oversee multi-branch operations

**Scale Target:** Thousands of concurrent table sessions across multiple branches simultaneously.

---

## 2. BUSINESS GOALS

| Goal | Description |
|------|-------------|
| Zero wait-staff dependency | Customers order themselves via QR → reduces ordering errors |
| Real-time kitchen sync | Orders appear on KDS instantly via Supabase WebSocket |
| Multi-branch management | Defence & Qasimabad branches, expandable |
| Shift accountability | Manager Z-Reports with cash/card revenue breakdown |
| Mobile-first UX | 60fps on low-end Android devices |
| Privacy & isolation | Table sessions are isolated; no cross-table data leakage |

---

## 3. PORTALS & SCOPE

---

### 3.1 CUSTOMER PORTAL (`/` with `?table=N&branch=X`)

**Access:** QR Code scan on table → URL with query params  
**Auth:** None (public access)  
**Route:** `/?table=4&branch=branch-def`

#### Features:
- **Digital Menu Browsing**
  - Category filter tabs (horizontal scroll)
  - Search bar (item name & category)
  - Item cards with image, name, price, variant selector
  - Out-of-stock badge with disabled add button

- **Cart Management**
  - Add / remove / quantity update items
  - Per-item special instructions field
  - Order-level notes textarea
  - Cart total calculation

- **Customer Identity Collection**
  - Mandatory Name + Phone before order placement
  - Saved to `localStorage` for session convenience
  - Displayed in Kitchen & Manager portals for accountability

- **Order Submission**
  - Direct Supabase INSERT (with 8-second timeout)
  - Offline queue fallback if network fails
  - Visual toast notification on success or failure
  - Cart clears after successful submission

- **Live Order Tracking Tab**
  - Displays ONLY active orders for THIS table & branch
  - Status badges: `pending` → `preparing` → `ready` → `served` → (paid/completed)
  - Estimated time display when status is `preparing`
  - "Order Ready" banner when status is `ready`
  - Bill amount shown when status is `served`
  - Order disappears when `status = 'completed'` or `payment = 'Paid'`
  - Powered by Supabase Realtime WebSocket (sub-5s updates)

- **Waiter Call Button**
  - Inserts record into `waiter_calls` table
  - Manager portal shows pending waiter calls

- **Complaint Submission**
  - Inserts into `complaints` table
  - Manager sees all open complaints in real-time

- **Session Isolation (Critical)**
  - New customer at same table sees NO previous orders
  - `localStorage` orders cache wiped on every page load
  - Only orders matching current `tableNumber` + `branchId` shown

- **i18n / Language**
  - English (LTR) default
  - Urdu (RTL) support via `i18next`
  - Language switcher in header

---

### 3.2 KITCHEN PORTAL (`/kitchen` or `/staff` → role: kitchen)

**Access:** Staff login with role `kitchen` + 4-digit PIN  
**Auth:** PIN-based from `staff_accounts` Supabase table or local fallback

#### Features:
- **Live Order Queue**
  - All `pending` and `preparing` orders across the branch
  - Sorted by creation time (oldest first)
  - Real-time updates via Supabase Realtime

- **Order Status Toggles**
  - `pending` → `preparing` (with estimated minutes input)
  - `preparing` → `ready`
  - Status change writes to Supabase `orders` table immediately

- **Sound Alerts**
  - Audio chime plays when new `pending` order arrives
  - Browser permission required on first interaction

- **Order Details**
  - Items list with quantities and special notes
  - Customer name for verbal confirmation
  - Table number prominently displayed

---

### 3.3 MANAGER PORTAL (`/staff` → role: manager)

**Access:** Staff login with role `manager` + 4-digit PIN  
**Auth:** PIN from `staff_accounts` table or local credentials  
**Branch Isolation:** Manager only sees their assigned branch's data

#### Features:
- **Active Order Dashboard**
  - All active (non-completed) orders for the branch
  - Filter by status: All / Pending / Preparing / Ready / Served

- **Order Actions**
  - Mark as `ready` / `served`
  - Mark bill as `paid` (triggers `status = 'completed'`, order disappears from customer view)
  - Cancel order with reason

- **Waiter Calls Panel**
  - Real-time list of pending waiter call requests
  - Dismiss/resolve individual calls

- **Complaints Panel**
  - Active customer complaints
  - Resolve and clear

- **Shift Closing (Z-Report)**
  - Close current shift with cash/card/other revenue split
  - Generates `branch_reports` + `shift_closings` records
  - Privacy PIN required for settlement operations

- **Session Auth**
  - Persists across page reloads (localStorage `mirchi_auth_session`)
  - Never logs out on refresh

---

### 3.4 ADMIN PORTAL (`/staff` → role: admin)

**Access:** Admin username + password (minimum 4 chars)  
**Auth:** Supabase `staff_accounts` or hardcoded superadmin fallback  
**Scope:** Cross-branch visibility

#### Features:
- **Revenue Analytics Dashboard**
  - Date range filter (Today / Last 7 days / Custom)
  - Gross revenue, order count, cancellation count per shift
  - Per-branch breakdown

- **Shift History**
  - All `shift_closings` records with timestamps
  - Manager name, shift type, revenue breakdown

- **Menu Catalog Management**
  - Add / edit / delete menu items
  - Toggle item availability (in-stock / out-of-stock)
  - Category management
  - Image upload via URL

- **Order Audit Logs**
  - Full log of all status changes with timestamp + performed-by staff member

- **Multi-Admin Sessions**
  - Max 3 concurrent admin sessions enforced

---

## 4. NON-FUNCTIONAL REQUIREMENTS

| Requirement | Target |
|-------------|--------|
| Mobile load time | < 2 seconds on 4G |
| Order submission latency | < 500ms on good network |
| Realtime status update | < 5 seconds from kitchen action to customer view |
| Concurrent sessions | Thousands (Supabase handles connection pooling) |
| Offline order tolerance | Up to 60 seconds (offline queue with retry) |
| Session persistence | Staff never re-login on page refresh |
| Table isolation | 100% — no cross-table data leakage |
| Build size | < 600KB gzipped (current: ~167KB gzipped) |

---

## 5. USER ROLES & PERMISSIONS

| Role | Can Read | Can Insert | Can Update | Can Delete |
|------|----------|-----------|------------|------------|
| Customer (anon) | menu_items, their table's orders | orders, order_items, complaints, waiter_calls | — | — |
| Kitchen | all orders (branch) | help_calls | orders.status | — |
| Manager | branch orders, complaints, waiter_calls | branch_reports, shift_closings | orders.status/payment | complaints, waiter_calls |
| Admin | all tables | staff_accounts, menu_items | all | menu_items, branch_reports |

> ⚠️ The `anon` publishable key **cannot DELETE rows** in the `orders` table due to RLS policies.

---

## 6. KNOWN BUSINESS CONSTRAINTS

- **Physical order deletion** must be done via Supabase Dashboard SQL Editor
- **Branch slug** (`branch-def`, `branch-qas`) must match UUID in `BRANCH_UUID_MAP`
- **Table numbers** are 1–10 per branch; mapped to fixed UUIDs in `TABLE_UUID_MAP`
- **Shift types**: Morning (06:00–14:00), Evening (14:00–22:00), Night (22:00–06:00) — PKT timezone
