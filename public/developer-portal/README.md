# Merveil Developer Platform

AI-native workspace. Idea → prototype in under 3 minutes.

## Files

- `console.html` — /developer Command Center
- `console.css` / `console.js` — dark AI-first UI
- `config.js` — SUPABASE_URL, ANON_KEY, API_BASE, AI_BASE
- `onboarding.html` + `onboarding-panel.js` — guided setup
- `commercial-panel.js` — plans / usage
- `team-panel.js` — collaborators
- `webhook-deliveries.js` — live webhook log
- `oauth-consent.html` — 3rd-party OAuth consent
- `quickstart.html` — docs
- `openapi.yaml` — API reference
- `index.html` — marketing landing

## Routes (vercel.json)

| Path | File |
|------|------|
| /developer | console.html |
| /developer/onboarding | onboarding.html |
| /developer/quickstart | quickstart.html |
| /onboarding | onboarding.html |
| /oauth/consent | oauth-consent.html |

## Config

Edit `config.js` with your Supabase project URL and anon key.
