# Vercel Hobby fix — max 12 serverless functions

## Error
```
No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan.
```

## Cause
Every file under `api/**/*.js` is **one function**.  
GitHub `main` has **13+** API files → over the limit.

## Fix (do this on GitHub)

### 1. KEEP only
```
api/router.js
```

### 2. DELETE these from the repo (main + any deploy branch)

```
api/_create-core.js
api/admin-developer.js
api/api-enrich.js
api/create.js
api/discover.js
api/discover/[projectId]/opportunities/[oppId]/spawn.js
api/engine-generate.js
api/engine.js
api/interface.js
api/ship.js
api/studio.js
api/v1.js
api/webhooks/notification-push.js   # if present
api/webhooks/process.js
api/webhooks/retry.js
api/enrich.js
api/fx.js
api/geo.js
api/machineConnectApi.js
api/dev/ship.js
api/studio/chat.js
api/engine/generate.js
```

In GitHub UI: open each file → ⋯ → Delete file → commit.

Or locally:
```bash
git rm -r api/discover api/webhooks \
  api/_create-core.js api/admin-developer.js api/api-enrich.js \
  api/create.js api/discover.js api/engine-generate.js api/engine.js \
  api/interface.js api/ship.js api/studio.js api/v1.js \
  api/enrich.js api/fx.js api/geo.js api/machineConnectApi.js 2>/dev/null
# keep only api/router.js
git add api/router.js vercel.json
git commit -m "Hobby: single serverless function api/router.js"
git push
```

### 3. Upload these 2 files (updated)

| File | Path in repo |
|------|----------------|
| `vercel.json` | `/vercel.json` |
| `api/router.js` | `/api/router.js` |

`vercel.json` routes **all** `/api/*` → `/api/router` so one function handles everything.

### 4. Redeploy
Push to `main` (or the branch Vercel production tracks) → build should pass the function count.

## Verify
After deploy, Vercel project → Functions should show **1** (router).

Citizen app calls (`/api/auth/...`, `/api/people`, `/api/messages`, …) already go through `router.js`.

## Note
Developer portal / engine / studio extra endpoints were separate functions.  
They are **Coming soon** for investors — citizen app does not need them on Hobby.  
When you upgrade to Pro, you can restore those files if needed.
