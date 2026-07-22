'use client'

import { motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { useState, useRef, useEffect } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'
import toast from 'react-hot-toast'
import ParticleEffects from './effects/ParticleEffects'
import VoidCaptchaModal from './UI/VoidCaptchaModal'
import DynamicAdRotator from './DynamicAdRotator'

export default function VoidParticle() {
    const handleClick = useGameStore((state) => state.handleClick)
    const premiumLuckyParticle = useGameStore((state) => state.premiumLuckyParticle)
    const premiumParticleSkin = useGameStore((state) => state.premiumParticleSkin)
    const addParticles = useGameStore((state) => state.addParticles)
    const particlesPerClick = useGameStore((state) => state.particlesPerClick)
    const [clickEffect, setClickEffect] = useState(false)
    const [luckyEffect, setLuckyEffect] = useState(false)

    // Captcha and Anomaly Detector States
    const [isCaptchaOpen, setIsCaptchaOpen] = useState(false)
    const clickCoordinatesRef = useRef<{ x: number; y: number }[]>([])
    const clickIntervalsRef = useRef<number[]>([])
    const lastClickTimeRef = useRef<number>(0)

    // Dynamic states for design spells
    const [floatingTexts, setFloatingTexts] = useState<{ id: number; x: number; y: number; text: string; color: string; size: string; angle: number }[]>([])
    const [shockwaves, setShockwaves] = useState<{ id: number; x: number; y: number; color: string }[]>([])

    // Anti-bot protection state (Rate limiting & Anomaly Detection)
    const clickHistoryRef = useRef<number[]>([])
    const cooldownUntilRef = useRef<number>(0)
    const penaltyLevelRef = useRef<number>(0)
    const lastPenaltyTimeRef = useRef<number>(0)

    // Ads verification anti-bot state
    const [cps, setCps] = useState(0)
    const [adVerificationDeadline, setAdVerificationDeadline] = useState<number | null>(null)
    const [hasAdClicked, setHasAdClicked] = useState(false)
    const [adPenaltyActive, setAdPenaltyActive] = useState(false)
    const [formattedDeadline, setFormattedDeadline] = useState('')

    // Decay CPS and handle countdown timers
    useEffect(() => {
        const timer = setInterval(() => {
            const now = Date.now()
            const recent = clickHistoryRef.current.filter(t => now - t < 1000)
            setCps(recent.length)

            if (adPenaltyActive && now >= cooldownUntilRef.current) {
                setAdPenaltyActive(false)
            }

            if (recent.length === 0 && hasAdClicked) {
                setHasAdClicked(false)
            }

            if (adVerificationDeadline !== null) {
                const diff = adVerificationDeadline - now
                if (diff <= 0) {
                    setAdVerificationDeadline(null)
                    setAdPenaltyActive(true)
                    setFormattedDeadline('')
                    const penaltyDuration = 15000
                    cooldownUntilRef.current = now + penaltyDuration
                    toast.error('🤖 Czas minął! Wykryto zbyt szybkie klikanie. Blokada na 15 sekund.')
                } else {
                    const secondsLeft = Math.ceil(diff / 1000)
                    const date = new Date(adVerificationDeadline)
                    const timeStr = date.toTimeString().split(' ')[0]
                    setFormattedDeadline(`${timeStr} (za ${secondsLeft}s)`)
                }
            } else {
                setFormattedDeadline('')
            }
        }, 200)

        return () => clearInterval(timer)
    }, [adVerificationDeadline, adPenaltyActive, hasAdClicked])

    const handleAdClick = () => {
        setAdVerificationDeadline(null)
        setAdPenaltyActive(false)
        setHasAdClicked(true)
        cooldownUntilRef.current = 0
        toast.success('🛡️ Zweryfikowano! Blokada usunięta, możesz klikać dalej.')
    }

    const applyPenalty = () => {
        const now = Date.now()
        penaltyLevelRef.current += 1
        const penaltyDuration = Math.pow(2, penaltyLevelRef.current) * 1000 // 2s, 4s, 8s, 16s...
        cooldownUntilRef.current = now + penaltyDuration
        lastPenaltyTimeRef.current = now

        toast.error(`🤖 Przekroczono limit kliknięć! Czas: ${penaltyDuration / 1000}s`, {
            duration: penaltyDuration
        })
    }

    const getStandardDeviation = (values: number[]): number => {
        if (values.length < 5) return 999
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length
        const squareDiffs = values.map(val => Math.pow(val - avg, 2))
        const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length
        return Math.sqrt(avgSquareDiff)
    }

    const getPixelDeviation = (coords: { x: number; y: number }[]): number => {
        if (coords.length < 5) return 999
        const xs = coords.map(c => c.x)
        const ys = coords.map(c => c.y)
        return getStandardDeviation(xs) + getStandardDeviation(ys)
    }

    const isValidClick = (now: number, x: number, y: number): boolean => {
        if (isCaptchaOpen) {
            return false
        }

        if (adPenaltyActive) {
            toast.error('🤖 Klikanie zablokowane! Kliknij reklamę poniżej, aby odblokować.')
            return false
        }

        if (now - lastPenaltyTimeRef.current > 30000) {
            penaltyLevelRef.current = 0
        }

        if (now < cooldownUntilRef.current) {
            return false
        }

        const recentClicks = clickHistoryRef.current.filter(t => now - t < 1000)
        const currentCps = recentClicks.length + 1

        // Activate ad verification if clicking fast (CPS >= 11) and not yet immune/challenged
        if (currentCps >= 11 && adVerificationDeadline === null && !hasAdClicked) {
            setAdVerificationDeadline(now + 10000)
            toast('Szybkie klikanie! Kliknij reklamę poniżej w ciągu 10 sekund, aby uniknąć blokady.', {
                icon: '⚠️'
            })
        }

        if (recentClicks.length >= 22) {
            applyPenalty()
            return false
        }

        clickCoordinatesRef.current.push({ x, y })
        if (clickCoordinatesRef.current.length > 10) {
            clickCoordinatesRef.current.shift()
        }
        
        const pixelDev = getPixelDeviation(clickCoordinatesRef.current)
        if (clickCoordinatesRef.current.length >= 10 && pixelDev < 0.2) {
            console.warn(`[Anti-Bot] Pixel anomaly detected! Variance: ${pixelDev}px`)
            setIsCaptchaOpen(true)
            return false
        }

        if (lastClickTimeRef.current > 0) {
            const diff = now - lastClickTimeRef.current
            clickIntervalsRef.current.push(diff)
            if (clickIntervalsRef.current.length > 30) {
                clickIntervalsRef.current.shift()
            }

            const intervalDev = getStandardDeviation(clickIntervalsRef.current)
            if (clickIntervalsRef.current.length >= 30 && intervalDev < 8) {
                console.warn(`[Anti-Bot] Time interval anomaly! Variance: ${intervalDev}ms`)
                setIsCaptchaOpen(true)
                return false
            }
        }
        lastClickTimeRef.current = now

        return true
    }

    const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const now = Date.now()

        // Get coordinates relative to target element
        const rect = event.currentTarget.getBoundingClientRect()
        const clickX = event.clientX - rect.left
        const clickY = event.clientY - rect.top

        // Anti-bot validation
        if (!isValidClick(now, clickX, clickY)) {
            return
        }

        // Add to click history (keep last 20)
        clickHistoryRef.current.push(now)
        if (clickHistoryRef.current.length > 20) {
            clickHistoryRef.current.shift()
        }

        // Variable cooldown (50-200ms) to prevent constant-rate clicking
        const randomCooldown = 50 + Math.random() * 150
        cooldownUntilRef.current = now + randomCooldown

        // 1. Click calculation & core game logic
        const clickSuccess = handleClick()
        if (!clickSuccess) {
            return
        }

        setClickEffect(true)

        let currentMultiplier = 1
        let isLuckyClick = false
        let isMegaLucky = false

        if (premiumLuckyParticle) {
            const state = useGameStore.getState()
            const vipTier = state.vipTier || 1

            const tierStats = [
                { chance: 0, multiplier: 1 },     // No tier
                { chance: 0.05, multiplier: 2 },  // Bronze
                { chance: 0.08, multiplier: 2 },  // Silver
                { chance: 0.12, multiplier: 3 },  // Gold
                { chance: 0.15, multiplier: 5 }   // Platinum
            ]

            const { chance, multiplier } = tierStats[vipTier] || tierStats[1]

            if (Math.random() < chance) {
                currentMultiplier = multiplier
                isLuckyClick = true
            }

            // Mega Lucky for Gold/Platinum tiers
            if (vipTier >= 3) {
                const megaChance = vipTier === 3 ? 0.01 : 0.03
                const megaMulti = vipTier === 3 ? 10 : 15

                if (Math.random() < megaChance) {
                    currentMultiplier = megaMulti
                    isMegaLucky = true
                    isLuckyClick = true
                }
            }
        }

        const totalEarned = particlesPerClick * currentMultiplier
        if (currentMultiplier > 1) {
            addParticles(particlesPerClick * (currentMultiplier - 1))
            setLuckyEffect(true)
            if (isMegaLucky) {
                toast.success(`💎 MEGA LUCKY! +${currentMultiplier}x particles!`, { duration: 2000 })
            } else {
                toast.success(`🍀 Lucky! +${currentMultiplier}x particles!`)
            }
            setTimeout(() => setLuckyEffect(false), 1000)
        }

        // 2. Click coordinates for precise design spells
        const x = clickX
        const y = clickY

        // Skin color mapping
        let color = '#a78bfa' // cosmic purple
        let size = 'text-lg'
        if (premiumParticleSkin === 'gold') {
            color = '#fbbf24' // gold
        } else if (premiumParticleSkin === 'rainbow') {
            const colors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9']
            color = colors[Math.floor(Math.random() * colors.length)]
        } else if (premiumParticleSkin === 'crystal') {
            color = '#38bdf8' // crystal cyan
        } else if (premiumParticleSkin === 'dark_matter') {
            color = '#6d28d9' // dark violet
        } else if (premiumParticleSkin === 'supernova') {
            color = '#f97316' // orange/red
        }

        if (isMegaLucky) {
            color = '#38bdf8' // diamond blue
            size = 'text-2xl font-black tracking-widest'
        } else if (isLuckyClick) {
            color = '#4ade80' // emerald green
            size = 'text-xl font-extrabold'
        }

        // Trigger Shockwave ripple
        const waveId = Date.now() + Math.random()
        setShockwaves(prev => [...prev, { id: waveId, x, y, color }])
        setTimeout(() => {
            setShockwaves(prev => prev.filter(w => w.id !== waveId))
        }, 600)

        // Spawn floating text
        const textId = Date.now() + Math.random()
        let textString = `+${totalEarned}`
        if (isMegaLucky) textString = `💎 +${totalEarned} MEGA!`
        else if (isLuckyClick) textString = `🍀 +${totalEarned} LUCKY!`

        const randomAngle = (Math.random() - 0.5) * 50 // -25px to 25px drift
        setFloatingTexts(prev => [...prev, { id: textId, x, y, text: textString, color, size, angle: randomAngle }])
        setTimeout(() => {
            setFloatingTexts(prev => prev.filter(t => t.id !== textId))
        }, 800)

        // Haptic feedback
        if (typeof window !== 'undefined' && MiniKit.isInstalled()) {
            MiniKit.commands.sendHapticFeedback({
                hapticsType: 'impact',
                style: 'light'
            })
        }

        // Reset click effect
        setTimeout(() => setClickEffect(false), 300)
    }

    const handleCaptchaSuccess = () => {
        setIsCaptchaOpen(false)
        clickCoordinatesRef.current = []
        clickIntervalsRef.current = []
        lastClickTimeRef.current = 0
        toast.success('🛡️ Kalibracja pomyślna. Blokada zdjęta!')
    }

    const handleCaptchaFailure = () => {
        setIsCaptchaOpen(false)
        clickCoordinatesRef.current = []
        clickIntervalsRef.current = []
        lastClickTimeRef.current = 0
        
        // Zastosuj ciężką karę (np. 15 sekund cooldownu)
        const now = Date.now()
        cooldownUntilRef.current = now + 15000
        toast.error('🤖 Wykryto aktywność botów! Blokada klikania na 15 sekund.')
    }

    return (
        <div className="flex flex-col items-center w-full">
            <div className="relative flex items-center justify-center h-[350px] tap-target w-full select-none overflow-hidden">
            {/* Premium particle effects */}
            <ParticleEffects
                skinType={premiumParticleSkin as any}
                isClicking={clickEffect}
                isLucky={luckyEffect}
            />

            {/* Shockwaves */}
            {shockwaves.map((wave) => (
                <motion.div
                    key={wave.id}
                    className="absolute rounded-full border pointer-events-none z-10"
                    style={{
                        left: wave.x,
                        top: wave.y,
                        transform: 'translate(-50%, -50%)',
                        width: '30px',
                        height: '30px',
                        boxShadow: `0 0 20px ${wave.color}, inset 0 0 15px ${wave.color}`,
                        borderColor: wave.color,
                    }}
                    initial={{ scale: 0, opacity: 0.9 }}
                    animate={{ scale: 5, opacity: 0 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                />
            ))}

            {/* Floating texts */}
            {floatingTexts.map((txt) => {
                return (
                    <motion.div
                        key={txt.id}
                        className={`absolute pointer-events-none z-20 select-none font-bold text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] ${txt.size}`}
                        style={{
                            left: txt.x,
                            top: txt.y,
                            color: txt.color,
                            textShadow: `0 0 10px ${txt.color}, 0 0 20px ${txt.color}88`,
                            transform: 'translate(-50%, -50%)'
                        }}
                        initial={{ opacity: 1, scale: 0.8, y: 0, x: 0 }}
                        animate={{
                            opacity: 0,
                            scale: [0.8, 1.2, 1],
                            y: -120,
                            x: txt.angle
                        }}
                        transition={{ duration: 0.75, ease: "easeOut" }}
                    >
                        {txt.text}
                    </motion.div>
                )
            })}

            {/* Main clickable particle */}
            <motion.div
                className="relative w-64 h-64 cursor-pointer select-none tap-target z-20"
                whileTap={{ scale: 0.9, transition: { type: "spring", stiffness: 400, damping: 10 } }}
                onClick={onClick}
                animate={{
                    scale: clickEffect ? 1.05 : 1,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
                {/* Outer glow */}
                <div className="absolute inset-0 bg-gradient-radial from-particle-glow/40 to-transparent rounded-full blur-3xl" />

                {/* Main particle body */}
                <div className="absolute inset-0 bg-gradient-radial from-particle-glow via-void-purple to-transparent rounded-full shadow-2xl drop-shadow-[0_0_30px_rgba(184,101,255,0.6)]" />

                {/* Pulsing ring */}
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-particle-glow"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 0, 0.7],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* Second pulsing ring (offset) */}
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-void-blue"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5
                    }}
                />

                {/* Inner sparkle */}
                <motion.div
                    className="absolute inset-10 bg-gradient-radial from-white/60 to-transparent rounded-full blur-sm"
                    animate={{
                        opacity: [0.6, 0.9, 0.6],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                    }}
                />

                {/* Click indicator burst */}
                {clickEffect && (
                    <>
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2.5 h-2.5 rounded-full"
                                style={{
                                    left: '50%',
                                    top: '50%',
                                    backgroundColor: premiumParticleSkin === 'gold' ? '#fbbf24' : premiumParticleSkin === 'rainbow' ? '#ec4899' : premiumParticleSkin === 'crystal' ? '#38bdf8' : premiumParticleSkin === 'dark_matter' ? '#6d28d9' : premiumParticleSkin === 'supernova' ? '#f97316' : '#c084fc',
                                    boxShadow: `0 0 10px ${premiumParticleSkin === 'gold' ? '#fbbf24' : premiumParticleSkin === 'crystal' ? '#38bdf8' : premiumParticleSkin === 'dark_matter' ? '#6d28d9' : premiumParticleSkin === 'supernova' ? '#f97316' : '#c084fc'}`
                                }}
                                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                                animate={{
                                    x: Math.cos((i * Math.PI * 2) / 8) * 110,
                                    y: Math.sin((i * Math.PI * 2) / 8) * 110,
                                    scale: 0,
                                    opacity: 0,
                                }}
                                transition={{ duration: 0.45 }}
                            />
                        ))}
                    </>
                )}
            </motion.div>

            {/* Floating particles in background */}
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-particle-glow/30 rounded-full"
                    style={{
                        left: `${20 + (i * 60) % 80}%`,
                        top: `${10 + (i * 40) % 80}%`,
                    }}
                    animate={{
                        y: [0, -20, 0],
                        opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                        duration: 3 + (i % 3),
                        repeat: Infinity,
                        delay: (i % 2),
                    }}
                />
            ))}

            {/* Void Slider Captcha Modal */}
            <VoidCaptchaModal 
                isOpen={isCaptchaOpen}
                onSuccess={handleCaptchaSuccess}
                onFailure={handleCaptchaFailure}
            />
        </div>

        {/* Anti-Bot verification section */}
        {(adVerificationDeadline !== null || adPenaltyActive) && (
            <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`w-full max-w-sm rounded-3xl p-5 border text-center backdrop-blur-lg mt-6 shadow-[0_0_30px_rgba(239,68,68,0.15)] ${
                    adPenaltyActive 
                        ? 'bg-red-950/20 border-red-500/40 animate-pulse' 
                        : 'bg-void-purple/10 border-void-purple/30'
                }`}
            >
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-xl">🤖</span>
                    <h4 className="text-sm font-extrabold tracking-wider uppercase text-red-400">
                        {adPenaltyActive ? 'Blokada Antybotowa' : `Weryfikacja Klikania (CPS: ${cps})`}
                    </h4>
                </div>

                <p className="text-xs text-gray-300 font-medium mb-3">
                    {adPenaltyActive ? (
                        <span>
                            Klikanie zablokowane na 15s. <br />
                            <span className="text-white font-bold">Kliknij reklamę poniżej, aby natychmiast odblokować!</span>
                        </span>
                    ) : (
                        <span>
                            Kliknij reklamę przed: <span className="text-white font-mono font-bold bg-white/10 px-2 py-0.5 rounded">{formattedDeadline}</span>, aby kontynuować grę.
                        </span>
                    )}
                </p>

                {/* Scaled ads based on CPS */}
                <div className="flex flex-col gap-3">
                    {Array.from({ length: cps >= 15 ? 3 : cps >= 12 ? 2 : 1 }).map((_, idx) => (
                        <div key={idx} className="transition-all hover:scale-[1.01]">
                            <DynamicAdRotator onAdClick={handleAdClick} />
                        </div>
                    ))}
                </div>
            </motion.div>
        )}
    </div>
)
}
