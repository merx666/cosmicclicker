## 2026-07-06 - Zustand Store Subscriptions
**Learning:** Destructuring useGameStore without selectors subscribes components to the entire global state, causing massive re-renders on frequent updates like passive particle generation.
**Action:** Always use specific state selectors or useShallow from 'zustand/react/shallow' when selecting multiple properties.
