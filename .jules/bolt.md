## 2024-05-18 - Zustand store entire destructuring anti-pattern
**Learning:** Destructuring the entire `useGameStore()` in components causes them to subscribe to the entire global state, causing massive re-renders on frequent updates like passive particle generation.
**Action:** Always use specific state selectors, or `useShallow` from `zustand/react/shallow` when multiple properties must be selected.
