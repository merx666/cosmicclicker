# Changelog

All notable changes to the Void Collector project will be documented in this file.

## [Unreleased] - 2026-02-17

### Added
- **VIP Tiers**: Introduced Platinum (165,000 VOID) and Diamond (1,650,000 VOID) tiers with enhanced benefits.
- **Contest Promo**: Added specific promotional banner for the "50 WLD Contest" in the Void Club tab.
- **Mass Notification**: Implemented and executed scripts for mass user notifications regarding the contest and new tiers.
- **Ani Ads Integration**: Added support for Ani Ads SDK (currently using local version due to NPM permission issues).
- **Void Club Tab**: Created a dedicated tab for Void Club features, separating it from the Premium tab.

### Changed
- **Difficulty Protocol**: Increased game difficulty by ~65% (higher upgrade costs, higher VIP thresholds).
- **UI Polish**: Improved visual aesthetics of the Void Club, including new tier badges and animations.
- **Navigation**: Updated bottom navigation to include the new Void Club tab.
- **Codebase**: Refactored `GameScreen.tsx` and `PremiumTab.tsx` to support the new structure.

### Fixed
- **Ani Ads**: Resolved integration issues in `GameScreen.tsx`.
- **VIP Logic**: Fixed logic for correctly identifying and displaying VIP tiers based on user holdings.
