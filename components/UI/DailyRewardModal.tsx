'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DailyRewardModalProps {
    isOpen: boolean
    onClose: () => void
}

const DAILY_CREDITS = [10, 15, 20, 20, 25, 25, 35, 30, 30, 35, 40, 45, 50, 75]

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
                    canClaim: false
                })
            }
        } catch (error) {
            console.error('Claim failed:', error)
        } finally {
            setClaiming(false)
        }
    }

    const currentDay = streak?.currentStreak || 0

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(5,5,16,0.95)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        zIndex: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 15 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 15 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        style={{
                            width: '100%',
                            maxWidth: '380px',
                            maxHeight: '85vh',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            border: '1px solid rgba(234,179,8,0.2)',
                            background: 'linear-gradient(180deg, rgba(10,4,21,0.98) 0%, rgba(15,8,30,0.98) 100%)',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '20px 20px 16px',
                            background: 'linear-gradient(135deg, rgba(234,179,8,0.06) 0%, rgba(249,115,22,0.04) 100%)',
                            borderBottom: '1px solid rgba(234,179,8,0.15)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <h2 style={{
                                fontSize: '18px',
                                fontWeight: 800,
                                letterSpacing: '2px',
                                background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                🎁 DAILY CREDITS
                            </h2>
                            <button
                                onClick={onClose}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'rgba(255,255,255,0.6)',
                                    fontSize: '18px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '16px',
                            WebkitOverflowScrolling: 'touch',
                        }}>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                    Loading...
                                </div>
                            ) : (
                                <>
                                    {/* Streak counter */}
                                    <div style={{
                                        textAlign: 'center',
                                        marginBottom: '20px',
                                    }}>
                                        <div style={{
                                            fontSize: '40px',
                                            fontWeight: 800,
                                            color: '#fbbf24',
                                        }}>
                                            {currentDay}
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#9ca3af',
                                            fontWeight: 600,
                                            letterSpacing: '1px',
                                        }}>
                                            DAY STREAK
                                        </div>
                                    </div>

                                    {/* 14-day grid */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(7, 1fr)',
                                        gap: '6px',
                                        marginBottom: '20px',
                                    }}>
                                        {DAILY_CREDITS.map((credits, i) => {
                                            const day = i + 1
                                            const isCollected = day <= currentDay
                                            const isToday = day === currentDay + 1
                                            const isSpecial = day === 14

                                            return (
                                                <div
                                                    key={day}
                                                    style={{
                                                        background: isCollected
                                                            ? 'rgba(34,197,94,0.15)'
                                                            : isToday
                                                                ? 'rgba(234,179,8,0.12)'
                                                                : 'rgba(139,92,246,0.04)',
                                                        border: isToday
                                                            ? '2px solid #fbbf24'
                                                            : isCollected
                                                                ? '1px solid rgba(34,197,94,0.3)'
                                                                : '1px solid rgba(139,92,246,0.1)',
                                                        borderRadius: '10px',
                                                        padding: '8px 4px',
                                                        textAlign: 'center',
                                                        position: 'relative',
                                                    }}
                                                >
                                                    <div style={{
                                                        fontSize: '9px',
                                                        color: isCollected ? '#22c55e' : '#6b7280',
                                                        fontWeight: 600,
                                                        marginBottom: '2px',
                                                    }}>
                                                        D{day}
                                                    </div>
                                                    <div style={{
                                                        fontSize: isSpecial ? '11px' : '10px',
                                                        fontWeight: 700,
                                                        color: isCollected
                                                            ? '#22c55e'
                                                            : isToday
                                                                ? '#fbbf24'
                                                                : isSpecial
                                                                    ? '#f97316'
                                                                    : '#9ca3af',
                                                    }}>
                                                        {isCollected ? '✓' : `+${credits}`}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Claim button or status */}
                                    {streak?.canClaim && !claimed ? (
                                        <button
                                            onClick={handleClaim}
                                            disabled={claiming}
                                            style={{
                                                width: '100%',
                                                padding: '14px',
                                                borderRadius: '12px',
                                                border: 'none',
                                                background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
                                                color: '#0a0415',
                                                fontSize: '14px',
                                                fontWeight: 800,
                                                letterSpacing: '1px',
                                                cursor: claiming ? 'default' : 'pointer',
                                                opacity: claiming ? 0.6 : 1,
                                            }}
                                        >
                                            {claiming ? 'CLAIMING...' : `CLAIM +${DAILY_CREDITS[Math.min(currentDay, 13)]} CREDITS`}
                                        </button>
                                    ) : claimed ? (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '14px',
                                            borderRadius: '12px',
                                            background: 'rgba(34,197,94,0.1)',
                                            border: '1px solid rgba(34,197,94,0.3)',
                                        }}>
                                            <div style={{ fontSize: '16px', marginBottom: '4px' }}>✅</div>
                                            <div style={{ fontSize: '13px', color: '#22c55e', fontWeight: 600 }}>
                                                Claimed! Come back tomorrow.
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '14px',
                                            borderRadius: '12px',
                                            background: 'rgba(139,92,246,0.06)',
                                            border: '1px solid rgba(139,92,246,0.15)',
                                        }}>
                                            <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                                Already claimed today
                                            </div>
                                        </div>
                                    )}

                                    {/* Info */}
                                    <p style={{
                                        fontSize: '10px',
                                        color: '#4b5563',
                                        textAlign: 'center',
                                        marginTop: '12px',
                                    }}>
                                        Miss a day and your streak resets. Cycle resets after 14 days.
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
