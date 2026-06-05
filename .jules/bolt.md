
## 2025-02-14 - Isolate High-Frequency Global State Selectors
**Learning:** The entire `GameScreen` component was re-rendering every second because it directly selected `particles` from the global Zustand store to display in the header.
**Action:** When a global state value updates frequently (like idle game currencies), extract the specific UI element displaying that value into its own small component that subscribes to the store, preventing the parent from unnecessary re-renders.
