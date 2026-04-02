
## 2024-04-02 - Prevent Unnecessary Re-renders from Zustand Store Subscriptions
**Learning:** Destructuring multiple properties from a Zustand store hook (e.g., `const { a, b } = useGameStore()`) causes the component to subscribe to the entire store state. In games with high-frequency updates (like passive particle generation), this leads to severe performance degradation as components re-render on every tick.
**Action:** Always use specific state selectors for single properties (`useGameStore(state => state.property)`) or `useShallow` from `zustand/react/shallow` when selecting multiple properties (`useGameStore(useShallow(state => ({ a: state.a, b: state.b })))`).
