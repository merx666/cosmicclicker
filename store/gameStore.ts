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

    premiumAutoSave: boolean
    premiumStatistics: boolean
    premiumNotifications: boolean
    premiumLuckyParticle: boolean
    premiumOfflineEarnings: boolean
    premiumDailyBonus: boolean
    premiumVIP: boolean

    // Daily bonus tracking
    lastDailyBonusTime: number | null
    loginStreak: number

    // Claim info
    lastClaimTime: number | null
    totalWldClaimed: number

    // User info
    nullifierHash: string | null
    lastSaveTime: number

    // Actions
    setNullifierHash: (hash: string) => void
    addParticles: (amount: number) => void
    addPassiveParticles: (amount: number) => void // NEW: for passive earnings tracking
    handleClick: () => void
    purchaseUpgrade: (upgradeType: string, cost: number, level: number) => boolean
    purchasePremiumUpgrade: (upgradeType: string) => boolean
    equipSkin: (skinId: string) => void
    equipTheme: (themeId: string) => void
    claimDailyBonus: () => boolean
    checkAndResetDailyStats: () => void
    claimMissionReward: (missionId: string, reward: number) => boolean
    loadGameState: (userHash: string) => Promise<void>
    saveGameState: () => Promise<void>
}

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

            upgradeClickPower: 1,
            upgradeAutoCollector: 0,
            upgradeMultiplier: 0,
            upgradeOffline: 0,

            // Premium upgrades
            premiumParticleSkin: 'default',
            premiumBackgroundTheme: 'default',
            unlockedSkins: ['default'],
            unlockedThemes: ['default'],

            premiumAutoSave: false,
            premiumStatistics: false,
            premiumNotifications: false,
            premiumLuckyParticle: false,
            premiumOfflineEarnings: false,
            premiumDailyBonus: false,
            premiumVIP: false,

            lastDailyBonusTime: null,
            loginStreak: 0,

            lastClaimTime: null,
            totalWldClaimed: 0,

            nullifierHash: null,
            lastSaveTime: Date.now(),

            // Set user's nullifier hash
            setNullifierHash: (hash) => set({ nullifierHash: hash }),

            // Add particles
            addParticles: (amount) => set((state) => ({
                particles: state.particles + amount,
                totalParticlesCollected: state.totalParticlesCollected + amount,
                dailyParticlesCollected: state.dailyParticlesCollected + amount
            })),

            // Add passive particles (from auto-collector)
            addPassiveParticles: (amount) => set((state) => ({
                particles: state.particles + amount,
                totalParticlesCollected: state.totalParticlesCollected + amount,
                totalPassiveParticles: state.totalPassiveParticles + amount,
                dailyPassiveParticles: state.dailyPassiveParticles + amount,
                dailyParticlesCollected: state.dailyParticlesCollected + amount
            })),

            // Handle click
            handleClick: () => {
                const state = get()
                const earned = state.particlesPerClick

                set({
                    particles: state.particles + earned,
                    totalClicks: state.totalClicks + 1,
                    totalParticlesCollected: state.totalParticlesCollected + earned,
                    dailyClicks: state.dailyClicks + 1,
                    dailyParticlesCollected: state.dailyParticlesCollected + earned
                })

                // Auto-save every 10 clicks
                if (state.totalClicks % 10 === 0) {
                    get().saveGameState()
                }
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
                            unlockedThemes: Array.from(new Set([...state.unlockedThemes, ...allThemes]))
                        })
                        break
                    default:
                        return false
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
                const bonusAmount = 500

                set({
                    particles: state.particles + bonusAmount,
                    totalParticlesCollected: state.totalParticlesCollected + bonusAmount,
                    lastDailyBonusTime: now,
                    loginStreak: newStreak
                })

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
                            particles: data.particles || 0,
                            particlesPerClick: data.particles_per_click || 1,
                            particlesPerSecond: data.particles_per_second || 0,
                            totalClicks: data.total_clicks || 0,
                            totalParticlesCollected: data.total_particles_collected || 0,
                            totalPassiveParticles: data.total_passive_particles || 0, // NEW
                            upgradeClickPower: data.upgrade_click_power || 1,
                            upgradeAutoCollector: data.upgrade_auto_collector || 0,
                            upgradeMultiplier: data.upgrade_multiplier || 0,
                            upgradeOffline: data.upgrade_offline || 0,

                            // Premium
                            premiumParticleSkin: data.premium_particle_skin || 'default',
                            premiumBackgroundTheme: data.premium_background_theme || 'default',
                            // Fallback for unlocked arrays if not present in DB yet
                            unlockedSkins: data.unlocked_skins || ['default'],
                            unlockedThemes: data.unlocked_themes || ['default'],

                            premiumAutoSave: data.premium_auto_save || false,
                            premiumStatistics: data.premium_statistics || false,
                            premiumNotifications: data.premium_notifications || false,
                            premiumLuckyParticle: data.premium_lucky_particle || false,
                            premiumOfflineEarnings: data.premium_offline_earnings || false,
                            premiumDailyBonus: data.premium_daily_bonus || false,
                            premiumVIP: data.premium_vip || false,

                            lastDailyBonusTime: data.last_daily_bonus_time ? new Date(data.last_daily_bonus_time).getTime() : null,
                            loginStreak: data.login_streak || 0,

                            lastClaimTime: data.last_claim_time ? new Date(data.last_claim_time).getTime() : null,
                            totalWldClaimed: data.total_wld_claimed || 0,

                            // Daily mission counters
                            dailyClicks: data.daily_clicks || 0,
                            dailyPassiveParticles: data.daily_passive_particles || 0,
                            dailyParticlesCollected: data.daily_particles_collected || 0,
                            lastDailyReset: data.last_daily_reset ? new Date(data.last_daily_reset).getTime() : null,
                            claimedMissions: data.claimed_missions || [],

                            nullifierHash: userHash
                        })

                        // Check and reset daily stats if needed
                        get().checkAndResetDailyStats()
                    }
                } catch (error) {
                    console.error('Failed to load game state:', error)
                }
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
                            claimed_missions: state.claimedMissions
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
                claimedMissions: state.claimedMissions
            })
        }
    )
)
