## 2025-02-12 - Zustand Store Re-renders in UI Tabs
**Learning:** Destructuring `useGameStore()` without a selector subscribes components to the *entire* state. Since `particles` update rapidly (every tick/second), all tabs were constantly re-rendering even if they didn't consume `particles`.
**Action:** Always use specific selectors (`state => state.prop`) for single properties or `useShallow` for multiple properties to prevent unneeded re-renders when accessing global game state.
