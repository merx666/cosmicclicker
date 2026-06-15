
## 2026-06-15 - Zustand Store Re-render Optimization
**Learning:** Destructuring the entire useGameStore() without selectors subscribes components to the full global state, causing massive re-renders on frequent updates like passive particle generation.
**Action:** Always use specific state selectors or useShallow to extract only the required properties.
