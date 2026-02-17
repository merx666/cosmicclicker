'use client'

import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'

export default function ParticleCounter() {
    const particles = useGameStore((state) => state.particles)
    const particlesPerClick = useGameStore((state) => state.particlesPerClick)
    const particlesPerSecond = useGameStore((state) => state.particlesPerSecond)

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
        return Math.floor(num).toLocaleString()
    }

    return (
        <div className="text-center space-y-2 tap-target">
            {/* Main particle count */}
            <motion.div
                className="text-7xl font-bold bg-gradient-to-r from-void-purple via-particle-glow to-void-blue bg-clip-text text-transparent"
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
            <div className="flex justify-center gap-6 text-sm text-text-secondary mt-4">
                <div className="flex flex-col items-center">
                    <span className="text-xs opacity-70">per click</span>
                    <span className="text-particle-glow font-bold">+{particlesPerClick}</span>
                </div>
                {particlesPerSecond > 0 && (
                    <div className="flex flex-col items-center">
                        <span className="text-xs opacity-70">per second</span>
                        <span className="text-void-blue font-bold">+{particlesPerSecond}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
