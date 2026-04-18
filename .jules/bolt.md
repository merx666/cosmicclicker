## 2024-04-18 - Zustand Selector Re-renders
**Learning:** Using `useGameStore()` without a selector subscribes the component to the entire store. In a game where state like `particles` updates every second, this causes massive, unnecessary re-renders across all tabs, destroying performance.
**Action:** Always use direct state selectors like `useGameStore(state => state.property)` for single values, or `useShallow` from `zustand/react/shallow` when extracting multiple values, to minimize re-renders.
