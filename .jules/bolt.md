## 2024-05-24 - Unnecessary re-renders from global state subscriptions
**Learning:** Using `useGameStore()` without selectors (e.g., destructuring the entire store) in components subscribes the component to the entire global state, causing massive re-renders on frequent updates like passive particle generation.
**Action:** Always use specific state selectors (`useGameStore(state => state.property)`) for single properties, and `useShallow` from `zustand/react/shallow` when multiple properties must be selected to prevent unnecessary re-renders.
