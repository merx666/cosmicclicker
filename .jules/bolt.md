## 2024-05-18 - Init
## 2026-04-04 - Avoid useGameStore() without selectors
**Learning:** Destructuring the entire useGameStore() in components subscribes the component to the entire global state, causing massive re-renders on frequent updates like passive particle generation.
**Action:** Always use specific state selectors, or use `useShallow` from `zustand/react/shallow` when multiple properties must be selected.
