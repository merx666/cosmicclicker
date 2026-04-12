## 2024-05-18 - Zustand Selector Re-render Anti-Pattern
**Learning:** Components subscribing to the entire `useGameStore()` without selectors cause unnecessary re-renders whenever *any* state updates (e.g., passive particle generation firing every second).
**Action:** Always use specific state selectors (`useGameStore(state => state.prop)`) or `useShallow` for multiple properties to prevent massive React re-render trees.
