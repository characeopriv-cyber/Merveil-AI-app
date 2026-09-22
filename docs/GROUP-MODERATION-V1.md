# Group Moderation V1 — Implementation details

## Philosophy
Merveil AI is the admin. No human queue for thousands of leads/hour.
Citizens report; AI scans, hides, suspends, and **notifies** the poster every time.

## Policy (auto-enforced)
| Code | Meaning | Typical action |
|------|---------|----------------|
| terror_violence | Violence / terror content | Hide + **60–90d** all-groups suspend |
| extremist_hate | Religious/ethnic hate | Hide + **60–90d** |
| scam_fake | Scam / forged docs patterns | Hide + **30–60–90d** by repeat |
| insult | Harassment / insults | Warn → **30–60d** |
| spam_* | Caps / link floods / char spam | Warn or hide |

Sanctions: **30 / 60 / 90 days** by severity + prior sanctions count.  
Every action → **push notification** to the citizen.

## Duplicate leads (not a ban)
Same inventory can be posted by many agents.  
If content hash matches prior leads, poster is notified:  
“You are the Nth citizen posting a very similar lead…” — allowed, not an issue.

## Automated pipeline on POST
1. Membership + active suspension check  
2. Rate limit (`group_post_{userId}`)  
3. `merveilAiScanLead(text)` → score + flags + decision  
4. Content hash + duplicate rank  
5. suspend → sanction row + notify + **reject**  
6. hide → insert hidden + notify + no feed  
7. warn → publish + notify  
8. allow → publish; if duplicate_rank ≥ 2 → notify  
9. Contributor stats; every **10 real leads** → **5 boost credits**

## Citizen tools
- **Report** on each lead → `/api/groups/:id?action=report`  
  High risk auto-hides + may suspend author  
- **Pin** (members)  
- **Remove** own lead (`remove-post` / existing delete)  
- **Pulse** button → Community area deep link  
  `/?tab=pulse&community=1&emirate=…&area=…`

## Top posters
`area_group_contributor_stats` + `GET /api/groups?action=leaderboard`  
Quality ≈ leads×2 + calls×3 + deals×10  
Boost credits on `profiles.boost_credits` + `merveil_boost_credits` ledger  
Use later to boost Pulse listing / Passport / World reel

## SQL
1. `supabase-area-groups-ALL.sql` (if needed)  
2. `supabase-area-groups-v1c.sql` (favorites/pin)  
3. **`supabase-group-moderation-v1.sql`** ← this pack  

## Files
- `api/router.js` — AI helpers + post gate + report/remove/leaderboard  
- `src/App.jsx` — Report, Pulse link, leaderboard strip, hidden/warn UX  
'''
