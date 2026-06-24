## 2025-02-18 - Zustand Full-State Subscription Anti-Pattern
**Learning:** Components destructuring directly from `useGameStore()` without `useShallow` subscribe to *all* state updates. In a game with a high-frequency tick rate (like `particles` updating continuously), this causes massive unnecessary re-renders across the entire UI.
**Action:** Always use `useShallow` from `zustand/react/shallow` when selecting multiple properties from a global store, especially in high-frequency update scenarios. Ensure all necessary properties are mapped correctly.
