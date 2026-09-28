# ⚙️ MIRCHI 360 — AI OPERATING RULES
> **Version:** 1.0 | **Enforced Since:** 2026-09-28 | **Owner:** Principal Systems Architect

---

## 🔴 MANDATORY PRE-FLIGHT CHECKLIST
> Before writing a SINGLE line of code, making ANY edit, or planning ANY feature — complete this checklist in order:

```
[ ] 1. Read context/RULES.md   ← You are here
[ ] 2. Read context/MEMORY.md  ← What has changed recently?
[ ] 3. Read context/PRD.md     ← What does the product require?
[ ] 4. Read context/TRD.md     ← What is the technical architecture?
[ ] 5. Read the actual source file(s) before editing them
```

**VIOLATION OF THIS CHECKLIST IS NOT PERMITTED. NO EXCEPTIONS.**

---

## 📋 RULE 1 — CONTEXT FIRST, CODE SECOND

- NEVER open a file to edit without first reading the context docs above.
- NEVER assume what a component does, what props it accepts, or what state it manages — READ the file first.
- NEVER assume what columns a Supabase table has — check `context/TRD.md` schema section OR query `information_schema` first.
- NEVER assume localStorage keys — check `context/TRD.md` storage keys section.
- If context docs are stale or incomplete, READ the actual source code before proceeding.

---

## 📋 RULE 2 — ZERO GUESS-CODING

The following are **STRICTLY FORBIDDEN** without verification:

| Forbidden Action | Required Action Instead |
|---|---|
| Assuming a DB column exists (e.g. `is_archived`) | Check TRD.md schema OR run `SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'` |
| Assuming a React prop name | Read the component file first |
| Assuming a localStorage key name | Check TRD.md Storage Keys section |
| Assuming a Supabase RLS policy allows DELETE | Check TRD.md RLS section — anon key cannot DELETE |
| Assuming an env variable name | Check `.env` file directly |
| Copy-pasting a pattern from memory | Verify it still exists in the current codebase |

**Root cause of all past bugs:** `.eq('is_archived', false)` — column did not exist. This was guess-coding. Never again.

---

## 📋 RULE 3 — MEMORY UPDATE AFTER EVERY CHANGE

After EVERY significant change (bug fix, feature, refactor, deploy), update `context/MEMORY.md`:

```markdown
### [YYYY-MM-DD HH:MM PKT] — [Scope] — [Summary]
- **Files Modified:** list of files
- **What Changed:** brief description
- **Why:** reason / bug it fixed
- **Commit:** git commit hash or message
- **Next Steps:** any follow-up required
```

Failure to update MEMORY.md means the next session starts blind. This causes regressions.

---

## 📋 RULE 4 — DATABASE SAFETY

- The `anon` publishable Supabase key **CANNOT** `DELETE` rows due to RLS policies.
- To delete data, use: **Supabase Dashboard → SQL Editor → `DELETE FROM table_name;`**
- All `INSERT` and `UPDATE` operations via anon key work because RLS allows them.
- Never add `.eq('is_archived', false)` or any column filter without verifying the column exists in TRD.md schema.
- Always use specific column `select()` — never `select('*')` in production queries.

---

## 📋 RULE 5 — DEPLOYMENT WORKFLOW

```
1. Make code changes
2. npm run build          ← MUST pass with zero errors before pushing
3. git add -A
4. git commit -m "type: description"
5. git push origin main   ← Vercel auto-deploys on push
6. Update context/MEMORY.md
```

**Never push without a passing build.**

---

## 📋 RULE 6 — COMPONENT EDITING PROTOCOL

Before editing any component:
1. Read the full file (not just the section you think is relevant)
2. Identify all `useState`, `useEffect`, `useMemo`, `useCallback` dependencies
3. Check if the component uses `useApp()` — understand which store values it consumes
4. Check if the component is wrapped in `React.memo` — changes to parent state may not propagate
5. After editing, verify the component still builds (`npm run build`)

---

## 📋 RULE 7 — PRODUCTION CONSOLE CLEANUP

- `console.log()` → **REMOVE** in production code
- `console.warn()` → **KEEP** only for non-fatal warnings (network issues, fallback triggers)
- `console.error()` → **KEEP** only for actual errors caught in try/catch
- Debug `console.log` statements that were added during development → **ALWAYS REMOVE before commit**

---

## 🔑 QUICK REFERENCE — KEY FILES

| File | Purpose |
|------|---------|
| `src/lib/store.jsx` | Central state management, Supabase queries, realtime, auth |
| `src/lib/supabase.js` | Supabase client, UUID maps, branch slugs |
| `src/components/customer/CustomerApp.jsx` | Customer QR menu portal |
| `src/components/kitchen/KitchenApp.jsx` | Kitchen Display System |
| `src/components/manager/ManagerApp.jsx` | Manager portal — orders, billing, shift close |
| `src/components/admin/AdminApp.jsx` | Admin analytics, menu management |
| `src/lib/staffCredentials.js` | Hardcoded fallback staff credentials |
| `src/hooks/useMenuItems.js` | Menu items fetcher with Supabase fallback |
| `context/MEMORY.md` | Change log — read this to know what happened |
| `context/TRD.md` | DB schema, localStorage keys, architecture |
| `context/PRD.md` | Product requirements, portal scopes |
