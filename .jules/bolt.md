## 2024-05-27 - Zustand Selector Optimization
**Learning:** Destructuring the entire Zustand store without selectors (e.g., `const { nullifierHash } = useGameStore()`) subscribes the component to all state changes, causing massive re-renders on frequent updates like passive particle generation.
**Action:** Always use specific state selectors for single properties or `useShallow` from 'zustand/react/shallow' for multiple properties to prevent unnecessary re-renders.
