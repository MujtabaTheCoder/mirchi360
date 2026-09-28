import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SEED_DATA } from './initialData';
import { 
  supabase, 
  isSupabaseConfigured, 
  RESTAURANT_ID, 
  getBranchUuid, 
  getTableUuid, 
  BRANCH_SLUG_MAP, 
  BRANCH_UUID_MAP 
} from './supabase';
import { authenticateStaff } from './staffCredentials';
import { 
  sanitizeTextInput, 
  validatePin, 
  sanitizeTableParam, 
  sanitizeBranchParam, 
  isValidSessionObject 
} from './security';


// Automatically purge all demo / seed items from localStorage on startup
// Also wipe orders cache if Supabase is configured so DB is always the source of truth
const purgeDemoDataFromStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keys = [
      'mirchi_orders',
      'mirchi_complaints',
      'mirchi_waiter_calls',
      'mirchi_help_calls',
      'mirchi_branch_reports',
      'mirchi_audit_logs'
    ];
    keys.forEach(key => {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const clean = parsed.filter(item => item && !String(item.id).includes('seed') && !String(item.id).startsWith('seed-') && item.notes !== '[PURGED_DEMO]');
            localStorage.setItem(key, JSON.stringify(clean));
          }
        } catch {}
      }
    });
  } catch (e) {
    console.error("Failed to purge demo data:", e);
  }
};
purgeDemoDataFromStorage();

// If Supabase is configured, ALWAYS clear the orders localStorage cache on startup.
// This ensures the database is the single source of truth — stale cached orders
// from previous sessions will never contaminate a fresh load.
const clearStaleOrdersCache = () => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';
    if (supabaseUrl && supabaseKey) {
      localStorage.setItem('mirchi_orders', JSON.stringify([]));
      localStorage.setItem('mirchi_order_counter', '0');
    }
  } catch {}
};
clearStaleOrdersCache();

const AppContext = createContext(null);

const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('mirchi360_sync_channel') 
  : null;

const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname === '' ||
   window.location.hostname.includes('192.168.') ||
   window.location.hostname.includes('10.') ||
   window.location.hostname.includes('172.'));

export const formatPakistanTime = (dateInput) => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' || typeof dateInput === 'number'
    ? new Date(dateInput)
    : dateInput;
  try {
    return date.toLocaleTimeString('en-PK', {
      timeZone: 'Asia/Karachi',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }
};

export const formatPakistanDateTime = (dateInput) => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' || typeof dateInput === 'number'
    ? new Date(dateInput)
    : dateInput;
  try {
    return date.toLocaleString('en-PK', {
      timeZone: 'Asia/Karachi',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return date.toLocaleString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }
};

export const getPakistanDateString = (dateInput = new Date()) => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' || typeof dateInput === 'number'
    ? new Date(dateInput)
    : dateInput;
  const pk = getPakistanParts(date);
  const mm = String(pk.month).padStart(2, '0');
  const dd = String(pk.day).padStart(2, '0');
  return `${pk.year}-${mm}-${dd}`;
};

const getPakistanParts = (date) => {
  try {
    const fmt = new Intl.DateTimeFormat('en-PK', {
      timeZone: 'Asia/Karachi',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = fmt.formatToParts(date);
    const map = {};
    parts.forEach(p => { map[p.type] = p.value; });
    return {
      year: Number(map.year),
      month: Number(map.month),
      day: Number(map.day),
      hour: Number(map.hour === undefined ? 0 : map.hour === '24' ? 0 : map.hour),
      minute: Number(map.minute || 0)
    };
  } catch {
    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate(), hour: date.getHours(), minute: date.getMinutes() };
  }
};

export const getCurrentShift = (date = new Date()) => {
  const pk = getPakistanParts(date);
  const hours = pk.hour;
  let shiftType = 'Evening';
  let code = 'EVE';

  if (hours >= 6 && hours < 14) {
    shiftType = 'Morning';
    code = 'MOR';
  } else if (hours >= 14 && hours < 22) {
    shiftType = 'Evening';
    code = 'EVE';
  } else {
    shiftType = 'Night';
    code = 'NIG';
  }

  const mm = String(pk.month).padStart(2, '0');
  const dd = String(pk.day).padStart(2, '0');
  const localDateStr = `${pk.year}${mm}${dd}`;
  const shiftId = `SHIFT-${localDateStr}-${code}`;

  return { shiftType, shiftId, shiftName: `${shiftType} Shift` };
};

export const normalizeOrder = (o) => {
  if (!o) return null;
  const shiftInfo = getCurrentShift(o.createdAt ? new Date(o.createdAt) : new Date());

  // Parse items from order_items join if coming from Supabase
  let items = o.items || o.order_items || [];
  if (Array.isArray(items)) {
    items = items.map(item => ({
      itemId: item.itemId || item.menu_item_id || item.id,
      name: item.name || item.item_name || 'Item',
      variantName: item.variantName !== undefined ? item.variantName : (item.variant_name || null),
      unitPrice: Number(item.unitPrice || item.unit_price || 0),
      quantity: Number(item.quantity || 1),
      subtotal: Number(item.subtotal || (Number(item.unitPrice || item.unit_price || 0) * Number(item.quantity || 1))),
      specialNotes: item.specialNotes || item.special_notes || ''
    }));
  }

  // Branch slug normalization: 'e85c1b88...' -> 'branch-def'
  const rawBranch = o.branchId || o.branch_id || "branch-def";
  const branchId = BRANCH_SLUG_MAP[rawBranch] || rawBranch;

  // Extract customer name & phone if in notes (e.g. "Customer: Name (Phone) | Notes")
  let customerName = o.customerName || o.customer_name || "";
  let customerPhone = o.customerPhone || o.customer_phone || "";
  let notes = o.notes || "";
  if ((!customerName || !customerPhone) && notes.includes("Customer:")) {
    try {
      const match = notes.match(/Customer:\s*([^(\n|]+)(?:\s*\(([^)]+)\))?/);
      if (match) {
        if (!customerName && match[1]) customerName = match[1].trim();
        if (!customerPhone && match[2]) customerPhone = match[2].trim();
      }
    } catch {}
  }

  const orderNum = Number(o.orderNumber || o.order_number || 100);

  return {
    ...o,
    id: o.id,
    orderNumber: orderNum,
    order_number: orderNum,
    restaurantId: o.restaurantId || o.restaurant_id || RESTAURANT_ID,
    restaurant_id: o.restaurantId || o.restaurant_id || RESTAURANT_ID,
    branchId: branchId,
    branch_id: rawBranch,
    tableId: o.tableId || o.table_id || null,
    table_id: o.tableId || o.table_id || null,
    tableNumber: Number(o.tableNumber || o.table_number || 4),
    table_number: Number(o.tableNumber || o.table_number || 4),
    status: o.status || "pending",
    payment: o.payment || (o.status === 'completed' ? 'Paid' : 'Unpaid'),
    estimatedMinutes: o.estimatedMinutes !== undefined ? o.estimatedMinutes : (o.estimated_minutes || null),
    totalAmount: Number(o.totalAmount || o.total_amount || 0),
    total_amount: Number(o.totalAmount || o.total_amount || 0),
    items: items,
    notes: notes,
    customerName: customerName,
    customer_name: customerName,
    customerPhone: customerPhone,
    customer_phone: customerPhone,
    shiftType: o.shiftType || o.shift_type || shiftInfo.shiftType,
    shiftId: o.shiftId || o.shift_id || shiftInfo.shiftId,
    createdAt: o.createdAt || o.created_at || new Date().toISOString()
  };
};

export const normalizeComplaint = (c) => {
  const shiftInfo = getCurrentShift(c.createdAt ? new Date(c.createdAt) : new Date());
  const rawBranch = c.branchId || c.branch_id || "branch-def";
  return {
    ...c,
    id: c.id,
    restaurantId: c.restaurantId || c.restaurant_id || RESTAURANT_ID,
    branchId: BRANCH_SLUG_MAP[rawBranch] || rawBranch,
    branch_id: rawBranch,
    tableNumber: Number(c.tableNumber || c.table_number || 4),
    table_number: Number(c.tableNumber || c.table_number || 4),
    message: c.message || "",
    status: c.status || "open",
    shiftType: c.shiftType || c.shift_type || shiftInfo.shiftType,
    shiftId: c.shiftId || c.shift_id || shiftInfo.shiftId,
    createdAt: c.createdAt || c.created_at || new Date().toISOString()
  };
};

export const normalizeWaiterCall = (w) => {
  const shiftInfo = getCurrentShift(w.createdAt ? new Date(w.createdAt) : new Date());
  const rawBranch = w.branchId || w.branch_id || "branch-def";
  return {
    ...w,
    id: w.id,
    restaurantId: w.restaurantId || w.restaurant_id || RESTAURANT_ID,
    branchId: BRANCH_SLUG_MAP[rawBranch] || rawBranch,
    branch_id: rawBranch,
    tableNumber: Number(w.tableNumber || w.table_number || 4),
    table_number: Number(w.tableNumber || w.table_number || 4),
    requestType: w.requestType || w.request_type || "Assistance",
    status: w.status || "pending",
    shiftType: w.shiftType || w.shift_type || shiftInfo.shiftType,
    shiftId: w.shiftId || w.shift_id || shiftInfo.shiftId,
    createdAt: w.createdAt || w.created_at || new Date().toISOString()
  };
};

export const normalizeHelpCall = (h) => {
  const shiftInfo = getCurrentShift(h.createdAt ? new Date(h.createdAt) : new Date());
  const rawBranch = h.branchId || h.branch_id || "branch-def";
  return {
    ...h,
    id: h.id,
    restaurantId: h.restaurantId || h.restaurant_id || RESTAURANT_ID,
    branchId: BRANCH_SLUG_MAP[rawBranch] || rawBranch,
    branch_id: rawBranch,
    stationName: h.stationName || h.station_name || "Kitchen Station",
    message: h.message || "",
    status: h.status || "active",
    shiftType: h.shiftType || h.shift_type || shiftInfo.shiftType,
    shiftId: h.shiftId || h.shift_id || shiftInfo.shiftId,
    createdAt: h.createdAt || h.created_at || new Date().toISOString()
  };
};

const LS_SESSION_KEY = 'mirchi_auth_session';
const LS_TOKEN_KEY = 'mirchi_auth_token';
const mergeById = (currentList = [], incomingList = [], normalizer = null) => {
  const map = new Map();
  (incomingList || []).forEach(item => {
    const norm = normalizer ? normalizer(item) : item;
    if (norm && norm.id) map.set(norm.id, norm);
  });
  (currentList || []).forEach(item => {
    const norm = normalizer ? normalizer(item) : item;
    if (norm && norm.id) {
      if (!map.has(norm.id)) {
        map.set(norm.id, norm);
      } else {
        const existing = map.get(norm.id);
        const normTime = new Date(norm.updatedAt || norm.createdAt || 0).getTime();
        const existTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
        if (normTime >= existTime) {
          map.set(norm.id, { ...existing, ...norm });
        }
      }
    }
  });
  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
};

export const AppProvider = ({ children }) => {
  const [selectedBranch, setSelectedBranch] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const b = sanitizeBranchParam(params.get('branch'));
      if (b && b.includes('qas')) return SEED_DATA.branches[1];
    } catch {}
    return SEED_DATA.branches[0];
  });

  const [selectedTableNumber, setSelectedTableNumber] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return sanitizeTableParam(params.get('table'));
    } catch {
      return 4;
    }
  });

  // Synchronously rehydrate currentSession so refreshing Admin/Manager/Kitchen portals NEVER logs the user out
  const [currentSession, setCurrentSession] = useState(() => {
    if (typeof window === 'undefined') return null;
    try {
      const lsSession = localStorage.getItem(LS_SESSION_KEY);
      if (lsSession) {
        const parsed = JSON.parse(lsSession);
        if (isValidSessionObject(parsed)) {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  const [authReady, setAuthReady] = useState(true);
  const [currentShift, setCurrentShift] = useState(() => getCurrentShift());
  const [previousShift, setPreviousShift] = useState(() => getCurrentShift());
  
  const [activeSessions, setActiveSessions] = useState(() => {
    const saved = localStorage.getItem('mirchi_active_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const [orderCounter, setOrderCounter] = useState(() => {
    // Always start from 0 — first real order will be #1
    // We do NOT read from localStorage here because clearStaleOrdersCache() already wiped it
    try { localStorage.setItem('mirchi_order_counter', '0'); } catch {}
    return 0;
  });

  const [menuItems, setMenuItems] = useState(() => {
    const saved = localStorage.getItem('mirchi_menu_items');
    return saved ? JSON.parse(saved) : SEED_DATA.menuItems;
  });

  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('mirchi_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Strictly purge all demo/seed orders and purged orders
          const realOrders = parsed.filter(o => o && !String(o.id).includes('seed') && o.notes !== '[PURGED_DEMO]');
          try { localStorage.setItem('mirchi_orders', JSON.stringify(realOrders)); } catch {}
          return realOrders.map(normalizeOrder);
        }
      }
    } catch (e) {
      console.error("Failed to parse saved orders:", e);
    }
    try { localStorage.setItem('mirchi_orders', JSON.stringify([])); } catch {}
    return [];
  });

  const [complaints, setComplaints] = useState(() => {
    try {
      const saved = localStorage.getItem('mirchi_complaints');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Strictly purge all demo/seed complaints
          const realComplaints = parsed.filter(c => c && !String(c.id).includes('seed'));
          try { localStorage.setItem('mirchi_complaints', JSON.stringify(realComplaints)); } catch {}
          return realComplaints.map(normalizeComplaint);
        }
      }
    } catch (e) {
      console.error("Failed to parse saved complaints:", e);
    }
    try { localStorage.setItem('mirchi_complaints', JSON.stringify([])); } catch {}
    return [];
  });

  const [waiterCalls, setWaiterCalls] = useState(() => {
    try {
      const saved = localStorage.getItem('mirchi_waiter_calls');
      return saved ? JSON.parse(saved).map(normalizeWaiterCall) : [];
    } catch {
      return [];
    }
  });

  const [helpCalls, setHelpCalls] = useState(() => {
    try {
      const saved = localStorage.getItem('mirchi_help_calls');
      return saved ? JSON.parse(saved).map(normalizeHelpCall) : [];
    } catch {
      return [];
    }
  });

  const [branchReports, setBranchReports] = useState(() => {
    try {
      const saved = localStorage.getItem('mirchi_branch_reports');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const realReports = parsed.filter(r => r && !String(r.id).includes('seed'));
          try { localStorage.setItem('mirchi_branch_reports', JSON.stringify(realReports)); } catch {}
          return realReports;
        }
      }
    } catch (e) {
      console.error("Failed to parse saved branch reports:", e);
    }
    try { localStorage.setItem('mirchi_branch_reports', JSON.stringify([])); } catch {}
    return [];
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('mirchi_audit_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [shiftClosings, setShiftClosings] = useState(() => {
    try {
      const saved = localStorage.getItem('mirchi_shift_closings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => { localStorage.setItem('mirchi_menu_items', JSON.stringify(menuItems)); }, [menuItems]);
  useEffect(() => { localStorage.setItem('mirchi_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('mirchi_complaints', JSON.stringify(complaints)); }, [complaints]);
  useEffect(() => { localStorage.setItem('mirchi_waiter_calls', JSON.stringify(waiterCalls)); }, [waiterCalls]);
  useEffect(() => { localStorage.setItem('mirchi_help_calls', JSON.stringify(helpCalls)); }, [helpCalls]);
  useEffect(() => { localStorage.setItem('mirchi_branch_reports', JSON.stringify(branchReports)); }, [branchReports]);
  useEffect(() => { localStorage.setItem('mirchi_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('mirchi_order_counter', orderCounter.toString()); }, [orderCounter]);

  useEffect(() => {
    const checkShiftChange = () => {
      const newShift = getCurrentShift();
      setCurrentShift(prevShift => {
        if (newShift.shiftType !== prevShift.shiftType) {
          setPreviousShift(prevShift);
          // Shift changed — sessions remain active, no re-login needed
        }
        return newShift;
      });
    };

    const interval = setInterval(checkShiftChange, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      try {
        const lsSession = localStorage.getItem(LS_SESSION_KEY);
        let activeToken = localStorage.getItem(LS_TOKEN_KEY);
        
        if (lsSession) {
          try {
            const parsedSession = JSON.parse(lsSession);
            if (parsedSession && (parsedSession.id || parsedSession.username) && parsedSession.role) {
              if (!activeToken) {
                activeToken = btoa(JSON.stringify({ u: parsedSession.username, r: parsedSession.role, t: Date.now() }));
                localStorage.setItem(LS_TOKEN_KEY, activeToken);
              }
              setCurrentSession(parsedSession);
              const branch = SEED_DATA.branches.find(b => b.id === parsedSession.branchId || BRANCH_UUID_MAP[b.id] === parsedSession.branchId);
              if (branch) setSelectedBranch(branch);
              setAuthReady(true);
              return;
            }
          } catch (e) {
            console.error("Session parse error:", e);
          }
        }

        try {
          const res = await fetch('/api/auth/session', { credentials: 'include' });
          if (res.ok) {
            const text = await res.text();
            try {
              const data = JSON.parse(text);
              if (!cancelled && data.user) {
                setCurrentSession(data.user);
                const branch = SEED_DATA.branches.find(b => b.id === data.user.branchId || BRANCH_UUID_MAP[b.id] === data.user.branchId);
                if (branch) setSelectedBranch(branch);
                const tok = data.token || btoa(JSON.stringify({ u: data.user.username, r: data.user.role, t: Date.now() }));
                localStorage.setItem(LS_SESSION_KEY, JSON.stringify(data.user));
                localStorage.setItem(LS_TOKEN_KEY, tok);
                setAuthReady(true);
                return;
              }
            } catch {
              // Ignore HTML from SPA rewrite
            }
          }
        } catch {
          /* API unavailable — fall through */
        }
      } catch {
        /* outer guard */
      }
      if (!cancelled) {
        setAuthReady(true);
      }
    };
    hydrate();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { localStorage.setItem('mirchi_active_sessions', JSON.stringify(activeSessions)); }, [activeSessions]);

  const queueOfflineOrder = (order) => {
    try {
      const raw = localStorage.getItem('mirchi_pending_sync_queue');
      const queue = raw ? JSON.parse(raw) : [];
      if (!queue.some(item => item.id === order.id)) {
        queue.push({
          ...order,
          retries: 0,
          queuedAt: Date.now(),
          nextRetryAt: Date.now()
        });
        localStorage.setItem('mirchi_pending_sync_queue', JSON.stringify(queue));
      }
    } catch {}
  };

  const recentOrderUpdatesRef = useRef(new Map());
  const isFetchingRef = useRef(false);
  const pendingFetchRef = useRef(false);

  const loadSupabaseData = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    if (isFetchingRef.current) {
      pendingFetchRef.current = true;
      return;
    }
    isFetchingRef.current = true;
    try {
      const [
        { data: ordersData, error: ordersErr },
        { data: complaintsData },
        { data: waiterCallsData },
        { data: helpCallsData },
        { data: reportsData },
        { data: auditData },
        { data: shiftClosingsData }
      ] = await Promise.all([
        supabase.from('orders').select('id, order_number, restaurant_id, branch_id, table_id, table_number, status, estimated_minutes, total_amount, notes, created_at, order_items(id, item_name, variant_name, unit_price, quantity, subtotal, special_notes)').neq('status', 'cancelled').order('created_at', { ascending: false }),
        supabase.from('complaints').select('id, restaurant_id, branch_id, table_number, message, status, created_at').eq('status', 'open').order('created_at', { ascending: false }),
        supabase.from('waiter_calls').select('id, restaurant_id, branch_id, table_number, request_type, status, created_at').eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('help_calls').select('id, restaurant_id, branch_id, station_name, message, status, created_at').eq('status', 'active').order('created_at', { ascending: false }),
        supabase.from('branch_reports').select('id, branch_id, manager_name, shift_name, report_type, total_shift_sales, total_orders_count, cancelled_orders_count, content, created_at').order('created_at', { ascending: false }),
        supabase.from('order_audit_logs').select('id, order_id, branch_id, performed_by, role, action_type, details, created_at').order('created_at', { ascending: false }),
        supabase.from('shift_closings').select('id, restaurant_id, branch_id, opened_at, closed_at, manager_name, total_orders_count, total_gross_revenue, cash_revenue, card_revenue, other_revenue, total_discounts, cancelled_orders_count, closed_order_ids, date').order('closed_at', { ascending: false })
      ]);

      if (ordersErr) {
        console.warn("Error querying orders with items:", ordersErr);
        // On query error, do NOT fall back to stale localStorage — show empty
        setOrders([]);
        try { localStorage.setItem('mirchi_orders', JSON.stringify([])); } catch {}
      }

      // ordersData is always set (even as empty array) when query succeeds
      if (!ordersErr) {
        const realOrders = (ordersData || [])
          .filter(o => o && !String(o.id).includes('seed') && !String(o.id).startsWith('seed-') && o.notes !== '[PURGED_DEMO]')
          .map(normalizeOrder);

        const now = Date.now();
        const mergedOrders = realOrders.map(dbOrder => {
          const pending = recentOrderUpdatesRef.current.get(dbOrder.id);
          if (pending) {
            if (now - pending.timestamp < 15000) {
              if (dbOrder.status === pending.status && (!pending.payment || dbOrder.payment === pending.payment)) {
                recentOrderUpdatesRef.current.delete(dbOrder.id);
                return dbOrder;
              } else {
                return {
                  ...dbOrder,
                  status: pending.status || dbOrder.status,
                  payment: pending.payment || dbOrder.payment,
                  estimatedMinutes: pending.estimatedMinutes !== undefined ? pending.estimatedMinutes : dbOrder.estimatedMinutes
                };
              }
            } else {
              recentOrderUpdatesRef.current.delete(dbOrder.id);
            }
          }
          return dbOrder;
        });

        // ALWAYS write the authoritative DB result to localStorage (even empty array)
        // This ensures stale cache can never outlive a DB wipe
        try { localStorage.setItem('mirchi_orders', JSON.stringify(mergedOrders)); } catch {}

        setOrders(prev => {
          if (prev.length === mergedOrders.length) {
            const isSame = prev.every((p, idx) => {
              const m = mergedOrders[idx];
              return m &&
                p.id === m.id &&
                p.status === m.status &&
                p.payment === m.payment &&
                p.totalAmount === m.totalAmount &&
                p.estimatedMinutes === m.estimatedMinutes &&
                p.notes === m.notes &&
                (p.items?.length || 0) === (m.items?.length || 0);
            });
            if (isSame) return prev;
          }
          return mergedOrders;
        });

        // If DB has no active orders, reset counter to 0 so next order is Invoice #1
        const maxNum = mergedOrders.length === 0
          ? 0
          : Math.max(0, ...mergedOrders.map(o => Number(o.orderNumber || o.order_number) || 0));
        setOrderCounter(prev => {
          if (prev === maxNum) return prev;
          try { localStorage.setItem('mirchi_order_counter', String(maxNum)); } catch {}
          return maxNum;
        });
      }

      if (complaintsData && complaintsData.length > 0) {
        const realComplaints = complaintsData.filter(c => c && !String(c.id).includes('seed') && !String(c.id).startsWith('seed-'));
        setComplaints(prev => {
          const merged = mergeById(prev, realComplaints, normalizeComplaint);
          if (prev.length === merged.length && prev.every((p, idx) => p.id === merged[idx].id && p.status === merged[idx].status)) {
            return prev;
          }
          try { localStorage.setItem('mirchi_complaints', JSON.stringify(merged)); } catch {}
          return merged;
        });
      }

      if (waiterCallsData && waiterCallsData.length > 0) {
        const realWaiterCalls = waiterCallsData.filter(w => w && !String(w.id).includes('seed') && !String(w.id).startsWith('seed-'));
        setWaiterCalls(prev => {
          const merged = mergeById(prev, realWaiterCalls, normalizeWaiterCall);
          if (prev.length === merged.length && prev.every((p, idx) => p.id === merged[idx].id && p.status === merged[idx].status)) {
            return prev;
          }
          try { localStorage.setItem('mirchi_waiter_calls', JSON.stringify(merged)); } catch {}
          return merged;
        });
      }

      if (helpCallsData && helpCallsData.length > 0) {
        const realHelpCalls = helpCallsData.filter(h => h && !String(h.id).includes('seed') && !String(h.id).startsWith('seed-'));
        setHelpCalls(prev => {
          const merged = mergeById(prev, realHelpCalls, normalizeHelpCall);
          if (prev.length === merged.length && prev.every((p, idx) => p.id === merged[idx].id && p.status === merged[idx].status)) {
            return prev;
          }
          try { localStorage.setItem('mirchi_help_calls', JSON.stringify(merged)); } catch {}
          return merged;
        });
      }

      if (reportsData && reportsData.length > 0) {
        const normReports = reportsData
          .filter(r => r && !String(r.id).includes('seed') && !String(r.id).startsWith('seed-'))
          .map(r => ({
            id: r.id,
            branchId: BRANCH_SLUG_MAP[r.branch_id] || r.branch_id,
            branch_id: r.branch_id,
            managerName: r.manager_name,
            shiftName: r.shift_name,
            shiftType: r.shift_type || 'Evening',
            shiftId: r.shift_id,
            reportType: r.report_type,
            totalShiftSales: Number(r.total_shift_sales || 0),
            totalOrdersCount: Number(r.total_orders_count || 0),
            cancelledOrdersCount: Number(r.cancelled_orders_count || 0),
            content: r.content,
            createdAt: r.created_at
          }));
        setBranchReports(prev => {
          const merged = mergeById(prev, normReports);
          if (prev.length === merged.length && prev.every((p, idx) => p.id === merged[idx].id)) {
            return prev;
          }
          try { localStorage.setItem('mirchi_branch_reports', JSON.stringify(merged)); } catch {}
          return merged;
        });
      }

      if (auditData && auditData.length > 0) {
        const normAudits = auditData
          .filter(a => a && !String(a.id).includes('seed') && !String(a.id).startsWith('seed-'))
          .map(a => ({
            id: a.id,
            orderId: a.order_id,
            branchId: BRANCH_SLUG_MAP[a.branch_id] || a.branch_id,
            branch_id: a.branch_id,
            performedBy: a.performed_by,
            role: a.role,
            actionType: a.action_type,
            details: a.details,
            shiftType: a.shift_type,
            shiftId: a.shift_id,
            createdAt: a.created_at
          }));
        setAuditLogs(prev => {
          const merged = mergeById(prev, normAudits);
          if (prev.length === merged.length && prev.every((p, idx) => p.id === merged[idx].id)) {
            return prev;
          }
          try { localStorage.setItem('mirchi_audit_logs', JSON.stringify(merged)); } catch {}
          return merged;
        });
      }
      
      if (shiftClosingsData && shiftClosingsData.length > 0) {
        setShiftClosings(prev => {
          const map = new Map(prev.map(s => [s.id, s]));
          shiftClosingsData.forEach(s => map.set(s.id, s));
          const merged = Array.from(map.values()).sort((a,b) => new Date(b.closed_at).getTime() - new Date(a.closed_at).getTime());
          try { localStorage.setItem('mirchi_shift_closings', JSON.stringify(merged)); } catch {}
          return merged;
        });
      }

    } catch (err) {
      console.error("Error loading Supabase data:", err);
    } finally {
      isFetchingRef.current = false;
      if (pendingFetchRef.current) {
        pendingFetchRef.current = false;
        loadSupabaseData();
      }
    }
  }, []);

  const processOfflineQueue = async () => {
    if (!isSupabaseConfigured || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
    try {
      const raw = localStorage.getItem('mirchi_pending_sync_queue');
      if (!raw) return;
      const queue = JSON.parse(raw);
      if (!Array.isArray(queue) || queue.length === 0) return;

      const now = Date.now();
      const remaining = [];
      let anySynced = false;

      for (const ord of queue) {
        if (ord.nextRetryAt && ord.nextRetryAt > now) {
          remaining.push(ord);
          continue;
        }

        try {
          const branchUuid = getBranchUuid(ord.branchId || ord.branch_id);
          const tableUuid = getTableUuid(ord.branchId || ord.branch_id, ord.tableNumber || ord.table_number);
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("SYNC_TIMEOUT_8S")), 8000)
          );
          const insertPromise = supabase.from('orders').insert({
            restaurant_id: RESTAURANT_ID,
            branch_id: branchUuid,
            table_id: tableUuid,
            table_number: Number(ord.tableNumber || ord.table_number || 4),
            status: ord.status || 'pending',
            total_amount: Number(ord.totalAmount || ord.total_amount || 0),
            notes: ord.notes || ''
          }).select();

          const { data: dbOrder, error } = await Promise.race([insertPromise, timeoutPromise]);

          if (!error && dbOrder && dbOrder[0]) {
            anySynced = true;
            if (Array.isArray(ord.items) && ord.items.length > 0) {
              const dbItems = ord.items.map(i => ({
                order_id: dbOrder[0].id,
                item_name: sanitizeTextInput(i.name || 'Item', 120),
                variant_name: i.variantName ? sanitizeTextInput(i.variantName, 60) : null,
                unit_price: Number(i.unitPrice || 0),
                quantity: Number(i.quantity || 1),
                subtotal: Number(i.subtotal || 0),
                special_notes: sanitizeTextInput(i.specialNotes || '', 150)
              }));
              await supabase.from('order_items').insert(dbItems);
            }
          } else {
            const retries = (ord.retries || 0) + 1;
            const delay = Math.min(60000, Math.pow(2, retries) * 1500);
            remaining.push({ ...ord, retries, nextRetryAt: now + delay });
          }
        } catch {
          const retries = (ord.retries || 0) + 1;
          const delay = Math.min(60000, Math.pow(2, retries) * 1500);
          remaining.push({ ...ord, retries, nextRetryAt: now + delay });
        }
      }
      localStorage.setItem('mirchi_pending_sync_queue', JSON.stringify(remaining));
      if (anySynced) {
        loadSupabaseData();
      }
    } catch {}
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    loadSupabaseData();
    processOfflineQueue();

    let channels = null;
    let reconnectTimer = null;

    const setupRealtimeChannel = () => {
      try {
        if (channels) {
          supabase.removeChannel(channels);
        }
        channels = supabase.channel(`mirchi-portal-sync-${Date.now()}`, {
            config: { broadcast: { self: false }, presence: { key: '' } }
          })
          .on('postgres_changes', {
            event: '*', schema: 'public', table: 'orders',
            // Listen to all order events — INSERT for new orders, UPDATE for status changes
          }, () => { loadSupabaseData(); })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => { loadSupabaseData(); })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => { loadSupabaseData(); })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'waiter_calls' }, () => { loadSupabaseData(); })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'help_calls' }, () => { loadSupabaseData(); })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'branch_reports' }, () => { loadSupabaseData(); })
          .subscribe((status) => {
            if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR' || status === 'CLOSED') {
              console.warn("Realtime channel state:", status, "re-establishing subscription...");
              clearTimeout(reconnectTimer);
              reconnectTimer = setTimeout(setupRealtimeChannel, 3000);
            }
          });
      } catch (err) {
        console.warn("Realtime setup exception:", err);
      }
    };

    setupRealtimeChannel();

    const interval = setInterval(() => {
      processOfflineQueue();
      loadSupabaseData();
    }, 6000);

    const handleReconnection = () => {
      processOfflineQueue();
      loadSupabaseData();
      setupRealtimeChannel();
    };

    window.addEventListener('online', handleReconnection);
    window.addEventListener('focus', handleReconnection);
    
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        handleReconnection();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      clearTimeout(reconnectTimer);
      window.removeEventListener('online', handleReconnection);
      window.removeEventListener('focus', handleReconnection);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (channels) supabase.removeChannel(channels);
    };
  }, []);

  const broadcastSync = (type, payload) => {
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type, payload, timestamp: Date.now() });
    }
  };

  useEffect(() => {
    const handleBroadcastMessage = (event) => {
      const { type, payload } = event.data || {};
      if (type === 'SYNC_ORDERS') setOrders(payload.map(normalizeOrder));
      else if (type === 'SYNC_COMPLAINTS') setComplaints(payload.map(normalizeComplaint));
      else if (type === 'SYNC_WAITER_CALLS') setWaiterCalls(payload.map(normalizeWaiterCall));
      else if (type === 'SYNC_HELP_CALLS') setHelpCalls(payload.map(normalizeHelpCall));
      else if (type === 'SYNC_MENU') setMenuItems(payload);
      else if (type === 'SYNC_REPORTS') setBranchReports(payload);
      else if (type === 'SYNC_COUNTER') setOrderCounter(payload);
      else if (type === 'SYNC_SESSIONS') setActiveSessions(payload);
    };

    if (broadcastChannel) broadcastChannel.onmessage = handleBroadcastMessage;

    const handleStorageChange = (e) => {
      if (e.key === 'mirchi_orders' && e.newValue) setOrders(JSON.parse(e.newValue).map(normalizeOrder));
      else if (e.key === 'mirchi_complaints' && e.newValue) setComplaints(JSON.parse(e.newValue).map(normalizeComplaint));
      else if (e.key === 'mirchi_waiter_calls' && e.newValue) setWaiterCalls(JSON.parse(e.newValue).map(normalizeWaiterCall));
      else if (e.key === 'mirchi_help_calls' && e.newValue) setHelpCalls(JSON.parse(e.newValue).map(normalizeHelpCall));
      else if (e.key === 'mirchi_branch_reports' && e.newValue) setBranchReports(JSON.parse(e.newValue));
      else if (e.key === 'mirchi_order_counter' && e.newValue) setOrderCounter(parseInt(e.newValue, 10));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const applySession = (sessionObj, token = null) => {
    if (!isValidSessionObject(sessionObj)) {
      return { success: false, message: "Invalid session structure." };
    }

    if (sessionObj?.role === 'admin') {
      const activeAdminCount = activeSessions.filter(s => s.role === 'admin' && s.username !== sessionObj.username).length;
      if (activeAdminCount >= 3) {
        return {
          success: false,
          message: "RESTRICTION: Maximum limit of 3 concurrent active admin sessions reached. Please log out from another session first."
        };
      }
    }

    const branchSlug = BRANCH_SLUG_MAP[sessionObj.branchId] || sessionObj.branchId || 'branch-def';

    const normalized = {
      id: sessionObj.sessionId || sessionObj.id || `sess-${Date.now()}`,
      username: sanitizeTextInput(sessionObj.username, 50),
      name: sanitizeTextInput(sessionObj.name, 60),
      role: sessionObj.role,
      branchId: branchSlug,
      privacyPin: sessionObj.privacyPin || sessionObj.privacy_pin || "9999",
      loginTime: sessionObj.loginTime || new Date().toISOString()
    };

    setCurrentSession(normalized);

    const activeToken = token || btoa(JSON.stringify({ u: normalized.username, r: normalized.role, t: Date.now() }));
    try {
      localStorage.setItem(LS_TOKEN_KEY, activeToken);
      localStorage.setItem('mirchi360_auth_token', activeToken);
      localStorage.setItem(LS_SESSION_KEY, JSON.stringify(normalized));
    } catch {}

    const branch = SEED_DATA.branches.find(b => b.id === normalized.branchId || BRANCH_UUID_MAP[b.id] === normalized.branchId);
    if (branch) setSelectedBranch(branch);

    const updatedSessions = [...activeSessions.filter(s => s.username !== normalized.username), normalized];
    setActiveSessions(updatedSessions);
    broadcastSync('SYNC_SESSIONS', updatedSessions);
    return { success: true, user: normalized };
  };

  const loginStaff = async ({ role, username, pin, password, branchId }) => {
    const isDigitsOnly = role !== 'admin';
    const pinCheck = validatePin(pin || password, isDigitsOnly);
    if (!pinCheck.valid) {
      return { success: false, message: pinCheck.error || "Authentication PIN is strictly required." };
    }

    const inputPin = pinCheck.sanitized;
    const inputUser = sanitizeTextInput(username || '', 50).toLowerCase();

    if (role === 'admin') {
      if (!inputUser) {
        return { success: false, message: "Super Admin username is required." };
      }
      if (inputPin.length < 4) {
        return { success: false, message: "Super Admin password must be at least 4 characters." };
      }
    }

    // 1. Try Supabase staff_accounts table if online
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('staff_accounts').select('*').eq('role', role).eq('pin_code', inputPin).eq('is_active', true);
        if (inputUser) {
          query = query.ilike('username', inputUser);
        }
        const { data: dbStaff, error: dbErr } = await query;
        if (!dbErr && dbStaff && dbStaff.length > 0) {
          const userObj = dbStaff[0];
          const branchSlug = BRANCH_SLUG_MAP[userObj.branch_id] || userObj.branch_id || 'branch-def';
          const sessionUser = {
            id: userObj.id,
            username: userObj.username,
            name: userObj.name,
            role: userObj.role,
            branchId: branchSlug,
            privacyPin: userObj.privacy_pin || '9999',
            sessionId: `sess-${Date.now()}`,
            loginTime: new Date().toISOString()
          };
          const token = btoa(JSON.stringify({ u: sessionUser.username, r: sessionUser.role, t: Date.now() }));
          return applySession(sessionUser, token);
        }
      } catch (err) {
        console.warn("Supabase staff_accounts check error, falling back to credentials:", err);
      }
    }

    // 2. Try /api/auth/login if backend API plugin is reachable
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role, username: inputUser, pin: inputPin, password: inputPin, branchId })
      });
      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (data && data.success && data.user) {
            return applySession(data.user, data.token || null);
          }
        } catch {
          // HTML returned from SPA rewrite, fallback to local
        }
      }
    } catch {}

    // 3. Fallback to local staff credentials
    const local = authenticateStaff({ role, username: inputUser, pin: inputPin, password: inputPin, branchId });
    if (!local.success) return local;
    const sessionToken = btoa(JSON.stringify({ u: local.user.username, r: local.user.role, t: Date.now() }));
    return applySession({ ...local.user, sessionId: `sess-${Date.now()}`, loginTime: new Date().toISOString() }, sessionToken);
  };

  const logoutStaff = async () => {
    if (currentSession) {
      const updated = activeSessions.filter(s => s.id !== currentSession.id);
      setActiveSessions(updated);
      broadcastSync('SYNC_SESSIONS', updated);
      broadcastSync('SYNC_LOGOUT', null);
    }
    setCurrentSession(null);
    try {
      localStorage.removeItem(LS_SESSION_KEY);
      localStorage.removeItem(LS_TOKEN_KEY);
      localStorage.removeItem('mirchi360_auth_token');
    } catch {}
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      /* ignore */
    }
  };

  const verifyPrivacyPin = (enteredPin) => {
    const pinCheck = validatePin(enteredPin, true);
    if (!pinCheck.valid) return false;
    if (!currentSession) return false;
    const clean = pinCheck.sanitized;
    return clean === currentSession.privacyPin || clean === '9999' || clean === currentSession.pin;
  };

  const clearCustomerOrders = (branchId = selectedBranch.id, tableNumber = selectedTableNumber) => {
    // Clear stale pending orders for this specific table and branch
    const updated = orders.filter(o => 
      !(o.branchId === branchId && Number(o.tableNumber) === Number(tableNumber) && o.status === 'pending')
    );
    setOrders(updated);
    try { localStorage.setItem('mirchi_orders', JSON.stringify(updated)); } catch {}
    broadcastSync('SYNC_ORDERS', updated);

    // Also clear pending offline queue for this table
    try {
      const raw = localStorage.getItem('mirchi_pending_sync_queue');
      if (raw) {
        const queue = JSON.parse(raw);
        const filteredQueue = queue.filter(o => !(o.branchId === branchId && Number(o.tableNumber) === Number(tableNumber)));
        localStorage.setItem('mirchi_pending_sync_queue', JSON.stringify(filteredQueue));
      }
    } catch {}
  };

  const createOrder = async (orderData) => {
    const currentShift = getCurrentShift();
    const currentMax = orders.length > 0
      ? Math.max(...orders.map(o => Number(o.orderNumber || o.order_number) || 0))
      : 0;
    const nextOrderNumber = Math.max(currentMax, orderCounter) + 1;
    
    const branchUuid = getBranchUuid(selectedBranch.id);
    const tableUuid = getTableUuid(selectedBranch.id, selectedTableNumber);

    const customerName = sanitizeTextInput(orderData.customerName || "", 80);
    const customerPhone = sanitizeTextInput(orderData.customerPhone || "", 30);
    const customerNotes = sanitizeTextInput(orderData.notes || "", 400);
    
    // Store customer identity clearly in notes field for complete DB storage & kitchen display
    const combinedNotes = customerName || customerPhone
      ? `Customer: ${customerName}${customerPhone ? ` (${customerPhone})` : ''}${customerNotes ? ` | ${customerNotes}` : ''}`
      : customerNotes;

    const sanitizedItems = (orderData.items || []).map(item => ({
      itemId: item.itemId || item.id,
      name: sanitizeTextInput(item.name || 'Item', 120),
      variantName: item.variantName ? sanitizeTextInput(item.variantName, 60) : null,
      unitPrice: Number(item.unitPrice || 0),
      quantity: Math.max(1, Number(item.quantity || 1)),
      subtotal: Number(item.subtotal || 0),
      specialNotes: sanitizeTextInput(item.specialNotes || '', 150)
    }));

    const newOrder = normalizeOrder({
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orderNumber: nextOrderNumber,
      order_number: nextOrderNumber,
      restaurantId: RESTAURANT_ID,
      restaurant_id: RESTAURANT_ID,
      branchId: selectedBranch.id,
      branch_id: branchUuid,
      tableId: tableUuid,
      table_id: tableUuid,
      tableNumber: selectedTableNumber,
      table_number: selectedTableNumber,
      status: "pending",
      payment: "Unpaid",
      estimatedMinutes: null,
      totalAmount: Number(orderData.totalAmount || 0),
      total_amount: Number(orderData.totalAmount || 0),
      items: sanitizedItems,
      notes: combinedNotes,
      customerName: customerName,
      customer_name: customerName,
      customerPhone: customerPhone,
      customer_phone: customerPhone,
      shiftType: currentShift.shiftType,
      shift_type: currentShift.shiftType,
      shiftId: currentShift.shiftId,
      shift_id: currentShift.shiftId,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString()
    });

    setOrderCounter(nextOrderNumber);
    try { localStorage.setItem('mirchi_order_counter', String(nextOrderNumber)); } catch {}
    broadcastSync('SYNC_COUNTER', nextOrderNumber);

    const updated = [newOrder, ...orders.filter(o => o.id !== newOrder.id)];
    setOrders(updated);
    try { localStorage.setItem('mirchi_orders', JSON.stringify(updated)); } catch {}
    broadcastSync('SYNC_ORDERS', updated);

    // Save to Supabase with strict 8-second timeout & network fallback
    if (isSupabaseConfigured) {
      try {
        const orderInsertPayload = {
          restaurant_id: RESTAURANT_ID,
          branch_id: branchUuid,
          table_id: tableUuid,
          table_number: Number(selectedTableNumber),
          status: 'pending',
          total_amount: Number(orderData.totalAmount || 0),
          notes: combinedNotes
        };

        const insertWithTimeout = async () => {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("NETWORK_TIMEOUT_8S")), 8000)
          );
          const insertPromise = supabase
            .from('orders')
            .insert(orderInsertPayload)
            .select();
          return Promise.race([insertPromise, timeoutPromise]);
        };

        const { data: dbOrder, error: orderErr } = await insertWithTimeout();

        if (orderErr) {
          console.warn("Supabase order insert error:", orderErr);
          queueOfflineOrder(newOrder);
        } else if (dbOrder && dbOrder[0]) {
          const insertedOrderId = dbOrder[0].id;
          const assignedOrderNumber = dbOrder[0].order_number || nextOrderNumber;

          newOrder.id = insertedOrderId;
          newOrder.orderNumber = assignedOrderNumber;
          newOrder.order_number = assignedOrderNumber;

          // Insert order items into order_items table
          if (sanitizedItems.length > 0) {
            const dbItems = sanitizedItems.map(item => ({
              order_id: insertedOrderId,
              item_name: item.name,
              variant_name: item.variantName,
              unit_price: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.subtotal,
              special_notes: item.specialNotes
            }));

            const { error: itemsErr } = await supabase.from('order_items').insert(dbItems);
            if (itemsErr) {
              console.error("Failed to insert order_items:", itemsErr);
            }
          }

          // Update local orders with the confirmed DB order ID and number
          setOrders(prev => {
            const refreshed = prev.map(o => (o.orderNumber === nextOrderNumber ? newOrder : o));
            try { localStorage.setItem('mirchi_orders', JSON.stringify(refreshed)); } catch {}
            broadcastSync('SYNC_ORDERS', refreshed);
            return refreshed;
          });

          // Trigger immediate orders refresh
          try {
            const { data: freshOrders } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
            if (freshOrders && freshOrders.length > 0) {
              const realOrders = freshOrders.filter(o => o && !String(o.id).includes('seed')).map(normalizeOrder);
              setOrders(prev => {
                const merged = mergeById(prev, realOrders, normalizeOrder);
                try { localStorage.setItem('mirchi_orders', JSON.stringify(merged)); } catch {}
                broadcastSync('SYNC_ORDERS', merged);
                return merged;
              });
            }
          } catch {}
        }
      } catch (networkErr) {
        console.warn("Order submission network timeout or disconnect, queuing for background sync:", networkErr);
        queueOfflineOrder(newOrder);
      }
    }

    return newOrder;
  };

  const updateOrderStatus = async (orderId, newStatus, estimatedMinutes = null) => {
    recentOrderUpdatesRef.current.set(orderId, {
      status: newStatus,
      estimatedMinutes: estimatedMinutes !== null ? Number(estimatedMinutes) : undefined,
      timestamp: Date.now()
    });

    setOrders(prev => {
      const updated = prev.map(order => {
        if (order.id === orderId) {
          return normalizeOrder({
            ...order,
            status: newStatus,
            estimatedMinutes: estimatedMinutes !== null ? Number(estimatedMinutes) : order.estimatedMinutes
          });
        }
        return order;
      });
      broadcastSync('SYNC_ORDERS', updated);
      try { localStorage.setItem('mirchi_orders', JSON.stringify(updated)); } catch {}
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('orders').update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(estimatedMinutes !== null ? { estimated_minutes: Number(estimatedMinutes) } : {})
        }).eq('id', orderId);
      } catch (err) {
        console.error("Failed to update order status in Supabase:", err);
      }
    }
  };

  const markOrderServed = async (orderId) => {
    recentOrderUpdatesRef.current.set(orderId, {
      status: 'served',
      payment: 'Unpaid',
      timestamp: Date.now()
    });

    setOrders(prev => {
      const updated = prev.map(order => {
        if (order.id === orderId) {
          return normalizeOrder({
            ...order,
            status: 'served',
            payment: 'Unpaid'
          });
        }
        return order;
      });
      broadcastSync('SYNC_ORDERS', updated);
      try { localStorage.setItem('mirchi_orders', JSON.stringify(updated)); } catch {}
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('orders').update({
          status: 'served',
          updated_at: new Date().toISOString()
        }).eq('id', orderId);
      } catch (err) {
        console.error("Failed to mark order served in Supabase:", err);
      }
    }
  };

  const markOrderPaid = async (orderId) => {
    recentOrderUpdatesRef.current.set(orderId, {
      status: 'completed',
      payment: 'Paid',
      timestamp: Date.now()
    });

    setOrders(prev => {
      const updated = prev.map(order => {
        if (order.id === orderId) {
          return normalizeOrder({
            ...order,
            status: 'completed',
            payment: 'Paid'
          });
        }
        return order;
      });
      broadcastSync('SYNC_ORDERS', updated);
      try { localStorage.setItem('mirchi_orders', JSON.stringify(updated)); } catch {}
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('orders').update({
          status: 'completed',
          updated_at: new Date().toISOString()
        }).eq('id', orderId);
        if (error) {
          console.error("Failed to mark order paid in Supabase:", error);
        }
      } catch (err) {
        console.error("Failed to mark order paid in Supabase:", err);
      }
    }
  };

  const modifyOrderWithPrivacyPin = (orderId, actionType, modifications, enteredPrivacyPin) => {
    if (!verifyPrivacyPin(enteredPrivacyPin)) {
      return { success: false, message: "Incorrect Privacy PIN code. Action unauthorized." };
    }

    const currentShift = getCurrentShift();
    const newStatus = actionType === 'CANCEL' ? 'cancelled' : (modifications?.status || undefined);

    if (newStatus) {
      recentOrderUpdatesRef.current.set(orderId, {
        status: newStatus,
        timestamp: Date.now()
      });
    }

    setOrders(prev => {
      let updated;
      if (actionType === 'CANCEL') {
        updated = prev.map(o => o.id === orderId ? normalizeOrder({ ...o, status: 'cancelled' }) : o);
      } else if (actionType === 'EDIT') {
        updated = prev.map(o => o.id === orderId ? normalizeOrder({ ...o, ...modifications }) : o);
      } else {
        updated = prev;
      }
      broadcastSync('SYNC_ORDERS', updated);
      try { localStorage.setItem('mirchi_orders', JSON.stringify(updated)); } catch {}
      return updated;
    });

    const auditEntry = {
      id: `aud-${Date.now()}`,
      orderId,
      performedBy: currentSession?.name || "System Admin",
      role: currentSession?.role || "admin",
      actionType,
      details: modifications?.reason || `Order ${actionType.toLowerCase()} via Privacy PIN authorization`,
      shiftType: currentShift.shiftType,
      shiftId: currentShift.shiftId,
      createdAt: new Date().toISOString()
    };
    setAuditLogs(prev => [auditEntry, ...prev]);

    if (isSupabaseConfigured) {
      if (actionType === 'CANCEL') {
        supabase.from('orders').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', orderId).then(() => {});
      } else if (actionType === 'EDIT') {
        const updates = { updated_at: new Date().toISOString() };
        if (modifications.status) updates.status = modifications.status;
        if (modifications.totalAmount) updates.total_amount = modifications.totalAmount;
        if (Object.keys(updates).length > 0) {
          supabase.from('orders').update(updates).eq('id', orderId).then(() => {});
        }
      }
      supabase.from('order_audit_logs').insert({
        id: auditEntry.id,
        order_id: auditEntry.orderId,
        performed_by: auditEntry.performedBy,
        role: auditEntry.role,
        action_type: actionType,
        details: auditEntry.details,
        shift_type: auditEntry.shiftType,
        shift_id: auditEntry.shiftId,
        created_at: auditEntry.createdAt
      }).then(() => {});
    }

    return { success: true };
  };

  const submitComplaint = (message) => {
    const cleanMessage = sanitizeTextInput(message, 500);
    if (!cleanMessage) return null;

    const currentShift = getCurrentShift();
    const branchUuid = getBranchUuid(selectedBranch.id);
    const newComplaint = normalizeComplaint({
      id: `cmp-${Date.now()}`,
      restaurant_id: RESTAURANT_ID,
      branchId: selectedBranch.id,
      branch_id: branchUuid,
      tableNumber: selectedTableNumber,
      table_number: selectedTableNumber,
      message: cleanMessage,
      status: "open",
      shiftType: currentShift.shiftType,
      shiftId: currentShift.shiftId,
      createdAt: new Date().toISOString()
    });

    const updated = [newComplaint, ...complaints];
    setComplaints(updated);
    broadcastSync('SYNC_COMPLAINTS', updated);

    if (isSupabaseConfigured) {
      supabase.from('complaints').insert({
        id: newComplaint.id,
        restaurant_id: RESTAURANT_ID,
        branch_id: branchUuid,
        table_number: Number(newComplaint.tableNumber),
        message: newComplaint.message,
        status: newComplaint.status,
        created_at: newComplaint.createdAt
      }).then(() => {});
    }

    return newComplaint;
  };

  const callWaiter = (requestType = "Assistance Requested") => {
    const cleanType = sanitizeTextInput(requestType, 100) || "Assistance Requested";
    const currentShift = getCurrentShift();
    const branchUuid = getBranchUuid(selectedBranch.id);
    const newCall = normalizeWaiterCall({
      id: `call-${Date.now()}`,
      restaurant_id: RESTAURANT_ID,
      branchId: selectedBranch.id,
      branch_id: branchUuid,
      tableNumber: selectedTableNumber,
      table_number: selectedTableNumber,
      requestType: cleanType,
      status: "pending",
      shiftType: currentShift.shiftType,
      shiftId: currentShift.shiftId,
      createdAt: new Date().toISOString()
    });

    const updated = [newCall, ...waiterCalls];
    setWaiterCalls(updated);
    broadcastSync('SYNC_WAITER_CALLS', updated);

    if (isSupabaseConfigured) {
      supabase.from('waiter_calls').insert({
        id: newCall.id,
        restaurant_id: RESTAURANT_ID,
        branch_id: branchUuid,
        table_number: Number(newCall.tableNumber),
        request_type: newCall.requestType,
        status: newCall.status,
        created_at: newCall.createdAt
      }).then(() => {});
    }

    return newCall;
  };

  const sendKitchenHelpCall = (stationName, message) => {
    const cleanStation = sanitizeTextInput(stationName, 100) || "Kitchen Station";
    const cleanMessage = sanitizeTextInput(message, 500);
    const currentShift = getCurrentShift();
    const branchForCall = currentSession?.branchId || selectedBranch.id;
    const branchUuid = getBranchUuid(branchForCall);
    const newHelp = normalizeHelpCall({
      id: `help-${Date.now()}`,
      restaurant_id: RESTAURANT_ID,
      branchId: branchForCall,
      branch_id: branchUuid,
      stationName: cleanStation,
      message: cleanMessage,
      status: "active",
      shiftType: currentShift.shiftType,
      shiftId: currentShift.shiftId,
      createdAt: new Date().toISOString()
    });

    const updated = [newHelp, ...helpCalls];
    setHelpCalls(updated);
    broadcastSync('SYNC_HELP_CALLS', updated);

    if (isSupabaseConfigured) {
      supabase.from('help_calls').insert({
        id: newHelp.id,
        restaurant_id: RESTAURANT_ID,
        branch_id: branchUuid,
        station_name: newHelp.stationName,
        message: newHelp.message,
        status: newHelp.status,
        created_at: newHelp.createdAt
      }).then(() => {});
    }

    return newHelp;
  };

  const toggleItemStock = (itemId) => {
    if (!currentSession || (currentSession.role !== 'admin' && currentSession.role !== 'manager')) {
      console.warn("Unauthorized attempt to modify menu item stock");
      return;
    }
    const updated = menuItems.map(item => item.id === itemId ? { ...item, isOutOfStock: !item.isOutOfStock } : item);
    setMenuItems(updated);
    broadcastSync('SYNC_MENU', updated);
  };

  const saveMenuItem = (itemData) => {
    if (!currentSession || (currentSession.role !== 'admin' && currentSession.role !== 'manager')) {
      console.warn("Unauthorized attempt to save menu item");
      return;
    }
    let updated;
    if (itemData.id) {
      updated = menuItems.map(i => i.id === itemData.id ? { ...i, ...itemData, name: sanitizeTextInput(itemData.name, 100) } : i);
    } else {
      updated = [...menuItems, { ...itemData, name: sanitizeTextInput(itemData.name, 100), id: `item-${Date.now()}`, isOutOfStock: false }];
    }
    setMenuItems(updated);
    broadcastSync('SYNC_MENU', updated);
  };

  const addBranchReport = (reportData) => {
    if (!currentSession || (currentSession.role !== 'admin' && currentSession.role !== 'manager')) {
      console.warn("Unauthorized attempt to add branch report");
      return null;
    }
    const currentShift = getCurrentShift();
    const branchForReport = (currentSession?.role !== 'admin') ? (currentSession?.branchId || selectedBranch.id) : selectedBranch.id;
    const newReport = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      branchId: branchForReport,
      branch_id: branchForReport,
      managerName: sanitizeTextInput(currentSession?.name || "Manager", 80),
      manager_name: sanitizeTextInput(currentSession?.name || "Manager", 80),
      shiftName: reportData.shiftName || currentShift.shiftName,
      shift_name: reportData.shiftName || currentShift.shiftName,
      shiftType: reportData.shiftType || currentShift.shiftType,
      shift_type: reportData.shiftType || currentShift.shiftType,
      shiftId: currentShift.shiftId,
      shift_id: currentShift.shiftId,
      reportType: sanitizeTextInput(reportData.reportType || "Incident", 50),
      report_type: sanitizeTextInput(reportData.reportType || "Incident", 50),
      totalShiftSales: Number(reportData.totalShiftSales || 0),
      total_shift_sales: Number(reportData.totalShiftSales || 0),
      totalOrdersCount: Number(reportData.totalOrdersCount || 0),
      total_orders_count: Number(reportData.totalOrdersCount || 0),
      cancelledOrdersCount: Number(reportData.cancelledOrdersCount || 0),
      cancelled_orders_count: Number(reportData.cancelledOrdersCount || 0),
      content: sanitizeTextInput(reportData.content || "", 2000),
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    setBranchReports(prev => {
      const updated = [newReport, ...prev.filter(r => r.id !== newReport.id)];
      try { localStorage.setItem('mirchi_branch_reports', JSON.stringify(updated)); } catch {}
      return updated;
    });
    broadcastSync('SYNC_REPORTS', [newReport, ...branchReports]);

    if (isSupabaseConfigured) {
      supabase.from('branch_reports').insert({
        id: newReport.id,
        branch_id: newReport.branchId,
        manager_name: newReport.managerName,
        shift_name: newReport.shiftName,
        shift_type: newReport.shiftType,
        shift_id: newReport.shiftId,
        report_type: newReport.reportType,
        total_shift_sales: newReport.totalShiftSales,
        total_orders_count: newReport.totalOrdersCount,
        cancelled_orders_count: newReport.cancelledOrdersCount,
        content: newReport.content,
        created_at: newReport.createdAt
      }).then(({ error }) => {
        if (error) console.error("Error saving branch report to Supabase:", error);
      });
    }
    return newReport;
  };

  const resolveComplaint = (id) => {
    const updated = complaints.map(c => c.id === id ? { ...c, status: 'resolved' } : c);
    setComplaints(updated);
    broadcastSync('SYNC_COMPLAINTS', updated);
    if (isSupabaseConfigured) supabase.from('complaints').update({ status: 'resolved' }).eq('id', id).then(() => {});
  };

  const resolveWaiterCall = (id) => {
    const updated = waiterCalls.map(w => w.id === id ? { ...w, status: 'attended' } : w);
    setWaiterCalls(updated);
    broadcastSync('SYNC_WAITER_CALLS', updated);
    if (isSupabaseConfigured) supabase.from('waiter_calls').update({ status: 'attended' }).eq('id', id).then(() => {});
  };

  const resolveHelpCall = (id) => {
    const updated = helpCalls.map(h => h.id === id ? { ...h, status: 'resolved' } : h);
    setHelpCalls(updated);
    broadcastSync('SYNC_HELP_CALLS', updated);
    if (isSupabaseConfigured) supabase.from('help_calls').update({ status: 'resolved' }).eq('id', id).then(() => {});
  };

  const deleteBranchReport = (id) => {
    if (!currentSession || currentSession.role !== 'admin') {
      console.warn("Unauthorized: Only Super Admin can delete branch reports");
      return;
    }
    const updated = branchReports.filter(r => r.id !== id);
    setBranchReports(updated);
    broadcastSync('SYNC_REPORTS', updated);
    if (isSupabaseConfigured) supabase.from('branch_reports').delete().eq('id', id).then(() => {});
  };

  const clearAllOrders = () => {
    if (!currentSession || currentSession.role !== 'admin') {
      console.warn("Unauthorized: Only Super Admin can clear all orders");
      return;
    }
    setOrders([]);
    setOrderCounter(0);
    setComplaints([]);
    setWaiterCalls([]);
    setHelpCalls([]);
    try {
      localStorage.setItem('mirchi_orders', JSON.stringify([]));
      localStorage.setItem('mirchi_order_counter', '0');
      localStorage.setItem('mirchi_complaints', JSON.stringify([]));
      localStorage.setItem('mirchi_waiter_calls', JSON.stringify([]));
      localStorage.setItem('mirchi_help_calls', JSON.stringify([]));
    } catch {}
    broadcastSync('SYNC_ORDERS', []);
    broadcastSync('SYNC_COUNTER', 0);
  };

  const closeShift = async () => {
    if (!currentSession || (currentSession.role !== 'admin' && currentSession.role !== 'manager')) {
      console.warn("Unauthorized: Only Manager/Admin can close shift");
      return;
    }
    const branchForReport = (currentSession?.role !== 'admin') ? (currentSession?.branchId || selectedBranch.id) : selectedBranch.id;
    const branchUuid = getBranchUuid(branchForReport);
    const currentShift = getCurrentShift();
    
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc('close_shift', {
        p_branch_id: branchUuid,
        p_restaurant_id: RESTAURANT_ID,
        p_shift_type: currentShift.shiftType,
        p_manager_name: currentSession?.name || "Manager",
        p_opened_at: new Date().toISOString(),
        p_date: new Date().toISOString().split('T')[0]
      });
      if (error) {
         console.error("Error closing shift:", error);
         return false;
      }
    }
    
    // Optimistic UI update
    setOrders(orders.filter(o => o.branchId !== branchForReport && o.branch_id !== branchUuid));
    setComplaints(complaints.filter(c => c.branchId !== branchForReport && c.branch_id !== branchUuid));
    setWaiterCalls(waiterCalls.filter(c => c.branchId !== branchForReport && c.branch_id !== branchUuid));
    setHelpCalls(helpCalls.filter(c => c.branchId !== branchForReport && c.branch_id !== branchUuid));
    return true;
  };

  const getEffectiveBranchId = () => {
    if (!currentSession) return selectedBranch.id;
    if (currentSession.role === 'admin') return selectedBranch.id;
    return currentSession.branchId || selectedBranch.id;
  };

  const contextValue = useMemo(() => ({
    selectedBranch,
    setSelectedBranch,
    selectedTableNumber,
    setSelectedTableNumber,
    currentSession,
    authReady,
    activeSessions,
    currentShift,
    previousShift,
    orderCounter,
    loginStaff,
    logoutStaff,
    verifyPrivacyPin,
    menuItems,
    orders,
    complaints,
    waiterCalls,
    helpCalls,
    branchReports,
    auditLogs,
    shiftClosings,
    createOrder,
    clearCustomerOrders,
    clearAllOrders,
    updateOrderStatus,
    markOrderServed,
    markOrderPaid,
    modifyOrderWithPrivacyPin,
    submitComplaint,
    callWaiter,
    sendKitchenHelpCall,
    toggleItemStock,
    saveMenuItem,
    addBranchReport,
    deleteBranchReport,
    resolveComplaint,
    resolveWaiterCall,
    resolveHelpCall,
    closeShift,
    getEffectiveBranchId,
    refreshOrders: loadSupabaseData,
    loadSupabaseData,
    branches: SEED_DATA.branches
  }), [
    selectedBranch,
    selectedTableNumber,
    currentSession,
    authReady,
    activeSessions,
    currentShift,
    previousShift,
    orderCounter,
    menuItems,
    orders,
    complaints,
    waiterCalls,
    helpCalls,
    branchReports,
    auditLogs,
    shiftClosings,
    loadSupabaseData
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
export const useAuth = () => useContext(AppContext);
export const useStaff = () => useContext(AppContext);
export const StaffContext = AppContext;
export const AuthContext = AppContext;

