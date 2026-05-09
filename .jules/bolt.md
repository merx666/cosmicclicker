## 2025-02-23 - Zustand Global Store Destructuring Optimization
**Learning:** Destructuring the entire `useGameStore()` in Next.js components (e.g., `const { nullifierHash } = useGameStore()`) subscribes the component to the *entire* store, causing unnecessary massive re-renders on every minor state update (such as passive particle ticks).
**Action:** Always use specific state selectors (`useGameStore(state => state.property)`) or `useShallow` from `zustand/react/shallow` for multiple properties to prevent UI freezing and re-render explosions.
