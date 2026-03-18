
## 2024-05-18 - Isolate frequent Zustand state updates
**Learning:** `GameScreen.tsx` was subscribed to the `particles` state, which updates very frequently (up to 60 times a second when holding the spacebar or auto-collecting). This caused the entire application's main component to re-render constantly. Zustand hooks trigger re-renders on every value change for subscribed properties.
**Action:** When working with frequently updating global state in React (like a score or particle count), create tiny, dedicated wrapper components (like `ParticleBalance.tsx`) whose only job is to subscribe to that specific state and render it. This isolates the re-renders to the absolute minimum DOM nodes and prevents larger parent components from thrashing.
