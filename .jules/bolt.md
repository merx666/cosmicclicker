## 2026-06-14 - Optimize Zustand useGameStore Destructuring
**Learning:** Destructuring the massive useGameStore directly inside components subscribes them to all updates (e.g., ticking particles), causing widespread unnecessary re-renders across multiple tabs and screens.
**Action:** Always use specific state selectors `useGameStore(state => state.property)` for single properties or `useShallow` from `zustand/react/shallow` for multiple properties to prevent re-renders when unrelated properties change.
