## 2024-05-24 - Zustand Whole-Store Subscription Anti-Pattern
**Learning:** Using `useGameStore()` without selectors subscribes the component to the entire global state. In this app, the `particles` count updates every second due to passive generation, causing massive, continuous re-renders in components (like Tabs) that don't even use the particle count.
**Action:** Always use specific state selectors (e.g., `useGameStore(state => state.property)`) for single properties, and `useShallow` from `zustand/react/shallow` when multiple properties must be selected.
