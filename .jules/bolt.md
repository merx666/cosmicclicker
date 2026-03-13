## 2024-05-19 - Understanding The Game Store
**Learning:** Found that the app uses Zustand for state management with complex tracking of clicks, particles, daily missions, achievements, battle passes, standard/premium upgrades, user info, VIP tiers, and saves to database with an auto-save / debounced-save mechanism.
**Action:** When picking a performance opportunity, look into areas like minimizing state updates, unnecessary re-renders in React hooks, or improving the auto-save mechanism.
## 2024-05-19 - React Component Re-renders With Zustand
**Learning:** Found that `GameScreen` components subscribe to `particles` from `useGameStore`. Because `addPassiveParticles` is called every second (if `particlesPerSecond` > 0), the `particles` state changes every second, which re-renders `GameScreen` every second. `GameScreen` manages many sub-components that also might get unnecessarily re-rendered. The `particles` variable is only used in `GameScreen` for the header to show the WLD amount.
**Action:** Extract the header out into a separate component so that `GameScreen` itself does not need to re-render every time `particles` updates.
