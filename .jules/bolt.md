
## 2024-11-20 - Global State Re-render Cascades
**Learning:** In a highly interactive app using Zustand, directly subscribing to a frequently changing global state (like `particles`, which updates every second and on every click) in a large root component (like `GameScreen`) forces the entire component tree to unnecessarily re-render on every state tick. This creates severe performance bottlenecks, especially when the component contains heavy animations and un-memoized children.
**Action:** Always isolate subscriptions to highly volatile global state into tiny, purpose-built components (e.g., `<ParticleCounter />` or `<WldBalance />`). This restricts React's reconciliation cycle to only the precise DOM nodes that need updating, avoiding massive re-render cascades.
