'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import toast from 'react-hot-toast'
import { Target, Calendar, Sparkles, Star, CheckCircle, Clock, Gift, MousePointer2, Gem, Coins, Zap, Shield, Trophy } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function MissionsTab() {
    const t = useTranslations('Missions')
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
            name: t('daily_collect_50k'),
            progress: dailyParticlesCollected,
            target: 50000,
            reward: 8000,
            completed: dailyParticlesCollected >= 50000,
            claimed: claimedMissions.includes('daily_collect_50k')
        },
        {
            id: 'daily_click_2000',
            name: t('daily_click_2000'),
            progress: dailyClicks,
            target: 2000,
            reward: 3000,
            completed: dailyClicks >= 2000,
            claimed: claimedMissions.includes('daily_click_2000')
        },
        {
            id: 'daily_passive_20k',
            name: t('daily_passive_20k'),
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
            name: t('weekly_collect_500k'),
            icon: <Gem className="w-6 h-6 text-white" />,
            progress: weeklyParticlesCollected,
            target: 500000,
            reward: 50000,
            completed: weeklyParticlesCollected >= 500000,
            claimed: claimedWeeklyChallenges.includes('weekly_collect_500k')
        },
        {
            id: 'weekly_click_10k',
            name: t('weekly_click_10k'),
            icon: <MousePointer2 className="w-6 h-6 text-white/80" />,
            progress: weeklyClicks,
            target: 10000,
            reward: 25000,
            completed: weeklyClicks >= 10000,
            claimed: claimedWeeklyChallenges.includes('weekly_click_10k')
        },
        {
            id: 'weekly_roulette_3',
            name: t('weekly_roulette_3'),
            icon: <Coins className="w-6 h-6 text-yellow-400" />,
            progress: weeklyRouletteWins,
            target: 3,
            reward: 20000,
            completed: weeklyRouletteWins >= 3,
            claimed: claimedWeeklyChallenges.includes('weekly_roulette_3')
        },
        {
            id: 'weekly_passive_100k',
            name: t('weekly_passive_100k'),
            icon: <Zap className="w-6 h-6 text-fuchsia-400" />,
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
        <div className="py-8 space-y-6 px-4 pb-24">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black mb-2 flex justify-center items-center gap-3 text-white">
                    <Target className="w-8 h-8 text-white/80" />
                    {t('title')}
                </h2>
                <p className="text-white/60 tracking-wide">{t('description')}</p>
            </div>

            {/* Toggle view */}
            <div className="flex bg-white/5 backdrop-blur-xl rounded-2xl p-1.5 w-max mx-auto border border-white/10">
                <button
                    onClick={() => setActiveView('missions')}
                    className={`px-5 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${activeView === 'missions' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}
                >
                    {t('daily')}
                </button>
                <button
                    onClick={() => setActiveView('weekly')}
                    className={`px-5 py-2 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 ${activeView === 'weekly' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}
                >
                    {t('weekly')} {weeklyBonusAvailable && <Gift className="w-4 h-4 text-yellow-400" />}
                </button>
                <button
                    onClick={() => setActiveView('achievements')}
                    className={`px-5 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${activeView === 'achievements' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}
                >
                    {t('achievements')}
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
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                            <Clock className="w-6 h-6 text-white/80" />
                            {t('dailyMissions')}
                            <span className="text-sm text-white/50 font-normal">({t('reset')}: 00:00 UTC)</span>
                        </h3>

                        <div className="space-y-3">
                            {dailyMissions.map((mission, idx) => (
                                <motion.div
                                    key={mission.id}
                                    className={`relative overflow-hidden rounded-[20px] p-5 border transition-all duration-300 ${mission.claimed
                                        ? 'bg-white/5 border-white/10 opacity-70'
                                        : mission.completed
                                            ? 'bg-white/10 border-white/30'
                                            : 'bg-white/5 border-white/5'
                                        }`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            {mission.completed ? <CheckCircle className="w-5 h-5 text-green-400" /> : <div className="w-5 h-5 rounded-full border-2 border-white/20" />}
                                            <span className={`font-bold text-white ${mission.claimed ? 'line-through opacity-60' : ''}`}>
                                                {mission.name}
                                            </span>
                                        </div>

                                        {mission.claimed ? (
                                            <span className="text-white/60 font-bold text-sm">✓ {t('claimed')}</span>
                                        ) : mission.completed ? (
                                            <motion.button
                                                onClick={() => handleClaim(mission.id, mission.reward)}
                                                className="px-4 py-1 rounded-lg bg-white text-black font-bold text-sm"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {t('claim')} +{mission.reward}
                                            </motion.button>
                                        ) : (
                                            <span className="text-white font-bold">+{mission.reward}</span>
                                        )}
                                    </div>

                                    {!mission.claimed && (
                                        <div className="ml-8 mt-4">
                                            <div className="flex justify-between text-xs font-bold tracking-wider text-white/50 mb-2 uppercase">
                                                <span>{t('progress')}</span>
                                                <span className="font-mono text-white/80">{Math.min(mission.progress, mission.target).toLocaleString()} / {mission.target.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                                <motion.div
                                                    className={`h-full rounded-full transition-all ${mission.completed
                                                        ? 'bg-white'
                                                        : 'bg-white/50'
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
                        <div className="mt-10 pt-8 border-t border-white/10 space-y-4">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                <Sparkles className="w-6 h-6 text-white/80" />
                                {t('specialMissions')}
                            </h3>

                            <motion.div
                                className={`p-1 bg-white/5 border rounded-2xl transition-all duration-300 relative overflow-hidden group
                                    ${claimedMissions.includes('partner_next_wallet_visit')
                                        ? 'border-white/20 bg-white/5'
                                        : nextWalletVisited
                                            ? 'border-white/50 bg-white/10 animate-pulse'
                                            : 'border-white/10 hover:border-white/30'
                                    }`}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="bg-black/50 backdrop-blur-md rounded-[calc(1rem-0.25rem)] p-4 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                                                <span className="font-bold text-white text-sm">{t('partnerVisit')}</span>
                                                <span className="px-2 py-0.5 rounded-full text-[8px] font-black bg-white/10 text-white/80 border border-white/20">
                                                    PARTNER
                                                </span>
                                            </div>
                                            <p className="text-xs text-white/50 mt-1 leading-relaxed max-w-sm">
                                                {t('partnerDesc')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-white/5 pt-3 md:pt-0 relative z-10">
                                        {/* Progress indicator */}
                                        <div className="text-right">
                                            <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold">{t('progress')}</div>
                                            <div className="text-xs font-bold font-mono text-white mt-0.5">
                                                {nextWalletVisited ? '1 / 1' : '0 / 1'}
                                            </div>
                                        </div>

                                        {claimedMissions.includes('partner_next_wallet_visit') ? (
                                            <span className="px-4 py-2 rounded-xl bg-white/10 text-white/60 font-bold text-xs uppercase tracking-wider">
                                                ✓ {t('claimed')}
                                            </span>
                                        ) : nextWalletVisited ? (
                                            <motion.button
                                                onClick={() => {
                                                    claimMissionReward('partner_next_wallet_visit', 25000)
                                                    toast.success('Odebrano 25,000 cząsteczek!')
                                                }}
                                                className="px-5 py-2.5 rounded-xl bg-white hover:bg-white/90 text-black font-black text-xs uppercase tracking-wider transition-all"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                {t('claim')} +25k
                                            </motion.button>
                                        ) : (
                                            <motion.button
                                                onClick={() => {
                                                    window.open('https://world.org/mini-app?app_id=app_fc0b450998cdd2fbf6efb90d491f7cce&path=&draft_id=meta_16d33ebc3b71dc5cf29380f6e6306f68', '_blank')
                                                    localStorage.setItem('partner_next_wallet_visited', 'true')
                                                    setNextWalletVisited(true)
                                                }}
                                                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-black text-xs uppercase tracking-wider flex items-center gap-1 transition-all"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <span>{t('go')}</span>
                                                <span>↗</span>
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        <div className="text-center text-white/50 text-sm mt-12 p-6 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center gap-2">
                            <Clock className="w-6 h-6 text-white/40" />
                            <p>{t('infoTitle')}</p>
                            <p className="mt-2">{t('infoDesc')}</p>
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
                        <div className="flex items-center justify-between mb-4 text-white">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Calendar className="w-6 h-6 text-white/80" />
                                {t('weeklyChallenges')}
                            </h3>
                            <span className="text-xs text-white/80 font-mono bg-white/10 px-3 py-1 rounded-lg border border-white/20">
                                ⏰ {weeklyTimeLeft}
                            </span>
                        </div>

                        {/* Progress overview */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                            <div className="text-sm text-white/60 mb-1">{t('weeklyProgress')}</div>
                            <div className="text-2xl font-black text-white">
                                {weeklyCompleted} / {weeklyChallenges.length}
                            </div>
                            <div className="text-xs text-white/50 mt-1">
                                {t('weeklyBonus')}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {weeklyChallenges.map((challenge, idx) => (
                                <motion.div
                                    key={challenge.id}
                                    className={`relative overflow-hidden rounded-[20px] p-5 border transition-all duration-300 ${challenge.claimed
                                        ? 'bg-white/5 border-white/10 opacity-70'
                                        : challenge.completed
                                            ? 'bg-white/10 border-white/30'
                                            : 'bg-white/5 border-white/5'
                                        }`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            {challenge.icon}
                                            <span className={`font-bold text-white ${challenge.claimed ? 'line-through opacity-60' : ''}`}>
                                                {challenge.name}
                                            </span>
                                        </div>

                                        {challenge.claimed ? (
                                            <span className="text-white/60 font-bold text-sm">✓ {t('claimed')}</span>
                                        ) : challenge.completed ? (
                                            <motion.button
                                                onClick={() => handleWeeklyClaim(challenge.id, challenge.reward)}
                                                className="px-4 py-1 rounded-lg bg-white text-black font-bold text-sm"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {t('claim')} +{challenge.reward.toLocaleString()}
                                            </motion.button>
                                        ) : (
                                            <span className="text-white font-bold">+{challenge.reward.toLocaleString()}</span>
                                        )}
                                    </div>

                                    {!challenge.claimed && (
                                        <div className="ml-9 mt-4">
                                            <div className="flex justify-between text-xs font-bold tracking-wider text-white/50 mb-2 uppercase">
                                                <span>{t('progress')}</span>
                                                <span className="font-mono text-white/80">{Math.min(challenge.progress, challenge.target).toLocaleString()} / {challenge.target.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                                <motion.div
                                                    className={`h-full rounded-full transition-all ${challenge.completed
                                                        ? 'bg-white'
                                                        : 'bg-white/50'
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

                        <motion.div
                            className={`relative overflow-hidden rounded-[24px] p-8 text-center border transition-all duration-300 ${
                                weeklyBonusAvailable
                                    ? 'bg-white/10 border-white/30'
                                    : claimedWeeklyChallenges.includes('weekly_bonus_chest')
                                        ? 'bg-white/5 border-white/10'
                                        : 'bg-white/5 border-white/5 opacity-70'
                            }`}
                        >
                            <div className="flex justify-center mb-2 text-white/80">
                                {claimedWeeklyChallenges.includes('weekly_bonus_chest') ? <CheckCircle className="w-8 h-8 text-white/60" /> : <Gift className="w-8 h-8 text-yellow-400" />}
                            </div>
                            <div className="text-lg font-bold text-white mb-1">
                                {t('weeklyChest')}
                            </div>
                            <div className="text-xs text-white/50 mb-3">
                                {t('weeklyChestDesc')}
                            </div>
                            {weeklyBonusAvailable ? (
                                <motion.button
                                    onClick={() => handleWeeklyClaim('weekly_bonus_chest', 75000)}
                                    className="px-6 py-2 rounded-xl bg-white text-black font-bold text-sm"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {t('openChest')}
                                </motion.button>
                            ) : claimedWeeklyChallenges.includes('weekly_bonus_chest') ? (
                                <span className="text-white/60 font-bold text-sm">✓ {t('opened')}</span>
                            ) : (
                                <span className="text-white/40 text-sm">{weeklyCompleted}/3 {t('needed')}</span>
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
                                { id: 'clicks', name: t('ach_clicks'), desc: t('ach_clicks_desc'), thresholds: [1000, 10000, 50000, 100000, 500000], icon: <MousePointer2 className="w-8 h-8 text-white/80" /> },
                                { id: 'logins', name: t('ach_logins'), desc: t('ach_logins_desc'), thresholds: [3, 7, 14, 30, 100], icon: <Calendar className="w-8 h-8 text-white/80" /> },
                                { id: 'spins', name: t('ach_spins'), desc: t('ach_spins_desc'), thresholds: [5, 20, 50, 100, 500], icon: <Shield className="w-8 h-8 text-white/80" /> },
                                { id: 'bp_levels', name: t('ach_bp_levels'), desc: t('ach_bp_levels_desc'), thresholds: [5, 10, 15, 20], icon: <Trophy className="w-8 h-8 text-white/80" /> }
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
                                        <Star key={i} className={`w-4 h-4 ${i < currentLevel ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
                                    )
                                }

                                return (
                                    <motion.div
                                        key={achDef.id}
                                        className={`relative overflow-hidden rounded-[20px] p-5 border transition-all duration-300 ${isMaxed ? 'border-white/20 bg-white/10' : 'bg-white/5 border-white/5'}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        <div className="flex gap-4 items-center mb-3">
                                            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                                                {achDef.icon}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-lg text-white">{achDef.name}</h4>
                                                        <p className="text-xs text-white/50 mb-1">{achDef.desc}</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        {stars}
                                                    </div>
                                                </div>

                                                <div className="mt-4">
                                                    <div className="flex justify-between text-xs mb-2 font-mono tracking-wider uppercase font-bold">
                                                        <span className="text-white/40">{t('lvl')} {currentLevel}</span>
                                                        <span className={isMaxed ? 'text-yellow-400' : 'text-white/80'}>
                                                            {isMaxed ? t('maxed') : `${achData.progress.toLocaleString()} / ${nextThreshold.toLocaleString()}`}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                                                        <motion.div
                                                            className={`h-full rounded-full ${isMaxed ? 'bg-white' : 'bg-white/50'}`}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${progressPercent}%` }}
                                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {!isMaxed && (
                                            <div className="text-[10px] text-right text-white/50 uppercase font-bold tracking-wider">
                                                {t('nextReward')}: <span className="text-white font-black">+2000 Particles</span> & <span className="text-white font-black">+500 XP</span>
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
