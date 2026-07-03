## 2024-05-18 - Zustand Full Store Unpacking Anti-pattern
**Learning:** Many components destructure entire Zustand stores or single properties using `const { prop } = useGameStore()` without selectors. This subscribes the components to every store change (like `particles` updating constantly), triggering widespread, unnecessary re-renders across the app.
**Action:** Replace `const { prop } = useGameStore()` with direct selectors like `const prop = useGameStore(state => state.prop)` for single variables, and use `useShallow` when multiple properties are needed.
