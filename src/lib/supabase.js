import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://hrrqunldyquxsnsufxpa.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_tWlff35xenmaucL_HGulqg_qyf9yTaB';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = (rawUrl && rawUrl !== 'https://placeholder.supabase.co') ? rawUrl : DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (rawKey && rawKey !== 'placeholder' && !rawKey.startsWith('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS')) 
  ? rawKey 
  : DEFAULT_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const RESTAURANT_ID = '6b8015e9-95d0-4fd9-ac57-2d8d8cc8c111';

export const BRANCH_UUID_MAP = {
  'branch-def': 'e85c1b88-47a0-47b1-bc82-be2ea60d2ae3',
  'branch-qas': '6d9e61c4-4cb5-46a1-af76-75554993ae4a',
  'Defence': 'e85c1b88-47a0-47b1-bc82-be2ea60d2ae3',
  'Qasimabad': '6d9e61c4-4cb5-46a1-af76-75554993ae4a',
  'e85c1b88-47a0-47b1-bc82-be2ea60d2ae3': 'e85c1b88-47a0-47b1-bc82-be2ea60d2ae3',
  '6d9e61c4-4cb5-46a1-af76-75554993ae4a': '6d9e61c4-4cb5-46a1-af76-75554993ae4a'
};

export const BRANCH_SLUG_MAP = {
  'e85c1b88-47a0-47b1-bc82-be2ea60d2ae3': 'branch-def',
  '6d9e61c4-4cb5-46a1-af76-75554993ae4a': 'branch-qas',
  'branch-def': 'branch-def',
  'branch-qas': 'branch-qas'
};

export const TABLE_UUID_MAP = {
  // Defence
  'e85c1b88-47a0-47b1-bc82-be2ea60d2ae3': {
    1: 'f896d51a-029e-46f8-8be8-b36ff3bdad16',
    2: '99a6901a-85a7-4198-a2a9-325ebc0bd64c',
    3: '6dd572d1-2198-4ab1-8046-a26d709c9690',
    4: '2b3a57d1-27d8-450f-b991-8b1bdb217578',
    5: '30b21767-ad05-47d5-86c5-edb4418beefc',
    6: '15366f08-5c41-4532-8ca9-db45645b1005',
    7: 'bf35dbfa-07cb-419a-9743-65651b2bc636',
    8: '53521fc1-78f7-4eb6-9232-ddadcc87f276',
    9: 'f3103f19-6011-4234-879a-15d11ead6e26',
    10: '56e12294-3781-4af8-b43d-17f18943f865'
  },
  // Qasimabad
  '6d9e61c4-4cb5-46a1-af76-75554993ae4a': {
    1: 'd5a49d05-1a89-4f8e-b7ef-dba24511ecb1',
    2: 'b106fd06-fc52-438c-a5e8-0e9e9369e276',
    3: '63828b3d-39e0-4594-ad15-67f5a9dd45db',
    4: 'db65a2fe-f66a-4c5f-b862-183fcb5340f7',
    5: '643db455-43f8-465e-92ed-fe1466ad616b',
    6: '3a442632-dd14-4958-a0d4-a8a9e7915809',
    7: '10d5a644-1fcc-4419-afda-e637841f2fbf',
    8: '4a417482-3997-4a62-8358-6a8c3680ec71',
    9: 'aff0dea7-bec6-4f91-8713-d771ffdddc4d',
    10: '893983a1-4dfc-4a04-8d54-b95a21281175'
  }
};

export const isValidUuid = (id) => {
  if (typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};

export const getBranchUuid = (branchIdOrSlug) => {
  if (branchIdOrSlug && isValidUuid(branchIdOrSlug)) {
    return branchIdOrSlug;
  }
  return BRANCH_UUID_MAP[branchIdOrSlug] || BRANCH_UUID_MAP['branch-def'];
};

export const getTableUuid = (branchIdOrSlug, tableNumber) => {
  const branchUuid = getBranchUuid(branchIdOrSlug);
  const num = Number(tableNumber) || 4;
  return TABLE_UUID_MAP[branchUuid]?.[num] || TABLE_UUID_MAP[branchUuid]?.[4] || '2b3a57d1-27d8-450f-b991-8b1bdb217578';
};

// Safe storage wrapper that gracefully falls back to memory if private browsing disables localStorage
const memoryStorage = new Map();
const safeStorage = {
  getItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {}
    return memoryStorage.get(key) || null;
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {}
    memoryStorage.set(key, String(value));
  },
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {}
    memoryStorage.delete(key);
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'mirchi360_auth_token',
    storage: safeStorage,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
