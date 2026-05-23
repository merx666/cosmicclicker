
## 2024-05-18 - Zustand Global Subscriptions Cause Unnecessary Renders
**Learning:** Components subscribing to `useGameStore()` without a selector or `useShallow` get re-rendered on *any* state change. Since `particles` (and potentially other stats) can update rapidly (e.g. passive income every second), any component blindly calling `const { ... } = useGameStore()` will be re-rendered every second, which is a massive performance bottleneck.
**Action:** Always use specific state selectors (`useGameStore(state => state.prop)`) or `useShallow` (`useGameStore(useShallow(state => ({ prop: state.prop })))`) when destructuring multiple properties from a frequently updated global store.
