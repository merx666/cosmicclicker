'use client'

import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useState, useRef, useEffect } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'
import toast from 'react-hot-toast'
import ParticleEffects from './effects/ParticleEffects'

export default function VoidParticle() {
    const handleClick = useGameStore((state) => state.handleClick)
    const premiumLuckyParticle = useGameStore((state) => state.premiumLuckyParticle)
    const premiumParticleSkin = useGameStore((state) => state.premiumParticleSkin)
    const addParticles = useGameStore((state) => state.addParticles)
    const particlesPerClick = useGameStore((state) => state.particlesPerClick)
    const [clickEffect, setClickEffect] = useState(false)
    const [luckyEffect, setLuckyEffect] = useState(false)

    // Moving target anti-bot system
    const [targetPosition, setTargetPosition] = useState({ x: 50, y: 50 })

    // Anti-bot protection state
    const clickHistoryRef = useRef<number[]>([])
    const cooldownUntilRef = useRef<number>(0)
    const penaltyLevelRef = useRef<number>(0)
    const lastPenaltyTimeRef = useRef<number>(0)

    // Move target position randomly every 5-15 seconds
    useEffect(() => {
        const moveTarget = () => {
            setTargetPosition({
                x: 20 + Math.random() * 60, // 20-80%
                y: 20 + Math.random() * 60
            })
        }

        const interval = setInterval(() => {
            moveTarget()
        }, 5000 + Math.random() * 10000) // 5-15 seconds

        return () => clearInterval(interval)
    }, [])

    const calculateVariance = (numbers: number[]): number => {
        if (numbers.length < 2) return 1000 // High variance for insufficient data
        const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
        const squareDiffs = numbers.map(value => Math.pow(value - mean, 2))
        return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / numbers.length)
    }

    const applyPenalty = () => {
        const now = Date.now()
        penaltyLevelRef.current += 1
        const penaltyDuration = Math.pow(2, penaltyLevelRef.current) * 1000 // 2s, 4s, 8s, 16s...
        cooldownUntilRef.current = now + penaltyDuration
        lastPenaltyTimeRef.current = now

        toast.error(`🤖 Bot detected! Cooldown: ${penaltyDuration / 1000}s`, {
            duration: penaltyDuration
        })
    }

    const isValidClick = (now: number): boolean => {
        // Reset penalty level after 30s of no penalties
        if (now - lastPenaltyTimeRef.current > 30000) {
            penaltyLevelRef.current = 0
        }

        // Check cooldown
        if (now < cooldownUntilRef.current) {
            return false
        }

        // Check rate limit (10 clicks per second max)
        const recentClicks = clickHistoryRef.current.filter(t => now - t < 1000)
        if (recentClicks.length >= 10) {
            applyPenalty()
            return false
        }

        // Pattern detection - need at least 20 clicks for better accuracy
        if (clickHistoryRef.current.length >= 20) {
            const last20 = clickHistoryRef.current.slice(-20)
            const intervals = last20.map((t, i, arr) =>
                i > 0 ? t - arr[i - 1] : 0
            ).filter(i => i > 0)

            const variance = calculateVariance(intervals)

            // If variance is too low (< 10ms), likely a bot
            if (variance < 10) {
                applyPenalty()
                return false
            }
        }

        return true
    }

    const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const now = Date.now()

        // Get click position relative to container
        const rect = event.currentTarget.getBoundingClientRect()
        const clickX = ((event.clientX - rect.left) / rect.width) * 100
        const clickY = ((event.clientY - rect.top) / rect.height) * 100

        // Validate click is near target (±15% tolerance)
        const dx = Math.abs(clickX - targetPosition.x)
        const dy = Math.abs(clickY - targetPosition.y)
        const isNearTarget = dx < 15 && dy < 15

        if (!isNearTarget) {
            toast.error('🎯 Click the glowing target!', { duration: 1000 })
            return
        }

        // Anti-bot validation
        if (!isValidClick(now)) {
            return
        }

        // Add to click history (keep last 20)
        clickHistoryRef.current.push(now)
        if (clickHistoryRef.current.length > 20) {
            clickHistoryRef.current.shift()
        }

        // Variable cooldown (50-200ms) to prevent constant-rate clicking
        const randomCooldown = 50 + Math.random() * 150
        cooldownUntilRef.current = now + randomCooldown

        handleClick()
        setClickEffect(true)

        // Lucky Particle chance - tiered system
        // Bronze: 5% chance 2x, Silver: 8% chance 2x, Gold: 12% chance 3x, Platinum: 15% chance 5x
        if (premiumLuckyParticle) {
            const state = useGameStore.getState()
            const vipTier = state.vipTier || 1 // Default to Bronze if premium

            const tierStats = [
                { chance: 0, multiplier: 1 },     // No tier
                { chance: 0.05, multiplier: 2 },  // Bronze
                { chance: 0.08, multiplier: 2 },  // Silver
                { chance: 0.12, multiplier: 3 },  // Gold
                { chance: 0.15, multiplier: 5 }   // Platinum
            ]

            const { chance, multiplier } = tierStats[vipTier] || tierStats[1]

            if (Math.random() < chance) {
                // Grant bonus particles (multiplier - 1 because handleClick already added 1x)
                addParticles(particlesPerClick * (multiplier - 1))
                setLuckyEffect(true)
                toast.success(`🍀 Lucky! +${multiplier}x particles!`)

                setTimeout(() => setLuckyEffect(false), 1000)
            }

            // Mega Lucky for Gold/Platinum tiers
            if (vipTier >= 3) {
                const megaChance = vipTier === 3 ? 0.01 : 0.03 // Gold: 1%, Platinum: 3%
                const megaMulti = vipTier === 3 ? 10 : 15

                if (Math.random() < megaChance) {
                    addParticles(particlesPerClick * (megaMulti - 1))
                    setLuckyEffect(true)
                    toast.success(`💎 MEGA LUCKY! +${megaMulti}x particles!`, { duration: 2000 })
                }
            }
        }

        // Haptic feedback
        if (typeof window !== 'undefined' && MiniKit.isInstalled()) {
            MiniKit.commands.sendHapticFeedback({
                hapticsType: 'impact',
                style: 'light'
            })
        }

        // Reset click effect
        setTimeout(() => setClickEffect(false), 300)
    }

    return (
        <div className="relative flex items-center justify-center h-[400px] tap-target">
            {/* Premium particle effects */}
            <ParticleEffects
                skinType={premiumParticleSkin as 'default' | 'rainbow' | 'gold'}
                isClicking={clickEffect}
                isLucky={luckyEffect}
            />
            {/* Main clickable particle */}
            <motion.div
                className="relative w-64 h-64 cursor-pointer select-none tap-target"
                whileTap={{ scale: 0.9 }}
                onClick={onClick}
                animate={{
                    scale: clickEffect ? [1, 1.05, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
            >
                {/* Outer glow */}
                <div className="absolute inset-0 bg-gradient-radial from-particle-glow/40 to-transparent rounded-full blur-3xl" />

                {/* Moving Target Indicator */}
                <motion.div
                    className="absolute w-8 h-8 -ml-4 -mt-4 pointer-events-none z-50"
                    style={{
                        left: `${targetPosition.x}%`,
                        top: `${targetPosition.y}%`,
                    }}
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    {/* Target glow */}
                    <div className="absolute inset-0 bg-yellow-400/60 rounded-full blur-md" />
                    {/* Target core */}
                    <div className="absolute inset-2 bg-yellow-300 rounded-full" />
                    {/* Crosshair */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1 h-full bg-yellow-500/50" />
                        <div className="absolute w-full h-1 bg-yellow-500/50" />
                    </div>
                </motion.div>

                {/* Main particle body */}
                <div className="absolute inset-0 bg-gradient-radial from-void-purple via-void-blue to-transparent rounded-full shadow-2xl" />

                {/* Pulsing ring */}
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-particle-glow"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 0, 0.7],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* Second pulsing ring (offset) */}
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-void-blue"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                    }}
                />

                {/* Inner sparkle */}
                <motion.div
                    className="absolute inset-10 bg-gradient-radial from-white/30 to-transparent rounded-full"
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                    }}
                />

                {/* Click indicator */}
                {clickEffect && (
                    <>
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 bg-particle-glow rounded-full"
                                style={{
                                    left: '50%',
                                    top: '50%',
                                }}
                                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                                animate={{
                                    x: Math.cos((i * Math.PI * 2) / 8) * 100,
                                    y: Math.sin((i * Math.PI * 2) / 8) * 100,
                                    scale: 0,
                                    opacity: 0,
                                }}
                                transition={{ duration: 0.5 }}
                            />
                        ))}
                    </>
                )}
            </motion.div>

            {/* Floating particles in background */}
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-particle-glow/30 rounded-full"
                    style={{
                        left: `${20 + (i * 60) % 80}%`,
                        top: `${10 + (i * 40) % 80}%`,
                    }}
                    animate={{
                        y: [0, -20, 0],
                        opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                    }}
                />
            ))}
        </div>
    )
}
