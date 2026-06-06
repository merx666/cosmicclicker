'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { mapError } from '@/lib/errorMapper'

interface VerificationScreenProps {
    onVerify: () => void
    isLoading: boolean
    error: string | null
}

export default function VerificationScreen({ onVerify, isLoading, error }: VerificationScreenProps) {
    const [isMounted, setIsMounted] = useState(false)
    const t = useTranslations('Home')
    const tc = useTranslations('Common')
    const locale = useLocale()

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const translatedError = error ? mapError(error, locale) : null

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-void-dark px-6 safe-area-top safe-area-bottom overflow-hidden relative">
            
            {/* Premium Animated particle background effect */}
            {isMounted && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(30)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                background: ['#a855f7', '#6366f1', '#3b82f6', '#06b6d4'][i % 4],
                            }}
                            animate={{
                                y: [0, -40, 0],
                                opacity: [0.15, 0.45, 0.15],
                                scale: [1, 1.4, 1],
                            }}
                            transition={{
                                duration: 4 + Math.random() * 3,
                                repeat: Infinity,
                                delay: Math.random() * 3,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Glowing cosmic mesh overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(168,85,247,0.2) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(59,130,246,0.15) 0%, transparent 50%)',
                }}
            />

            {/* Main content glass container */}
            <div className="relative z-10 text-center max-w-md w-full">
                
                {/* Logo/Title */}
                <motion.div
                    initial={{ opacity: 0, y: -25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                >
                    <h1 className="text-6xl font-extrabold mb-3 tracking-tighter bg-gradient-to-r from-purple-400 via-fuchsia-500 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                        VOID COLLECTOR
                    </h1>
                    <p className="text-text-secondary text-sm md:text-base mb-8 uppercase tracking-widest font-medium opacity-85">
                        {t('subtitle')}
                    </p>
                </motion.div>

                {/* Animated premium central orb */}
                <motion.div
                    className="relative w-44 h-44 mx-auto mb-10 cursor-pointer"
                    animate={{
                        scale: [1, 1.06, 1],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-radial from-particle-glow/30 to-transparent rounded-full blur-2xl" />
                    <div className="absolute inset-4 bg-gradient-to-tr from-void-purple via-indigo-600 to-void-blue rounded-full shadow-[0_0_40px_rgba(107,47,181,0.5)] border border-white/10" />
                    
                    {/* Inner glowing core */}
                    <div className="absolute inset-10 bg-gradient-radial from-white/30 via-transparent to-transparent rounded-full" />

                    {/* Concentric rotating glowing ring */}
                    <motion.div
                        className="absolute inset-0 rounded-full border border-dashed border-particle-glow/40"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Outer pulsing ring */}
                    <motion.div
                        className="absolute -inset-2 rounded-full border border-void-blue/30"
                        animate={{
                            scale: [1, 1.15, 1],
                            opacity: [0.4, 0, 0.4],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 1
                        }}
                    />
                </motion.div>

                {/* Verification info with Glassmorphic design */}
                <motion.div
                    className="mb-8 p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md shadow-2xl relative overflow-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-void-purple/20 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-start gap-4 text-left">
                        <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">🔐</span>
                        <div>
                            <h3 className="font-bold text-white text-base mb-1">
                                {t('verificationTitle')}
                            </h3>
                            <p className="text-text-secondary text-xs leading-relaxed opacity-90">
                                {t('verificationDesc')}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Verify button */}
                <motion.button
                    onClick={onVerify}
                    disabled={isLoading}
                    className={`
                        w-full py-4 px-8 rounded-xl font-bold text-base uppercase tracking-wider
                        bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600
                        hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500
                        shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]
                        transition-all duration-300 border border-white/10 active:scale-[0.98]
                        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
                    `}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                            <span>{tc('verifying')}</span>
                        </div>
                    ) : (
                        <span>🚀 {t('verifyButton')}</span>
                    )}
                </motion.button>

                {/* Telegram Login Button */}
                <motion.a
                    href="https://t.me/Voidbot_official_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-3 w-full py-4 px-8 rounded-xl font-bold text-base uppercase tracking-wider bg-gradient-to-r from-[#229ED9] via-[#0088cc] to-[#0077b5] hover:from-[#33aef0] hover:via-[#1199dd] hover:to-[#1188c6] shadow-[0_0_20px_rgba(34,158,217,0.3)] hover:shadow-[0_0_30px_rgba(34,158,217,0.5)] transition-all duration-300 border border-white/10 active:scale-[0.98] hover:scale-[1.02]"
                    whileTap={{ scale: 0.98 }}
                >
                    <span>💬 Zaloguj przez Telegram</span>
                </motion.a>

                {/* Localized Error message display */}
                {translatedError && (
                    <motion.div
                        className="mt-5 p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-200 text-xs text-left flex items-start gap-3 shadow-lg"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    >
                        <span className="text-base select-none">⚠️</span>
                        <div className="flex-1 font-medium leading-relaxed">
                            {translatedError}
                        </div>
                    </motion.div>
                )}

                {/* Features list */}
                <motion.div
                    className="mt-10 grid grid-cols-2 gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    {[
                        { icon: '✨', text: t('featureClick') },
                        { icon: '🚀', text: t('featureUpgrade') },
                        { icon: '💎', text: t('featureConvert') },
                        { icon: '🏆', text: t('featureLeaderboard') },
                    ].map((feature, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-2 p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors"
                        >
                            <span className="text-lg filter drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">{feature.icon}</span>
                            <span className="text-text-secondary text-[11px] text-left leading-tight font-medium">
                                {feature.text}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    )
}
