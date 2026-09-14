/*
 * Legacy shortcuts compatibility layer.
 *
 * The current Merveil Developer experience has one intentional entry point:
 * Home -> Discover/Create -> real creation result -> Pro Studio.
 *
 * The previous floating shortcut UI generated local/random opportunity cards
 * and demo-looking actions. That is intentionally removed: no fake demand,
 * no fake generation, and no decorative controls that imply live capability.
 * Real Discover, Create, Boost and provider-backed actions own their surfaces.
 */
(() => {
  if (typeof window === 'undefined') return;
  window.__merveilLegacyShortcutsDisabled = true;
})();
