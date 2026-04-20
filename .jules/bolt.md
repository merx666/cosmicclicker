## 2024-04-20 - Global State Selections in React
**Learning:** Using `useGameStore()` without selectors subscribes the component to the entire global state, causing massive re-renders on frequent updates.
**Action:** Always use specific state selectors (`useGameStore(state => state.property)`) or `useShallow` when multiple properties are needed.
