## 2025-05-18 - Zustand Selector Optimization
**Learning:** Using `useGameStore()` without selectors subscribes components to the entire store, causing unnecessary re-renders when unrelated state changes (like particle count ticking).
**Action:** When destructuring from Zustand stores, use `useShallow` when selecting multiple properties, or individual selectors when only taking a few.
