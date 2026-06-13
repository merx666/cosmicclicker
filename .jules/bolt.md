
## 2024-05-18 - Zustand Destructuring Performance Anti-pattern
**Learning:** Destructuring directly from `useGameStore()` subscribes the component to the entire global state. In components with high-frequency state updates elsewhere (like passive particle generation), this leads to massive unnecessary re-renders.
**Action:** Always use specific state selectors (`useGameStore(state => state.property)`). When multiple properties must be selected from the store within a single component, always import and wrap the selector with `useShallow` (`import { useShallow } from 'zustand/react/shallow'`).
