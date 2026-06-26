## 2026-06-26 - Zustand Selector Optimization
**Learning:** Destructuring entire Zustand stores in components causes massive re-renders on frequent state updates (like particle generation).
**Action:** Always use specific state selectors or useShallow when selecting multiple properties from a Zustand store.
