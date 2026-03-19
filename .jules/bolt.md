## 2024-03-19 - Zustand Subscriptions without Selectors
**Learning:** Many components in this codebase (like `Tabs`) extract the entire Zustand state (e.g., `const { ... } = useGameStore()`) without using selectors. This is a severe anti-pattern because the `particles` state changes multiple times per second, causing massive, unnecessary re-renders across the entire component tree.
**Action:** When working on performance, actively search for and replace full store subscriptions with specific state selectors, or extract fast-changing values into tiny, isolated components like `HeaderBalance`.
