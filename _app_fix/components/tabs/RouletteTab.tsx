'use client'

import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { MiniKit, Tokens, Network, tokenToDecimals } from '@worldcoin/minikit-js'
import Image from 'next/image'

// Fake winners data for the marquee
const FAKE_WINNERS = [
    { addr: '0x71...8a92', prize: '50 WLD' },
    { addr: '0x3a...b21c', prize: 'Platinum VIP' },
    { addr: '0x99...f1e2', prize: '10 WLD' },
    { addr: '0x42...d4a1', prize: 'Gold VIP' },
    { addr: '0x1b...c988', prize: '500k Particles' },
    { addr: '0x8f...e332', prize: '2 WLD' },
    { addr: '0x2c...a77b', prize: 'Silver VIP' },
    { addr: '0xd5...1234', prize: '1M Particles' },
    { addr: '0xe7...5678', prize: 'Bronze VIP' },
    { addr: '0xab...9abc', prize: '25 WLD' },
]

// Free spin cooldown: 24 hours
const FREE_SPIN_COOLDOWN = 24 * 60 * 60 * 1000

export default function RouletteTab() {
    const { nullifierHash, particles, addParticles } = useGameStore()
    const [isSpinning, setIsSpinning] = useState(false)
    const [variant, setVariant] = useState<'small' | 'big'>('small')
    const [reels, setReels] = useState([0, 0, 0])
    const [lastWin, setLastWin] = useState<{ type: string, value: number, message: string } | null>(null)
    const [winStreak, setWinStreak] = useState(0)
    const [freeSpinAvailable, setFreeSpinAvailable] = useState(false)
    const [freeSpinTimer, setFreeSpinTimer] = useState('')
    const [showConfetti, setShowConfetti] = useState(false)
    const [screenShake, setScreenShake] = useState(false)
    const machineRef = useRef<HTMLDivElement>(null)

    const COST_SMALL = 0.45
    const COST_BIG = 1.5

    const SYMBOLS = [
        { id: 0, icon: '🗑️', color: 'text-gray-500', name: 'Trash' },
        { id: 1, icon: '✨', color: 'text-blue-400', name: 'Particles' },
        { id: 2, icon: '🌟', color: 'text-purple-400', name: 'Mega Particles' },
        { id: 3, icon: '🥉', color: 'text-amber-700', name: 'Bronze' },
        { id: 4, icon: '🥈', color: 'text-gray-300', name: 'Silver' },
        { id: 5, icon: '🥇', color: 'text-yellow-400', name: 'Gold' },
        { id: 6, icon: '💎', color: 'text-cyan-400', name: 'Platinum' },
    ]

    // Check free spin availability
    useEffect(() => {
        const checkFreeSpin = () => {
            const lastFree = localStorage.getItem('last_free_spin')
            if (!lastFree) {
                setFreeSpinAvailable(true)
                setFreeSpinTimer('')
                return
            }
            const elapsed = Date.now() - parseInt(lastFree)
            if (elapsed >= FREE_SPIN_COOLDOWN) {
                setFreeSpinAvailable(true)
                setFreeSpinTimer('')
            } else {
                setFreeSpinAvailable(false)
                const remaining = FREE_SPIN_COOLDOWN - elapsed
                const hours = Math.floor(remaining / (60 * 60 * 1000))
                const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
                setFreeSpinTimer(`${hours}h ${mins}m`)
            }
        }
        checkFreeSpin()
        const interval = setInterval(checkFreeSpin, 60000)
        return () => clearInterval(interval)
    }, [])

    // Load win streak from localStorage
    useEffect(() => {
        const streak = localStorage.getItem('void_machine_streak')
        if (streak) setWinStreak(parseInt(streak))
    }, [])

    const triggerConfetti = () => {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
    }

    const triggerShake = () => {
        setScreenShake(true)
        setTimeout(() => setScreenShake(false), 600)
    }

    const handleSpin = async (isFree: boolean = false) => {
        if (isSpinning) return

        if (!isFree && !MiniKit.isInstalled()) {
            toast.error('MiniKit not installed')
            return
        }

        const cost = variant === 'small' ? COST_SMALL : COST_BIG

        setIsSpinning(true)
        setLastWin(null)

        try {
            let transactionRef = ''

            if (isFree) {
                // Free spin - no payment needed
                transactionRef = `free_${Date.now()}_${Math.random().toString(36).slice(2)}`
                localStorage.setItem('last_free_spin', Date.now().toString())
                setFreeSpinAvailable(false)
            } else {
                // Paid spin
                const uuid = window.crypto.randomUUID()
                transactionRef = uuid
                const payload = {
                    reference: uuid,
                    to: '0xc7d0ef606a313bfd69e6cc1c44065df8d99b8dfc',
                    tokens: [
                        {
                            symbol: Tokens.WLD,
                            token_amount: tokenToDecimals(cost, Tokens.WLD).toString()
                        }
                    ],
                    network: Network.WorldChain,
                    description: `Void Machine (${variant.toUpperCase()})`
                }

                const result = await MiniKit.commandsAsync.pay(payload) as any

                if (result?.finalPayload?.status !== 'success') {
                    toast.error('Payment cancelled')
                    setIsSpinning(false)
                    return
                }
            }

            // Visual spin start
            const spinInterval = setInterval(() => {
                setReels(prev => prev.map(() => Math.floor(Math.random() * SYMBOLS.length)))
            }, 100)

            // Call API
            const response = await fetch('/api/minigames/roulette', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nullifier_hash: nullifierHash,
                    transaction_ref: transactionRef,
                    variant: isFree ? 'free' : variant
                })
            })

            const data = await response.json()

            clearInterval(spinInterval)

            if (response.ok) {
                // Set final reels
                if (data.symbols) {
                    setReels(data.symbols)
                } else {
                    const symbolIdx = data.rewardType === 'vip' ? (data.rewardValue + 2) : (data.rewardValue > 100000 ? 2 : 1)
                    setReels([symbolIdx, symbolIdx, symbolIdx])
                }

                await new Promise(resolve => setTimeout(resolve, 500))

                setLastWin({
                    type: data.rewardType,
                    value: data.rewardValue,
                    message: data.message
                })

                // Win streak logic
                if (data.rewardType === 'vip' || data.rewardValue > 100000) {
                    const newStreak = winStreak + 1
                    setWinStreak(newStreak)
                    localStorage.setItem('void_machine_streak', newStreak.toString())
                    triggerShake()
                    if (data.rewardType === 'vip') {
                        triggerConfetti()
                    }
                } else {
                    setWinStreak(0)
                    localStorage.setItem('void_machine_streak', '0')
                }

                if (data.rewardType === 'particles') {
                    addParticles(data.rewardValue)
                    toast.success(`+${data.rewardValue.toLocaleString()} Particles!`)
                } else if (data.rewardType === 'wld') {
                    triggerConfetti()
                    triggerShake()
                    toast.success(`🎉 You won ${data.rewardValue} WLD!`, { duration: 8000 })
                } else if (data.rewardType === 'vip') {
                    toast.success('👑 VIP UPGRADE!', { duration: 5000 })
                    useGameStore.getState().loadGameState(nullifierHash!)
                }
            } else {
                toast.error(`Spin Error: ${data.error}`)
            }

        } catch (error) {
            console.error('Spin error:', error)
            toast.error('Failed to spin')
        } finally {
            setIsSpinning(false)
        }
    }

    return (
        <motion.div
            ref={machineRef}
            animate={screenShake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center min-h-[70vh] py-4 bg-gradient-to-b from-[#1a1b4b] to-[#0f1035] relative overflow-hidden"
        >
            {/* Confetti Effect */}
            <AnimatePresence>
                {showConfetti && (
                    <div className="absolute inset-0 pointer-events-none z-50">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    x: Math.random() * 300 + 50,
                                    y: -20,
                                    rotate: 0,
                                    opacity: 1,
                                }}
                                animate={{
                                    y: 600,
                                    rotate: Math.random() * 720 - 360,
                                    opacity: 0,
                                }}
                                transition={{
                                    duration: 2 + Math.random() * 2,
                                    delay: Math.random() * 0.5,
                                    ease: 'easeIn',
                                }}
                                className="absolute w-3 h-3 rounded-sm"
                                style={{
                                    backgroundColor: ['#a855f7', '#f59e0b', '#06b6d4', '#ef4444', '#22c55e', '#ec4899'][i % 6],
                                }}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Fake Winners Ticker */}
            <div className="w-full bg-black/40 border-y border-white/5 py-2 mb-4 overflow-hidden relative">
                <motion.div
                    className="flex gap-8 whitespace-nowrap"
                    animate={{ x: [0, -1500] }}
                    transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                >
                    {[...FAKE_WINNERS, ...FAKE_WINNERS].map((win, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-blue-200">
                            <span>🎉</span>
                            <span className="font-mono">{win.addr}</span>
                            <span className="text-yellow-400 font-bold">won {win.prize}</span>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Win Streak Badge */}
            {winStreak > 0 && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mb-2 px-4 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full"
                >
                    <span className="text-xs font-bold text-yellow-400">
                        🔥 Win Streak: {winStreak}x
                    </span>
                </motion.div>
            )}

            {/* Free Spin Banner */}
            {freeSpinAvailable && !isSpinning && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 w-full max-w-sm"
                >
                    <button
                        onClick={() => handleSpin(true)}
                        className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                    >
                        <motion.span
                            animate={{ rotate: [0, 360] }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                            className="text-xl"
                        >
                            🎁
                        </motion.span>
                        FREE DAILY SPIN!
                    </button>
                </motion.div>
            )}
            {!freeSpinAvailable && freeSpinTimer && (
                <div className="mb-4 text-xs text-gray-500">
                    Next free spin in: <span className="text-green-400 font-bold">{freeSpinTimer}</span>
                </div>
            )}

            <h2 className="text-2xl font-bold text-white mb-4 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                Void Machine
            </h2>

            {/* Toggle */}
            <div className="flex bg-black/30 p-1 rounded-full border border-white/10 mb-6 relative">
                <motion.div
                    className="absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600"
                    initial={false}
                    animate={{
                        left: variant === 'small' ? '4px' : '50%',
                        width: 'calc(50% - 4px)'
                    }}
                />
                <button
                    onClick={() => setVariant('small')}
                    className={`px-8 py-2 rounded-full relative z-10 text-sm font-bold transition-colors ${variant === 'small' ? 'text-white' : 'text-gray-400'}`}
                >
                    SMALL
                </button>
                <button
                    onClick={() => setVariant('big')}
                    className={`px-8 py-2 rounded-full relative z-10 text-sm font-bold transition-colors ${variant === 'big' ? 'text-white' : 'text-gray-400'}`}
                >
                    BIG
                </button>
            </div>

            {/* Slot Machine Display */}
            <div className="relative p-4 rounded-t-[40px] rounded-b-[20px] bg-gradient-to-b from-blue-400 to-blue-600 shadow-[0_0_30px_rgba(59,130,246,0.3)] border-4 border-blue-300">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 px-6 py-1 rounded-full border-2 border-purple-300 shadow-lg z-20">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Provably Fair</span>
                </div>

                <div className="bg-[#0a0a20] p-4 rounded-[20px] shadow-inner border-2 border-black/20">
                    <div className="flex gap-2">
                        {reels.map((symbolIdx, i) => (
                            <div key={i} className="w-20 h-24 bg-gradient-to-b from-[#151530] to-[#202040] rounded-lg border border-white/10 flex items-center justify-center relative overflow-hidden shadow-inner">
                                <AnimatePresence mode="popLayout">
                                    <motion.div
                                        key={`${i}-${symbolIdx}-${isSpinning}`}
                                        initial={{ y: isSpinning ? -50 : 0, opacity: isSpinning ? 0.5 : 1, filter: isSpinning ? 'blur(4px)' : 'none' }}
                                        animate={{ y: 0, opacity: 1, filter: 'none' }}
                                        exit={{ y: 50, opacity: 0 }}
                                        className="text-4xl"
                                    >
                                        {SYMBOLS[symbolIdx].icon}
                                    </motion.div>
                                </AnimatePresence>
                                {/* Scanline effect */}
                                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Base */}
            <div className="w-[80%] h-4 bg-blue-800 rounded-b-xl opacity-50 mb-6" />

            {/* Last Win Display */}
            <AnimatePresence>
                {lastWin && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className={`mb-4 px-6 py-3 rounded-xl text-center font-bold ${lastWin.type === 'vip'
                            ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 text-yellow-400'
                            : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-400'
                            }`}
                    >
                        <p className="text-sm">{lastWin.message}</p>
                        {winStreak > 1 && (
                            <p className="text-xs text-yellow-400 mt-1">🔥 {winStreak}x streak!</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Spin Button */}
            <button
                onClick={() => handleSpin(false)}
                disabled={isSpinning}
                className={`
                    w-48 h-16 rounded-2xl font-bold text-xl shadow-[0_5px_0_rgb(162,28,175)] active:shadow-none active:translate-y-[5px]
                    ${isSpinning
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed shadow-none translate-y-[5px]'
                        : 'bg-gradient-to-b from-purple-500 to-purple-700 text-white hover:brightness-110'
                    }
                    transition-all flex flex-col items-center justify-center border-t border-white/20
                `}
            >
                <span>{isSpinning ? '...' : 'SPIN'}</span>
                <span className="text-xs font-normal opacity-80">
                    {variant === 'small' ? COST_SMALL : COST_BIG} WLD
                </span>
            </button>

            {/* Improved Prize Table */}
            <div className="mt-8 mx-4 p-4 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm w-full max-w-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 text-center">Prize Table ({variant.toUpperCase()})</h3>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between p-2 bg-cyan-500/10 rounded border border-cyan-500/10">
                        <span className="flex gap-1 text-sm">💎💎💎</span>
                        <span className="text-cyan-300 text-xs font-bold">Platinum VIP</span>
                        <span className="text-[10px] text-gray-500">{variant === 'big' ? '0.05%' : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-yellow-500/10 rounded border border-yellow-500/10">
                        <span className="flex gap-1 text-sm">🥇🥇🥇</span>
                        <span className="text-yellow-400 text-xs font-bold">Gold VIP</span>
                        <span className="text-[10px] text-gray-500">{variant === 'big' ? '0.2%' : '0.01%'}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-300/5 rounded border border-gray-300/10">
                        <span className="flex gap-1 text-sm">🥈🥈🥈</span>
                        <span className="text-gray-300 text-xs font-bold">Silver VIP</span>
                        <span className="text-[10px] text-gray-500">{variant === 'big' ? '0.5%' : '0.1%'}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-amber-500/5 rounded border border-amber-500/10">
                        <span className="flex gap-1 text-sm">🥉🥉🥉</span>
                        <span className="text-amber-600 text-xs font-bold">Bronze VIP</span>
                        <span className="text-[10px] text-gray-500">{variant === 'big' ? '1%' : '0.5%'}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-purple-500/5 rounded border border-purple-500/10">
                        <span className="flex gap-1 text-sm">🌟🌟🌟</span>
                        <span className="text-purple-400 text-xs font-bold">Mega Particles</span>
                        <span className="text-[10px] text-gray-500">{variant === 'big' ? '30%' : '10%'}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-blue-500/5 rounded border border-blue-500/10">
                        <span className="flex gap-1 text-sm">✨✨✨</span>
                        <span className="text-blue-400 text-xs font-bold">Particles</span>
                        <span className="text-[10px] text-gray-500">{variant === 'big' ? '69%' : '89%'}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
