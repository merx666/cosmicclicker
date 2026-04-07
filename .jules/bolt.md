## 2025-02-12 - Zustand Store Re-renders
**Learning:** `useGameStore()` without destructuring causes huge re-renders (whole store). Must use specific state selectors or `useShallow`.
**Action:** Found multiple tabs (PremiumTab, SeasonPassTab, VoidClubTab, etc) extracting many variables via destructuring `useGameStore()`. We should wrap them with `useShallow` to prevent unneeded re-renders since the global state updates frequently (particles count).
