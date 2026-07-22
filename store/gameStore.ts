'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface GameState {
    // Core stats
    particles: number
    particlesPerClick: number
    particlesPerSecond: number
    totalClicks: number
    totalParticlesCollected: number
    totalPassiveParticles: number // NEW: for passive earnings mission

    // Daily mission counters (reset at 00:00 UTC)
    dailyClicks: number
    dailyPassiveParticles: number
    dailyParticlesCollected: number
    lastDailyReset: number | null
    claimedMissions: string[]

    // Hourly limits & Paywall
    hourlyClicks: number
    lastClickHourReset: number | null
    bypassUntil: number | null
    showEnergyPaywall: boolean
    setShowEnergyPaywall: (show: boolean) => void

    // Season 2: Battle Pass
    bpLevel: number
    bpXp: number
    bpPremium: boolean
    bpClaimedFree: string[]
    bpClaimedPremium: string[]

    // Season 2: Achievements
    achievements: Record<string, any>

    // Weekly challenges
    weeklyParticlesCollected: number
    weeklyClicks: number
    weeklyRouletteWins: number
    weeklyLoginDays: number
    weeklyPassiveParticles: number
    lastWeeklyReset: number | null
    claimedWeeklyChallenges: string[]

    // Upgrade levels
    upgradeClickPower: number
    upgradeAutoCollector: number
    upgradeMultiplier: number
    upgradeOffline: number

    // Premium upgrades (WLD purchases)
    premiumParticleSkin: string // 'default', 'rainbow', 'gold'
    premiumBackgroundTheme: string // 'default', 'nebula', 'galaxy'
    unlockedSkins: string[]
    unlockedThemes: string[]
    unlockedPremiumUpgrades: string[] // NEW: for WLD upgrades

    premiumAutoSave: boolean
    premiumStatistics: boolean
    premiumNotifications: boolean
    premiumLuckyParticle: boolean
    premiumOfflineEarnings: boolean
    premiumDailyBonus: boolean
    premiumVIP: boolean
    vipTier: number // 0=none, 1=bronze, 2=silver, 3=gold, 4=platinum

    // Daily bonus tracking
    lastDailyBonusTime: number | null
    loginStreak: number

    // Claim info
    lastClaimTime: number | null
    totalWldClaimed: number

    // User info
    nullifierHash: string | null
    lastSaveTime: number
    referralCode: string | null

    // Actions
    setNullifierHash: (hash: string) => void
    addParticles: (amount: number) => void
    addPassiveParticles: (amount: number) => void // NEW: for passive earnings tracking
    addBpXp: (amount: number) => void // NEW: for battle pass
    claimBpReward: (level: number, type: 'free' | 'premium', rewardParticles: number, rewardPremiumType?: string, rewardPremiumId?: string) => boolean
    checkAchievements: (key: string, amount: number) => void // NEW: Achievements check
    handleClick: () => boolean
    purchaseUpgrade: (upgradeType: string, cost: number, level: number) => boolean
    purchasePremiumUpgrade: (upgradeType: string) => boolean
    purchaseCosmicItem: (type: 'skin' | 'theme', value: string, cost: number) => boolean
    equipSkin: (skinId: string) => void
    equipTheme: (themeId: string) => void
    claimDailyBonus: () => boolean
    checkAndResetDailyStats: () => void
    checkAndResetWeeklyStats: () => void
    claimMissionReward: (missionId: string, reward: number) => boolean
    claimWeeklyReward: (challengeId: string, reward: number) => boolean
    incrementWeeklyRouletteWins: () => void
    loadGameState: (userHash: string) => Promise<void>
    saveGameState: () => Promise<void>
    debouncedSave: () => void
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            // Initial state
            particles: 0,
            particlesPerClick: 1,
            particlesPerSecond: 0,
            totalClicks: 0,
            totalParticlesCollected: 0,
            totalPassiveParticles: 0, // NEW

            // Daily mission counters
            dailyClicks: 0,
            dailyPassiveParticles: 0,
            dailyParticlesCollected: 0,
            lastDailyReset: null,
            claimedMissions: [],

            // Hourly limits & Paywall
            hourlyClicks: 0,
            lastClickHourReset: null,
            bypassUntil: null,
            showEnergyPaywall: false,
            setShowEnergyPaywall: (show) => set({ showEnergyPaywall: show }),

            // Season 2: Battle Pass
            bpLevel: 1,
            bpXp: 0,
            bpPremium: false,
            bpClaimedFree: [],
            bpClaimedPremium: [],

            // Season 2: Achievements
            achievements: {},

            // Weekly challenges
            weeklyParticlesCollected: 0,
            weeklyClicks: 0,
            weeklyRouletteWins: 0,
            weeklyLoginDays: 0,
            weeklyPassiveParticles: 0,
            lastWeeklyReset: null,
            claimedWeeklyChallenges: [],

            checkAchievements: (key: string, amount: number) => {
                const state = get()
                const current = state.achievements[key] || { level: 0, progress: 0 }

                // Achievement thresholds — must match MissionsTab.tsx definitions
                const THRESHOLDS: Record<string, number[]> = {
                    clicks:    [1000, 10000, 50000, 100000, 500000],
                    logins:    [3, 7, 14, 30, 100],
                    spins:     [5, 20, 50, 100, 500],
                    bp_levels: [5, 10, 15, 20],
                }

                const thresholds = THRESHOLDS[key]
                if (!thresholds) return

                const newProgress = current.progress + amount
                let newLevel = current.level

                // Check if threshold crossed (supports multi-level jumps)
                while (newLevel < thresholds.length && newProgress >= thresholds[newLevel]) {
                    newLevel++
                }

                set({
                    achievements: {
                        ...state.achievements,
                        [key]: { level: newLevel, progress: newProgress }
                    }
                })
            },

            upgradeClickPower: 1,
            upgradeAutoCollector: 0,
            upgradeMultiplier: 0,
            upgradeOffline: 0,

            // Premium upgrades
            premiumParticleSkin: 'default',
            premiumBackgroundTheme: 'default',
            unlockedSkins: ['default'],
            unlockedThemes: ['default'],
            unlockedPremiumUpgrades: [],

            premiumAutoSave: false,
            premiumStatistics: false,
            premiumNotifications: false,
            premiumLuckyParticle: false,
            premiumOfflineEarnings: false,
            premiumDailyBonus: false,
            premiumVIP: false,
            vipTier: 0,

            lastDailyBonusTime: null,
            loginStreak: 0,

            lastClaimTime: null,
            totalWldClaimed: 0,

            nullifierHash: null,
            referralCode: null,
            lastSaveTime: Date.now(),

            // Set user's nullifier hash
            setNullifierHash: (hash) => set({ nullifierHash: hash }),

            // Add particles
            addParticles: (amount) => set((state) => ({
                particles: state.particles + amount,
                totalParticlesCollected: state.totalParticlesCollected + amount,
                dailyParticlesCollected: state.dailyParticlesCollected + amount,
                weeklyParticlesCollected: state.weeklyParticlesCollected + amount
            })),

            // Add passive particles (from auto-collector)
            addPassiveParticles: (amount) => set((state) => ({
                particles: state.particles + amount,
                totalParticlesCollected: state.totalParticlesCollected + amount,
                totalPassiveParticles: state.totalPassiveParticles + amount,
                dailyPassiveParticles: state.dailyPassiveParticles + amount,
                dailyParticlesCollected: state.dailyParticlesCollected + amount,
                weeklyPassiveParticles: state.weeklyPassiveParticles + amount,
                weeklyParticlesCollected: state.weeklyParticlesCollected + amount
            })),

            // Handle click
            handleClick: () => {
                const state = get()

                // Check Hourly Limit
                const now = Date.now()
                const d = new Date(now)
                d.setMinutes(0, 0, 0)
                const currentHourStart = d.getTime()

                let currentHourlyClicks = state.hourlyClicks || 0

                if (!state.lastClickHourReset || state.lastClickHourReset !== currentHourStart) {
                    currentHourlyClicks = 0
                    set({ hourlyClicks: 0, lastClickHourReset: currentHourStart })
                    // Immediate save to prevent infinite reset exploit
                    setTimeout(() => get().saveGameState(), 100)
                }

                const hasBypass = state.premiumVIP || (state.bypassUntil && state.bypassUntil > now) || (Array.isArray(state.unlockedPremiumUpgrades) && state.unlockedPremiumUpgrades.includes('singularity_perm'))

                // Calculate tier bonus: Bronze=0, Silver=+2, Gold=+5, Platinum=+10
                const tierBonus = [0, 0, 2, 5, 10][state.vipTier] || 0
                let earned = state.particlesPerClick + tierBonus

                // Apply Premium WLD Upgrades
                if (Array.isArray(state.unlockedPremiumUpgrades) && state.unlockedPremiumUpgrades.includes('void_core_multiplier')) {
                    earned *= 2
                }

                // Apply active click booster (Void Surge: +500% / multiplied by 6)
                const boosterExpiry = state.achievements?.booster_click_multiplier_until
                if (boosterExpiry && Number(boosterExpiry) > now) {
                    earned *= 6
                }

                // Energy check: each click costs as much energy as the particles earned
                if ((currentHourlyClicks + earned) > 1000 && !hasBypass) {
                    if (!state.showEnergyPaywall) {
                        set({ showEnergyPaywall: true })
                        get().saveGameState() // Immediate save when reaching limit
                    }
                    return false
                }

                set({
                    particles: state.particles + earned,
                    totalClicks: state.totalClicks + 1,
                    totalParticlesCollected: state.totalParticlesCollected + earned,
                    dailyClicks: state.dailyClicks + 1,
                    dailyParticlesCollected: state.dailyParticlesCollected + earned,
                    weeklyClicks: state.weeklyClicks + 1,
                    weeklyParticlesCollected: state.weeklyParticlesCollected + earned,
                    hourlyClicks: currentHourlyClicks + earned
                })

                // Add BP XP for clicking (e.g. 1 click = 1 XP)
                get().addBpXp(1)
                get().checkAchievements('clicks', 1)

                // Trigger debounced save
                get().debouncedSave()
                return true
            },

            // Purchase upgrade
            purchaseUpgrade: (upgradeType, cost, level) => {
                const state = get()

                if (state.particles < cost) {
                    return false // Not enough particles
                }

                set({ particles: state.particles - cost })

                switch (upgradeType) {
                    case 'click_power':
                        set({
                            upgradeClickPower: level,
                            particlesPerClick: level
                        })
                        break
                    case 'auto_collector':
                        set({
                            upgradeAutoCollector: level,
                            particlesPerSecond: level
                        })
                        break
                    case 'multiplier':
                        set({ upgradeMultiplier: level })
                        break
                    case 'offline':
                        set({ upgradeOffline: level })
                        break
                }

                get().saveGameState()
                return true
            },

            // Equip actions
            equipSkin: (skinId) => {
                const state = get()
                if (state.unlockedSkins.includes(skinId)) {
                    set({ premiumParticleSkin: skinId })
                    get().saveGameState()
                }
            },

            equipTheme: (themeId) => {
                const state = get()
                if (state.unlockedThemes.includes(themeId)) {
                    set({ premiumBackgroundTheme: themeId })
                    get().saveGameState()
                }
            },

            // Add Battle Pass XP
            addBpXp: (amount) => {
                const state = get()
                const newXp = state.bpXp + amount
                const nextLevelReq = state.bpLevel * 100 // Formula: 100 XP * Level

                if (newXp >= nextLevelReq && state.bpLevel < 20) {
                    set({
                        bpXp: newXp - nextLevelReq,
                        bpLevel: state.bpLevel + 1
                    })
                } else if (state.bpLevel >= 20) {
                    // Max level cap reached
                    if (state.bpXp < 2000) set({ bpXp: state.bpXp + amount }) // keep adding to a soft cap
                } else {
                    set({ bpXp: newXp })
                }
            },

            // Claim Battle Pass Reward
            claimBpReward: (level, type, rewardParticles, rewardPremiumType, rewardPremiumId) => {
                const state = get()

                // Validiations
                if (state.bpLevel < level) return false
                if (type === 'free' && state.bpClaimedFree.includes(level.toString())) return false
                if (type === 'premium' && state.bpClaimedPremium.includes(level.toString())) return false
                if (type === 'premium' && !state.bpPremium && !state.premiumVIP) return false

                if (type === 'free') {
                    set({
                        particles: state.particles + rewardParticles,
                        totalParticlesCollected: state.totalParticlesCollected + rewardParticles,
                        bpClaimedFree: [...state.bpClaimedFree, level.toString()]
                    })
                } else {
                    // Handle premium specific rewards
                    if (rewardPremiumType === 'skin' && rewardPremiumId) {
                        if (!state.unlockedSkins.includes(rewardPremiumId)) {
                            set({ unlockedSkins: [...state.unlockedSkins, rewardPremiumId] })
                        }
                    } else if (rewardPremiumType === 'theme' && rewardPremiumId) {
                        if (!state.unlockedThemes.includes(rewardPremiumId)) {
                            set({ unlockedThemes: [...state.unlockedThemes, rewardPremiumId] })
                        }
                    }

                    // Add particle rewards anyway
                    set({
                        particles: state.particles + rewardParticles,
                        totalParticlesCollected: state.totalParticlesCollected + rewardParticles,
                        bpClaimedPremium: [...state.bpClaimedPremium, level.toString()]
                    })
                }

                get().checkAchievements('bp_levels', 1)
                get().debouncedSave()
                return true
            },



            // Purchase premium upgrade
            purchasePremiumUpgrade: (upgradeType) => {
                const state = get()

                switch (upgradeType) {
                    case 'particle_skin_rainbow':
                        if (!state.unlockedSkins.includes('rainbow')) {
                            set({
                                unlockedSkins: [...state.unlockedSkins, 'rainbow'],
                                premiumParticleSkin: 'rainbow'
                            })
                        }
                        break
                    case 'particle_skin_gold':
                        if (!state.unlockedSkins.includes('gold')) {
                            set({
                                unlockedSkins: [...state.unlockedSkins, 'gold'],
                                premiumParticleSkin: 'gold'
                            })
                        }
                        break
                    case 'background_nebula':
                        if (!state.unlockedThemes.includes('nebula')) {
                            set({
                                unlockedThemes: [...state.unlockedThemes, 'nebula'],
                                premiumBackgroundTheme: 'nebula'
                            })
                        }
                        break
                    case 'background_galaxy':
                        if (!state.unlockedThemes.includes('galaxy')) {
                            set({
                                unlockedThemes: [...state.unlockedThemes, 'galaxy'],
                                premiumBackgroundTheme: 'galaxy'
                            })
                        }
                        break
                    case 'auto_save':
                        set({ premiumAutoSave: true })
                        break
                    case 'statistics':
                        set({ premiumStatistics: true })
                        break
                    case 'notifications':
                        set({ premiumNotifications: true })
                        break
                    case 'lucky_particle':
                        set({ premiumLuckyParticle: true })
                        break
                    case 'offline_earnings':
                        set({ premiumOfflineEarnings: true })
                        break
                    case 'daily_bonus':
                        set({ premiumDailyBonus: true })
                        break
                    case 'vip':
                        // VIP unlocks everything
                        const allSkins = ['default', 'rainbow', 'gold']
                        const allThemes = ['default', 'nebula', 'galaxy']

                        set({
                            premiumVIP: true,
                            premiumAutoSave: true,
                            premiumStatistics: true,
                            premiumNotifications: true,
                            premiumLuckyParticle: true,
                            premiumOfflineEarnings: true,
                            premiumDailyBonus: true,
                            unlockedSkins: Array.from(new Set([...state.unlockedSkins, ...allSkins])),
                            unlockedThemes: Array.from(new Set([...state.unlockedThemes, ...allThemes])),
                            bpPremium: true // VIP unlocks premium BP
                        })
                        break
                    default:
                        return false
                }

                get().saveGameState()
                return true
            },

            purchaseCosmicItem: (type, value, cost) => {
                const state = get()
                if (state.particles < cost) {
                    return false
                }

                if (type === 'skin') {
                    if (state.unlockedSkins.includes(value)) return false
                    set({
                        particles: state.particles - cost,
                        unlockedSkins: [...state.unlockedSkins, value]
                    })
                } else if (type === 'theme') {
                    if (state.unlockedThemes.includes(value)) return false
                    set({
                        particles: state.particles - cost,
                        unlockedThemes: [...state.unlockedThemes, value]
                    })
                }

                get().saveGameState()
                return true
            },

            // Check and reset daily stats at 00:00 UTC
            checkAndResetDailyStats: () => {
                const now = Date.now()
                const todayUTC = new Date(now)
                todayUTC.setUTCHours(0, 0, 0, 0)
                const todayStart = todayUTC.getTime()

                const state = get()
                // If never reset or last reset was before today's 00:00 UTC
                if (!state.lastDailyReset || state.lastDailyReset < todayStart) {
                    set({
                        dailyClicks: 0,
                        dailyPassiveParticles: 0,
                        dailyParticlesCollected: 0,
                        claimedMissions: [],
                        lastDailyReset: now
                    })
                }

                // Also check weekly reset
                get().checkAndResetWeeklyStats()
            },

            // Check and reset weekly stats at Monday 00:00 UTC
            checkAndResetWeeklyStats: () => {
                const now = Date.now()
                const d = new Date(now)
                // Find this week's Monday 00:00 UTC
                const dayOfWeek = d.getUTCDay() // 0=Sun, 1=Mon
                const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // days since Monday
                const monday = new Date(d)
                monday.setUTCDate(d.getUTCDate() - diff)
                monday.setUTCHours(0, 0, 0, 0)
                const mondayStart = monday.getTime()

                const state = get()
                if (!state.lastWeeklyReset || state.lastWeeklyReset < mondayStart) {
                    set({
                        weeklyParticlesCollected: 0,
                        weeklyClicks: 0,
                        weeklyRouletteWins: 0,
                        weeklyLoginDays: 0,
                        weeklyPassiveParticles: 0,
                        claimedWeeklyChallenges: [],
                        lastWeeklyReset: now
                    })
                }
            },

            // Claim mission reward
            claimMissionReward: (missionId, reward) => {
                const state = get()
                if (state.claimedMissions.includes(missionId)) {
                    return false // Already claimed
                }

                set({
                    particles: state.particles + reward,
                    totalParticlesCollected: state.totalParticlesCollected + reward,
                    dailyParticlesCollected: state.dailyParticlesCollected + reward,
                    claimedMissions: [...state.claimedMissions, missionId]
                })

                get().saveGameState()
                return true
            },

            // Claim weekly challenge reward
            claimWeeklyReward: (challengeId, reward) => {
                const state = get()
                if (state.claimedWeeklyChallenges.includes(challengeId)) {
                    return false
                }

                set({
                    particles: state.particles + reward,
                    totalParticlesCollected: state.totalParticlesCollected + reward,
                    weeklyParticlesCollected: state.weeklyParticlesCollected + reward,
                    claimedWeeklyChallenges: [...state.claimedWeeklyChallenges, challengeId]
                })

                get().addBpXp(50) // ponytail: flat XP, scale when BP system evolves
                get().saveGameState()
                return true
            },

            // Increment weekly roulette wins (called from RouletteTab)
            incrementWeeklyRouletteWins: () => {
                set((state) => ({ weeklyRouletteWins: state.weeklyRouletteWins + 1 }))
            },

            // Claim daily bonus
            claimDailyBonus: () => {
                const state = get()

                if (!state.premiumDailyBonus) {
                    return false // Need to own daily bonus upgrade
                }

                const now = Date.now()
                const oneDayMs = 24 * 60 * 60 * 1000

                // Check if 24h passed since last claim
                if (state.lastDailyBonusTime && (now - state.lastDailyBonusTime < oneDayMs)) {
                    return false // Cooldown not ready
                }

                // Check if consecutive day
                const daysSinceLastClaim = state.lastDailyBonusTime
                    ? Math.floor((now - state.lastDailyBonusTime) / oneDayMs)
                    : 0

                const newStreak = daysSinceLastClaim <= 1 ? state.loginStreak + 1 : 1

                // Grant bonus particles
                const bonusAmount = 760

                set({
                    particles: state.particles + bonusAmount,
                    totalParticlesCollected: state.totalParticlesCollected + bonusAmount,
                    lastDailyBonusTime: now,
                    loginStreak: newStreak
                })

                // Achievement tick
                if (newStreak > state.loginStreak) {
                    get().checkAchievements('logins', 1)
                }

                get().saveGameState()
                return true
            },

            // Load game state from API
            loadGameState: async (userHash) => {
                try {
                    const response = await fetch(`/api/game-state?hash=${userHash}`)
                    if (response.ok) {
                        const data = await response.json()
                        set({
                            particles: Number(data.particles || 0),
                            particlesPerClick: Number(data.particles_per_click || 1),
                            particlesPerSecond: Number(data.particles_per_second || 0),
                            totalClicks: Number(data.total_clicks || 0),
                            totalParticlesCollected: Number(data.total_particles_collected || 0),
                            totalPassiveParticles: Number(data.total_passive_particles || 0), // NEW
                            upgradeClickPower: Number(data.upgrade_click_power || 1),
                            upgradeAutoCollector: Number(data.upgrade_auto_collector || 0),
                            upgradeMultiplier: Number(data.upgrade_multiplier || 0),
                            upgradeOffline: Number(data.upgrade_offline || 0),

                            // Premium
                            premiumParticleSkin: data.premium_particle_skin || 'default',
                            premiumBackgroundTheme: data.premium_background_theme || 'default',
                            // Fallback for unlocked arrays if not present in DB yet
                            unlockedSkins: data.unlocked_skins || ['default'],
                            unlockedThemes: data.unlocked_themes || ['default'],
                            unlockedPremiumUpgrades: Array.isArray(data.unlocked_premium_upgrades) ? data.unlocked_premium_upgrades : [],

                            premiumAutoSave: data.premium_auto_save || false,
                            premiumStatistics: data.premium_statistics || false,
                            premiumNotifications: data.premium_notifications || false,
                            premiumLuckyParticle: data.premium_lucky_particle || false,
                            premiumOfflineEarnings: data.premium_offline_earnings || false,
                            premiumDailyBonus: data.premium_daily_bonus || false,
                            premiumVIP: data.premium_vip || false,
                            vipTier: Number(data.vip_tier || 0),

                            lastDailyBonusTime: data.last_daily_bonus_time ? new Date(data.last_daily_bonus_time).getTime() : null,
                            loginStreak: Number(data.login_streak || 0),

                            lastClaimTime: data.last_claim_time ? new Date(data.last_claim_time).getTime() : null,
                            totalWldClaimed: Number(data.total_wld_claimed || 0),

                            // Daily mission counters
                            dailyClicks: Number(data.daily_clicks || 0),
                            dailyPassiveParticles: Number(data.daily_passive_particles || 0),
                            dailyParticlesCollected: Number(data.daily_particles_collected || 0),
                            lastDailyReset: data.last_daily_reset ? new Date(data.last_daily_reset).getTime() : null,
                            claimedMissions: data.claimed_missions || [],

                            hourlyClicks: Number(data.hourly_clicks || 0),
                            lastClickHourReset: data.last_click_hour_reset ? new Date(data.last_click_hour_reset).getTime() : null,
                            bypassUntil: data.bypass_until ? new Date(data.bypass_until).getTime() : null,

                            bpLevel: Number(data.bp_level || 1),
                            bpXp: Number(data.bp_xp || 0),
                            bpPremium: data.bp_premium || false,
                            bpClaimedFree: data.bp_claimed_free || [],
                            bpClaimedPremium: data.bp_claimed_premium || [],

                            achievements: data.achievements && typeof data.achievements === 'object' ? data.achievements : {},

                            // Weekly challenges
                            weeklyParticlesCollected: Number(data.weekly_particles_collected || 0),
                            weeklyClicks: Number(data.weekly_clicks || 0),
                            weeklyRouletteWins: Number(data.weekly_roulette_wins || 0),
                            weeklyLoginDays: Number(data.weekly_login_days || 0),
                            weeklyPassiveParticles: Number(data.weekly_passive_particles || 0),
                            lastWeeklyReset: data.last_weekly_reset ? new Date(data.last_weekly_reset).getTime() : null,
                            claimedWeeklyChallenges: data.claimed_weekly_challenges || [],

                            lastSaveTime: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
                            nullifierHash: userHash,
                            referralCode: data.referral_code || null
                        })

                        // Check and reset daily stats if needed
                        get().checkAndResetDailyStats()
                    }
                } catch (error) {
                    console.error('Failed to load game state:', error)
                }
            },

            // Debounced save
            debouncedSave: () => {
                if (saveTimeout) clearTimeout(saveTimeout)
                saveTimeout = setTimeout(() => {
                    get().saveGameState()
                    saveTimeout = null
                }, 2000)
            },

            // Save game state to API
            saveGameState: async () => {
                const state = get()

                if (!state.nullifierHash) return

                try {
                    await fetch('/api/game-state', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            nullifier_hash: state.nullifierHash,
                            particles: state.particles,
                            particles_per_click: state.particlesPerClick,
                            particles_per_second: state.particlesPerSecond,
                            total_clicks: state.totalClicks,
                            total_particles_collected: state.totalParticlesCollected,
                            total_passive_particles: state.totalPassiveParticles, // NEW
                            upgrade_click_power: state.upgradeClickPower,
                            upgrade_auto_collector: state.upgradeAutoCollector,
                            upgrade_multiplier: state.upgradeMultiplier,
                            upgrade_offline: state.upgradeOffline,

                            // Premium fields
                            premium_particle_skin: state.premiumParticleSkin,
                            premium_background_theme: state.premiumBackgroundTheme,
                            unlocked_skins: state.unlockedSkins,
                            unlocked_themes: state.unlockedThemes,
                            unlocked_premium_upgrades: state.unlockedPremiumUpgrades,

                            premium_auto_save: state.premiumAutoSave,
                            premium_statistics: state.premiumStatistics,
                            premium_notifications: state.premiumNotifications,
                            premium_lucky_particle: state.premiumLuckyParticle,
                            premium_offline_earnings: state.premiumOfflineEarnings,
                            premium_daily_bonus: state.premiumDailyBonus,
                            premium_vip: state.premiumVIP,

                            last_daily_bonus_time: state.lastDailyBonusTime ? new Date(state.lastDailyBonusTime).toISOString() : null,
                            login_streak: state.loginStreak,

                            // Daily mission counters
                            daily_clicks: state.dailyClicks,
                            daily_passive_particles: state.dailyPassiveParticles,
                            daily_particles_collected: state.dailyParticlesCollected,
                            last_daily_reset: state.lastDailyReset ? new Date(state.lastDailyReset).toISOString() : null,
                            claimed_missions: state.claimedMissions,

                            hourly_clicks: state.hourlyClicks,
                            last_click_hour_reset: state.lastClickHourReset ? new Date(state.lastClickHourReset).toISOString() : null,
                            bypass_until: state.bypassUntil ? new Date(state.bypassUntil).toISOString() : null,

                            bp_level: state.bpLevel,
                            bp_xp: state.bpXp,
                            bp_premium: state.bpPremium,
                            bp_claimed_free: state.bpClaimedFree,
                            bp_claimed_premium: state.bpClaimedPremium,
                            achievements: state.achievements,

                            // Weekly challenges
                            weekly_particles_collected: state.weeklyParticlesCollected,
                            weekly_clicks: state.weeklyClicks,
                            weekly_roulette_wins: state.weeklyRouletteWins,
                            weekly_login_days: state.weeklyLoginDays,
                            weekly_passive_particles: state.weeklyPassiveParticles,
                            last_weekly_reset: state.lastWeeklyReset ? new Date(state.lastWeeklyReset).toISOString() : null,
                            claimed_weekly_challenges: state.claimedWeeklyChallenges
                        })
                    })

                    set({ lastSaveTime: Date.now() })
                } catch (error) {
                    console.error('Failed to save game state:', error)
                }
            },
        }),
        {
            name: 'void-collector-storage',
            partialize: (state) => ({
                particles: state.particles,
                particlesPerClick: state.particlesPerClick,
                particlesPerSecond: state.particlesPerSecond,
                totalClicks: state.totalClicks,
                totalParticlesCollected: state.totalParticlesCollected,
                totalPassiveParticles: state.totalPassiveParticles, // NEW

                // Upgrades
                upgradeClickPower: state.upgradeClickPower,
                upgradeAutoCollector: state.upgradeAutoCollector,
                upgradeMultiplier: state.upgradeMultiplier,
                upgradeOffline: state.upgradeOffline,

                // Premium
                premiumParticleSkin: state.premiumParticleSkin,
                premiumBackgroundTheme: state.premiumBackgroundTheme,
                unlockedSkins: state.unlockedSkins,
                unlockedThemes: state.unlockedThemes,
                unlockedPremiumUpgrades: state.unlockedPremiumUpgrades,

                premiumAutoSave: state.premiumAutoSave,
                premiumStatistics: state.premiumStatistics,
                premiumNotifications: state.premiumNotifications,
                premiumLuckyParticle: state.premiumLuckyParticle,
                premiumOfflineEarnings: state.premiumOfflineEarnings,
                premiumDailyBonus: state.premiumDailyBonus,
                premiumVIP: state.premiumVIP,

                // Daily Bonus & Streak
                lastDailyBonusTime: state.lastDailyBonusTime,
                loginStreak: state.loginStreak,

                // Claims & Meta
                lastClaimTime: state.lastClaimTime,
                totalWldClaimed: state.totalWldClaimed,
                lastSaveTime: state.lastSaveTime,
                nullifierHash: state.nullifierHash,

                // Daily mission counters
                dailyClicks: state.dailyClicks,
                dailyPassiveParticles: state.dailyPassiveParticles,
                dailyParticlesCollected: state.dailyParticlesCollected,
                lastDailyReset: state.lastDailyReset,
                claimedMissions: state.claimedMissions,

                hourlyClicks: state.hourlyClicks,
                lastClickHourReset: state.lastClickHourReset,
                bypassUntil: state.bypassUntil,

                bpLevel: state.bpLevel,
                bpXp: state.bpXp,
                bpPremium: state.bpPremium,
                bpClaimedFree: state.bpClaimedFree,
                bpClaimedPremium: state.bpClaimedPremium,

                achievements: state.achievements,

                // Weekly challenges
                weeklyParticlesCollected: state.weeklyParticlesCollected,
                weeklyClicks: state.weeklyClicks,
                weeklyRouletteWins: state.weeklyRouletteWins,
                weeklyLoginDays: state.weeklyLoginDays,
                weeklyPassiveParticles: state.weeklyPassiveParticles,
                lastWeeklyReset: state.lastWeeklyReset,
                claimedWeeklyChallenges: state.claimedWeeklyChallenges
            })
        }
    )
)
