'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import toast from 'react-hot-toast'

const COOLDOWN_MS = 4 * 60 * 60 * 1000 // 4 hours
const STORAGE_KEY = 'void_anomaly_last_claim'

interface AnomalyReward {
    name: string
    emoji: string
    weight: number
    apply: (store: any) => string // returns description
}

const REWARDS: AnomalyReward[] = [
    {
        name: 'Void Particles',
        emoji: '💎',
        weight: 35,
        apply: (store) => {
            store.addParticles(5000)
            return '+5,000 Particles'
        }
    },
    {
        name: 'Mega Particles',
        emoji: '🌟',
        weight: 15,
        apply: (store) => {
            store.addParticles(15000)
            return '+15,000 Particles'
        }
    },
    {
        name: 'Void Surge',
        emoji: '⚡',
        weight: 20,
        apply: (store) => {
            // 3-minute click booster via achievements store hack
            const until = Date.now() + 3 * 60 * 1000
            const current = store.achievements || {}
            store.checkAchievements('clicks', 0) // no-op but ensures key exists
            // Direct set booster expiry
            const state = useGameStore.getState()
            useGameStore.setState({
                achievements: { ...state.achievements, booster_click_multiplier_until: until }
            })
            return 'x6 Click Power for 3 min!'
        }
    },
    {
        name: 'Lucky Spin',
        emoji: '🎰',
        weight: 15,
        apply: (store) => {
            store.addParticles(3000)
            return '+3,000 Particles + Lucky feeling!'
        }
    },
    {
        name: 'Energy Burst',
        emoji: '🔋',
        weight: 10,
        apply: (store) => {
            store.addParticles(8000)
            return '+8,000 Particles (Energy Burst)'
        }
    },
    {
        name: 'Cosmic Fragment',
        emoji: '🧩',
        weight: 5,
        apply: (store) => {
            store.addParticles(25000)
            store.addBpXp(200)
            return '+25,000 Particles + 200 XP (RARE!)'
        }
    },
]

function pickReward(): AnomalyReward {
    const totalWeight = REWARDS.reduce((sum, r) => sum + r.weight, 0)
    let roll = Math.random() * totalWeight
    for (const reward of REWARDS) {
        roll -= reward.weight
        if (roll <= 0) return reward
    }
    return REWARDS[0]
}

export default function VoidAnomalyDrop() {
    const [isAvailable, setIsAvailable] = useState(false)
    const [isOpening, setIsOpening] = useState(false)
    const [rewardResult, setRewardResult] = useState<{ emoji: string; text: string } | null>(null)

    const addParticles = useGameStore((s) => s.addParticles)
    const addBpXp = useGameStore((s) => s.addBpXp)
    const checkAchievements = useGameStore((s) => s.checkAchievements)
    const debouncedSave = useGameStore((s) => s.debouncedSave)
    const achievements = useGameStore((s) => s.achievements)

    const checkAvailability = useCallback(() => {
        try {
            const last = localStorage.getItem(STORAGE_KEY)
            if (!last) { setIsAvailable(true); return }
            const elapsed = Date.now() - Number(last)
            setIsAvailable(elapsed >= COOLDOWN_MS)
        } catch {
            setIsAvailable(true)
        }
    }, [])

    useEffect(() => {
        checkAvailability()
        const interval = setInterval(checkAvailability, 60000) // re-check every minute
        return () => clearInterval(interval)
    }, [checkAvailability])

    const handleClaim = () => {
        if (!isAvailable || isOpening) return
        setIsOpening(true)

        // Delay reward reveal for animation
        setTimeout(() => {
            const reward = pickReward()
            const store = { addParticles, addBpXp, checkAchievements, achievements }
            const description = reward.apply(store)

            localStorage.setItem(STORAGE_KEY, String(Date.now()))
            setRewardResult({ emoji: reward.emoji, text: description })
            debouncedSave()

            toast.success(`${reward.emoji} ${reward.name}: ${description}`, {
                duration: 4000,
                style: { background: '#1a0a2e', color: '#fff', border: '1px solid rgba(139,92,246,0.4)' }
            })

            // Hide after 3s
            setTimeout(() => {
                setIsOpening(false)
                setRewardResult(null)
                setIsAvailable(false)
            }, 3000)
        }, 800)
    }

    if (!isAvailable && !isOpening) return null

    return (
        <AnimatePresence>
            {(isAvailable || isOpening) && (
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                    style={{
                        position: 'relative',
                        margin: '24px auto',
                        width: '100%',
                        maxWidth: '280px',
                    }}
                >
                    {!rewardResult ? (
                        <motion.button
                            onClick={handleClaim}
                            disabled={isOpening}
                            animate={{
                                boxShadow: [
                                    '0 0 20px rgba(139,92,246,0.3)',
                                    '0 0 40px rgba(139,92,246,0.6)',
                                    '0 0 20px rgba(139,92,246,0.3)',
                                ],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '16px',
                                border: '2px solid rgba(139,92,246,0.5)',
                                background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(168,85,247,0.1) 50%, rgba(139,92,246,0.15) 100%)',
                                cursor: isOpening ? 'default' : 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                        >
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                style={{ fontSize: '32px' }}
                            >
                                {isOpening ? '✨' : '🌀'}
                            </motion.div>
                            <div style={{
                                fontSize: '13px',
                                fontWeight: 800,
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                                background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 50%, #7c3aed 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                {isOpening ? 'Opening...' : '⚡ Void Anomaly Detected ⚡'}
                            </div>
                            <div style={{
                                fontSize: '10px',
                                color: 'rgba(255,255,255,0.4)',
                                fontWeight: 600,
                            }}>
                                Tap to claim your reward
                            </div>
                        </motion.button>
                    ) : (
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{
                                width: '100%',
                                padding: '20px',
                                borderRadius: '16px',
                                border: '2px solid rgba(250,204,21,0.4)',
                                background: 'linear-gradient(135deg, rgba(250,204,21,0.08) 0%, rgba(139,92,246,0.08) 100%)',
                                textAlign: 'center',
                            }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ duration: 0.6, repeat: 2 }}
                                style={{ fontSize: '40px', marginBottom: '8px' }}
                            >
                                {rewardResult.emoji}
                            </motion.div>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: 700,
                                color: '#fbbf24',
                            }}>
                                {rewardResult.text}
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
