import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DailyRewardModalProps {
    isOpen: boolean
    onClose: () => void
}

const DAILY_CREDITS = [10, 15, 20, 20, 25, 25, 50, 30, 30, 35, 40, 45, 50, 100]
const MILESTONE_DAYS = [7, 14]

export default function DailyRewardModal({ isOpen, onClose }: DailyRewardModalProps) {
    const [streak, setStreak] = useState<any>(null)
    const [claiming, setClaiming] = useState(false)
    const [claimed, setClaimed] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (isOpen) {
            setLoading(true)
            fetchStreak()
        }
    }, [isOpen])

    const fetchStreak = async () => {
        try {
            const res = await fetch('/api/rewards/streak')
            const data = await res.json()
            setStreak(data)
            setClaimed(false)
        } catch (error) {
            console.error('Failed to fetch streak:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleClaim = async () => {
        setClaiming(true)
        try {
            const res = await fetch('/api/rewards/streak', { method: 'POST' })
            const data = await res.json()

            if (data.success) {
                setClaimed(true)
                setStreak({
                    ...streak,
                    currentStreak: data.newStreak,
                    canClaim: false,
                    shieldAvailable: data.shieldAwarded || streak?.shieldAvailable
                })
            }
        } catch (error) {
            console.error('Claim failed:', error)
        } finally {
            setClaiming(false)
        }
    }

    const currentDay = streak?.currentStreak || 0
    const hasShield = streak?.shieldAvailable || false
    const isFireStreak = currentDay >= 7

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-[#05030f]/95 backdrop-blur-lg z-[200] flex items-center justify-center p-3"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 15 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 15 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        className={`w-full max-w-[380px] max-h-[85vh] flex flex-col rounded-3xl overflow-hidden border bg-gradient-to-b from-[#0a0415]/98 to-[#0f081e]/98 shadow-2xl ${
                            isFireStreak ? 'border-orange-500/40 shadow-[0_0_40px_rgba(249,115,22,0.15)]' : 'border-purple-500/20'
                        }`}
                    >
                        {/* Header */}
                        <div className={`px-5 py-4 flex justify-between items-center border-b border-orange-500/15 ${
                            isFireStreak 
                                ? 'bg-gradient-to-r from-orange-500/10 to-amber-500/5' 
                                : 'bg-gradient-to-r from-amber-500/5 to-orange-500/3'
                        }`}>
                            <div className="flex items-center gap-2">
                                <h2 className={`text-base font-black tracking-widest bg-clip-text text-transparent uppercase bg-gradient-to-r ${
                                    isFireStreak ? 'from-orange-500 to-amber-400' : 'from-amber-400 to-orange-500'
                                }`}>
                                    {isFireStreak ? '🔥' : '🎁'} Daily Credits
                                </h2>
                                {hasShield && (
                                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold uppercase tracking-wide">
                                        🛡️ Shield
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 text-white/60 text-lg flex items-center justify-center cursor-pointer hover:bg-white/10 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-5 no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                            {loading ? (
                                <div className="text-center py-10 text-gray-500 text-sm font-bold animate-pulse">
                                    Loading...
                                </div>
                            ) : (
                                <>
                                    {/* Streak counter */}
                                    <div className="text-center mb-5">
                                        <motion.div
                                            animate={isFireStreak ? { scale: [1, 1.05, 1] } : {}}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className={`text-4xl font-black ${isFireStreak ? 'text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]' : 'text-amber-500'}`}
                                        >
                                            {isFireStreak && '🔥 '}{currentDay}{isFireStreak && ' 🔥'}
                                        </motion.div>
                                        <div className="text-[10px] text-gray-400 font-black tracking-widest uppercase mt-1">
                                            Day Streak
                                        </div>
                                    </div>

                                    {/* 14-day grid */}
                                    <div className="grid grid-cols-7 gap-1.5 mb-5">
                                        {DAILY_CREDITS.map((credits, i) => {
                                            const day = i + 1
                                            const isCollected = day <= currentDay
                                            const isToday = day === currentDay + 1
                                            const isMilestone = MILESTONE_DAYS.includes(day)

                                            return (
                                                <motion.div
                                                    key={day}
                                                    animate={isMilestone && isToday ? {
                                                        borderColor: ['rgba(249,115,22,0.8)', 'rgba(250,204,21,0.8)', 'rgba(249,115,22,0.8)']
                                                    } : {}}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className={`relative rounded-xl py-2.5 px-0.5 text-center border transition-all ${
                                                        isCollected
                                                            ? 'bg-emerald-500/15 border-emerald-500/30'
                                                            : isToday
                                                                ? isMilestone
                                                                    ? 'bg-orange-500/15 border-2 border-orange-500'
                                                                    : 'bg-amber-500/12 border-2 border-amber-500'
                                                                : isMilestone
                                                                    ? 'bg-orange-500/5 border border-orange-500/25'
                                                                    : 'bg-purple-500/5 border border-purple-500/10'
                                                    }`}
                                                >
                                                    {isMilestone && !isCollected && (
                                                        <div className="absolute -top-1.5 -right-1 text-[10px]">
                                                            {day === 7 ? '🛡️' : '👑'}
                                                        </div>
                                                    )}
                                                    <div className={`text-[9px] font-black mb-0.5 uppercase ${
                                                        isCollected ? 'text-emerald-400' : isMilestone ? 'text-orange-400' : 'text-gray-500'
                                                    }`}>
                                                        D{day}
                                                    </div>
                                                    <div className={`text-[10px] font-bold ${
                                                        isCollected
                                                            ? 'text-emerald-400'
                                                            : isToday
                                                                ? 'text-amber-400'
                                                                : isMilestone
                                                                    ? 'text-orange-400'
                                                                    : 'text-gray-400'
                                                    }`}>
                                                        {isCollected ? '✓' : `+${credits}`}
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </div>

                                    {/* Shield info */}
                                    {hasShield && (
                                        <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-gray-400 text-center">
                                            🛡️ <span className="text-emerald-400 font-extrabold">Streak Shield active</span> — miss 1 day without losing your streak
                                        </div>
                                    )}

                                    {/* Claim button or status */}
                                    {streak?.canClaim && !claimed ? (
                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleClaim}
                                            disabled={claiming}
                                            className="w-full py-3.5 rounded-xl border-none bg-gradient-to-r from-amber-400 to-orange-500 text-void-dark text-xs font-black tracking-wider uppercase cursor-pointer shadow-[0_4px_15px_rgba(245,158,11,0.25)] disabled:opacity-60"
                                        >
                                            {claiming ? 'CLAIMING...' : `CLAIM +${DAILY_CREDITS[Math.min(currentDay, 13)]} CREDITS`}
                                        </motion.button>
                                    ) : claimed ? (
                                        <div className="text-center py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col items-center justify-center gap-1.5">
                                            <div className="text-xl">✅</div>
                                            <div className="text-xs font-bold text-emerald-400">
                                                Claimed! Come back tomorrow.
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-3.5 rounded-xl bg-purple-500/5 border border-purple-500/15">
                                            <div className="text-xs font-bold text-gray-500">
                                                Already claimed today
                                            </div>
                                        </div>
                                    )}

                                    {/* Info */}
                                    <p className="text-[9px] text-gray-600 text-center mt-4 leading-normal max-w-[280px] mx-auto">
                                        {hasShield
                                            ? '🛡️ Shield protects 1 missed day. Resets after use. Earned at Day 7.'
                                            : 'Miss a day and your streak resets. Cycle resets after 14 days.'
                                        }
                                    </p>
                                </>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
