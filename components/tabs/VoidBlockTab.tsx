'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion'
import toast from 'react-hot-toast'
import { MiniKit, Tokens, Network, tokenToDecimals } from '@worldcoin/minikit-js'
import { trackEvent } from '@/lib/analytics'

import { Zap, Trophy, Clock } from 'lucide-react'

const RECEIVER_ADDRESS = process.env.NEXT_PUBLIC_WALLET_ADDRESS || '0x68b4aa6fB4f00dD1A8F8d9AfD6401e4baF67C817'

// ─── Animated Number Component ───
function AnimatedNumber({ value, decimals = 2 }: { value: number; decimals?: number }) {
    const motionVal = useMotionValue(0)
    const spring = useSpring(motionVal, { stiffness: 80, damping: 20 })
    const display = useTransform(spring, (v: number) => v.toFixed(decimals))
    const [text, setText] = useState(value.toFixed(decimals))

    useEffect(() => {
        motionVal.set(value)
    }, [value, motionVal])

    useEffect(() => {
        const unsub = display.on('change', (v: string) => setText(v))
        return unsub
    }, [display])

    return <>{text}</>
}

// ─── Countdown Ring Timer ───
function CountdownRing({ timeLeft, totalDuration }: { timeLeft: number; totalDuration: number }) {
    const radius = 38
    const circumference = 2 * Math.PI * radius
    const progress = totalDuration > 0 ? timeLeft / totalDuration : 0
    const offset = circumference * (1 - progress)

    const urgencyPct = totalDuration > 0 ? timeLeft / totalDuration : 1
    const strokeColor = urgencyPct > 0.5 ? '#22c55e' : urgencyPct > 0.2 ? '#eab308' : '#ef4444'
    const glowColor = urgencyPct > 0.5 ? 'rgba(34,197,94,0.4)' : urgencyPct > 0.2 ? 'rgba(234,179,8,0.4)' : 'rgba(239,68,68,0.5)'
    const isUrgent = timeLeft <= 30

    const m = Math.floor(timeLeft / 60)
    const s = timeLeft % 60
    const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`

    return (
        <div className="relative inline-flex items-center justify-center w-[96px] h-[96px]">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 88 88">
                {/* Background ring */}
                <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                {/* Progress ring */}
                <motion.circle
                    cx="44" cy="44" r={radius}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        filter: `drop-shadow(0 0 6px ${glowColor})`,
                        transition: 'stroke 0.5s ease, stroke-dashoffset 0.3s ease'
                    }}
                />
            </svg>
            <motion.div
                className="flex flex-col items-center z-10"
                animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
                transition={isUrgent ? { duration: 0.8, repeat: Infinity } : {}}
            >
                <span className="text-lg font-black tracking-wider" style={{ color: strokeColor }}>
                    {timeStr}
                </span>
                <span className="text-[8px] uppercase tracking-widest text-white/40 font-bold">remaining</span>
            </motion.div>
        </div>
    )
}

// ─── Floating Particles ───
function FloatingParticles({ intensity = 1 }: { intensity?: number }) {
    const count = Math.min(12, Math.max(6, Math.round(6 * intensity)))
    const particles = useMemo(() =>
        Array.from({ length: count }, (_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            size: 1.5 + Math.random() * 2,
            delay: Math.random() * 4,
            duration: 3 + Math.random() * 3,
            opacity: 0.15 + Math.random() * 0.35,
        })),
    [count])

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map(p => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-purple-400"
                    style={{
                        left: p.left,
                        bottom: '-5%',
                        width: p.size,
                        height: p.size,
                    }}
                    animate={{
                        y: [0, -300],
                        opacity: [0, p.opacity, 0],
                        x: [0, (Math.random() - 0.5) * 40],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: 'easeOut',
                    }}
                />
            ))}
        </div>
    )
}

// ─── Confetti Burst ───
function ConfettiBurst({ active }: { active: boolean }) {
    const colors = ['#a855f7', '#f59e0b', '#3b82f6', '#ec4899', '#ffffff', '#22c55e']
    const particles = useMemo(() =>
        Array.from({ length: 40 }, (_, i) => ({
            id: i,
            color: colors[i % colors.length],
            angle: (i / 40) * 360 + Math.random() * 20,
            distance: 80 + Math.random() * 120,
            size: 3 + Math.random() * 5,
            duration: 0.8 + Math.random() * 0.6,
            rotation: Math.random() * 720,
        })),
    [])

    if (!active) return null

    return (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
            {/* Flash overlay */}
            <motion.div
                className="absolute inset-0 bg-purple-500/20"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
            />
            {particles.map(p => {
                const rad = (p.angle * Math.PI) / 180
                return (
                    <motion.div
                        key={p.id}
                        className="absolute rounded-sm"
                        style={{
                            backgroundColor: p.color,
                            width: p.size,
                            height: p.size * 0.6,
                        }}
                        initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
                        animate={{
                            x: Math.cos(rad) * p.distance,
                            y: Math.sin(rad) * p.distance + 60,
                            opacity: 0,
                            scale: 0.3,
                            rotate: p.rotation,
                        }}
                        transition={{ duration: p.duration, ease: 'easeOut' }}
                    />
                )
            })}
        </div>
    )
}

// ─── Win Chance Bar ───
function WinChanceBar({ chance, totalBet }: { chance: number; totalBet: number }) {
    return (
        <div className="bg-white/5 border border-purple-500/15 rounded-2xl p-3">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Your Stake</span>
                <span className="text-xs font-bold text-white">{totalBet.toFixed(2)} WLD</span>
            </div>
            <div className="relative h-5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                        background: 'linear-gradient(90deg, #7c3aed, #a855f7, #f59e0b)',
                    }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.min(chance, 100)}%` }}
                    transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {chance.toFixed(1)}% WIN CHANCE 🍀
                    </span>
                </div>
            </div>
        </div>
    )
}

// ─── Bet Item ───
function BetItem({ bet, isNew, cropAddress }: { bet: Bet; isNew: boolean; cropAddress: (a: string) => string }) {
    const initial = bet.username?.[0]?.toUpperCase() || '?'

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            className={`flex items-center gap-3 bg-[#0a0415] rounded-xl p-2.5 text-xs transition-all duration-500 ${
                isNew ? 'border border-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.15)]' : 'border border-white/5'
            }`}
        >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600/40 to-indigo-600/40 flex items-center justify-center text-[10px] font-black text-purple-300 border border-purple-500/20 flex-shrink-0">
                {initial}
            </div>
            <div className="flex-1 min-w-0">
                <span className="font-bold text-gray-300 truncate block">{bet.username}</span>
                <span className="text-[10px] text-white/30 font-mono">{cropAddress(bet.wallet_address)}</span>
            </div>
            <div className="text-right flex-shrink-0">
                <span className="font-bold block text-white">{bet.bet_amount.toFixed(2)} WLD</span>
                <span className="text-[10px] text-purple-400 font-medium">{bet.chance.toFixed(1)}%</span>
            </div>
        </motion.div>
    )
}

// ─── Relative Time Helper ───
function timeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

// ─── Types ───
interface Bet {
    id: number
    username: string
    wallet_address: string
    bet_amount: number
    chance: number
    nullifier_hash: string
}

interface Round {
    id: number
    status: string
    total_pool: number
    fee_amount: number
    net_pool: number
    end_time: number
    start_time: number
    winner_nullifier?: string
}

interface HistoryItem {
    id: number
    winner_wallet: string
    winner_username: string
    total_pool: number
    net_pool: number
    resolved_at: number
}

// ─────────────────────────────────
// ─── MAIN COMPONENT ─────────────
// ─────────────────────────────────
export default function VoidBlockTab() {
    const { nullifierHash } = useGameStore()

    // UI state
    const [round, setRound] = useState<Round | null>(null)
    const [bets, setBets] = useState<Bet[]>([])
    const [userStats, setUserStats] = useState({ total_bet: 0, chance: 0 })
    const [history, setHistory] = useState<HistoryItem[]>([])
    const [betAmount, setBetAmount] = useState<number>(0.1)
    const [isBetting, setIsBetting] = useState(false)
    const [timeLeft, setTimeLeft] = useState<number>(0)
    const [showConfetti, setShowConfetti] = useState(false)
    const [latestBetId, setLatestBetId] = useState<number | null>(null)

    const prevRoundIdRef = useRef<number | null>(null)
    const prevBetCountRef = useRef<number>(0)

    // Compute round total duration for ring timer
    const totalDuration = useMemo(() => {
        if (!round) return 0
        return Math.max(1, Math.floor((round.end_time - round.start_time) / 1000))
    }, [round])

    // Pool intensity for particles (1 = baseline, grows with pool)
    const poolIntensity = useMemo(() => {
        if (!round) return 1
        return Math.min(3, 1 + round.total_pool * 0.5)
    }, [round])

    // Load state
    const loadState = useCallback(async () => {
        try {
            const res = await fetch(`/api/void-block/state?nullifier_hash=${nullifierHash || ''}`)
            if (!res.ok) throw new Error('Failed to fetch state')
            const data = await res.json()

            setRound(data.round)
            setBets(data.bets)
            setUserStats(data.user)
            setHistory(data.history)

            // Track new bets for highlight
            if (data.bets.length > prevBetCountRef.current && prevBetCountRef.current > 0) {
                const newest = data.bets[data.bets.length - 1]
                if (newest) {
                    setLatestBetId(newest.id)
                    setTimeout(() => setLatestBetId(null), 2500)
                }
            }
            prevBetCountRef.current = data.bets.length

            // Round change → winner notification
            if (prevRoundIdRef.current !== null && prevRoundIdRef.current !== data.round.id) {
                const lastWinner = data.history[0]
                if (lastWinner) {
                    const isUserWinner = nullifierHash && data.round.winner_nullifier === nullifierHash
                    if (isUserWinner) {
                        setShowConfetti(true)
                        setTimeout(() => setShowConfetti(false), 2000)
                        toast.success(`🎉 GRATULACJE! Wygrałeś ${lastWinner.net_pool.toFixed(2)} WLD!`, { duration: 10000 })
                    } else {
                        toast(`Runda ${prevRoundIdRef.current} zakończona! Zwycięzca: ${lastWinner.winner_username} (${lastWinner.net_pool.toFixed(2)} WLD)`, {
                            icon: '🏆',
                            duration: 6000
                        })
                    }
                }
            }
            prevRoundIdRef.current = data.round.id
        } catch (e) {
            console.error(e)
        }
    }, [nullifierHash])

    // Polling interval
    useEffect(() => {
        loadState()
        const interval = setInterval(loadState, 3000)
        return () => clearInterval(interval)
    }, [loadState])

    // Client-side ticking timer
    useEffect(() => {
        if (!round) return

        const updateTimer = () => {
            const diff = round.end_time - Date.now()
            setTimeLeft(Math.max(0, Math.floor(diff / 1000)))
        }

        updateTimer()
        const timer = setInterval(updateTimer, 1000)
        return () => clearInterval(timer)
    }, [round])

    // Crop address
    const cropAddress = (addr: string) => {
        if (!addr) return '0x000...0000'
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
    }

    const handlePlaceBet = async () => {
        if (!nullifierHash) {
            toast.error('Zaloguj się najpierw przez World ID!')
            return
        }
        if (betAmount <= 0) {
            toast.error('Kwota musi być większa od zera!')
            return
        }
        if (!MiniKit.isInstalled()) {
            toast.error('Płatności WLD są dostępne wyłącznie w aplikacji World App.')
            return
        }

        setIsBetting(true)
        try {
            const uuid = window.crypto.randomUUID()
            const payload = {
                reference: uuid,
                to: RECEIVER_ADDRESS,
                tokens: [
                    {
                        symbol: Tokens.WLD,
                        token_amount: tokenToDecimals(betAmount, Tokens.WLD).toString()
                    }
                ],
                network: Network.WorldChain,
                description: `Void Block Bet - Round #${round?.id}`
            }

            const result = await MiniKit.commandsAsync.pay(payload) as any

            if (result?.finalPayload?.status === 'success') {
                const walletAddress = nullifierHash || '0x0000000000000000000000000000000000000000'
                const response = await fetch('/api/void-block/bet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nullifier_hash: nullifierHash,
                        // @ts-ignore
                        username: MiniKit.username || cropAddress(walletAddress),
                        wallet_address: walletAddress,
                        bet_amount: betAmount,
                        transaction_ref: uuid,
                        round_id: round?.id
                    })
                })

                if (response.ok) {
                    toast.success('Zakład przyjęty! Powodzenia! 🌌')
                    trackEvent('place_void_block_bet', 'gameplay', round?.id.toString(), betAmount)
                    loadState()
                } else {
                    const errData = await response.json()
                    toast.error(errData.error || 'Błąd rejestracji zakładu.')
                }
            } else {
                toast.error('Płatność anulowana.')
            }
        } catch (error) {
            console.error('Bet error:', error)
            toast.error('Coś poszło nie tak podczas wnoszenia zakładu.')
        } finally {
            setIsBetting(false)
        }
    }

    return (
        <div className="flex flex-col gap-5 max-w-md mx-auto py-4 px-2 relative">
            {/* Confetti */}
            <ConfettiBurst active={showConfetti} />

            {/* Header */}
            <div className="text-center">
                <motion.h2
                    className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400 bg-clip-text text-transparent tracking-tight"
                    animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                    style={{ backgroundSize: '200% 200%' }}
                >
                    VOID BLOCK
                </motion.h2>
                <p className="text-[10px] text-white/40 mt-1 uppercase tracking-[0.2em] font-bold">
                    Multiplayer WLD Jackpot
                </p>
            </div>

            {/* ─── Main Jackpot Card ─── */}
            <div className="relative rounded-3xl overflow-hidden border border-purple-500/25 bg-[#0c051a]/95 shadow-[0_0_60px_rgba(107,47,181,0.12)] p-6">

                {/* Floating Particles */}
                <FloatingParticles intensity={poolIntensity} />

                {/* Background glows */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/15 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-600/15 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative flex flex-col gap-5 text-center z-10">

                    {/* Round ID + Ring Timer */}
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                            Round #{round?.id || '...'}
                        </span>
                        <CountdownRing timeLeft={timeLeft} totalDuration={totalDuration} />
                    </div>

                    {/* Jackpot Amount */}
                    <div className="my-1">
                        <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] block mb-2 font-bold">
                            Current Jackpot
                        </span>
                        <div className="flex items-baseline justify-center gap-2">
                            <motion.span
                                className="text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent"
                                animate={round && round.total_pool > 1 ? { scale: [1, 1.02, 1] } : {}}
                                transition={round && round.total_pool > 1 ? { duration: 2, repeat: Infinity } : {}}
                            >
                                <AnimatedNumber value={round?.total_pool ?? 0} />
                            </motion.span>
                            <span className="text-lg font-bold text-indigo-400">WLD</span>
                        </div>

                        {/* Pool breakdown */}
                        <div className="flex justify-center gap-4 mt-4 text-[10px]">
                            <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2">
                                <span className="text-white/40 block font-medium">Winner (87%)</span>
                                <span className="font-bold text-emerald-400 text-xs">
                                    <AnimatedNumber value={round?.net_pool ?? 0} decimals={3} /> WLD
                                </span>
                            </div>
                            <div className="bg-white/5 border border-white/5 rounded-xl px-3 py-2">
                                <span className="text-white/40 block font-medium">Fee (13%)</span>
                                <span className="font-bold text-purple-400 text-xs">
                                    <AnimatedNumber value={round?.fee_amount ?? 0} decimals={3} /> WLD
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Win Chance Bar */}
                    {nullifierHash && (
                        <WinChanceBar chance={userStats.chance} totalBet={userStats.total_bet} />
                    )}

                    {/* ─── Bet Interface ─── */}
                    <div className="flex flex-col gap-3 mt-1">
                        {/* Casino Chip Quick Amount Buttons */}
                        <div className="flex gap-2">
                            {[0.1, 0.5, 1.0, 5.0].map(val => (
                                <motion.button
                                    key={val}
                                    onClick={() => setBetAmount(val)}
                                    whileTap={{ scale: 0.9 }}
                                    className={`flex-1 py-2.5 rounded-full text-[11px] font-black transition-all duration-200 ${
                                        betAmount === val
                                            ? 'bg-gradient-to-b from-purple-500 to-purple-700 text-white shadow-[0_0_16px_rgba(139,92,246,0.4)] border-2 border-purple-400/50 scale-105'
                                            : 'bg-white/5 border-2 border-white/10 hover:border-white/25 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {val} WLD
                                </motion.button>
                            ))}
                        </div>

                        {/* Custom bet input */}
                        <div className="relative">
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={betAmount}
                                onChange={(e) => setBetAmount(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                                className="w-full bg-black/50 border border-white/10 hover:border-purple-500/30 focus:border-purple-500/60 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none transition-all focus:shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                                placeholder="Bet Amount (WLD)"
                            />
                            <span className="absolute right-4 top-3.5 text-xs text-white/30 font-bold">WLD</span>
                        </div>

                        {/* Bet Button */}
                        <motion.button
                            onClick={handlePlaceBet}
                            disabled={isBetting || timeLeft <= 0}
                            whileHover={!isBetting && timeLeft > 0 ? { scale: 1.02 } : {}}
                            whileTap={!isBetting && timeLeft > 0 ? { scale: 0.98 } : {}}
                            className={`relative w-full py-4 rounded-2xl font-extrabold text-white text-sm overflow-hidden transition-all duration-300 ${
                                isBetting
                                    ? 'bg-purple-900/60 border border-purple-500/20'
                                    : timeLeft <= 0
                                        ? 'bg-gray-800/60 border border-white/10'
                                        : 'bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 border border-purple-400/30 shadow-[0_0_30px_rgba(139,92,246,0.25)] hover:shadow-[0_0_40px_rgba(139,92,246,0.4)]'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {/* Shimmer effect on active button */}
                            {!isBetting && timeLeft > 0 && (
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                                    style={{ width: '50%' }}
                                />
                            )}
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isBetting ? (
                                    <>
                                        <motion.div
                                            className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                        />
                                        PROCESSING...
                                    </>
                                ) : timeLeft <= 0 ? (
                                    <>
                                        <motion.span
                                            animate={{ opacity: [0.4, 1, 0.4] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        >
                                            ROUND RESOLVING...
                                        </motion.span>
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4" />
                                        BET {betAmount.toFixed(2)} WLD
                                    </>
                                )}
                            </span>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* ─── Active Bets ─── */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">
                        Active Bets
                    </h3>
                    <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                        {bets.length} players
                    </span>
                </div>

                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 max-h-52 overflow-y-auto no-scrollbar space-y-2">
                    <AnimatePresence mode="popLayout">
                        {bets.length === 0 ? (
                            <motion.p
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-[11px] text-white/30 text-center py-8 font-medium"
                            >
                                No bets placed yet. Be the first! ✨
                            </motion.p>
                        ) : (
                            bets.map((b) => (
                                <BetItem
                                    key={b.id}
                                    bet={b}
                                    isNew={b.id === latestBetId}
                                    cropAddress={cropAddress}
                                />
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ─── History ─── */}
            <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    Last Winners
                </h3>

                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 space-y-2">
                    {history.length === 0 ? (
                        <p className="text-[11px] text-white/30 text-center py-6 font-medium">
                            No rounds resolved yet. Stay tuned! 🏆
                        </p>
                    ) : (
                        history.map((h, idx) => (
                            <motion.div
                                key={h.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`flex items-center justify-between rounded-xl p-2.5 text-xs ${
                                    idx === 0
                                        ? 'bg-amber-500/5 border border-amber-500/15'
                                        : 'bg-white/[0.02] border border-white/5'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    {idx === 0 && (
                                        <motion.div
                                            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <Trophy className="w-4 h-4 text-amber-400" />
                                        </motion.div>
                                    )}
                                    <div>
                                        <span className="text-white/30 mr-1.5 font-mono text-[10px]">#{h.id}</span>
                                        <span className="font-bold text-gray-300">{h.winner_username}</span>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col">
                                    <span className={`font-bold ${idx === 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                        +{h.net_pool.toFixed(2)} WLD
                                    </span>
                                    <span className="text-[9px] text-white/25 flex items-center gap-0.5 justify-end">
                                        <Clock className="w-2.5 h-2.5" />
                                        {timeAgo(h.resolved_at)}
                                    </span>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
