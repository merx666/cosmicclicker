'use client'

import { motion } from 'framer-motion'

interface VerificationScreenProps {
    onVerify: () => void
    isLoading: boolean
    error: string | null
}

export default function VerificationScreen({ onVerify, isLoading, error }: VerificationScreenProps) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-void-dark px-6">
            {/* Animated particle background effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-particle-glow rounded-full opacity-20"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
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

            {/* Main content */}
            <div className="relative z-10 text-center max-w-md">
                {/* Logo/Title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-void-purple via-particle-glow to-void-blue bg-clip-text text-transparent">
                        VOID COLLECTOR
                    </h1>
                    <p className="text-text-secondary text-lg mb-8">
                        Collect Void Particles, upgrade your system and earn WLD 🌌
                    </p>
                </motion.div>

                {/* Animated central orb */}
                <motion.div
                    className="relative w-48 h-48 mx-auto mb-12"
                    animate={{
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-radial from-particle-glow/40 to-transparent rounded-full blur-2xl" />
                    <div className="absolute inset-4 bg-gradient-radial from-void-purple via-void-blue to-transparent rounded-full" />
                    <motion.div
                        className="absolute inset-0 rounded-full border-2 border-particle-glow/50"
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                        }}
                    />
                </motion.div>

                {/* Verification info */}
                <motion.div
                    className="mb-8 p-6 bg-void-purple/10 border border-void-purple/30 rounded-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="flex items-start gap-3 text-left">
                        <span className="text-2xl">🔐</span>
                        <div>
                            <h3 className="font-bold text-white mb-2">World ID Required</h3>
                            <p className="text-text-secondary text-sm">
                                World ID verification ensures every player is a real human.
                                No bots, fair WLD distribution!
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Verify button */}
                <motion.button
                    onClick={onVerify}
                    disabled={isLoading}
                    className={`
            w-full py-4 px-8 rounded-xl font-bold text-lg
            bg-gradient-to-r from-void-purple to-void-blue
            hover:from-void-purple/80 hover:to-void-blue/80
            transition-all duration-200
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
          `}
                    whileTap={{ scale: isLoading ? 1 : 0.95 }}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                            Verifying...
                        </div>
                    ) : (
                        '🚀 Verify with World ID'
                    )}
                </motion.button>

                {/* Error message */}
                {error && (
                    <motion.div
                        className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        ⚠️ {error}
                    </motion.div>
                )}

                {/* Features list */}
                <motion.div
                    className="mt-12 grid gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    {[
                        { icon: '⭐', text: 'Click and collect particles' },
                        { icon: '🚀', text: 'Upgrade collecting system' },
                        { icon: '💰', text: 'Convert to real WLD tokens' },
                        { icon: '🏆', text: 'Compete on the leaderboard' },
                    ].map((feature, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-3 text-text-secondary text-sm"
                        >
                            <span className="text-xl">{feature.icon}</span>
                            <span>{feature.text}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    )
}
