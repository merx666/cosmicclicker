'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface LeaderboardEntry {
    id: string
    name: string
    score: number
    vip: boolean
}

export default function LeaderboardTab() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch('/api/leaderboard')

                if (!res.ok) {
                    throw new Error(`Failed to load leaderboard: ${res.status} ${res.statusText}`)
                }

                const data = await res.json()
                // Sort again just in case, though API should do it
                setLeaderboard(data.sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score))
                setError(null)
            } catch (err) {
                console.error('Failed to load leaderboard', err)
                const message = err instanceof Error ? err.message : 'Failed to load leaderboard'
                setError(message)
                setLeaderboard([])
            } finally {
                setLoading(false)
            }
        }
        fetchLeaderboard()
    }, [])

    const handleRetry = () => {
        setLoading(true)
        setError(null)
        // Re-run effect by resetting state
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch('/api/leaderboard')

                if (!res.ok) {
                    throw new Error(`Failed to load leaderboard: ${res.status} ${res.statusText}`)
                }

                const data = await res.json()
                setLeaderboard(data.sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score))
                setError(null)
            } catch (err) {
                console.error('Failed to load leaderboard', err)
                const message = err instanceof Error ? err.message : 'Failed to load leaderboard'
                setError(message)
                setLeaderboard([])
            } finally {
                setLoading(false)
            }
        }
        fetchLeaderboard()
    }

    return (
        <div className="py-8 space-y-4 px-4 pb-24">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-yellow-300 via-yellow-500 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                    🏆 Global Ranking
                </h2>
                <p className="text-text-secondary tracking-wide">Top collectors in the void</p>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl animate-pulse shadow-[0_4px_24px_rgba(0,0,0,0.2)]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-white/10" />
                                <div>
                                    <div className="h-4 w-28 bg-white/10 rounded mb-2" />
                                    <div className="h-3 w-16 bg-white/5 rounded" />
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="h-5 w-20 bg-white/10 rounded mb-1 ml-auto" />
                                <div className="h-3 w-12 bg-white/5 rounded ml-auto" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={handleRetry}
                        className="px-4 py-2 bg-void-purple/20 border border-void-purple/50 rounded-lg hover:bg-void-purple/30 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {leaderboard.map((entry, index) => {
                        let rankColor = 'bg-black/40 border-white/10 shadow-[inset_0_1px_10px_rgba(255,255,255,0.02),0_4px_24px_rgba(0,0,0,0.4)]'
                        let rankIcon = `#${index + 1}`
                        let textColor = 'text-text-secondary font-mono'

                        if (index === 0) {
                            rankColor = 'bg-gradient-to-br from-yellow-500/10 to-amber-600/5 border-yellow-500/40 shadow-[inset_0_1px_10px_rgba(255,255,255,0.05),0_8px_32px_rgba(234,179,8,0.2)]'
                            rankIcon = '🥇'
                            textColor = 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]'
                        } else if (index === 1) {
                            rankColor = 'bg-gradient-to-br from-gray-400/10 to-gray-600/5 border-gray-400/40 shadow-[inset_0_1px_10px_rgba(255,255,255,0.05),0_8px_32px_rgba(156,163,175,0.2)]'
                            rankIcon = '🥈'
                            textColor = 'text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.8)]'
                        } else if (index === 2) {
                            rankColor = 'bg-gradient-to-br from-orange-600/10 to-amber-700/5 border-orange-600/40 shadow-[inset_0_1px_10px_rgba(255,255,255,0.05),0_8px_32px_rgba(234,88,12,0.2)]'
                            rankIcon = '🥉'
                            textColor = 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]'
                        }

                        return (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`
                                    flex items-center justify-between p-5 rounded-[20px] border backdrop-blur-2xl transition-all duration-300 hover:scale-[1.02]
                                    ${rankColor}
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-8 h-8 flex items-center justify-center font-bold text-xl
                                        ${textColor}
                                    `}>
                                        {rankIcon}
                                    </div>
                                    <div>
                                        <div className="font-bold flex items-center gap-2 text-white">
                                            {entry.name}
                                            {entry.vip && (
                                                <span className="text-[10px] bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 text-black px-2 py-0.5 rounded-full font-black tracking-wider shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                                                    VIP
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-text-secondary tracking-widest uppercase font-bold mt-0.5">
                                            Collector
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono font-black text-cyan-400 text-xl drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]">
                                        {entry.score.toLocaleString()}
                                    </div>
                                    <div className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">particles</div>
                                </div>
                            </motion.div>
                        )
                    })}

                    {leaderboard.length === 0 && (
                        <div className="text-center py-12 text-text-secondary">
                            No players found yet. Be the first!
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
