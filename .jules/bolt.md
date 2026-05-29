## 2026-05-29 - Zustand Store Destructuring Re-Renders
**Learning:** Destructuring the entire Zustand store (e.g., `const { a, b } = useGameStore()`) without using selectors or `useShallow` subscribes the component to all state changes, causing massive re-renders on frequent updates like passive particle generation.
**Action:** Always use specific state selectors (`useGameStore(state => state.prop)`) for single properties or `useShallow` for multiple properties to prevent excessive component re-renders.
