## 2025-02-23 - Zustand State Subscription Causing Massive Re-renders
**Learning:** Subscribing to frequently changing global state (like `particles` which updates every second and on every click) at the top level of a large component tree (`GameScreen.tsx`) causes the entire tree and all its tabs to re-render unnecessarily.
**Action:** Isolate subscriptions to frequently changing state into small, dedicated components (e.g., `WldBadge.tsx`) to prevent cascading re-renders in the parent component and its siblings.
