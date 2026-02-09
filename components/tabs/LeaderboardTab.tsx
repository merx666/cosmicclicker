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
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                    🏆 Global Ranking
                </h2>
                <p className="text-text-secondary">Top collectors in the void</p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-void-purple mb-4"></div>
                    <p className="text-text-secondary">Loading rankings...</p>
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
                        let rankColor = 'bg-void-purple/10 border-void-purple/20'
                        let rankIcon = `#${index + 1}`
                        let textColor = 'text-text-secondary'

                        if (index === 0) {
                            rankColor = 'bg-yellow-500/20 border-yellow-500/50'
                            rankIcon = '🥇'
                            textColor = 'text-yellow-500'
                        } else if (index === 1) {
                            rankColor = 'bg-gray-400/20 border-gray-400/50'
                            rankIcon = '🥈'
                            textColor = 'text-gray-400'
                        } else if (index === 2) {
                            rankColor = 'bg-orange-700/20 border-orange-700/50'
                            rankIcon = '🥉'
                            textColor = 'text-orange-600'
                        }

                        return (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`
                                    flex items-center justify-between p-4 rounded-xl border ${rankColor}
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
                                        <div className="font-bold flex items-center gap-2">
                                            {entry.name}
                                            {entry.vip && (
                                                <span className="text-[10px] bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-1.5 py-0.5 rounded-full font-bold">
                                                    VIP
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-text-secondary">
                                            Collector
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono font-bold text-particle-glow text-lg">
                                        {entry.score.toLocaleString()}
                                    </div>
                                    <div className="text-[10px] text-text-secondary">particles</div>
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
