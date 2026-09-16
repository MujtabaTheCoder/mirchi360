import React, { createContext, useContext, useState, useEffect } from 'react';
import { SEED_DATA } from './initialData';
import { supabase, isSupabaseConfigured } from './supabase';
import { authenticateStaff } from './staffCredentials';

// Automatically purge all demo / seed items from localStorage on startup
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
            const clean = parsed.filter(item => item && !String(item.id).includes('seed') && !String(item.id).startsWith('seed-'));
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

  return {
    ...o,
    id: o.id,
    orderNumber: o.orderNumber || o.order_number || 100,
    branchId: o.branchId || o.branch_id || "branch-def",
    tableId: o.tableId || o.table_id || null,
    tableNumber: Number(o.tableNumber || o.table_number || 4),
    status: o.status || "pending",
    payment: o.payment || (o.status === 'completed' ? 'Paid' : 'Unpaid'),
    estimatedMinutes: o.estimatedMinutes !== undefined ? o.estimatedMinutes : (o.estimated_minutes || null),
    totalAmount: Number(o.totalAmount || o.total_amount || 0),
    items: o.items || o.order_items || [],
    notes: o.notes || "",
    customerName: o.customerName || o.customer_name || "",
    customerPhone: o.customerPhone || o.customer_phone || "",
    shiftType: o.shiftType || o.shift_type || shiftInfo.shiftType,
    shiftId: o.shiftId || o.shift_id || shiftInfo.shiftId,
    createdAt: o.createdAt || o.created_at || new Date().toISOString()
  };
};

export const normalizeComplaint = (c) => {
  const shiftInfo = getCurrentShift(c.createdAt ? new Date(c.createdAt) : new Date());
  return {
    ...c,
    id: c.id,
    branchId: c.branchId || c.branch_id || "branch-def",
    tableNumber: Number(c.tableNumber || c.table_number || 4),
    message: c.message || "",
    status: c.status || "open",
    shiftType: c.shiftType || c.shift_type || shiftInfo.shiftType,
    shiftId: c.shiftId || c.shift_id || shiftInfo.shiftId,
    createdAt: c.createdAt || c.created_at || new Date().toISOString()
  };
};

export const normalizeWaiterCall = (w) => {
  const shiftInfo = getCurrentShift(w.createdAt ? new Date(w.createdAt) : new Date());
  return {
    ...w,
    id: w.id,
    branchId: w.branchId || w.branch_id || "branch-def",
    tableNumber: Number(w.tableNumber || w.table_number || 4),
    requestType: w.requestType || w.request_type || "Assistance",
    status: w.status || "pending",
    shiftType: w.shiftType || w.shift_type || shiftInfo.shiftType,
    shiftId: w.shiftId || w.shift_id || shiftInfo.shiftId,
    createdAt: w.createdAt || w.created_at || new Date().toISOString()
  };
};

export const normalizeHelpCall = (h) => {
  const shiftInfo = getCurrentShift(h.createdAt ? new Date(h.createdAt) : new Date());
  return {
    ...h,
    id: h.id,
    branchId: h.branchId || h.branch_id || "branch-def",
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
    const params = new URLSearchParams(window.location.search);
    const b = params.get('branch');
    if (b && b.toLowerCase().includes('qas')) return SEED_DATA.branches[1];
    return SEED_DATA.branches[0];
  });

  const [selectedTableNumber, setSelectedTableNumber] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('table');
    return t ? parseInt(t, 10) : 4;
  });

  const [currentSession, setCurrentSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [currentShift, setCurrentShift] = useState(() => getCurrentShift());
  const [previousShift, setPreviousShift] = useState(() => getCurrentShift());
  
  const [activeSessions, setActiveSessions] = useState(() => {
    const saved = localStorage.getItem('mirchi_active_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const [orderCounter, setOrderCounter] = useState(() => {
    try {
      const savedOrders = localStorage.getItem('mirchi_orders');
      if (savedOrders) {
        const parsed = JSON.parse(savedOrders).filter(o => o && !String(o.id).includes('seed'));
        if (parsed.length > 0) {
          const maxNum = Math.max(...parsed.map(o => Number(o.orderNumber) || 0));
          return maxNum > 0 ? maxNum : 0;
        }
      }
    } catch {}
    try { localStorage.setItem('mirchi_order_counter', '0'); } catch {}
    return 0; // Starts from 0, so the very first order will be Invoice #1
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
          // Strictly purge all demo/seed orders
          const realOrders = parsed.filter(o => o && !String(o.id).includes('seed'));
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
          console.log(`Shift changed from ${prevShift.shiftType} to ${newShift.shiftType}. Sessions remain active.`);
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
        const lsToken = localStorage.getItem(LS_TOKEN_KEY);
        
        if (lsSession && lsToken) {
          try {
            const parsedSession = JSON.parse(lsSession);
            if (parsedSession && parsedSession.id) {
              setCurrentSession(parsedSession);
              const branch = SEED_DATA.branches.find(b => b.id === parsedSession.branchId);
              if (branch) setSelectedBranch(branch);
              setAuthReady(true);
              return;
            } else {
              localStorage.removeItem(LS_SESSION_KEY);
              localStorage.removeItem(LS_TOKEN_KEY);
              setAuthReady(true);
              return;
            }
          } catch {
            localStorage.removeItem(LS_SESSION_KEY);
            localStorage.removeItem(LS_TOKEN_KEY);
            setAuthReady(true);
            return;
          }
        }

        try {
          const res = await fetch('/api/auth/session', { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            if (!cancelled && data.user) {
              setCurrentSession(data.user);
              const branch = SEED_DATA.branches.find(b => b.id === data.user.branchId);
              if (branch) setSelectedBranch(branch);
              setAuthReady(true);
              return;
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

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const loadSupabaseData = async () => {
      try {
        // Clean any old seed rows from Supabase database in the background
        supabase.from('orders').delete().ilike('id', '%seed%').then(() => {});
        supabase.from('complaints').delete().ilike('id', '%seed%').then(() => {});
        supabase.from('waiter_calls').delete().ilike('id', '%seed%').then(() => {});
        supabase.from('help_calls').delete().ilike('id', '%seed%').then(() => {});
        supabase.from('branch_reports').delete().ilike('id', '%seed%').then(() => {});
        supabase.from('order_audit_logs').delete().ilike('id', '%seed%').then(() => {});

        const [
          { data: ordersData },
          { data: complaintsData },
          { data: waiterCallsData },
          { data: helpCallsData },
          { data: reportsData },
          { data: auditData }
        ] = await Promise.all([
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('complaints').select('*').order('created_at', { ascending: false }),
          supabase.from('waiter_calls').select('*').order('created_at', { ascending: false }),
          supabase.from('help_calls').select('*').order('created_at', { ascending: false }),
          supabase.from('branch_reports').select('*').order('created_at', { ascending: false }),
          supabase.from('order_audit_logs').select('*').order('created_at', { ascending: false })
        ]);

        if (ordersData && ordersData.length > 0) {
          const realOrders = ordersData.filter(o => o && !String(o.id).includes('seed') && !String(o.id).startsWith('seed-'));
          setOrders(prev => {
            const merged = mergeById(prev, realOrders, normalizeOrder);
            try { localStorage.setItem('mirchi_orders', JSON.stringify(merged)); } catch {}
            return merged;
          });
          // Sync order counter with highest order number in database
          const maxNum = Math.max(0, ...realOrders.map(o => Number(o.order_number || o.orderNumber) || 0));
          if (maxNum > 0) {
            setOrderCounter(prev => {
              const higher = Math.max(prev, maxNum);
              try { localStorage.setItem('mirchi_order_counter', String(higher)); } catch {}
              return higher;
            });
          }
        }
        if (complaintsData && complaintsData.length > 0) {
          const realComplaints = complaintsData.filter(c => c && !String(c.id).includes('seed') && !String(c.id).startsWith('seed-'));
          setComplaints(prev => {
            const merged = mergeById(prev, realComplaints, normalizeComplaint);
            try { localStorage.setItem('mirchi_complaints', JSON.stringify(merged)); } catch {}
            return merged;
          });
        }
        if (waiterCallsData && waiterCallsData.length > 0) {
          const realWaiterCalls = waiterCallsData.filter(w => w && !String(w.id).includes('seed') && !String(w.id).startsWith('seed-'));
          setWaiterCalls(prev => {
            const merged = mergeById(prev, realWaiterCalls, normalizeWaiterCall);
            try { localStorage.setItem('mirchi_waiter_calls', JSON.stringify(merged)); } catch {}
            return merged;
          });
        }
        if (helpCallsData && helpCallsData.length > 0) {
          const realHelpCalls = helpCallsData.filter(h => h && !String(h.id).includes('seed') && !String(h.id).startsWith('seed-'));
          setHelpCalls(prev => {
            const merged = mergeById(prev, realHelpCalls, normalizeHelpCall);
            try { localStorage.setItem('mirchi_help_calls', JSON.stringify(merged)); } catch {}
            return merged;
          });
        }
        if (reportsData && reportsData.length > 0) {
          const normReports = reportsData
            .filter(r => r && !String(r.id).includes('seed') && !String(r.id).startsWith('seed-'))
            .map(r => ({
              id: r.id,
              branchId: r.branch_id,
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
              branchId: a.branch_id,
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
            try { localStorage.setItem('mirchi_audit_logs', JSON.stringify(merged)); } catch {}
            return merged;
          });
        }
      } catch (err) {
        console.error("Error loading Supabase data:", err);
      }
    };

    loadSupabaseData();

    const channels = supabase.channel('public-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        loadSupabaseData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, payload => {
        loadSupabaseData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waiter_calls' }, payload => {
        loadSupabaseData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'help_calls' }, payload => {
        loadSupabaseData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'branch_reports' }, payload => {
        loadSupabaseData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channels);
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
    if (sessionObj?.role === 'admin') {
      const activeAdminCount = activeSessions.filter(s => s.role === 'admin' && s.username !== sessionObj.username).length;
      if (activeAdminCount >= 3) {
        return {
          success: false,
          message: "RESTRICTION: Maximum limit of 3 concurrent active admin sessions reached. Please log out from another session first."
        };
      }
    }

    const normalized = {
      id: sessionObj.sessionId || sessionObj.id || `sess-${Date.now()}`,
      username: sessionObj.username,
      name: sessionObj.name,
      role: sessionObj.role,
      branchId: sessionObj.branchId,
      privacyPin: sessionObj.privacyPin || "9999",
      loginTime: sessionObj.loginTime || new Date().toISOString()
    };

    setCurrentSession(normalized);

    if (token) {
      localStorage.setItem(LS_TOKEN_KEY, token);
    } else {
      const fallbackToken = btoa(JSON.stringify({ u: normalized.username, r: normalized.role, t: Date.now() }));
      localStorage.setItem(LS_TOKEN_KEY, fallbackToken);
    }
    localStorage.setItem(LS_SESSION_KEY, JSON.stringify(normalized));

    const branch = SEED_DATA.branches.find(b => b.id === normalized.branchId);
    if (branch) setSelectedBranch(branch);

    const updatedSessions = [...activeSessions.filter(s => s.username !== normalized.username), normalized];
    setActiveSessions(updatedSessions);
    broadcastSync('SYNC_SESSIONS', updatedSessions);
    return { success: true, user: normalized };
  };

  const loginStaff = async ({ role, username, pin, password, branchId }) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role, username, pin, password, branchId })
      });
      const data = await res.json();
      if (!data.success) return { success: false, message: data.message || 'Login failed.' };
      const sessionCookie = data.token || null;
      return applySession(data.user, sessionCookie);
    } catch {
      const local = authenticateStaff({ role, username, pin, password, branchId });
      if (!local.success) return local;
      return applySession({ ...local.user, sessionId: `sess-${Date.now()}`, loginTime: new Date().toISOString() });
    }
  };

  const logoutStaff = async () => {
    if (currentSession) {
      const updated = activeSessions.filter(s => s.id !== currentSession.id);
      setActiveSessions(updated);
      broadcastSync('SYNC_SESSIONS', updated);
      broadcastSync('SYNC_LOGOUT', null);
    }
    setCurrentSession(null);
    localStorage.removeItem(LS_SESSION_KEY);
    localStorage.removeItem(LS_TOKEN_KEY);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      /* ignore */
    }
  };

  const verifyPrivacyPin = (enteredPin) => {
    if (!currentSession) return false;
    if (currentSession.role === 'admin') return true;
    return enteredPin === currentSession.privacyPin;
  };

  const createOrder = (orderData) => {
    const currentShift = getCurrentShift();
    const currentMax = orders.length > 0
      ? Math.max(...orders.map(o => Number(o.orderNumber || o.order_number) || 0))
      : 0;
    const nextOrderNumber = Math.max(currentMax, orderCounter) + 1;
    
    const newOrder = normalizeOrder({
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orderNumber: nextOrderNumber,
      order_number: nextOrderNumber,
      branchId: selectedBranch.id,
      branch_id: selectedBranch.id,
      tableId: `tbl-${selectedBranch.id}-${selectedTableNumber}`,
      table_id: `tbl-${selectedBranch.id}-${selectedTableNumber}`,
      tableNumber: selectedTableNumber,
      table_number: selectedTableNumber,
      status: "pending",
      payment: "Unpaid",
      estimatedMinutes: null,
      totalAmount: Number(orderData.totalAmount || 0),
      total_amount: Number(orderData.totalAmount || 0),
      items: orderData.items || [],
      notes: orderData.notes || "",
      customerName: orderData.customerName || "",
      customer_name: orderData.customerName || "",
      customerPhone: orderData.customerPhone || "",
      customer_phone: orderData.customerPhone || "",
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

    if (isSupabaseConfigured) {
      supabase.from('orders').insert({
        id: newOrder.id,
        order_number: newOrder.orderNumber,
        branch_id: newOrder.branchId,
        table_id: newOrder.tableId,
        table_number: newOrder.tableNumber,
        status: newOrder.status,
        payment: newOrder.payment,
        total_amount: newOrder.totalAmount,
        notes: newOrder.notes,
        customer_name: newOrder.customerName,
        customer_phone: newOrder.customerPhone,
        shift_type: newOrder.shiftType,
        shift_id: newOrder.shiftId,
        items: newOrder.items,
        created_at: newOrder.createdAt
      }).then(({ error }) => {
        if (error) console.error("Error saving order to Supabase:", error);
      });
    }

    return newOrder;
  };

  const updateOrderStatus = (orderId, newStatus, estimatedMinutes = null) => {
    const updated = orders.map(order => {
      if (order.id === orderId) {
        return normalizeOrder({
          ...order,
          status: newStatus,
          estimatedMinutes: estimatedMinutes !== null ? Number(estimatedMinutes) : order.estimatedMinutes
        });
      }
      return order;
    });

    setOrders(updated);
    broadcastSync('SYNC_ORDERS', updated);

    if (isSupabaseConfigured) {
      supabase.from('orders').update({
        status: newStatus,
        ...(estimatedMinutes !== null ? { estimated_minutes: Number(estimatedMinutes) } : {})
      }).eq('id', orderId).then(() => {});
    }
  };

  const markOrderServed = (orderId) => {
    const updated = orders.map(order => {
      if (order.id === orderId) {
        return normalizeOrder({
          ...order,
          status: 'served',
          payment: 'Unpaid'
        });
      }
      return order;
    });

    setOrders(updated);
    broadcastSync('SYNC_ORDERS', updated);

    if (isSupabaseConfigured) {
      supabase.from('orders').update({
        status: 'served',
        payment: 'Unpaid'
      }).eq('id', orderId).then(() => {});
    }
  };

  const markOrderPaid = (orderId) => {
    const updated = orders.map(order => {
      if (order.id === orderId) {
        return normalizeOrder({
          ...order,
          status: 'completed',
          payment: 'Paid'
        });
      }
      return order;
    });

    setOrders(updated);
    broadcastSync('SYNC_ORDERS', updated);

    if (isSupabaseConfigured) {
      supabase.from('orders').update({
        status: 'completed',
        payment: 'Paid'
      }).eq('id', orderId).then(() => {});
    }
  };

  const modifyOrderWithPrivacyPin = (orderId, actionType, modifications, enteredPrivacyPin) => {
    if (currentSession?.role !== 'admin' && !verifyPrivacyPin(enteredPrivacyPin)) {
      return { success: false, message: "Incorrect Privacy PIN code. Action unauthorized." };
    }

    const currentShift = getCurrentShift();
    let updated;
    if (actionType === 'CANCEL') {
      updated = orders.map(o => o.id === orderId ? normalizeOrder({ ...o, status: 'cancelled' }) : o);
    } else if (actionType === 'EDIT') {
      updated = orders.map(o => o.id === orderId ? normalizeOrder({ ...o, ...modifications }) : o);
    } else {
      updated = orders;
    }

    setOrders(updated);
    broadcastSync('SYNC_ORDERS', updated);

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
        supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId).then(() => {});
      } else if (actionType === 'EDIT') {
        const updates = {};
        if (modifications.status) updates.status = modifications.status;
        if (modifications.payment) updates.payment = modifications.payment;
        if (modifications.items) updates.items = modifications.items;
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
        action_type: auditEntry.actionType,
        details: auditEntry.details,
        shift_type: auditEntry.shiftType,
        shift_id: auditEntry.shiftId,
        created_at: auditEntry.createdAt
      }).then(() => {});
    }

    return { success: true };
  };

  const submitComplaint = (message) => {
    const currentShift = getCurrentShift();
    const newComplaint = normalizeComplaint({
      id: `cmp-${Date.now()}`,
      branchId: selectedBranch.id,
      tableNumber: selectedTableNumber,
      message,
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
        branch_id: newComplaint.branchId,
        table_number: newComplaint.tableNumber,
        message: newComplaint.message,
        status: newComplaint.status,
        shift_type: newComplaint.shiftType,
        shift_id: newComplaint.shiftId,
        created_at: newComplaint.createdAt
      }).then(() => {});
    }

    return newComplaint;
  };

  const callWaiter = (requestType = "Assistance Requested") => {
    const currentShift = getCurrentShift();
    const newCall = normalizeWaiterCall({
      id: `call-${Date.now()}`,
      branchId: selectedBranch.id,
      tableNumber: selectedTableNumber,
      requestType,
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
        branch_id: newCall.branchId,
        table_number: newCall.tableNumber,
        request_type: newCall.requestType,
        status: newCall.status,
        shift_type: newCall.shiftType,
        shift_id: newCall.shiftId,
        created_at: newCall.createdAt
      }).then(() => {});
    }

    return newCall;
  };

  const sendKitchenHelpCall = (stationName, message) => {
    const currentShift = getCurrentShift();
    const branchForCall = currentSession?.branchId || selectedBranch.id;
    const newHelp = normalizeHelpCall({
      id: `help-${Date.now()}`,
      branchId: branchForCall,
      stationName,
      message,
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
        branch_id: newHelp.branchId,
        station_name: newHelp.stationName,
        message: newHelp.message,
        status: newHelp.status,
        shift_type: newHelp.shiftType,
        shift_id: newHelp.shiftId,
        created_at: newHelp.createdAt
      }).then(() => {});
    }

    return newHelp;
  };

  const toggleItemStock = (itemId) => {
    const updated = menuItems.map(item => item.id === itemId ? { ...item, isOutOfStock: !item.isOutOfStock } : item);
    setMenuItems(updated);
    broadcastSync('SYNC_MENU', updated);
  };

  const saveMenuItem = (itemData) => {
    let updated;
    if (itemData.id) {
      updated = menuItems.map(i => i.id === itemData.id ? { ...i, ...itemData } : i);
    } else {
      updated = [...menuItems, { ...itemData, id: `item-${Date.now()}`, isOutOfStock: false }];
    }
    setMenuItems(updated);
    broadcastSync('SYNC_MENU', updated);
  };

  const addBranchReport = (reportData) => {
    const currentShift = getCurrentShift();
    const branchForReport = (currentSession?.role !== 'admin') ? (currentSession?.branchId || selectedBranch.id) : selectedBranch.id;
    const newReport = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      branchId: branchForReport,
      branch_id: branchForReport,
      managerName: currentSession?.name || "Manager",
      manager_name: currentSession?.name || "Manager",
      shiftName: reportData.shiftName || currentShift.shiftName,
      shift_name: reportData.shiftName || currentShift.shiftName,
      shiftType: reportData.shiftType || currentShift.shiftType,
      shift_type: reportData.shiftType || currentShift.shiftType,
      shiftId: currentShift.shiftId,
      shift_id: currentShift.shiftId,
      reportType: reportData.reportType || "Incident",
      report_type: reportData.reportType || "Incident",
      totalShiftSales: Number(reportData.totalShiftSales || 0),
      total_shift_sales: Number(reportData.totalShiftSales || 0),
      totalOrdersCount: Number(reportData.totalOrdersCount || 0),
      total_orders_count: Number(reportData.totalOrdersCount || 0),
      cancelledOrdersCount: Number(reportData.cancelledOrdersCount || 0),
      cancelled_orders_count: Number(reportData.cancelledOrdersCount || 0),
      content: reportData.content || "",
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
    const updated = branchReports.filter(r => r.id !== id);
    setBranchReports(updated);
    broadcastSync('SYNC_REPORTS', updated);
    if (isSupabaseConfigured) supabase.from('branch_reports').delete().eq('id', id).then(() => {});
  };

  const clearAllOrders = () => {
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

  const getEffectiveBranchId = () => {
    if (!currentSession) return selectedBranch.id;
    if (currentSession.role === 'admin') return selectedBranch.id;
    return currentSession.branchId || selectedBranch.id;
  };

  return (
    <AppContext.Provider value={{
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
      createOrder,
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
      getEffectiveBranchId,
      branches: SEED_DATA.branches
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
