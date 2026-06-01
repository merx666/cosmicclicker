## 2024-05-18 - Zustand Selector Optimization
**Learning:** Using `useGameStore()` without state selectors (e.g., destructuring the entire store in Tab components) subscribes the component to the entire global state, causing massive re-renders on frequent updates like passive particle generation.
**Action:** Always use specific state selectors, like `useShallow` from `zustand/react/shallow`, when destructuring multiple properties from a Zustand store to isolate state subscriptions and prevent excessive re-renders.
