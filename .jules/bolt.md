## 2024-05-24 - Zustand Destructuring Re-render Bottleneck
**Learning:** Components were destructuring `useGameStore()` directly (e.g., `const { property } = useGameStore()`). In Zustand, this subscribes the component to the *entire* store, causing re-renders whenever *any* state changes (like the high-frequency passive particle generation).
**Action:** Always use specific state selectors (`useGameStore(state => state.prop)`) or `useShallow` (`useGameStore(useShallow(state => ({ prop1: state.prop1 })))`) to isolate state subscriptions and prevent unnecessary re-renders.
