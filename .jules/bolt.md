## 2024-04-10 - Zustand Selector Anti-pattern
**Learning:** Using `useGameStore()` without selectors (destructuring the entire store) subscribes the component to the entire global state, causing massive re-renders on frequent updates like passive particle generation.
**Action:** Always use specific state selectors (`useGameStore(state => state.prop)`) or `useShallow` from `zustand/react/shallow` for multiple properties to prevent performance bottlenecks.
