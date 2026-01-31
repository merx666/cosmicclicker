'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import VoidParticle from './VoidParticle'
import ParticleCounter from './ParticleCounter'
import Navigation from './Navigation'
import UpgradesTab from './tabs/UpgradesTab'
import MissionsTab from './tabs/MissionsTab'
import PremiumTab from './tabs/PremiumTab'
import ConvertTab from './tabs/ConvertTab'
import RouletteTab from './tabs/RouletteTab'
import { motion, AnimatePresence } from 'framer-motion'
import BackgroundEffects from './effects/BackgroundEffects'


interface GameScreenProps {
    userHash: string
}

export default function GameScreen({ userHash }: GameScreenProps) {
    const [activeTab, setActiveTab] = useState('collect')
    const loadGameState = useGameStore((state) => state.loadGameState)
    const setNullifierHash = useGameStore((state) => state.setNullifierHash)
    const saveGameState = useGameStore((state) => state.saveGameState)
    const addPassiveParticles = useGameStore((state) => state.addPassiveParticles) // Changed from addParticles
    const particlesPerSecond = useGameStore((state) => state.particlesPerSecond)
    const premiumBackgroundTheme = useGameStore((state) => state.premiumBackgroundTheme)
    const particles = useGameStore((state) => state.particles)

    // Load game state on mount
    useEffect(() => {
        setNullifierHash(userHash)
        loadGameState(userHash)
    }, [userHash])

    // Auto-collection interval
    useEffect(() => {
        if (particlesPerSecond <= 0) return

        const interval = setInterval(() => {
            addPassiveParticles(particlesPerSecond) // Changed from addParticles
        }, 1000)

        return () => clearInterval(interval)
    }, [particlesPerSecond, addPassiveParticles])

    // Auto-save every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            saveGameState()
        }, 30000)

        return () => clearInterval(interval)
    }, [saveGameState])

    return (
        <div className="min-h-screen bg-void-dark text-white pb-24">
            {/* Premium background effects */}
            <BackgroundEffects theme={premiumBackgroundTheme as 'default' | 'nebula' | 'galaxy'} />
            {/* Header */}
            <header className="sticky top-0 z-40 bg-void-dark/80 backdrop-blur-lg border-b border-void-purple/20">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-void-purple to-particle-glow bg-clip-text text-transparent">
                            VOID COLLECTOR
                        </h1>
                        <div className="flex items-center gap-2">
                            <div className="px-3 py-1 rounded-full bg-void-purple/20 border border-void-purple/30 text-sm">
                                💎 {particles >= 10000 ? `${Math.floor(particles / 10000) * 0.01} WLD` : '0 WLD'}
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
                                <p>Click the particle to collect Void Particles! ✨</p>
                            </div>
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
                </AnimatePresence>
            </main>

            {/* Navigation */}
            <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    )
}
