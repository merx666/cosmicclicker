## 2026-07-01 - Zustand destructuring causes excessive re-renders
**Learning:** Using useGameStore() and destructuring multiple properties without useShallow or selectors subscribes the component to all store changes.
**Action:** Always use specific state selectors or useShallow when selecting multiple properties from the store.
