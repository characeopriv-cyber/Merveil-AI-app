# Merveil citizen domain extracts — 2026-09-23

## Files (copy separately, no zip)

| File | Role |
|------|------|
| `deps.js` | Runtime bridge. App calls `bindMerveilDeps({...})` once after helpers exist. |
| `ConnectMessages.jsx` | Connect: requests, citizens, circle, groups, **MessagesView** |
| `WorldReels.jsx` | World ranking helpers, **WorldReelCard**, **PostWorldModal**, **WorldView** |
| `PulseDiscover.jsx` | **PropertyCard**, **FeedView**, **InvestorZone**, Pulse reels, Marketplace |

## Status

- Source of truth for these domains is now under `src/merveil/`.
- **Production still mounts from `App.jsx`** until you run the wire step below (avoids a hard break if icon/deps bags are incomplete).
- Stale partial copies `MessagesView.jsx` / `WorldView.jsx` were removed.

## Wire step (when ready)

1. Place folder at client `src/merveil/` (same as repo).
2. Near top of `App.jsx` (after React + lucide imports):

```js
import { bindMerveilDeps } from "./merveil/deps.js";
import {
  MessagesView,
  AreaGroupsView,
  IncomingConnectionRequests,
  CitizensTab,
  MyCircleTab,
} from "./merveil/ConnectMessages.jsx";
import { WorldView, PostWorldModal, WorldReelCard } from "./merveil/WorldReels.jsx";
import {
  FeedView,
  InvestorZone,
  PropertyCard,
  ReelsView,
  MarketplaceFeedView,
  MarketplacePostModal,
  rankPulseReels,
} from "./merveil/PulseDiscover.jsx";
```

3. After `merveilFetch`, `T`, `Avatar`, icons, and shared components (`RealCallScreen`, `CreatorProfileModal`, …) are defined, call `bindMerveilDeps({ ... })` — see keys listed in the extract headers / prior ship notes.

4. Delete the original function ranges from `App.jsx` so only the imports remain:

| Domain | Approx lines in App.jsx (pre-extract) |
|--------|----------------------------------------|
| Connect | 11663–15773 |
| World | 20010–23008 |
| Pulse core | 5678–7267 |
| Pulse reels | 10146–11324 |
| Marketplace | 30073–30723 |

5. Smoke: Connect message send · Groups post · World swipe · Pulse Discover list · Invest tab · Marketplace.

## Ranking note

`WorldReels.jsx` still embeds client `rankWorldReels`. Prefer `lib/merveilRanking.js` on the next pass and delete the duplicate in the extract.
