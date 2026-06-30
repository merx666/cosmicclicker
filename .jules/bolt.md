## 2024-05-25 - Zustand full store destructuring anti-pattern
**Learning:** Using `useGameStore()` without selectors (e.g., destructuring the entire store in components like Tabs) subscribes the component to the entire global state, causing massive re-renders on frequent updates like passive particle generation.
**Action:** Always use specific state selectors, utilizing `useShallow` when selecting multiple properties from the store.
