# E2E test — Signup → Passport (live production)

**Date:** 2026-09-22 21:35 GST  
**URL:** https://www.junction.technology/  
**Method:** Live browser (mobile viewport) + API probes  

---

## Flow results

| Step | Result | Evidence |
|------|--------|----------|
| 1. Landing / intro | **PASS** | Splash + “TAP TO CONNECT” loads |
| 2. Enter Merveil AI | **PASS** | AI intro → **ENTER MERVEIL AI** |
| 3. Visitor into Pulse | **PASS** | Discover, listings, “No login required” |
| 4. Sign in modal | **PASS (UI)** | “Enter as a citizen” · **Continue with Google** only |
| 5. Email/password signup | **N/A** | **Not offered** — Google OAuth only |
| 6. Google OAuth complete | **NOT RUN** | Requires real Google account in interactive browser |
| 7. Session API (visitor) | **PASS** | `GET /api/auth/session` → `{ user: null }` 200 |
| 8. Passport as visitor | **PASS** | Gate: “Your power center awaits” + Sign In |
| 9. World as visitor | **PASS (content)** | Reel plays (Chara Enterprise / Otter) |
| 10. Creator profile API | **FAIL on prod** | See critical bug below |

---

## Critical bug found (causes “Citizen not found”)

```
GET /api/people?action=profile&userId=…
→ 400 {"error":"column profiles.agent_verified does not exist"}
```

Production `profiles` table is **missing** `agent_verified` / `company_verified` columns that the router selected.  
Any Group / World / Pulse tap on a profile hit this 400 → client showed **Citizen not found**.

### Fix in this ship (`router.js`)
- Removed those columns from all profile `SELECT`s  
- RE badge uses `rera_number` (and optional fields if present)  
- Stub profile still returned when row truly missing  

**Must redeploy `router.js` for creator profiles to work on production.**

---

## Auth model (honest)

Citizen entry is **Google OAuth only** (`signInWithProvider("google")`).  
There is **no** email/password sign-up in the citizen AuthModal.

**Investor demo implication:**  
Sign-in requires a Google account. Cannot complete full “create account → Passport Core” in headless automation without OAuth credentials.

**Recommended manual E2E (you run once):**
1. Sign in with Google  
2. Land on Pulse signed-in  
3. Open **Passport** → Core identity, name, avatar  
4. Edit name / bio  
5. Open Connect → message yourself path / directory  
6. Groups → post / open author profile (**after router deploy**)  
7. Refresh page → session still valid  

---

## Production still on old client (not deployed)

World still shows:
- **Saved** top button  
- **WORLD REELS / What should I discover next?**  

Repo already removed these. **App.jsx not live yet.**

---

## Console notes
- Multiple GoTrueClient instances warning (Supabase) — cleanup later, not blocking  

---

## Deploy priority for this test

1. **`router.js`** — profile 400 fix (blocking creator pages)  
2. **`App.jsx`** — World chrome, profile UX, Coming soon, perf  
3. Optional SQL later: add `agent_verified` / `company_verified` columns if you want them as real fields  

---

## Verdict

| Path | Status |
|------|--------|
| Visitor → Pulse / World / Passport gate | **Works** |
| Sign-in UI | **Works** (Google only) |
| Full signup → Passport Core | **Manual Google required** |
| Profile / creator after signup | **Broken on prod until router deploy** |
