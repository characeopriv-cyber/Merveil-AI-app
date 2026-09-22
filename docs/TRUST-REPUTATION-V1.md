# Trust signals + Reputation V1

## Design (Facebook-style)
Trust is a **visible signal**, never a permission wall.
Unverified citizens post, chat, appear in Groups and profiles like anyone else.

## Signals
| Signal | Meaning |
|--------|---------|
| **Verified / Unverified** | Passport identity (badge only) |
| **RE verified** | Optional agent/company flag |
| **Trust level** | newcomer → active → trusted → pillar → elite |
| **Trust score** | 0–1000 composite |

## Score components
- Identity (KYC, RE flags, paid Passport tier)
- Activity (listings, group leads, World posts)
- Network (accepted connections)
- Engagement (leads, calls, deals from contributor stats)
- Reliability minus reports/sanctions

## Moderation (already + this pack)
- Group AI scan, report, hide, 30/60/90d suspend
- Sanctions lower reputation automatically
- Top posters / boost credits unchanged

## API
- `GET /api/reputation?userId=`
- `POST /api/reputation?action=recompute&userId=` (self)

## SQL
`supabase-trust-reputation-v1.sql`

## UI
`MerveilTrustBadge` on group leads + creator page.
