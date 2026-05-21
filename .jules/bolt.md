## 2025-02-18 - Zustand Full State Destructuring
**Learning:** Components destructured values from the entire `useGameStore()` (e.g., `const { a, b } = useGameStore()`). This codebase anti-pattern subscribes the component to the entire store, causing massive re-renders on frequent state updates like passive particle generation.
**Action:** Always use specific state selectors (`useGameStore(state => state.prop)`) or `useShallow` mapping for multiple properties to isolate component renders.
