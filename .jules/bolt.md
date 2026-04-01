
## 2024-11-20 - Global Zustand Store Destructuring Anti-pattern
**Learning:** Using `useGameStore()` without selectors (e.g. `const { prop } = useGameStore()`) in components subscribes the component to the *entire* global state. In this codebase, passive properties like `particles` update frequently (every second). This causes massive, unnecessary re-renders in all components destructuring the store, even if they don't consume the changing property.
**Action:** Always use targeted selectors. Use direct selectors for single properties (`useGameStore(state => state.prop)`) and `useShallow` from `zustand/react/shallow` when multiple properties must be selected to prevent these global re-renders.
