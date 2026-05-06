## 2024-03-08 - Zustand State Selectors Anti-pattern
**Learning:** Destructuring the entire `useGameStore()` in Next.js/React components (e.g. `const { nullifierHash } = useGameStore()`) subscribes those components to all global state changes. In this app, `particles` update passively every second, causing heavy UI components like `PremiumTab`, `AdsTab`, `RouletteTab` to needlessly re-render every second.
**Action:** Always use specific state selectors (`useGameStore(state => state.prop)`) for single properties, or `useShallow` from `zustand/react/shallow` when multiple properties are needed.
