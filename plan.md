1.  **Modify `components/tabs/AdsTab.tsx`**
    -   Replace the global store destructuring `const { nullifierHash } = useGameStore()` with a specific state selector to prevent unnecessary re-renders when other state properties change.
    -   Use `const nullifierHash = useGameStore(state => state.nullifierHash)`.
2.  **Modify `components/tabs/SurveyTab.tsx`**
    -   Replace `const { nullifierHash } = useGameStore()` with `const nullifierHash = useGameStore(state => state.nullifierHash)`.
3.  **Modify `components/tabs/RouletteTab.tsx`**
    -   Replace `const { nullifierHash, particles, addParticles } = useGameStore()` with `useShallow` for multiple properties.
    -   Add `import { useShallow } from 'zustand/react/shallow'`
    -   Use `const { nullifierHash, particles, addParticles } = useGameStore(useShallow(state => ({ nullifierHash: state.nullifierHash, particles: state.particles, addParticles: state.addParticles })))`.
4.  **Modify `components/tabs/VoidClubTab.tsx`**
    -   Replace global store destructuring with `useShallow`
    -   Add `import { useShallow } from 'zustand/react/shallow'`
    -   Use `const { nullifierHash, loadGameState } = useGameStore(useShallow(state => ({ nullifierHash: state.nullifierHash, loadGameState: state.loadGameState })))`.
5.  **Modify `components/tabs/SeasonPassTab.tsx`**
    -   Replace global store destructuring with `useShallow`
    -   Add `import { useShallow } from 'zustand/react/shallow'`
    -   Use `const { bpLevel, bpXp, bpPremium, premiumVIP, bpClaimedFree, bpClaimedPremium, claimBpReward } = useGameStore(useShallow(state => ({ bpLevel: state.bpLevel, bpXp: state.bpXp, bpPremium: state.bpPremium, premiumVIP: state.premiumVIP, bpClaimedFree: state.bpClaimedFree, bpClaimedPremium: state.bpClaimedPremium, claimBpReward: state.claimBpReward })))`.
6.  **Modify `components/tabs/UpgradesTab.tsx`**
    -   Replace global store destructuring with `useShallow`
    -   Add `import { useShallow } from 'zustand/react/shallow'`
    -   Use `const { particles, upgradeClickPower, upgradeAutoCollector, purchaseUpgrade, unlockedPremiumUpgrades, nullifierHash } = useGameStore(useShallow(state => ({ particles: state.particles, upgradeClickPower: state.upgradeClickPower, upgradeAutoCollector: state.upgradeAutoCollector, purchaseUpgrade: state.purchaseUpgrade, unlockedPremiumUpgrades: state.unlockedPremiumUpgrades, nullifierHash: state.nullifierHash })))`.
7.  **Modify `components/tabs/PremiumTab.tsx`**
    -   Replace global store destructuring with `useShallow`
    -   Add `import { useShallow } from 'zustand/react/shallow'`
    -   Use `const { premiumParticleSkin, premiumBackgroundTheme, premiumLuckyParticle, premiumOfflineEarnings, premiumDailyBonus, premiumVIP, vipTier, purchasePremiumUpgrade, equipSkin, equipTheme, unlockedSkins, unlockedThemes, claimDailyBonus, lastDailyBonusTime, loginStreak, nullifierHash, loadGameState } = useGameStore(useShallow(state => ({ premiumParticleSkin: state.premiumParticleSkin, premiumBackgroundTheme: state.premiumBackgroundTheme, premiumLuckyParticle: state.premiumLuckyParticle, premiumOfflineEarnings: state.premiumOfflineEarnings, premiumDailyBonus: state.premiumDailyBonus, premiumVIP: state.premiumVIP, vipTier: state.vipTier, purchasePremiumUpgrade: state.purchasePremiumUpgrade, equipSkin: state.equipSkin, equipTheme: state.equipTheme, unlockedSkins: state.unlockedSkins, unlockedThemes: state.unlockedThemes, claimDailyBonus: state.claimDailyBonus, lastDailyBonusTime: state.lastDailyBonusTime, loginStreak: state.loginStreak, nullifierHash: state.nullifierHash, loadGameState: state.loadGameState })))`.
8.  **Test execution**
    -   Run `npm run lint -- --ignore-pattern="fix_v1/*" --ignore-pattern="_app_fix/*" --ignore-pattern="scripts/*"`.
    -   Run `npx jest --testPathIgnorePatterns="fix_v1|_app_fix|scripts"`.
9.  **Pre-commit steps**
    -   Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
10. **Submit PR**
    -   Submit the PR with the required Bolt format (Title: '⚡ Bolt: [performance improvement]', Description must include '💡 What', '🎯 Why', '📊 Impact', and '🔬 Measurement').
