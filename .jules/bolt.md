## 2024-05-18 - Zustand Store Selectors
**Learning:** Destructuring the entire store without selectors (e.g. `const { prop } = useGameStore()`) causes heavy re-renders because the component subscribes to the entire global state, which updates every second due to passive particle updates.
**Action:** Always use specific state selectors (`const prop = useGameStore(state => state.prop)`) or `useShallow` for multiple properties to prevent performance bottlenecks.
