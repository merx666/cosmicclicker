'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CHANGELOG_VERSION = 'changelog_v2_seen'

export default function ChangelogModal() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const seen = localStorage.getItem(CHANGELOG_VERSION)
        if (!seen) {
            // Small delay so it doesn't flash on load
            setTimeout(() => setIsVisible(true), 800)
        }
    }, [])

    const handleDismiss = () => {
        localStorage.setItem(CHANGELOG_VERSION, 'true')
        setIsVisible(false)
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    onClick={handleDismiss}
                >
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="bg-gradient-to-b from-[#0d0d2b] to-[#0a0a1a] border border-purple-500/30 rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto shadow-[0_0_60px_rgba(139,92,246,0.15)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 pb-2 text-center">
                            <motion.div
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                                className="text-5xl mb-3"
                            >
                                📋
                            </motion.div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                What&apos;s New
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">v2.1 — February 2026</p>
                        </div>

                        {/* Content */}
                        <div className="px-6 pb-4 space-y-4">

                            {/* Payment Fix */}
                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">✅</span>
                                    <div>
                                        <h3 className="font-bold text-green-400 text-sm">Payment System — Fixed Forever</h3>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            The payment issue has been permanently resolved. However, the blockchain has a
                                            limited number of transactions per day — your deposits may appear naturally
                                            slower during peak hours. This is normal blockchain behavior, not a bug.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">👆</span>
                                    <div>
                                        <h3 className="font-bold text-blue-400 text-sm">Swipeable Navigation Bar</h3>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            The bottom navigation bar can now be swiped left and right to reveal
                                            more tabs! Look for the animated hint when you enter the game.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Survey */}
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">🗳️</span>
                                    <div>
                                        <h3 className="font-bold text-purple-400 text-sm">New: The Void AI Decides</h3>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            A new Survey tab is available! Vote on the future of the game.
                                            Each vote costs WLD — the more you vote, the louder your voice.
                                            The Void AI will implement the community&apos;s decision.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Lottery */}
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">🎰</span>
                                    <div>
                                        <h3 className="font-bold text-yellow-400 text-sm">Void Machine Upgrades</h3>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            Free daily spin! Win streak multipliers! Better visual effects and
                                            an improved prize table. Try your luck today.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* i18n */}
                            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">🌍</span>
                                    <div>
                                        <h3 className="font-bold text-cyan-400 text-sm">Multi-Language Support</h3>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            The game now supports 12 languages! Your language is detected
                                            automatically based on your location.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Valentine's Message */}
                            <div className="bg-gradient-to-r from-pink-500/10 to-red-500/10 border border-pink-500/20 rounded-xl p-4 mt-2">
                                <div className="text-center">
                                    <motion.span
                                        className="text-3xl inline-block"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                                    >
                                        💝
                                    </motion.span>
                                    <p className="text-sm text-pink-300 mt-2 font-medium italic">
                                        &quot;Happy Valentine&apos;s Day to all our players!
                                        Wishing you love, luck, and lots of Void Particles!&quot;
                                    </p>
                                    <p className="text-xs text-pink-500/60 mt-1">— The Developer</p>
                                </div>
                            </div>
                        </div>

                        {/* Dismiss Button */}
                        <div className="p-6 pt-2">
                            <button
                                onClick={handleDismiss}
                                className="w-full py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-purple-500/20"
                            >
                                Got it! Let&apos;s play 🚀
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
