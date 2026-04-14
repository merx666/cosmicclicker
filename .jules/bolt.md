## 2024-02-23 - Avoid Destructuring Entire Store
**Learning:** Codebase-specific performance anti-pattern: Using `useGameStore()` without selectors (e.g., destructuring the entire store in components like Tabs) subscribes the component to the entire global state, causing massive re-renders on frequent updates like passive particle generation.
**Action:** Always use specific state selectors (`useGameStore(state => state.property)`) for single properties or `useShallow` for multiple properties to isolate state subscriptions and prevent excessive re-renders.
