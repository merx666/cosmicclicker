'use client'

import { useTranslation } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'

interface LeaderboardModalProps {
    isOpen: boolean
    onClose: () => void
    data: any
    type: 'wave' | 'spending' | 'streak' | 'voidbastion'
    onChangeType: (type: 'wave' | 'spending' | 'streak' | 'voidbastion') => void
}

export default function LeaderboardModal({
    isOpen,
    onClose,
    data,
    type,
    onChangeType
}: LeaderboardModalProps) {
    const { t } = useTranslation()

    const tabs = [
        { id: 'wave', label: 'Waves', icon: '🌊' },
        { id: 'spending', label: 'Spenders', icon: '💰' },
        { id: 'streak', label: 'Streak', icon: '🔥' },
        { id: 'voidbastion', label: 'Void Bastion', icon: '🏰' }
    ]

    const medals = ['🥇', '🥈', '🥉']

    const getValue = (entry: any) => {
        if (type === 'wave') return entry.highest_wave || entry.value || 0
        if (type === 'spending') return entry.total_spent_wld || entry.total_spending || entry.value || 0
        if (type === 'streak') return entry.current_streak || entry.value || 0
        if (type === 'voidbastion') return entry.highest_wave || entry.value || 0
        return 0
    }

    const getUnit = () => {
        if (type === 'spending') return ' WLD'
        if (type === 'streak') return 'd'
        if (type === 'voidbastion') return ' wave'
        return ''
    }

    const getColor = () => {
        if (type === 'wave') return '#06b6d4'
        if (type === 'spending') return '#fbbf24'
        if (type === 'streak') return '#f97316'
        if (type === 'voidbastion') return '#8b5cf6'
        return '#a78bfa'
    }

    const leaderboardData = data?.leaderboard || data || []

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
                        zIndex: 100,
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
                            maxWidth: '430px',
                            maxHeight: '90vh',
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
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px',
                            }}>
                                <h2 style={{
                                    fontSize: '20px',
                                    fontWeight: 800,
                                    letterSpacing: '2px',
                                    background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}>
                                    🏆 RANKING
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

                            {/* Tabs */}
                            <div style={{
                                display: 'flex',
                                gap: '6px',
                                overflowX: 'auto',
                                WebkitOverflowScrolling: 'touch',
                            }}>
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => onChangeType(tab.id as any)}
                                        style={{
                                            padding: '8px 14px',
                                            borderRadius: '8px',
                                            fontWeight: 700,
                                            fontSize: '12px',
                                            letterSpacing: '0.5px',
                                            whiteSpace: 'nowrap',
                                            border: type === tab.id
                                                ? '1px solid #fbbf24'
                                                : '1px solid rgba(255,255,255,0.1)',
                                            background: type === tab.id
                                                ? 'rgba(234,179,8,0.15)'
                                                : 'transparent',
                                            color: type === tab.id
                                                ? '#fbbf24'
                                                : '#6b7280',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {tab.icon} {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Leaderboard List */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '16px',
                            WebkitOverflowScrolling: 'touch',
                        }}>
                            {!leaderboardData || leaderboardData.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '48px 20px',
                                }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                                    <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '8px' }}>
                                        No data yet
                                    </p>
                                    <p style={{ fontSize: '13px', color: '#4b5563' }}>
                                        Be the first to climb the ranks!
                                    </p>
                                </div>
                            ) : (
                                leaderboardData.map((entry: any, index: number) => {
                                    const isTop3 = index < 3

                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '14px 16px',
                                                marginBottom: '8px',
                                                borderRadius: '12px',
                                                background: isTop3
                                                    ? 'rgba(234,179,8,0.06)'
                                                    : 'rgba(139,92,246,0.04)',
                                                border: isTop3
                                                    ? '1px solid rgba(234,179,8,0.2)'
                                                    : '1px solid rgba(139,92,246,0.1)',
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                            }}>
                                                <div style={{
                                                    fontSize: isTop3 ? '22px' : '14px',
                                                    fontWeight: 800,
                                                    minWidth: '36px',
                                                    textAlign: 'center',
                                                    color: isTop3 ? undefined : '#6b7280',
                                                }}>
                                                    {isTop3 ? medals[index] : `#${index + 1}`}
                                                </div>
                                                <div>
                                                    <div style={{
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        color: '#e0e0ff',
                                                    }}>
                                                        {entry.wallet_address || '0x...'}
                                                    </div>
                                                    {(entry.total_games_played || entry.games_played) && (
                                                        <div style={{
                                                            fontSize: '10px',
                                                            color: '#6b7280',
                                                            marginTop: '2px',
                                                        }}>
                                                            {entry.total_games_played || entry.games_played} games
                                                            {type === 'voidbastion' && entry.total_score ? ` · ${entry.total_score} pts` : ''}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{
                                                fontSize: '18px',
                                                fontWeight: 800,
                                                color: getColor(),
                                                textAlign: 'right',
                                            }}>
                                                {getValue(entry)}
                                                <span style={{
                                                    fontSize: '10px',
                                                    color: '#9ca3af',
                                                    marginLeft: '2px',
                                                }}>
                                                    {getUnit()}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '12px 16px',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            background: 'rgba(0,0,0,0.3)',
                            textAlign: 'center',
                        }}>
                            <p style={{ fontSize: '10px', color: '#6b7280' }}>
                                Season 3 Rankings
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
