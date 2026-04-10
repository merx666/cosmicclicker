## 2024-05-24 - Initial setup | **Learning:** Setting up bolt.md | **Action:** Always log critical learnings
## 2024-05-24 - Zustand Re-render Optimization
**Learning:** Destructuring the entire `useGameStore` using `const { a, b } = useGameStore()` causes massive re-renders on frequent state updates (e.g., passive particle generation) in large tab components.
**Action:** Always use specific Zustand state selectors (e.g., `useGameStore(state => state.property)`) or `useShallow` from `zustand/react/shallow` when multiple properties need to be selected to prevent performance bottlenecks.
