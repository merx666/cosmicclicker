## 2024-05-24 - Zustand store destructuring performance issue
**Learning:** Destructuring global Zustand store without selectors (e.g., `const { property } = useGameStore()`) subscribes the component to ALL store updates, leading to massive unnecessary re-renders. This is particularly problematic in a game with frequent state updates (like particles increasing every second).
**Action:** Always use specific state selectors with Zustand, e.g., `const property = useGameStore(state => state.property)`. For multiple properties, use `useShallow` from `zustand/react/shallow`.
