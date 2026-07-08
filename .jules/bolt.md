## 2026-07-08 - Prevent re-renders in SeasonPassTab by shallow-selecting state
**Learning:** Destructuring the entire useGameStore() hook without a selector subscribes the component to all state updates (including rapid ticking like particles or timers). This is a major anti-pattern that destroys frontend performance in passive incremental games.
**Action:** Always use specific state selectors or useShallow from 'zustand/react/shallow' for extracting multiple state properties to decouple components from global ticks they don't care about.
