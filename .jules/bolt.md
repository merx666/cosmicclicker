## 2024-05-24 - Zustand Global State Re-render Anti-Pattern
**Learning:** Destructuring the entire `useGameStore()` in components (e.g. Tabs) subscribes them to all state changes, including the highly frequent `particles` tick. This causes massive unnecessary re-renders across the app.
**Action:** Always use specific state selectors (`useGameStore(state => state.property)`) for single properties or `useShallow` for multiple properties to isolate re-renders.
