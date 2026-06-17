## 2026-05-14 - Zustand Destructuring Anti-pattern
**Learning:** Destructuring the entire state object from `useGameStore()` without using selectors causes the component to subscribe to the entire global state. In this codebase, where properties like `particles` are frequently updated via passive generation, it causes massive unnecessary re-renders of the component.
**Action:** Always use specific state selectors, or `useShallow` from `zustand/react/shallow` when selecting multiple properties, to prevent performance degradation.
