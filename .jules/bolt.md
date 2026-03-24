## 2026-03-24 - Zustand useGameStore Anti-pattern
**Learning:** Components destructuring the entire `useGameStore` hook subscribe to all state updates in the global store. When properties like `particles` update frequently (e.g., every second), it triggers massive unnecessary re-renders in components that don't even use the changing properties.
**Action:** Always use specific state selectors, e.g., `const property = useGameStore(state => state.property)` or `useShallow` to isolate state subscriptions and prevent performance bottlenecks.
