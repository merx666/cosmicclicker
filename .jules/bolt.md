
## 2024-05-18 - Zustand Full Store Destructuring causes massive re-renders
**Learning:** Using `const { a, b } = useGameStore()` without a selector in a Zustand store subscribes the component to the entire store state. In games with frequent state updates (like passive particle generation ticking every second), this causes massive, unnecessary cascading re-renders across all tabs and UI elements, crippling performance.
**Action:** Always use specific state selectors or `useShallow` when pulling multiple variables from Zustand (`const { a, b } = useGameStore(useShallow(state => ({ a: state.a, b: state.b })))`) to prevent re-renders on unrelated state changes.
