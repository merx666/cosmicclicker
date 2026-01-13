'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'

export default function MissionsTab() {
    // Daily counters (reset at 00:00 UTC)
    const dailyParticlesCollected = useGameStore((state) => state.dailyParticlesCollected)
    const dailyClicks = useGameStore((state) => state.dailyClicks)
    const dailyPassiveParticles = useGameStore((state) => state.dailyPassiveParticles)
    const claimedMissions = useGameStore((state) => state.claimedMissions)
    const checkAndResetDailyStats = useGameStore((state) => state.checkAndResetDailyStats)
    const claimMissionReward = useGameStore((state) => state.claimMissionReward)

    // Check for daily reset on mount
    useEffect(() => {
        checkAndResetDailyStats()
    }, [checkAndResetDailyStats])

    const dailyMissions = [
        {
            id: 'daily_collect_10k',
            name: 'Collect 10,000 particles',
            progress: dailyParticlesCollected,
            target: 10000,
            reward: 2500,
            completed: dailyParticlesCollected >= 10000,
            claimed: claimedMissions.includes('daily_collect_10k')
        },
        {
            id: 'daily_click_500',
            name: 'Click 500 times',
            progress: dailyClicks,
            target: 500,
            reward: 1000,
            completed: dailyClicks >= 500,
            claimed: claimedMissions.includes('daily_click_500')
        },
        {
            id: 'daily_passive_5k',
            name: 'Earn 5,000 passive particles',
            progress: dailyPassiveParticles,
            target: 5000,
            reward: 1500,
            completed: dailyPassiveParticles >= 5000,
            claimed: claimedMissions.includes('daily_passive_5k')
        },
    ]

    const handleClaim = (missionId: string, reward: number) => {
        claimMissionReward(missionId, reward)
    }

    return (
        <div className="py-8 space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">🎯 Missions</h2>
                <p className="text-text-secondary">Complete daily tasks and earn bonus particles!</p>
            </div>

            <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Image src="/assets/ui/clock.png" alt="Daily" width={24} height={24} />
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
                                        <Image
                                            src={mission.completed ? '/assets/ui/checkbox_checked.png' : '/assets/ui/checkbox_empty.png'}
                                            alt={mission.completed ? 'Completed' : 'Pending'}
                                            fill
                                            className="object-contain"
                                        />
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
            </div>

            <div className="text-center text-text-secondary text-sm mt-12 p-6 bg-void-blue/10 border border-void-blue/30 rounded-xl flex flex-col items-center gap-2">
                <Image src="/assets/ui/info.png" alt="Info" width={24} height={24} className="opacity-70" />
                <p>Complete missions before reset to earn rewards!</p>
                <p className="mt-2">Come back daily for new tasks.</p>
            </div>
        </div>
    )
}
