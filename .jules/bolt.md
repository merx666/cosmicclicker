## 2026-06-06 - Unnecessary re-renders with zustand's useGameStore()
**Learning:** Using `useGameStore()` without selectors (e.g., destructuring the entire store) in components like Tabs causes massive re-renders whenever any global state updates (like `particles` updating every second).
**Action:** Always use explicit property mappings with `useShallow` when selecting multiple properties from `useGameStore()`, or direct selectors for single properties.
