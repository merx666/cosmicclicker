## 2026-06-08 - Zustand useGameStore Optimization
**Learning:** Destructuring entire Zustand stores directly in components (e.g., `const { nullifierHash } = useGameStore() `) causes massive re-renders across the app on every frequent state update (like passive particle generation).
**Action:** Always use specific state selectors (e.g., `useGameStore(state => state.prop)`) or `useShallow` for multiple properties to isolate subscriptions and prevent re-render bottlenecks.
