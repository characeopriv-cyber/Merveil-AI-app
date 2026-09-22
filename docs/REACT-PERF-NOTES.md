# React performance pack (2026-09-22)

## Changes
1. **VirtualWindow** — `requestAnimationFrame` scroll throttle, `ResizeObserver`, CSS `contain` + `content-visibility` on rows
2. **WorldReelCard** — `React.memo` with custom compare (inactive reels skip re-render on parent polls)
3. **CitizenRow** — `React.memo`
4. **startTransition** helper imported for non-urgent updates
5. **CSS** — `content-visibility: auto` on list rows / media; GPU layer hints for reels
6. **Boot** — dark shell until React paints (no greige flash)

## Already good in app
- CircularReel renders **one** main reel (not all N videos)
- `stableMergeById` avoids list flash on polls
- Conditional tab mount (`tab === "world" && …`)

## Deploy
- `App.jsx`, `index.css`, `index.html`, `main.jsx`

## Next (if still heavy)
- Split MessagesView / WorldView into separate modules (code-split)
- Virtualize group lead lists when > 40 posts
- Move presence dots to a narrow context so directory polls don’t refresh chat
