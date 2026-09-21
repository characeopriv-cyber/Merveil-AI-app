# Merveil AI — role of actions + push recommendations

## Product roles

| Action | AI role | Push? |
|--------|---------|-------|
| **Daily claim** | Recognition, not payout | Optional soft reminder 20:00 local if not claimed |
| **Message** | Delivery; AI chips draft only | Yes — other party (E2EE: locked preview) |
| **Call miss** | System line in thread | Yes — missed call |
| **Connection request** | Social graph | Yes — accept/decline |
| **World Super** | Ranking signal + creator reward path | Optional to creator |
| **World comment** | Engagement | Optional to owner |
| **Property post** | Discover rank + inventory AI structure | No blast; viewers via feed |
| **Paste → AI listing** | Extract structure; human publishes | No |
| **Inventory AI parse** | Structure units from file | No |
| **Passport / KYC** | Trust gate for paid tier | Admin on verify decision |
| **Recommend (directory / opportunities)** | Keyword + contact rank + new-citizen lift | No spam |

## Push rules (already directionally in codebase)

- `notifyUser` via FCM + Web Push  
- Never put **E2EE plaintext** in push body  
- Missed call + connection + message previews  

## Ranking (server)

- World + Pulse: `lib/merveilRanking.js` on GET  
- Directory: contact → new (5d) → online → name  

## Do not

- Auto-post property without citizen confirm after AI parse  
- Push every Super/like (noise)  
- Treat localStorage as auth  
