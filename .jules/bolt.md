## 2024-05-24 - Zustand store selections anti-pattern
**Learning:** Using `useGameStore()` without selectors subscribes the component to the entire global state, causing massive re-renders on frequent updates like passive particle generation.
**Action:** Always use specific state selectors, e.g., `useGameStore(state => state.property)` for single properties, and `useShallow` from `zustand/react/shallow` when multiple properties must be selected.
