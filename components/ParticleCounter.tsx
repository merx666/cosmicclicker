'use client'

import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useState, useEffect } from 'react'

export default function ParticleCounter() {
    const particles = useGameStore((state) => state.particles)
    const particlesPerClick = useGameStore((state) => state.particlesPerClick)
    const particlesPerSecond = useGameStore((state) => state.particlesPerSecond)
    const achievements = useGameStore((state) => state.achievements)
    const hourlyClicks = useGameStore((state) => state.hourlyClicks || 0)
    const bypassUntil = useGameStore((state) => state.bypassUntil)
    const unlockedPremiumUpgrades = useGameStore((state) => state.unlockedPremiumUpgrades)
    
    const boosterExpiry = achievements?.booster_click_multiplier_until
    const [timeLeft, setTimeLeft] = useState<number>(0)

    useEffect(() => {
        if (!boosterExpiry) {
            setTimeLeft(0)
            return
        }
        
        const updateTimer = () => {
            const diff = Number(boosterExpiry) - Date.now()
            setTimeLeft(diff > 0 ? Math.ceil(diff / 1000) : 0)
        }

        updateTimer()
        const interval = setInterval(updateTimer, 1000)
        return () => clearInterval(interval)
    }, [boosterExpiry])

    const boosterActive = timeLeft > 0
    const activeClickValue = boosterActive ? particlesPerClick * 6 : particlesPerClick

    const [hasBypass, setHasBypass] = useState(false)
    
    useEffect(() => {
        setHasBypass((unlockedPremiumUpgrades && unlockedPremiumUpgrades.includes('singularity_perm')) || (bypassUntil !== null && bypassUntil > Date.now()))
    }, [unlockedPremiumUpgrades, bypassUntil])

    const energyLimit = 5000
    const currentEnergy = Math.max(0, energyLimit - hourlyClicks)
    const energyPercentage = Math.min(100, Math.max(0, (currentEnergy / energyLimit) * 100))

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
        return Math.floor(num).toLocaleString()
    }

    return (
        <div className="text-center space-y-2 tap-target">
            {/* Main particle count */}
            <motion.div
                className="text-7xl font-bold bg-gradient-to-r from-white via-particle-glow to-void-purple bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(184,101,255,0.4)]"
                key={Math.floor(particles / 10)} // Re-animate every 10 particles
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
            >
                {formatNumber(particles)}
            </motion.div>

            {/* Label */}
            <div className="text-lg text-text-secondary font-medium">
                Void Particles
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-6 text-sm text-text-secondary mt-4 mb-4">
                <div className="flex flex-col items-center">
                    <span className="text-xs opacity-70">per click</span>
                    <span className="text-particle-glow font-bold">
                        +{activeClickValue} {boosterActive && <span className="text-xs text-pink-400 font-extrabold">(6X)</span>}
                    </span>
                </div>
                {particlesPerSecond > 0 && (
                    <div className="flex flex-col items-center">
                        <span className="text-xs opacity-70">per second</span>
                        <span className="text-void-blue font-bold">+{particlesPerSecond}</span>
                    </div>
                )}
            </div>

            {/* Energy Bar */}
            <div className="max-w-xs mx-auto mt-4 bg-void-purple/10 border border-void-purple/20 rounded-full h-4 relative overflow-hidden">
                {hasBypass ? (
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 opacity-80 animate-pulse"></div>
                ) : (
                    <div
                        className={`h-full transition-all duration-300 ${energyPercentage > 50 ? 'bg-green-500/80' : energyPercentage > 20 ? 'bg-yellow-500/80' : 'bg-red-500/80'}`}
                        style={{ width: `${energyPercentage}%` }}
                    />
                )}
                <div className="absolute inset-0 flex justify-center items-center text-[10px] font-bold text-white shadow-black drop-shadow-md z-10">
                    {hasBypass ? 'ENERGIA: NIESKOŃCZONA ⚡' : `ENERGIA: ${currentEnergy} / ${energyLimit}`}
                </div>
            </div>

            {boosterActive && (
                <div className="inline-block mt-3 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-xs font-bold text-pink-400 animate-pulse uppercase tracking-wider">
                    💥 Void Surge ({timeLeft}s)
                </div>
            )}
        </div>
    )
}
