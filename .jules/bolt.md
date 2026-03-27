## 2025-02-16 - Zustand Re-render Optimization
**Learning:** Using `useGameStore()` without selectors (e.g. destructuring the entire store in components like Tabs) subscribes the component to the entire global state, causing massive re-renders on frequent updates like passive particle generation.
**Action:** Always use specific state selectors (`useGameStore(state => state.property)`) for single properties or `useShallow` from `zustand/react/shallow` when selecting multiple properties to prevent unnecessary re-renders.
