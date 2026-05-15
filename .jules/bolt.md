## 2026-05-15 - Zustand Store Destructuring Anti-pattern
**Learning:** Destructuring the entire useGameStore() without selectors subscribes the component to the entire state. This causes massive unnecessary re-renders in components when frequent global state updates occur, such as passive particle generation.
**Action:** Always use specific state selectors, or use `useShallow` from `zustand/react/shallow` when extracting multiple properties from the store.
