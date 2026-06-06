'use client'

import { motion } from 'framer-motion'
import { Orbitron } from 'next/font/google'
import { useEffect, useState } from 'react'

const orbitron = Orbitron({ subsets: ['latin'], weight: ['700', '900'] })

interface LoadingScreenProps {
    onComplete?: () => void
    minimumDuration?: number
}

export default function LoadingScreen({ onComplete, minimumDuration = 2000 }: LoadingScreenProps) {
    const [progress, setProgress] = useState(0)
    const [tipIndex, setTipIndex] = useState(0)

    const loadingTips = [
        "Tip: Merge units of the same type to upgrade them!",
        "Tip: Strategically place your units before battle",
        "Tip: Each unit has unique abilities",
        "Tip: Boss appears every 5 waves - be prepared!",
        "Tip: Use Power-Ups to increase your chances",
        "Tip: Tank units absorb damage - place them in front",
        "Tip: Rangers deal damage from afar - keep them safe",
        "Tip: Assassins have high damage but low HP",
        "Tip: Collect synergy bonuses for powerful combos",
        "Tip: Save credits for stronger units in later waves"
    ]

    useEffect(() => {
        // Rotate tips
        const tipInterval = setInterval(() => {
            setTipIndex((prev) => (prev + 1) % loadingTips.length)
        }, 3000)

        // Simulate progress
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(progressInterval)
                    return 100
                }
                return prev + Math.random() * 15
            })
        }, 150)

        // Complete after minimum duration
        const timeout = setTimeout(() => {
            setProgress(100)
            setTimeout(() => {
                onComplete?.()
            }, 500)
        }, minimumDuration)

        return () => {
            clearInterval(tipInterval)
            clearInterval(progressInterval)
            clearTimeout(timeout)
        }
    }, [onComplete, minimumDuration])

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050510] overflow-hidden"
        >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black" />

            {/* Floating Stars */}
            {[...Array(30)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute bg-white rounded-full"
                    initial={{
                        x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : 500,
                        y: typeof window !== 'undefined' ? Math.random() * window.innerHeight : 500,
                        scale: Math.random() * 0.5 + 0.5,
                        opacity: 0.7
                    }}
                    animate={{
                        y: [null, typeof window !== 'undefined' ? Math.random() * window.innerHeight : 500],
                        opacity: [0.7, 0.2, 0.7]
                    }}
                    transition={{
                        duration: Math.random() * 10 + 15,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    style={{
                        width: Math.random() * 3 + 1 + 'px',
                        height: Math.random() * 3 + 1 + 'px',
                        boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)'
                    }}
                />
            ))}

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center gap-8 px-6">
                {/* Logo/Title Animation */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    <motion.h1
                        className={`${orbitron.className} text-6xl md:text-7xl font-black text-white drop-shadow-[0_4px_24px_rgba(99,102,241,0.9)] tracking-tight mb-3`}
                        animate={{
                            textShadow: [
                                '0 4px 24px rgba(99,102,241,0.9)',
                                '0 4px 32px rgba(139,92,246,0.9)',
                                '0 4px 24px rgba(99,102,241,0.9)',
                            ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        VOID BASTION
                    </motion.h1>
                    <p className="text-indigo-300 text-sm tracking-[0.3em] uppercase font-bold">
                        Auto-Battler Strategy
                    </p>
                </motion.div>

                {/* Spinning Hexagon */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20"
                >
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                        <defs>
                            <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                        </defs>
                        <polygon
                            points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
                            fill="none"
                            stroke="url(#hexGradient)"
                            strokeWidth="4"
                            opacity="0.8"
                        />
                        <polygon
                            points="50,15 85,32.5 85,67.5 50,85 15,67.5 15,32.5"
                            fill="url(#hexGradient)"
                            opacity="0.2"
                        />
                    </svg>
                </motion.div>

                {/* Progress Bar */}
                <div className="w-80 max-w-[90vw]">
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-indigo-500/30">
                        <motion.div
                            className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%]"
                            initial={{ width: 0 }}
                            animate={{
                                width: `${Math.min(progress, 100)}%`,
                                backgroundPosition: ['0% 0%', '200% 0%']
                            }}
                            transition={{
                                width: { duration: 0.3 },
                                backgroundPosition: { duration: 2, repeat: Infinity, ease: "linear" }
                            }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-indigo-400 font-mono">
                        <span>Loading...</span>
                        <span>{Math.floor(Math.min(progress, 100))}%</span>
                    </div>
                </div>

                {/* Loading Tips */}
                <motion.div
                    key={tipIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center px-6 max-w-md"
                >
                    <p className="text-sm text-indigo-300/80 font-medium">
                        {loadingTips[tipIndex]}
                    </p>
                </motion.div>

                {/* Pulsing Dots */}
                <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 bg-indigo-500 rounded-full"
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2
                            }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    )
}
