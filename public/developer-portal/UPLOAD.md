# Merveil Developer Platform — GitHub upload

## 1. Supabase SQL (run in order)
1. `sql/supabase-developer-platform-LIVE.sql`  ← required (projects, builds, RPC, extends developer_accounts)
2. `sql/supabase-developer-platform-v3-catalog.sql` ← optional sectors/templates
3. `sql/supabase-developer-platform-v2-panels.sql` ← optional team/webhooks/billing cols

## 2. Frontend files
Copy entire `public/developer-portal/` into your repo at the same path.

Default entry: `/developer` → `studio.html` (Human Studio v3)
Legacy: `/developer/classic` → `console.html`

`config.js` is already wired to live Supabase project `dixfybqlepticyudikuz`.

## 3. vercel.json
Merge routes from `vercel-developer-routes.json` or replace with included full `vercel.json`.

## 4. Orchestrator (optional AI builds)
Deploy `orchestrator/` (FastAPI) with env:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- ANTHROPIC_API_KEY
- VERCEL_TOKEN (optional)

Point `AI_BASE` in config.js to that service.

## 5. Edge functions (optional OAuth)
`supabase/functions/integrations-connect` + `integrations-callback`

## Auth note
Studio uses **Citizen profiles** (`profiles.junction_id`) as passport identity.
It auto-creates `developer_accounts` on first visit (same shape as `/api/developer-keys`).
