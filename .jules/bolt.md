## 2024-05-18 - Zustand Store Destructuring Anti-Pattern
**Learning:** Destructuring the entire Zustand store (e.g., `const { a, b } = useGameStore()`) subscribes the component to all store changes, causing massive unnecessary re-renders on frequent updates like passive particle generation. This is a codebase-specific performance bottleneck.
**Action:** Use `useShallow` from `zustand/react/shallow` when extracting multiple properties from the store to prevent unnecessary re-renders.
