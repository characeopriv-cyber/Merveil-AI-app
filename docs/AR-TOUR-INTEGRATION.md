# Merveil AR Tour integration (2026-09-23)

## What ships in App.jsx now

| Layer | Behavior |
|--------|----------|
| **Dubai Boy 3D** | CSS perspective + float / wave / point / nod / celebrate moods, orbit rings, particles |
| **Coach sheet** | World · Pulse · Connect · Passport step tours |
| **AR overlay** | Rear camera (`getUserMedia`) + HUD + reticle + floating Dubai Boy + step `arHint` |
| **WebXR probe** | `navigator.xr.isSessionSupported("immersive-ar")` + optional session request |

## Device matrix

| Device | Experience |
|--------|------------|
| iOS Safari / Android Chrome | Camera AR overlay (works today) |
| ARCore / WebXR browsers | “Try WebXR AR” button when supported |
| No camera permission | Tips still work; AR panel explains fallback |

## Phase 2 (not in this ship)

1. Three.js / Babylon scene attached to `XRSession` with **hit-test** anchors  
2. Place Dubai Boy on detected planes while pointing at the phone UI  
3. Optional `model-viewer` / `.glb` of Dubai Boy for richer mesh  
4. Geo-AR near landmarks (Burj, Marina) for New to UAE — needs location + asset pack  

## Storage

- Coach dismissed: `localStorage merveil_coach_v2_{world|pulse|messages|passport}`  
- Replay: Passport → Settings → Dubai Boy guide  

## Privacy

- Camera tracks stop when AR panel closes  
- No frames uploaded — local preview only  
