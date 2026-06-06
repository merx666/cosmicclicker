'use client'

import React, { useEffect, useState } from 'react'
import { Trophy, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

interface Achievement {
    id: string
    title: string
    description: string
    icon: string
}

const ACHIEVEMENT_DATA: Record<string, Omit<Achievement, 'id'>> = {
    'wave_10': {
        title: 'Survivor',
        description: 'Reached Wave 10',
        icon: '🛡️'
    },
    'wave_50': {
        title: 'Veteran',
        description: 'Reached Wave 50',
        icon: '🎖️'
    },
    'wave_100': {
        title: 'Legend',
        description: 'Reached Wave 100',
        icon: '👑'
    },
    'kills_1000': {
        title: 'Slayer',
        description: 'Defeated 1,000 Enemies',
        icon: '⚔️'
    },
    'kills_10000': {
        title: 'Exterminator',
        description: 'Defeated 10,000 Enemies',
        icon: '☠️'
    }
}

export default function AchievementNotification() {
    const [queue, setQueue] = useState<string[]>([])
    const [current, setCurrent] = useState<string | null>(null)

    useEffect(() => {
        const handleAchievement = (e: any) => {
            const newAchievements = e.detail.achievements || []
            setQueue(prev => [...prev, ...newAchievements])
        }

        window.addEventListener('achievement-unlocked', handleAchievement)
        return () => window.removeEventListener('achievement-unlocked', handleAchievement)
    }, [])

    useEffect(() => {
        if (!current && queue.length > 0) {
            const next = queue[0]
            setCurrent(next)
            setQueue(prev => prev.slice(1))

            // Auto dismiss after 4 seconds
            const timer = setTimeout(() => {
                setCurrent(null)
            }, 4000)

            return () => clearTimeout(timer)
        }
    }, [queue, current])

    const getAchievementData = (id: string) => {
        return ACHIEVEMENT_DATA[id] || {
            title: 'Achievement Unlocked',
            description: 'Unknown Achievement',
            icon: '🏆'
        }
    }

    return (
        <div className="fixed top-24 right-4 z-[9999] pointer-events-none flex flex-col items-end gap-2">
            <AnimatePresence mode="wait">
                {current && (
                    <motion.div
                        key={current}
                        initial={{ opacity: 0, x: 100, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="pointer-events-auto bg-black/80 border border-neon-yellow/50 backdrop-blur-md p-4 rounded-lg shadow-[0_0_20px_rgba(255,255,0,0.3)] w-72 relative overflow-hidden group"
                    >
                        {/* Progress/Timer Bar */}
                        <motion.div
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: 4, ease: "linear" }}
                            className="absolute bottom-0 left-0 h-1 bg-neon-yellow"
                        />

                        <div className="flex items-start gap-3 relative z-10">
                            <div className="w-12 h-12 rounded-full bg-neon-yellow/20 flex items-center justify-center border border-neon-yellow text-2xl animate-pulse">
                                {getAchievementData(current).icon}
                            </div>

                            <div className="flex-1">
                                <div className="text-neon-yellow text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Trophy size={12} /> Achievement Unlocked
                                </div>
                                <h3 className="text-white font-cyber text-lg leading-tight">
                                    {getAchievementData(current).title}
                                </h3>
                                <p className="text-gray-400 text-xs mt-1">
                                    {getAchievementData(current).description}
                                </p>
                            </div>

                            <button
                                onClick={() => setCurrent(null)}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-neon-yellow/10 rounded-full blur-2xl" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
