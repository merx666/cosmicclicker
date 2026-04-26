## 2024-05-25 - Zustand Unnecessary Re-renders
**Learning:** Using `useGameStore()` without selectors subscribes components to the entire store, causing massive re-renders, particularly because `particles` updates every second.
**Action:** Always use specific state selectors (`useGameStore(state => state.property)`) or `useShallow` from `zustand/react/shallow` for multiple properties to prevent excessive re-renders.
