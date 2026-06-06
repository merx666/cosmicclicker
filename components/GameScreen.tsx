'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import VoidParticle from './VoidParticle'
import ParticleCounter from './ParticleCounter'
import Navigation from './Navigation'
import UpgradesTab from './tabs/UpgradesTab'
import MissionsTab from './tabs/MissionsTab'
import LeaderboardTab from './tabs/LeaderboardTab'
import SeasonPassTab from './tabs/SeasonPassTab'
import PremiumTab from './tabs/PremiumTab'
import VoidClubTab from './tabs/VoidClubTab'
import ConvertTab from './tabs/ConvertTab'
import RouletteTab from './tabs/RouletteTab'
import SurveyTab from './tabs/SurveyTab'
import AdsTab from './tabs/AdsTab'
import MediaTab from './tabs/MediaTab'
import { motion, AnimatePresence } from 'framer-motion'
import BackgroundEffects from './effects/BackgroundEffects'
import { useTranslations } from 'next-intl'
import ApiTinyAd from './ApiTinyAd'
import LanguageSwitcher from './LanguageSwitcher'
import { trackEvent } from '@/lib/analytics'


interface GameScreenProps {
    userHash: string
    onBackToMenu?: () => void
}

export default function GameScreen({ userHash, onBackToMenu }: GameScreenProps) {
    const [activeTab, setActiveTab] = useState('collect')

    // Track tab switches in GA4
    useEffect(() => {
        trackEvent('tab_view', 'navigation', activeTab)
    }, [activeTab])

    const loadGameState = useGameStore((state) => state.loadGameState)
    const setNullifierHash = useGameStore((state) => state.setNullifierHash)
    const saveGameState = useGameStore((state) => state.saveGameState)
    const addPassiveParticles = useGameStore((state) => state.addPassiveParticles) // Changed from addParticles
    const particlesPerSecond = useGameStore((state) => state.particlesPerSecond)
    const unlockedPremiumUpgrades = useGameStore((state) => state.unlockedPremiumUpgrades) || []
    const premiumBackgroundTheme = useGameStore((state) => state.premiumBackgroundTheme)
    const particles = useGameStore((state) => state.particles)
    const t = useTranslations('Game')

    // Offline Earnings States & Selectors
    const [offlineGains, setOfflineGains] = useState<{ earned: number, duration: number } | null>(null)
    const [offlineChecked, setOfflineChecked] = useState(false)
    const lastSaveTime = useGameStore((state) => state.lastSaveTime)
    const upgradeOffline = useGameStore((state) => state.upgradeOffline)
    const premiumOfflineEarnings = useGameStore((state) => state.premiumOfflineEarnings)
    const addParticles = useGameStore((state) => state.addParticles)

    // Load game state on mount
    useEffect(() => {
        setNullifierHash(userHash)
        loadGameState(userHash)
    }, [userHash])

    // Offline earnings check
    useEffect(() => {
        if (!userHash || !lastSaveTime || offlineChecked) return
        
        const checkOffline = () => {
            const now = Date.now()
            const offlineTimeMs = now - lastSaveTime
            
            if (offlineTimeMs > 60000 && particlesPerSecond > 0) {
                const offlineSeconds = Math.min(Math.floor(offlineTimeMs / 1000), 12 * 60 * 60)
                
                let pps = particlesPerSecond
                if (Array.isArray(unlockedPremiumUpgrades) && unlockedPremiumUpgrades.includes('overclocked_drone')) {
                    pps *= 2
                }

                let efficiency = 0.05 * (upgradeOffline || 0)
                if (premiumOfflineEarnings) {
                    efficiency += 0.50
                }

                const earned = Math.floor(offlineSeconds * pps * efficiency)
                if (earned > 0) {
                    setOfflineGains({ earned, duration: offlineSeconds })
                }
            }
            setOfflineChecked(true)
        }

        const timer = setTimeout(checkOffline, 1200)
        return () => clearTimeout(timer)
    }, [lastSaveTime, userHash, offlineChecked, particlesPerSecond, upgradeOffline, premiumOfflineEarnings, unlockedPremiumUpgrades])

    // Auto-collection interval
    useEffect(() => {
        if (particlesPerSecond <= 0) return

        let pps = particlesPerSecond
        if (Array.isArray(unlockedPremiumUpgrades) && unlockedPremiumUpgrades.includes('overclocked_drone')) {
            pps *= 2
        }

        const interval = setInterval(() => {
            addPassiveParticles(pps) // Changed from addParticles
        }, 1000)

        return () => clearInterval(interval)
    }, [particlesPerSecond, addPassiveParticles, unlockedPremiumUpgrades])

    // Auto-save every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            saveGameState()
        }, 30000)

        return () => clearInterval(interval)
    }, [saveGameState])

    // Save on visibility change (tab close/switch)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                saveGameState()
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [saveGameState])

    const isTelegram = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true'

    return (
        <div className="min-h-screen bg-void-dark text-white pl-[72px] pb-8">
            {/* Premium background effects */}
            <BackgroundEffects theme={premiumBackgroundTheme as any} />
            {/* Header */}
            <header className="sticky top-0 z-40 bg-void-dark/80 backdrop-blur-lg border-b border-void-purple/20">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {onBackToMenu && (
                                <button
                                    onClick={onBackToMenu}
                                    className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                                    title="Wróć do menu"
                                >
                                    <span>←</span> Menu
                                </button>
                            )}
                            <h1 className="text-xl font-bold bg-gradient-to-r from-void-purple to-particle-glow bg-clip-text text-transparent">
                                {t('title')}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="px-3 py-1 rounded-full bg-void-purple/20 border border-void-purple/30 text-sm">
                                {isTelegram ? `💎 ${particles.toLocaleString()}` : `💎 ${particles >= 10000 ? `${Math.floor(particles / 10000) * 0.01} WLD` : '0 WLD'}`}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-2xl mx-auto px-4">
                {/* Show ads on all tabs EXCEPT 'collect' */}
                {/* Ads are now handled globally in layout.tsx */}

                <AnimatePresence mode="wait">
                    {activeTab === 'collect' && (
                        <motion.div
                            key="collect"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="py-8"
                        >
                            <ParticleCounter />
                            <VoidParticle />

                            {/* Quick stats */}
                            <div className="mt-8 text-center text-sm text-text-secondary">
                                <p>{t('clickInstruction')}</p>
                            </div>

                            <div className="mt-8 mx-auto max-w-xs opacity-50 hover:opacity-100 transition-opacity">
                                <LanguageSwitcher />
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'season_pass' && (
                        <motion.div
                            key="season_pass"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <SeasonPassTab onUnlockPremium={() => setActiveTab('premium')} />
                        </motion.div>
                    )}

                    {activeTab === 'upgrades' && (
                        <motion.div
                            key="upgrades"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <UpgradesTab />
                        </motion.div>
                    )}

                    {activeTab === 'void_club' && (
                        <motion.div
                            key="void_club"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <VoidClubTab />
                        </motion.div>
                    )}



                    {activeTab === 'missions' && (
                        <motion.div
                            key="missions"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <MissionsTab />
                        </motion.div>
                    )}

                    {activeTab === 'leaderboard' && (
                        <motion.div
                            key="leaderboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <LeaderboardTab />
                        </motion.div>
                    )}

                    {activeTab === 'premium' && (
                        <motion.div
                            key="premium"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <PremiumTab />
                        </motion.div>
                    )}

                    {activeTab === 'convert' && (
                        <motion.div
                            key="convert"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ConvertTab />
                        </motion.div>
                    )}

                    {activeTab === 'roulette' && (
                        <motion.div
                            key="roulette"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <RouletteTab />
                        </motion.div>
                    )}

                    {activeTab === 'survey' && (
                        <motion.div
                            key="survey"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <SurveyTab />
                        </motion.div>
                    )}

                    {activeTab === 'media' && (
                        <motion.div
                            key="media"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <MediaTab />
                        </motion.div>
                    )}

                    {activeTab === 'ads' && (
                        <motion.div
                            key="ads"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <AdsTab />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Ads */}
            <div className="pb-4">
                <ApiTinyAd userWallet={userHash} />
            </div>

            {/* Welcome Back Offline Earnings Modal */}
            <AnimatePresence>
                {offlineGains && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-sm rounded-3xl p-6 text-center border border-void-purple/30 bg-gradient-to-b from-void-dark to-[#120627] shadow-[0_0_50px_rgba(139,92,246,0.3)]"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-void-purple/20 flex items-center justify-center border-2 border-void-purple/40 mx-auto mb-4">
                                <span className="text-3xl">🌌</span>
                            </div>

                            <h3 className="text-xl font-extrabold text-white uppercase tracking-wider mb-2">
                                Witaj z powrotem, Dowódco!
                            </h3>
                            <p className="text-xs text-text-secondary uppercase tracking-widest mb-4">
                                Czas nieobecności: {Math.floor(offlineGains.duration / 3600)} godz. i {Math.floor((offlineGains.duration % 3600) / 60)} min.
                            </p>

                            <div className="py-4 px-3 rounded-2xl bg-white/5 border border-white/10 mb-6">
                                <span className="text-xs text-gray-400 block uppercase font-semibold">Wygenerowane Cząsteczki</span>
                                <span className="text-2xl font-black text-particle-glow mt-1 block">
                                    +{offlineGains.earned.toLocaleString()}
                                </span>
                            </div>

                            <div className="flex flex-col gap-3">
                                {/* Option 2: 2X Payout with Fee */}
                                <button
                                    onClick={() => {
                                        addParticles(Math.floor(offlineGains.earned * 1.75))
                                        saveGameState()
                                        setOfflineGains(null)
                                    }}
                                    className="w-full py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all bg-gradient-to-r from-void-purple to-particle-glow hover:from-void-purple/90 hover:to-particle-glow/90 text-black shadow-lg shadow-particle-glow/20 active:scale-95 cursor-pointer"
                                >
                                    Podwój zysk (Zysk: +{Math.floor(offlineGains.earned * 2).toLocaleString()} | Opłata: {Math.floor(offlineGains.earned * 0.25).toLocaleString()})
                                </button>

                                {/* Option 1: Standard Payout */}
                                <button
                                    onClick={() => {
                                        addParticles(offlineGains.earned)
                                        saveGameState()
                                        setOfflineGains(null)
                                    }}
                                    className="w-full py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all border border-white/15 bg-white/5 hover:bg-white/10 text-white active:scale-95 cursor-pointer"
                                >
                                    Odbierz standardowe zyski (+{offlineGains.earned.toLocaleString()})
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation */}
            <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    )
}
