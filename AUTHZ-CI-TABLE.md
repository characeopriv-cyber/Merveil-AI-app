# Authz CI table (manual → automate later)

Run against staging with two citizens **A** and **B**.

| # | Route | Actor A | Expect |
|---|--------|---------|--------|
| 1 | POST `/api/rewards?action=daily-claim` | signed in | 200, points |
| 2 | POST daily-claim | no cookie | 401 AUTH_REQUIRED |
| 3 | POST `/api/conversations/:id/messages` | participant | 200 |
| 4 | POST messages | not participant | 403 NOT_PARTICIPANT |
| 5 | POST `/api/world` | signed in | 200, owner_id=A |
| 6 | POST world body.owner_id=B | signed in A | still owner A |
| 7 | POST `/api/properties` | signed in | owner_id=A |
| 8 | POST `/api/properties?action=ai-parse-listing` | signed in | 200 listing |
| 9 | POST inventory-ai-parse | signed in | 200 units |
| 10 | POST `/api/wallet` topup | signed in | scoped to A |
| 11 | POST `/api/passport?action=activate` | signed in | self only |
| 12 | POST `/api/calls?action=create` | signed in | caller=A |
| 13 | POST connections request | signed in | requester=A |
| 14 | POST circles join | signed in | member=A |
| 15 | POST events RSVP | signed in | user_id=A |

Automate: Node script with two test JWTs hitting each row; fail CI on wrong status or wrong owner_id.
