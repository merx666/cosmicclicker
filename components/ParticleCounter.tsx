'use client'

import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Zap, Infinity as InfinityIcon } from 'lucide-react'

export default function ParticleCounter() {
    const particles = useGameStore((state) => state.particles)
    const particlesPerClick = useGameStore((state) => state.particlesPerClick)
    const particlesPerSecond = useGameStore((state) => state.particlesPerSecond)
    const achievements = useGameStore((state) => state.achievements)
    const hourlyClicks = useGameStore((state) => state.hourlyClicks || 0)
    const bypassUntil = useGameStore((state) => state.bypassUntil)
    const unlockedPremiumUpgrades = useGameStore((state) => state.unlockedPremiumUpgrades)
    const t = useTranslations('Game')
    
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

    const energyLimit = 1000 * particlesPerClick
    const currentEnergy = Math.max(0, energyLimit - hourlyClicks)
    const energyPercentage = Math.min(100, Math.max(0, (currentEnergy / energyLimit) * 100))

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
        return Math.floor(num).toLocaleString()
    }

    return (
        <div className="text-center space-y-3 tap-target relative z-10 pt-2">
            {/* Main particle count */}
            <motion.div
                className="text-[5rem] leading-none font-black tracking-tight text-white"
                key={Math.floor(particles / 10)} // Re-animate every 10 particles
                initial={{ scale: 1.05, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
                {formatNumber(particles)}
            </motion.div>

            {/* Label */}
            <div className="text-sm tracking-[0.2em] uppercase text-text-secondary font-bold">
                {t('voidParticles')}
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-4 text-xs mt-6 mb-8">
                <div className="flex flex-col items-center bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                    <span className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-1">{t('perClick')}</span>
                    <span className="text-white font-black text-sm">
                        +{activeClickValue} {boosterActive && <span className="text-[9px] text-pink-400 font-extrabold ml-1">(6X)</span>}
                    </span>
                </div>
                {particlesPerSecond > 0 && (
                    <div className="flex flex-col items-center bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                        <span className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-1">{t('perSecond')}</span>
                        <span className="text-white font-black text-sm">+{particlesPerSecond}</span>
                    </div>
                )}
            </div>

            {/* Premium Energy Bar */}
            <div className="max-w-[320px] mx-auto mt-8 relative group cursor-default">
                {/* Glow effect */}
                <div className={`absolute -inset-0.5 rounded-[1.125rem] blur-md opacity-30 transition-all duration-700 ${hasBypass ? 'bg-purple-500' : (energyPercentage > 50 ? 'bg-cyan-500' : energyPercentage > 20 ? 'bg-amber-500' : 'bg-red-500 animate-pulse')}`} />
                <div className="relative h-12 bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden flex items-center justify-between p-1.5 transition-colors group-hover:border-white/25 group-hover:bg-black/40">
                    
                    {hasBypass ? (
                        <div className="absolute inset-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 opacity-90 overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                            <motion.div 
                                animate={{ x: ['-50%', '0%'] }} 
                                transition={{ repeat: Infinity, ease: 'linear', duration: 1.5 }}
                                className="absolute inset-0 w-[200%] opacity-20 mix-blend-overlay" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.7) 10px, rgba(255,255,255,0.7) 20px)' }}
                            />
                        </div>
                    ) : (
                        <motion.div
                            className={`absolute inset-y-1.5 left-1.5 rounded-xl transition-colors duration-1000 shadow-inner ${energyPercentage > 50 ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : energyPercentage > 20 ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_20px_rgba(239,68,68,0.8)]'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `calc(${energyPercentage}% - 12px)` }}
                            transition={{ type: 'spring', bounce: 0, duration: 1 }}
                        />
                    )}
                    
                    {/* Text Overlay */}
                    <div className="absolute inset-0 flex justify-between items-center px-6 pointer-events-none">
                        <span className="text-[11px] font-black tracking-[0.2em] text-white uppercase">
                            {t('energy')}
                        </span>
                        <span className="text-[13px] font-bold tracking-wider text-white">
                            {hasBypass ? (
                                <span className="flex items-center gap-1.5 text-yellow-300">
                                    <InfinityIcon className="w-4 h-4" /> {t('infinite')}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 font-mono">
                                    {currentEnergy} <span className="text-white/30 font-light mx-0.5">|</span> {energyLimit}
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {boosterActive && (
                <div className="inline-flex items-center gap-1 mt-4 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-[10px] font-bold text-pink-400 uppercase tracking-[0.1em]">
                    <Zap className="w-3 h-3" /> {t('voidSurge')} ({timeLeft}s)
                </div>
            )}
        </div>
    )
}
