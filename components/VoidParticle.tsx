'use client'

import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useState } from 'react'
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

    const onClick = () => {
        handleClick()
        setClickEffect(true)

        // Lucky Particle chance (5% for 2x particles)
        if (premiumLuckyParticle && Math.random() < 0.05) {
            // Grant bonus particles
            addParticles(particlesPerClick)
            setLuckyEffect(true)
            toast.success('🍀 Lucky! +2x particles!')

            setTimeout(() => setLuckyEffect(false), 1000)
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
