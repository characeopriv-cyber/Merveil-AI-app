# App split plan (citizen first)

`App.jsx` remains the shell until modules are wired one domain at a time.

## Extracted / ready to import

| Module | Path | Role |
|--------|------|------|
| Ranking | `lib/merveilRanking.js` + `src/lib/merveilRanking.js` | Server + client World/Pulse rank |
| Authz | `lib/merveilAuthz.js` | Actor helpers (router inlined too) |
| E2EE | `lib/merveilE2ee.js` / in App | Already partial |

## Next extracts (order)

1. **`src/merveil/ranking.js`** — done (use from WorldView / Pulse when import path is stable)
2. **`src/merveil/ConnectMessages.jsx`** — cut `MessagesView` + thread list (~line 11821+)
3. **`src/merveil/WorldReels.jsx`** — `WorldView` (~19750+)
4. **`src/merveil/PulseDiscover.jsx`** — Discover + market cards
5. **`src/merveil/PassportWallet.jsx`** — Passport tabs + wallet/KYC
6. **`src/merveil/Calls.jsx`** — `RealCallScreen` + ringtone

## Import rule

```js
import { rankWorldReels, rankPulseListings } from "./lib/merveilRanking.js";
```

Do **not** duplicate algorithms in App after import lands.

## Server ranking (live)

- `GET /api/world?ranked=1` (default) — ranks page with diversity pass  
- `GET /api/world?ranked=0` — raw recency  
- `GET /api/properties?ranked=1` (default) — Pulse listing rank  
- Optional `?affinity=` base64url JSON for personalization without trusting score from client  

Client still runs local affinity for mutes; order is primarily server-driven.

## Out of scope

Interface + Developer portals.
