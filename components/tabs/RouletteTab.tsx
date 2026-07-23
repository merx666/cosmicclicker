'use client'

import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { MiniKit, Tokens, Network, tokenToDecimals } from '@worldcoin/minikit-js'
import { trackEvent } from '@/lib/analytics'
import { useTranslations } from 'next-intl'
import { Trash2, Sparkles, Star, Award, Gem, Gift, Flame } from 'lucide-react'

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
    const t = useTranslations('Roulette')
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
        { id: 0, icon: Trash2, color: 'text-white/40', nameKey: 'trash' },
        { id: 1, icon: Sparkles, color: 'text-blue-400', nameKey: 'particles' },
        { id: 2, icon: Star, color: 'text-purple-400', nameKey: 'megaParticles' },
        { id: 3, icon: Award, color: 'text-amber-700', nameKey: 'bronze' },
        { id: 4, icon: Award, color: 'text-gray-300', nameKey: 'silver' },
        { id: 5, icon: Award, color: 'text-yellow-400', nameKey: 'gold' },
        { id: 6, icon: Gem, color: 'text-cyan-400', nameKey: 'platinum' },
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
                trackEvent('spin_roulette', 'gameplay', isFree ? 'free' : variant)
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

            // Increment achievement
            useGameStore.getState().checkAchievements('spins', 1)

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
            className="flex flex-col items-center min-h-[70vh] py-4 bg-black relative overflow-hidden"
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
                                className="absolute w-2 h-2 rounded-sm"
                                style={{
                                    backgroundColor: ['#a855f7', '#f59e0b', '#06b6d4', '#ef4444', '#22c55e', '#ec4899'][i % 6],
                                }}
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Fake Winners Ticker */}
            <div className="w-full bg-white/5 border-y border-white/5 py-3 mb-6 overflow-hidden relative">
                <motion.div
                    className="flex gap-8 whitespace-nowrap"
                    animate={{ x: [0, -1500] }}
                    transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                >
                    {[...FAKE_WINNERS, ...FAKE_WINNERS].map((win, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-white/70">
                            <Gift className="w-3 h-3 text-white/40" />
                            <span className="font-mono">{win.addr}</span>
                            <span className="text-white font-bold">won {win.prize}</span>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Win Streak Badge */}
            {winStreak > 0 && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mb-4 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full flex items-center gap-2"
                >
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-bold text-white">
                        {t('winStreak')}: {winStreak}x
                    </span>
                </motion.div>
            )}

            {/* Free Spin Banner */}
            {freeSpinAvailable && !isSpinning && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 w-full max-w-sm px-4"
                >
                    <button
                        onClick={() => handleSpin(true)}
                        className="w-full py-4 rounded-2xl font-bold text-black bg-white hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                        >
                            <Gift className="w-5 h-5 text-black" />
                        </motion.div>
                        {t('freeSpin')}
                    </button>
                </motion.div>
            )}
            {!freeSpinAvailable && freeSpinTimer && (
                <div className="mb-6 text-xs text-white/40 bg-white/5 px-4 py-2 rounded-lg">
                    {t('nextFreeSpin')} <span className="text-white font-bold">{freeSpinTimer}</span>
                </div>
            )}

            <h2 className="text-2xl font-black text-white mb-6 tracking-tight">
                {t('title')}
            </h2>

            {/* Toggle */}
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 mb-8 relative">
                <motion.div
                    className="absolute top-1 bottom-1 rounded-xl bg-white/10"
                    initial={false}
                    animate={{
                        left: variant === 'small' ? '4px' : '50%',
                        width: 'calc(50% - 4px)'
                    }}
                />
                <button
                    onClick={() => setVariant('small')}
                    className={`px-8 py-2.5 rounded-xl relative z-10 text-sm font-bold transition-colors ${variant === 'small' ? 'text-white' : 'text-white/40'}`}
                >
                    {t('small')}
                </button>
                <button
                    onClick={() => setVariant('big')}
                    className={`px-8 py-2.5 rounded-xl relative z-10 text-sm font-bold transition-colors ${variant === 'big' ? 'text-white' : 'text-white/40'}`}
                >
                    {t('big')}
                </button>
            </div>

            {/* Slot Machine Display */}
            <div className="relative p-6 rounded-3xl bg-white/5 border border-white/10 mx-4 w-[calc(100%-2rem)] max-w-sm">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black px-4 py-1 rounded-full border border-white/10 z-20">
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{t('provablyFair')}</span>
                </div>

                <div className="bg-black/50 p-4 rounded-2xl border border-white/5 mt-2">
                    <div className="flex gap-3 justify-center">
                        {reels.map((symbolIdx, i) => {
                            const SymbolIcon = SYMBOLS[symbolIdx].icon;
                            return (
                                <div key={i} className="w-20 h-24 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center relative overflow-hidden">
                                    <AnimatePresence mode="popLayout">
                                        <motion.div
                                            key={`${i}-${symbolIdx}-${isSpinning}`}
                                            initial={{ y: isSpinning ? -50 : 0, opacity: isSpinning ? 0.5 : 1, filter: isSpinning ? 'blur(4px)' : 'none' }}
                                            animate={{ y: 0, opacity: 1, filter: 'none' }}
                                            exit={{ y: 50, opacity: 0 }}
                                            className={`${SYMBOLS[symbolIdx].color}`}
                                        >
                                            <SymbolIcon className="w-10 h-10" />
                                        </motion.div>
                                    </AnimatePresence>
                                    {/* Scanline effect */}
                                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Last Win Display */}
            <AnimatePresence>
                {lastWin && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className={`mt-6 mb-2 px-6 py-3 rounded-2xl text-center font-bold ${lastWin.type === 'vip'
                            ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                            : 'bg-white/5 border border-white/10 text-white'
                            }`}
                    >
                        <p className="text-sm">{lastWin.message}</p>
                        {winStreak > 1 && (
                            <p className="text-xs text-orange-400 mt-1 flex items-center justify-center gap-1">
                                <Flame className="w-3 h-3" /> {winStreak}x streak!
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Spin Button */}
            <motion.button
                onClick={() => handleSpin(false)}
                disabled={isSpinning}
                whileTap={!isSpinning ? { scale: 0.95 } : {}}
                className={`
                    w-48 h-16 rounded-2xl font-black text-lg mt-8
                    ${isSpinning
                        ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
                        : 'bg-white text-black hover:bg-gray-200'
                    }
                    transition-all flex flex-col items-center justify-center
                `}
            >
                <span>{isSpinning ? '...' : t('spin')}</span>
                <span className="text-xs font-medium opacity-60">
                    {variant === 'small' ? COST_SMALL : COST_BIG} WLD
                </span>
            </motion.button>

            {/* Improved Prize Table */}
            <div className="mt-12 mx-4 p-5 bg-white/5 rounded-2xl border border-white/5 w-[calc(100%-2rem)] max-w-sm mb-12">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4 text-center">{t('prizeTable')} ({t(variant)})</h3>
                <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="flex gap-2 text-cyan-400"><Gem className="w-4 h-4"/><Gem className="w-4 h-4"/><Gem className="w-4 h-4"/></span>
                        <span className="text-white text-xs font-bold">{t('platinum')}</span>
                        <span className="text-xs text-white/40">{variant === 'big' ? '0.05%' : '—'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="flex gap-2 text-yellow-400"><Award className="w-4 h-4"/><Award className="w-4 h-4"/><Award className="w-4 h-4"/></span>
                        <span className="text-white text-xs font-bold">{t('gold')}</span>
                        <span className="text-xs text-white/40">{variant === 'big' ? '0.2%' : '0.01%'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="flex gap-2 text-gray-300"><Award className="w-4 h-4"/><Award className="w-4 h-4"/><Award className="w-4 h-4"/></span>
                        <span className="text-white text-xs font-bold">{t('silver')}</span>
                        <span className="text-xs text-white/40">{variant === 'big' ? '0.5%' : '0.1%'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="flex gap-2 text-amber-600"><Award className="w-4 h-4"/><Award className="w-4 h-4"/><Award className="w-4 h-4"/></span>
                        <span className="text-white text-xs font-bold">{t('bronze')}</span>
                        <span className="text-xs text-white/40">{variant === 'big' ? '1%' : '0.5%'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="flex gap-2 text-purple-400"><Star className="w-4 h-4"/><Star className="w-4 h-4"/><Star className="w-4 h-4"/></span>
                        <span className="text-white text-xs font-bold">{t('megaParticles')}</span>
                        <span className="text-xs text-white/40">{variant === 'big' ? '30%' : '10%'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="flex gap-2 text-blue-400"><Sparkles className="w-4 h-4"/><Sparkles className="w-4 h-4"/><Sparkles className="w-4 h-4"/></span>
                        <span className="text-white text-xs font-bold">{t('particles')}</span>
                        <span className="text-xs text-white/40">{variant === 'big' ? '69%' : '89%'}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
