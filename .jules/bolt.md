
## 2024-05-18 - Zustand useShallow Optimization
**Learning:** Using `useGameStore()` without selectors subscribes the component to the entire global state, causing massive re-renders on frequent updates like passive particle generation.
**Action:** Always use specific state selectors or `useShallow` when destructuring multiple properties from the Zustand store.
