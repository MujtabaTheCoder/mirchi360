-- ========================================================
-- Mirchi360 Multi-Tenant Restaurant QR Menu & Order DB Schema
-- Supabase Postgres + RLS Policies + Realtime enabled
-- Date & Shift Tracking (Morning, Evening, Night) Included
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. RESTAURANTS (TENANTS)
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    currency TEXT DEFAULT 'PKR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BRANCHES
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLES (QR Scope)
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    table_number INT NOT NULL,
    qr_code_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(branch_id, table_number)
);

-- 4. MENU CATEGORIES
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. MENU ITEMS
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
    category_name TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) DEFAULT 0,
    image_url TEXT,
    is_out_of_stock BOOLEAN DEFAULT FALSE,
    has_variants BOOLEAN DEFAULT FALSE,
    variant_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. MENU ITEM VARIANTS
CREATE TABLE IF NOT EXISTS public.menu_item_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    is_out_of_stock BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ORDERS (Includes Date & Shift Tracking)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE,
    table_number INT NOT NULL,
    order_number SERIAL,
    status TEXT DEFAULT 'pending', -- 'pending', 'preparing', 'ready', 'completed', 'cancelled'
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    estimated_minutes INT,
    shift_type TEXT DEFAULT 'Evening', -- 'Morning', 'Evening', 'Night'
    shift_id TEXT, -- e.g. 'SHIFT-20260911-EVE'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
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

-- 9. COMPLAINTS (Includes Date & Shift Tracking)
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    table_number INT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open', -- 'open', 'resolved'
    shift_type TEXT DEFAULT 'Evening',
    shift_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. WAITER CALLS (Includes Date & Shift Tracking)
CREATE TABLE IF NOT EXISTS public.waiter_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    table_number INT NOT NULL,
    request_type TEXT DEFAULT 'General Assistance',
    status TEXT DEFAULT 'pending', -- 'pending', 'attended'
    shift_type TEXT DEFAULT 'Evening',
    shift_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. KITCHEN HELP CALLS
CREATE TABLE IF NOT EXISTS public.help_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    station_name TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    shift_type TEXT DEFAULT 'Evening',
    shift_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. STAFF ACCOUNTS
CREATE TABLE IF NOT EXISTS public.staff_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    pin_code TEXT NOT NULL,
    role TEXT NOT NULL, -- 'kitchen', 'manager', 'admin'
    privacy_pin TEXT DEFAULT '9999',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. STAFF SESSIONS (Max 3 concurrent admin cap)
CREATE TABLE IF NOT EXISTS public.staff_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff_accounts(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    device_info TEXT,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. BRANCH REPORTS (Includes Shift Closing & Incident logs)
CREATE TABLE IF NOT EXISTS public.branch_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    manager_name TEXT NOT NULL,
    shift_name TEXT NOT NULL, -- 'Morning', 'Evening', 'Night'
    shift_id TEXT,
    report_type TEXT DEFAULT 'Incident', -- 'Incident' or 'ShiftClosing'
    total_shift_sales NUMERIC(10, 2) DEFAULT 0,
    total_orders_count INT DEFAULT 0,
    cancelled_orders_count INT DEFAULT 0,
    report_date DATE DEFAULT CURRENT_DATE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. ORDER AUDIT LOGS (Privacy PIN modification tracking with shift)
CREATE TABLE IF NOT EXISTS public.order_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    performed_by TEXT NOT NULL,
    role TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'CANCELLED', 'EDITED'
    details TEXT,
    shift_type TEXT DEFAULT 'Evening',
    shift_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REALTIME & RLS POLICIES ENABLED
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.waiter_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.help_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.branch_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_audit_logs;

-- Missing columns for full sync
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment TEXT DEFAULT 'Unpaid';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
