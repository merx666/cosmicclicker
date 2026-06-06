'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PeopleIcon, WorldIcon } from './Icons'

interface MatchmakingOverlayProps {
    onCancel: () => void
    onMatchFound: () => void
}

const mockOpponents = [
    'ShadowSlayer', 'VoidWalker', 'CryptoKing', 'NeuralNet',
    'StarCommander', 'IronClad99', 'TacticsMaster', 'WldHolder'
]

export default function MatchmakingOverlay({ onCancel, onMatchFound }: MatchmakingOverlayProps) {
    const [status, setStatus] = useState<'searching' | 'found'>('searching')
    const [elapsed, setElapsed] = useState(0)
    const [opponent, setOpponent] = useState<string | null>(null)

    useEffect(() => {
        const timer = setInterval(() => {
            setElapsed(prev => prev + 1)
        }, 1000)

        // Simulate finding a match between 2-5 seconds
        const matchDelay = 2000 + Math.random() * 3000
        const matchTimer = setTimeout(() => {
            setStatus('found')
            setOpponent(mockOpponents[Math.floor(Math.random() * mockOpponents.length)])

            // Wait a bit after finding to start
            setTimeout(() => {
                onMatchFound()
            }, 1500)
        }, matchDelay)

        return () => {
            clearInterval(timer)
            clearTimeout(matchTimer)
        }
    }, [onMatchFound])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-8 flex flex-col items-center shadow-2xl relative overflow-hidden"
            >
                {/* Background pulse */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 animate-pulse" />

                <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-8 z-10">
                    {status === 'searching' ? 'Searching for Opponent' : 'Match Found!'}
                </h2>

                <div className="relative w-48 h-32 flex items-center justify-center mb-8 z-10">
                    {/* Player (Left) */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center"
                    >
                        <div className="w-16 h-16 rounded-full bg-indigo-600 border-2 border-indigo-400 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                            <span className="text-2xl">👤</span>
                        </div>
                        <span className="text-xs text-indigo-300 font-bold mt-2">YOU</span>
                    </motion.div>

                    {/* VS (Center) */}
                    <div className="text-xl font-black text-white italic z-20">VS</div>

                    {/* Opponent (Right) */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center w-16">
                        {status === 'searching' ? (
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-600 border-dashed flex items-center justify-center"
                            >
                                <span className="text-2xl animate-spin">❓</span>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-16 h-16 rounded-full bg-red-600 border-2 border-red-400 flex items-center justify-center shadow-[0_0_15px_rgba(248,113,113,0.5)]">
                                    <span className="text-2xl">😈</span>
                                </div>
                            </motion.div>
                        )}
                        <span className="text-xs text-slate-400 font-bold mt-2 truncate max-w-full">
                            {opponent || 'SEARCHING...'}
                        </span>
                    </div>
                </div>

                {/* Status Text / Timer */}
                <div className="flex flex-col items-center gap-2 mb-8 z-10">
                     {status === 'searching' ? (
                        <>
                            <div className="flex gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0s' }} />
                                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
                            </div>
                            <span className="text-sm text-slate-400 font-mono mt-2">{elapsed}s</span>
                        </>
                     ) : (
                         <span className="text-green-400 font-bold text-lg animate-pulse">STARTING MATCH...</span>
                     )}
                </div>

                {/* Cancel Button */}
                {status === 'searching' && (
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 rounded-full border border-slate-600 text-slate-400 text-sm hover:bg-slate-800 hover:text-white transition-colors z-10"
                    >
                        CANCEL
                    </button>
                )}
            </motion.div>
        </div>
    )
}
