# Connect deep fix + Area Groups (2026-09-21)

## Why Messages still showed only “Message”

**Algorithm bug (server), not only UI.**

`GET /api/conversations` loaded last messages with a global `order + limit`. Quiet threads often **never got a row** in the batch → `last_body` stayed null → client showed the placeholder “Message”.

### Server fix (`api/router.js`)
1. Higher batch limit + select `type`, `is_e2ee`, `media_url`
2. `previewOf()` builds human previews (text / 🎤 / 📷 / 🔒 / system)
3. Conversation **create** uses **Actor** (jwtSub-safe)
4. **Reuse 1:1** queries both participant sides (UUID/contains edge cases)

### Client (`src/App.jsx`)
- `startChatWith` hardened earlier (open exact thread)
- Poll merge preserves richer local `last_body`
- Empty preview → “Tap to open chat” when activity exists
- Groups tab + AreaGroupsView

## Area Groups (after AI Call)

Public WhatsApp-style **Emirates → Area → Sell / Buy / Rent** lead channels.

| Piece | Path |
|-------|------|
| SQL | `supabase-area-groups-v1.sql` |
| API | `/api/groups` in `router.js` |
| UI | Connect → **Groups** |

### Deploy order
1. Run **`supabase-area-groups-v1.sql`** in Supabase  
2. Upload **`api/router.js`**  
3. Upload **`src/App.jsx`**  

### Smoke
- Messages list shows **real last lines** (not only “Message”)  
- My Circle chat opens **that** thread  
- Groups → Dubai → Deira → Sell → post lead + Super + views  
