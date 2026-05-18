## 2024-05-24 - Zustand Full Store Subscription Anti-Pattern
**Learning:** Destructuring the entire useGameStore() without selectors causes components to re-render on every state update, even unrelated ones like passive particle generation.
**Action:** Always use specific state selectors or useShallow when selecting multiple properties from the store to prevent unnecessary re-renders.
