'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import toast from 'react-hot-toast'

export default function MissionsTab() {
    // Daily counters (reset at 00:00 UTC)
    const dailyParticlesCollected = useGameStore((state) => state.dailyParticlesCollected)
    const dailyClicks = useGameStore((state) => state.dailyClicks)
    const dailyPassiveParticles = useGameStore((state) => state.dailyPassiveParticles)
    const claimedMissions = useGameStore((state) => state.claimedMissions)
    const achievements = useGameStore((state) => state.achievements)

    // Weekly counters
    const weeklyParticlesCollected = useGameStore((state) => state.weeklyParticlesCollected)
    const weeklyClicks = useGameStore((state) => state.weeklyClicks)
    const weeklyRouletteWins = useGameStore((state) => state.weeklyRouletteWins)
    const weeklyLoginDays = useGameStore((state) => state.weeklyLoginDays)
    const weeklyPassiveParticles = useGameStore((state) => state.weeklyPassiveParticles)
    const claimedWeeklyChallenges = useGameStore((state) => state.claimedWeeklyChallenges)
    const loginStreak = useGameStore((state) => state.loginStreak)

    const checkAndResetDailyStats = useGameStore((state) => state.checkAndResetDailyStats)
    const claimMissionReward = useGameStore((state) => state.claimMissionReward)
    const claimWeeklyReward = useGameStore((state) => state.claimWeeklyReward)

    const [activeView, setActiveView] = useState<'missions' | 'achievements' | 'weekly'>('missions')
    const [weeklyTimeLeft, setWeeklyTimeLeft] = useState('')
    const [nextWalletVisited, setNextWalletVisited] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const visited = localStorage.getItem('partner_next_wallet_visited') === 'true'
            setNextWalletVisited(visited)
        }
    }, [])

    // Check for daily reset on mount
    useEffect(() => {
        checkAndResetDailyStats()
    }, [checkAndResetDailyStats])

    // Weekly countdown timer
    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date()
            const dayOfWeek = now.getUTCDay()
            const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek)
            const nextMonday = new Date(now)
            nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday)
            nextMonday.setUTCHours(0, 0, 0, 0)
            const diff = nextMonday.getTime() - now.getTime()
            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            setWeeklyTimeLeft(`${days}d ${hours}h ${mins}m`)
        }
        updateCountdown()
        const interval = setInterval(updateCountdown, 60000)
        return () => clearInterval(interval)
    }, [])

    const dailyMissions = [
        {
            id: 'daily_collect_50k',
            name: 'Collect 50,000 particles',
            progress: dailyParticlesCollected,
            target: 50000,
            reward: 8000,
            completed: dailyParticlesCollected >= 50000,
            claimed: claimedMissions.includes('daily_collect_50k')
        },
        {
            id: 'daily_click_2000',
            name: 'Click 2,000 times',
            progress: dailyClicks,
            target: 2000,
            reward: 3000,
            completed: dailyClicks >= 2000,
            claimed: claimedMissions.includes('daily_click_2000')
        },
        {
            id: 'daily_passive_20k',
            name: 'Earn 20,000 passive particles',
            progress: dailyPassiveParticles,
            target: 20000,
            reward: 4000,
            completed: dailyPassiveParticles >= 20000,
            claimed: claimedMissions.includes('daily_passive_20k')
        },
    ]

    const weeklyChallenges = [
        {
            id: 'weekly_collect_500k',
            name: 'Collect 500,000 particles',
            icon: '💎',
            progress: weeklyParticlesCollected,
            target: 500000,
            reward: 50000,
            completed: weeklyParticlesCollected >= 500000,
            claimed: claimedWeeklyChallenges.includes('weekly_collect_500k')
        },
        {
            id: 'weekly_click_10k',
            name: 'Click 10,000 times',
            icon: '🖱️',
            progress: weeklyClicks,
            target: 10000,
            reward: 25000,
            completed: weeklyClicks >= 10000,
            claimed: claimedWeeklyChallenges.includes('weekly_click_10k')
        },
        {
            id: 'weekly_roulette_3',
            name: 'Win roulette 3 times',
            icon: '🎰',
            progress: weeklyRouletteWins,
            target: 3,
            reward: 20000,
            completed: weeklyRouletteWins >= 3,
            claimed: claimedWeeklyChallenges.includes('weekly_roulette_3')
        },
        {
            id: 'weekly_passive_100k',
            name: 'Earn 100,000 passive particles',
            icon: '⚡',
            progress: weeklyPassiveParticles,
            target: 100000,
            reward: 30000,
            completed: weeklyPassiveParticles >= 100000,
            claimed: claimedWeeklyChallenges.includes('weekly_passive_100k')
        },
    ]

    const weeklyCompleted = weeklyChallenges.filter(c => c.completed).length
    const weeklyBonusAvailable = weeklyCompleted >= 3 && !claimedWeeklyChallenges.includes('weekly_bonus_chest')

    const handleClaim = (missionId: string, reward: number) => {
        claimMissionReward(missionId, reward)
    }

    const handleWeeklyClaim = (challengeId: string, reward: number) => {
        claimWeeklyReward(challengeId, reward)
    }

    return (
        <div className="py-8 space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold mb-2">🎯 Tasks & Goals</h2>
                <p className="text-text-secondary">Complete daily tasks, weekly challenges, or long-term achievements!</p>
            </div>

            {/* Toggle view */}
            <div className="flex bg-void-dark/80 rounded-xl p-1 w-max mx-auto border border-void-purple/20">
                <button
                    onClick={() => setActiveView('missions')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeView === 'missions' ? 'bg-void-purple text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    Daily
                </button>
                <button
                    onClick={() => setActiveView('weekly')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeView === 'weekly' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-lg shadow-orange-500/30' : 'text-gray-400 hover:text-white'}`}
                >
                    Weekly {weeklyBonusAvailable && '🎁'}
                </button>
                <button
                    onClick={() => setActiveView('achievements')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeView === 'achievements' ? 'bg-particle-glow text-black shadow-lg shadow-particle-glow/30' : 'text-gray-400 hover:text-white'}`}
                >
                    Achievements
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeView === 'missions' && (
                    <motion.div
                        key="missions_view"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="text-2xl">⏳</span>
                            Daily Missions
                            <span className="text-sm text-text-secondary font-normal">(Reset: 00:00 UTC)</span>
                        </h3>

                        <div className="space-y-3">
                            {dailyMissions.map((mission, idx) => (
                                <motion.div
                                    key={mission.id}
                                    className={`border rounded-xl p-4 ${mission.claimed
                                        ? 'bg-success/10 border-success/30'
                                        : mission.completed
                                            ? 'bg-particle-glow/10 border-particle-glow/50'
                                            : 'bg-void-purple/10 border-void-purple/30'
                                        }`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`relative w-6 h-6 ${mission.completed ? '' : 'opacity-30'}`}>
                                                <span className="text-xl">{mission.completed ? '✅' : '🔜'}</span>
                                            </div>
                                            <span className={`font-bold ${mission.claimed ? 'line-through opacity-60' : ''}`}>
                                                {mission.name}
                                            </span>
                                        </div>

                                        {mission.claimed ? (
                                            <span className="text-success font-bold text-sm">✓ Claimed</span>
                                        ) : mission.completed ? (
                                            <motion.button
                                                onClick={() => handleClaim(mission.id, mission.reward)}
                                                className="px-4 py-1 rounded-lg bg-gradient-to-r from-particle-glow to-void-purple text-white font-bold text-sm"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                Claim +{mission.reward}
                                            </motion.button>
                                        ) : (
                                            <span className="text-particle-glow font-bold">+{mission.reward}</span>
                                        )}
                                    </div>

                                    {!mission.claimed && (
                                        <div className="ml-8">
                                            <div className="flex justify-between text-sm text-text-secondary mb-1">
                                                <span>Progress</span>
                                                <span>{Math.min(mission.progress, mission.target).toLocaleString()}/{mission.target.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-void-dark rounded-full h-2">
                                                <motion.div
                                                    className={`h-2 rounded-full transition-all ${mission.completed
                                                        ? 'bg-gradient-to-r from-particle-glow to-success'
                                                        : 'bg-gradient-to-r from-void-purple to-particle-glow'
                                                        }`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min((mission.progress / mission.target) * 100, 100)}%` }}
                                                    transition={{ duration: 0.5 }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Partner & Special Missions */}
                        <div className="mt-10 pt-8 border-t border-void-purple/20 space-y-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <span className="text-2xl">✨</span>
                                Special Partner Missions
                            </h3>

                            <motion.div
                                className={`p-1 bg-white/5 border rounded-2xl transition-all duration-300 relative overflow-hidden group
                                    ${claimedMissions.includes('partner_next_wallet_visit')
                                        ? 'border-success/30 bg-success/5'
                                        : nextWalletVisited
                                            ? 'border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.15)] animate-pulse'
                                            : 'border-void-purple/30 bg-void-purple/5 hover:border-cyan-500/30'
                                    }`}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="bg-void-dark/80 backdrop-blur-md rounded-[calc(1rem-0.25rem)] p-4 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                                            <img
                                                src="/next-wallet-icon.jpg"
                                                alt="Next Wallet"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white text-sm">Odwiedź Next Wallet</span>
                                                <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                                    PARTNER
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-sm">
                                                Zajrzyj do nowej oficjalnej aplikacji Next Wallet w ekosystemie World App i odbierz cząsteczki!
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-white/5 pt-3 md:pt-0 relative z-10">
                                        {/* Progress indicator */}
                                        <div className="text-right">
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Progress</div>
                                            <div className="text-xs font-bold font-mono text-white mt-0.5">
                                                {nextWalletVisited ? '1 / 1' : '0 / 1'}
                                            </div>
                                        </div>

                                        {claimedMissions.includes('partner_next_wallet_visit') ? (
                                            <span className="px-4 py-2 rounded-xl bg-success/20 text-success border border-success/30 font-black text-xs uppercase tracking-wider">
                                                ✓ Claimed
                                            </span>
                                        ) : nextWalletVisited ? (
                                            <motion.button
                                                onClick={() => {
                                                    claimMissionReward('partner_next_wallet_visit', 25000)
                                                    toast.success('Odebrano 25,000 cząsteczek!')
                                                }}
                                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-purple-500 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-white/10 active:scale-[0.98] transition-all"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                Claim +25k
                                            </motion.button>
                                        ) : (
                                            <motion.button
                                                onClick={() => {
                                                    window.open('https://world.org/mini-app?app_id=app_fc0b450998cdd2fbf6efb90d491f7cce&path=&draft_id=meta_16d33ebc3b71dc5cf29380f6e6306f68', '_blank')
                                                    localStorage.setItem('partner_next_wallet_visited', 'true')
                                                    setNextWalletVisited(true)
                                                }}
                                                className="px-5 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 font-black text-xs uppercase tracking-wider flex items-center gap-1 active:scale-[0.98] transition-all"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <span>Go</span>
                                                <span>↗</span>
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        <div className="text-center text-text-secondary text-sm mt-12 p-6 bg-void-blue/10 border border-void-blue/30 rounded-xl flex flex-col items-center gap-2">
                            <span className="text-xl">ℹ️</span>
                            <p>Complete missions before reset to earn rewards!</p>
                            <p className="mt-2">Come back daily for new tasks.</p>
                        </div>
                    </motion.div>
                )}

                {activeView === 'weekly' && (
                    <motion.div
                        key="weekly_view"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <span className="text-2xl">🏆</span>
                                Weekly Challenges
                            </h3>
                            <span className="text-xs text-orange-400 font-mono bg-orange-500/10 px-3 py-1 rounded-lg border border-orange-500/20">
                                ⏰ {weeklyTimeLeft}
                            </span>
                        </div>

                        {/* Progress overview */}
                        <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
                            <div className="text-sm text-gray-400 mb-1">Weekly Progress</div>
                            <div className="text-2xl font-black text-orange-400">
                                {weeklyCompleted} / {weeklyChallenges.length}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Complete 3+ for Weekly Chest bonus!
                            </div>
                        </div>

                        <div className="space-y-3">
                            {weeklyChallenges.map((challenge, idx) => (
                                <motion.div
                                    key={challenge.id}
                                    className={`border rounded-xl p-4 ${challenge.claimed
                                        ? 'bg-success/10 border-success/30'
                                        : challenge.completed
                                            ? 'bg-orange-500/10 border-orange-500/40'
                                            : 'bg-white/[0.02] border-white/10'
                                        }`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{challenge.icon}</span>
                                            <span className={`font-bold ${challenge.claimed ? 'line-through opacity-60' : ''}`}>
                                                {challenge.name}
                                            </span>
                                        </div>

                                        {challenge.claimed ? (
                                            <span className="text-success font-bold text-sm">✓ Claimed</span>
                                        ) : challenge.completed ? (
                                            <motion.button
                                                onClick={() => handleWeeklyClaim(challenge.id, challenge.reward)}
                                                className="px-4 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold text-sm"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                Claim +{challenge.reward.toLocaleString()}
                                            </motion.button>
                                        ) : (
                                            <span className="text-orange-400 font-bold">+{challenge.reward.toLocaleString()}</span>
                                        )}
                                    </div>

                                    {!challenge.claimed && (
                                        <div className="ml-11">
                                            <div className="flex justify-between text-sm text-text-secondary mb-1">
                                                <span>Progress</span>
                                                <span>{Math.min(challenge.progress, challenge.target).toLocaleString()}/{challenge.target.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-void-dark rounded-full h-2">
                                                <motion.div
                                                    className={`h-2 rounded-full ${challenge.completed
                                                        ? 'bg-gradient-to-r from-orange-500 to-amber-400'
                                                        : 'bg-gradient-to-r from-orange-600/60 to-amber-500/60'
                                                        }`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min((challenge.progress / challenge.target) * 100, 100)}%` }}
                                                    transition={{ duration: 0.5 }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Weekly Bonus Chest */}
                        <motion.div
                            className={`border rounded-xl p-5 text-center ${
                                weeklyBonusAvailable
                                    ? 'bg-gradient-to-b from-amber-500/15 to-orange-500/10 border-amber-500/40'
                                    : claimedWeeklyChallenges.includes('weekly_bonus_chest')
                                        ? 'bg-success/10 border-success/30'
                                        : 'bg-white/[0.02] border-white/10 opacity-50'
                            }`}
                            animate={weeklyBonusAvailable ? {
                                boxShadow: ['0 0 10px rgba(245,158,11,0.1)', '0 0 25px rgba(245,158,11,0.3)', '0 0 10px rgba(245,158,11,0.1)']
                            } : {}}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <div className="text-3xl mb-2">
                                {claimedWeeklyChallenges.includes('weekly_bonus_chest') ? '✅' : '🎁'}
                            </div>
                            <div className="text-lg font-bold text-amber-400 mb-1">
                                Weekly Chest
                            </div>
                            <div className="text-xs text-gray-400 mb-3">
                                Complete 3 or more challenges to unlock
                            </div>
                            {weeklyBonusAvailable ? (
                                <motion.button
                                    onClick={() => handleWeeklyClaim('weekly_bonus_chest', 75000)}
                                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Open Chest — +75,000 Particles
                                </motion.button>
                            ) : claimedWeeklyChallenges.includes('weekly_bonus_chest') ? (
                                <span className="text-success font-bold text-sm">✓ Opened!</span>
                            ) : (
                                <span className="text-gray-500 text-sm">{weeklyCompleted}/3 challenges needed</span>
                            )}
                        </motion.div>
                    </motion.div>
                )}

                {activeView === 'achievements' && (
                    <motion.div
                        key="achievements_view"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { id: 'clicks', name: 'Clicker Maniac', desc: 'Total clicks on particle', thresholds: [1000, 10000, 50000, 100000, 500000], icon: '🖱️' },
                                { id: 'logins', name: 'Loyal Collector', desc: 'Login streak ranking', thresholds: [3, 7, 14, 30, 100], icon: '📅' },
                                { id: 'spins', name: 'Cosmic Gambler', desc: 'Times you spun the Roulete', thresholds: [5, 20, 50, 100, 500], icon: '🎰' },
                                { id: 'bp_levels', name: 'Season Regular', desc: 'Levels claimed in Void Pass', thresholds: [5, 10, 15, 20], icon: '🎟️' }
                            ].map((achDef, idx) => {
                                const achData = achievements[achDef.id] || { level: 0, progress: 0 }
                                const currentLevel = achData.level
                                const nextThreshold = currentLevel < achDef.thresholds.length ? achDef.thresholds[currentLevel] : achDef.thresholds[achDef.thresholds.length - 1]
                                const isMaxed = currentLevel >= achDef.thresholds.length
                                const progressPercent = isMaxed ? 100 : Math.min((achData.progress / nextThreshold) * 100, 100)

                                // Stars render
                                const stars = []
                                for (let i = 0; i < achDef.thresholds.length; i++) {
                                    stars.push(
                                        <span key={i} className={`text-sm ${i < currentLevel ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]' : 'text-gray-600'}`}>⭐</span>
                                    )
                                }

                                return (
                                    <motion.div
                                        key={achDef.id}
                                        className={`bg-black/40 border p-4 rounded-xl ${isMaxed ? 'border-yellow-500/50 bg-yellow-900/10' : 'border-white/10'}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <div className="flex gap-4 items-center mb-3">
                                            <div className="text-4xl bg-white/5 p-3 rounded-xl border border-white/10">
                                                {achDef.icon}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-lg text-white">{achDef.name}</h4>
                                                        <p className="text-xs text-gray-400 mb-1">{achDef.desc}</p>
                                                    </div>
                                                    <div className="flex gap-0.5">
                                                        {stars}
                                                    </div>
                                                </div>

                                                {/* Progress */}
                                                <div className="mt-2">
                                                    <div className="flex justify-between text-xs mb-1 font-mono">
                                                        <span className="text-gray-400">LVL {currentLevel}</span>
                                                        <span className={isMaxed ? 'text-yellow-400' : 'text-particle-glow'}>
                                                            {isMaxed ? 'MAXED OUT' : `${achData.progress.toLocaleString()} / ${nextThreshold.toLocaleString()}`}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden border border-white/5">
                                                        <motion.div
                                                            className={`h-full ${isMaxed ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'bg-particle-glow'}`}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${progressPercent}%` }}
                                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {!isMaxed && (
                                            <div className="text-[10px] text-right text-gray-500 uppercase font-bold tracking-wider">
                                                Next reward: <span className="text-particle-glow">+2000 Particles</span> & <span className="text-void-blue">+500 XP</span>
                                            </div>
                                        )}
                                    </motion.div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
