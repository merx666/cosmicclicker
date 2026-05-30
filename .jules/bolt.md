## 2026-05-30 - Zustand useShallow Optimization
**Learning:** Using `useGameStore()` without selectors subscribes components to the entire global state, causing massive re-renders on frequent updates like passive particle generation.
**Action:** Always use specific state selectors or `useShallow` when pulling multiple properties from the Zustand store.
