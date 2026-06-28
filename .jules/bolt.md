
## 2024-05-24 - Zustand Full Destructuring Anti-pattern
**Learning:** Using `const { property } = useGameStore()` subscribes the component to the entire store. In a game with frequent state updates like passive particle generation (updating every second), this causes massive, unnecessary re-renders across all tabs and screens even if they don't consume the frequently updating properties.
**Action:** Always use specific state selectors, like `const property = useGameStore(state => state.property)`, or `useShallow` for multiple properties, to ensure components only re-render when their specific dependent state changes.
