
## 2026-07-05 - Prevent Zustand Tab Re-renders
**Learning:** Destructuring the entire useGameStore() without selectors causes components to subscribe to the entire global state, causing massive re-renders on frequent updates like passive particle generation.
**Action:** Use useShallow from 'zustand/react/shallow' when multiple properties must be selected to prevent unnecessary re-renders.
