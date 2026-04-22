## 2026-04-22 - Zustand useGameStore Anti-pattern
**Learning:** Components destructuring the entire Zustand store (`const { prop } = useGameStore()`) subscribe to all state updates, causing massive unnecessary re-renders across the app, especially with frequent passive updates like particle generation.
**Action:** Always use specific state selectors `useGameStore(state => state.prop)` or `useShallow` from `zustand/react/shallow` when selecting multiple properties.
