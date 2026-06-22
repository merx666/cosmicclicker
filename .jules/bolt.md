## 2025-02-12 - Zustand Store Re-render Bottlenecks
**Learning:** Destructuring the entire `useGameStore()` in large components (like Tabs) subscribes them to the entire global state. This causes massive re-renders on frequent updates like passive particle generation.
**Action:** Always use specific state selectors or `useShallow` when extracting state from the store, especially in top-level components or those that do not rely on rapidly updating properties.
