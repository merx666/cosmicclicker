'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'

export default function MissionsTab() {
    // Daily counters (reset at 00:00 UTC)
    const dailyParticlesCollected = useGameStore((state) => state.dailyParticlesCollected)
    const dailyClicks = useGameStore((state) => state.dailyClicks)
    const dailyPassiveParticles = useGameStore((state) => state.dailyPassiveParticles)
    const claimedMissions = useGameStore((state) => state.claimedMissions)
    const achievements = useGameStore((state) => state.achievements)

    const checkAndResetDailyStats = useGameStore((state) => state.checkAndResetDailyStats)
    const claimMissionReward = useGameStore((state) => state.claimMissionReward)

    const [activeView, setActiveView] = useState<'missions' | 'achievements'>('missions')

    // Check for daily reset on mount
    useEffect(() => {
        checkAndResetDailyStats()
    }, [checkAndResetDailyStats])

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

    const handleClaim = (missionId: string, reward: number) => {
        claimMissionReward(missionId, reward)
    }

    return (
        <div className="py-8 space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold mb-2">🎯 Tasks & Goals</h2>
                <p className="text-text-secondary">Complete daily tasks or long-term achievements!</p>
            </div>

            {/* Toggle view */}
            <div className="flex bg-void-dark/80 rounded-xl p-1 w-max mx-auto border border-void-purple/20">
                <button
                    onClick={() => setActiveView('missions')}
                    className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${activeView === 'missions' ? 'bg-void-purple text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    Daily Missions
                </button>
                <button
                    onClick={() => setActiveView('achievements')}
                    className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${activeView === 'achievements' ? 'bg-particle-glow text-black shadow-lg shadow-particle-glow/30' : 'text-gray-400 hover:text-white'}`}
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
                                                <span>{Math.min(mission.progress, mission.target)}/{mission.target}</span>
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

                        <div className="text-center text-text-secondary text-sm mt-12 p-6 bg-void-blue/10 border border-void-blue/30 rounded-xl flex flex-col items-center gap-2">
                            <span className="text-xl">ℹ️</span>
                            <p>Complete missions before reset to earn rewards!</p>
                            <p className="mt-2">Come back daily for new tasks.</p>
                        </div>
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
