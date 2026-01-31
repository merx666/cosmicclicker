'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface WithdrawalRequest {
    id: string
    wld_amount: number
    status: string
    created_at: string
}

export default function ConvertTab() {
    const particles = useGameStore((state) => state.particles)
    const nullifierHash = useGameStore((state) => state.nullifierHash)
    const lastClaimTime = useGameStore((state) => state.lastClaimTime)
    const [isConverting, setIsConverting] = useState(false)
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
    const maintenance = false // Maintenance disabled, system live
    const [dailyStats, setDailyStats] = useState({
        totalClaimed: 0,
        remaining: 100,
        limitReached: false,
        conversions: 0,
        maxDaily: 100
    })
    const [conversionRate, setConversionRate] = useState({
        particles_per_wld: 150000,
        wld_price_usd: 0.465,
        last_update: new Date().toISOString()
    })
    const isWLDDisabled = maintenance || dailyStats.limitReached

    const PARTICLES_PER_WLD = conversionRate.particles_per_wld
    const WLD_AMOUNT = 0.01
    const COOLDOWN = 24 * 60 * 60 * 1000 // 24 hours

    const canConvert = particles >= PARTICLES_PER_WLD
    const claimableWLD = Math.floor(particles / PARTICLES_PER_WLD) * WLD_AMOUNT

    const getCooldownStatus = () => {
        if (!lastClaimTime) return { ready: true, timeLeft: '' }

        const now = Date.now()
        const timeSinceClaim = now - lastClaimTime

        if (timeSinceClaim >= COOLDOWN) {
            return { ready: true, timeLeft: '' }
        }

        const timeLeft = COOLDOWN - timeSinceClaim
        const hours = Math.floor(timeLeft / (60 * 60 * 1000))
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000))

        return { ready: false, timeLeft: `${hours}h ${minutes}m` }
    }

    const cooldown = getCooldownStatus()

    const fetchDailyStats = async () => {
        try {
            const res = await fetch('/api/daily-stats')
            const data = await res.json()
            setDailyStats(data)
        } catch (error) {
            console.error('Failed to fetch daily stats:', error)
        }
    }

    const fetchWithdrawals = useCallback(async () => {
        if (!nullifierHash) return
        try {
            const res = await fetch(`/api/user/withdrawals?nullifier=${nullifierHash}`)
            const data = await res.json()
            if (data.withdrawals) {
                setWithdrawals(data.withdrawals)
            }
        } catch (error) {
            console.error('Failed to fetch withdrawals:', error)
        }
    }, [nullifierHash])

    const fetchConversionRate = async () => {
        try {
            const res = await fetch('/api/conversion-rate')
            const data = await res.json()
            setConversionRate(data)
            console.log('[ConvertTab] Conversion rate updated:', data)
        } catch (error) {
            console.error('Failed to fetch conversion rate:', error)
        }
    }

    // Fetch daily stats, withdrawals, and conversion rate on mount
    useEffect(() => {
        fetchDailyStats()
        fetchWithdrawals()
        fetchConversionRate()

        const statsInterval = setInterval(fetchDailyStats, 30000)
        const rateInterval = setInterval(fetchConversionRate, 5 * 60 * 1000) // Every 5 minutes

        return () => {
            clearInterval(statsInterval)
            clearInterval(rateInterval)
        }
    }, [fetchWithdrawals])

    const handleConvert = async () => {
        if (!canConvert) {
            toast.error(`You need minimum ${PARTICLES_PER_WLD.toLocaleString()} particles!`)
            return
        }

        if (!cooldown.ready) {
            toast.error(`Cooldown active! Next claim in ${cooldown.timeLeft}`)
            return
        }

        if (dailyStats.limitReached) {
            toast.error('Daily global limit reached! Try again tomorrow.')
            return
        }

        setIsConverting(true)

        try {
            const res = await fetch('/api/convert-wld', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nullifier_hash: nullifierHash,
                    wld_amount: WLD_AMOUNT
                })
            })

            const data = await res.json()

            if (res.status === 429) {
                // Daily limit reached
                toast.error(data.message || 'Daily limit reached!')
                fetchDailyStats()
            } else if (res.ok) {
                // Update local store immediately to reflect change
                useGameStore.setState(state => ({
                    particles: state.particles - PARTICLES_PER_WLD,
                    lastClaimTime: Date.now()
                }))

                toast.success('Withdrawal request queued! Admin will process it shortly.')
                fetchDailyStats()
                fetchWithdrawals()
            } else {
                toast.error(data.error || 'Conversion failed')
            }
        } catch (error) {
            console.error('[Convert] Error:', error)
            toast.error('Connection error. Try again later!')
        } finally {
            setIsConverting(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-warning'
            case 'approved': return 'text-blue-400'
            case 'paid': return 'text-success'
            case 'rejected': return 'text-error'
            default: return 'text-gray-400'
        }
    }

    return (
        <div className="py-8">
            <div className="text-center mb-8 flex flex-col items-center">
                <div className="relative w-16 h-16 mb-4">
                    <Image src="/assets/nav/convert.png" alt="Convert" fill className="object-contain" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Convert to WLD</h2>
                <p className="text-text-secondary">Convert particles to real WLD tokens</p>
            </div>

            {/* Notification Alert */}
            <div className="mb-6 mx-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <h3 className="font-bold text-amber-400 mb-2">📢 Message from the Developer</h3>
                <p className="text-sm text-amber-200/80 leading-relaxed">
                    I sincerely apologize to all users for the issues that occurred during the app launch.
                    This app is managed by just one person, which is why fixes took so long.
                    This is my first application - I'm only human and I make mistakes too.
                </p>
                <p className="text-sm text-amber-200/80 leading-relaxed mt-2">
                    Thank you to everyone who reported bugs directly via email.
                    However, I will not thank those who shamelessly tried to exploit the app's security -
                    stealing YOUR payouts and laughing about it. These individuals have been reported to
                    the appropriate authorities and WorldApp support.
                </p>
                <p className="text-sm text-amber-200/80 leading-relaxed mt-2">
                    If the stolen funds are returned to the hot wallet address below,
                    daily payouts will be increased and I will withdraw all claims against those individuals:
                </p>
                <p className="text-xs text-amber-300 font-mono mt-2 break-all bg-amber-900/30 p-2 rounded">
                    0x68b4aa6fB4f00dD1A8F8d9AfD6401e4baF67C817
                </p>
                <p className="text-sm text-amber-200/80 mt-3 font-semibold">
                    May the Void be with you. 🌌
                </p>
            </div>

            {/* Security Alert */}
            <div className="mb-6 mx-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <h3 className="font-bold text-red-400 mb-2">🛡️ Anti-Abuse System Active</h3>
                <p className="text-sm text-red-200/80 leading-relaxed">
                    An automatic anti-abuse monitoring system has been deployed. The payout queue contained
                    fraudulent withdrawal requests totaling over <strong>15 WLD</strong> from exploiters.
                </p>
                <p className="text-sm text-red-200/80 leading-relaxed mt-2">
                    <strong>⚠️ Warning:</strong> Any abuse attempts will be <strong>instantly banned</strong> and
                    automatically reported to <strong>WorldApp Support</strong>. Your World ID will be flagged
                    across the entire World ecosystem.
                </p>
                <p className="text-xs text-red-300/60 mt-2">
                    Play fair. The Void sees everything. 👁️
                </p>
            </div>
            <motion.div
                className="bg-gradient-to-br from-void-purple/20 to-void-blue/20 border-2 border-particle-glow/30 rounded-2xl p-8"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                {/* Your particles */}
                <div className="mb-6">
                    <div className="text-sm text-text-secondary mb-2">Your Particles:</div>
                    <div className="text-4xl font-bold text-particle-glow">
                        {particles.toLocaleString()}
                    </div>
                </div>

                {/* Exchange rate */}
                <div className="mb-6 p-4 bg-void-dark/50 rounded-xl border border-particle-glow/20">
                    <div className="text-sm text-text-secondary mb-2">Exchange rate:</div>
                    <div className="text-xl font-bold mb-2">
                        {PARTICLES_PER_WLD.toLocaleString()} particles = {WLD_AMOUNT} WLD
                    </div>
                    <div className="text-xs text-particle-glow/60 leading-relaxed">
                        💡 Rate adjusts automatically based on current WLD price (${conversionRate.wld_price_usd.toFixed(3)}).
                        Updates 3x daily to ensure fair conversion.
                    </div>
                </div>

                {/* Daily Global Limit Progress */}
                <div className="mb-6 p-4 bg-void-dark/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-secondary">Global Daily Pool:</span>
                        <span className={`font-bold text-sm ${dailyStats.limitReached ? 'text-error' : 'text-success'}`}>
                            {dailyStats.remaining.toFixed(2)} / {dailyStats.maxDaily} WLD
                        </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                        <motion.div
                            className={`h-3 rounded-full ${dailyStats.limitReached
                                ? 'bg-error'
                                : dailyStats.totalClaimed / dailyStats.maxDaily > 0.8
                                    ? 'bg-warning'
                                    : 'bg-success'
                                }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${(dailyStats.totalClaimed / dailyStats.maxDaily) * 100}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                    <p className="text-xs text-text-secondary mt-2 text-center">
                        {dailyStats.conversions} claims today
                        {dailyStats.limitReached && ' • Limit reached!'}
                    </p>
                </div>

                {/* Claimable amount */}
                <div className="mb-6">
                    <div className="text-sm text-text-secondary mb-2">You can claim:</div>
                    <div className="text-5xl font-bold bg-gradient-to-r from-warning to-success bg-clip-text text-transparent">
                        {claimableWLD} WLD
                    </div>
                </div>

                {/* Cooldown status */}
                <div className="mb-6 p-4 bg-void-dark/50 rounded-xl">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">Cooldown:</span>
                        <span className={`font-bold ${cooldown.ready ? 'text-success' : 'text-warning'}`}>
                            {cooldown.ready ? (
                                <span className="flex items-center gap-2 text-success">
                                    <Image src="/assets/ui/checkbox_checked.png" alt="Ready" width={16} height={16} />
                                    Ready!
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 text-warning">
                                    <Image src="/assets/ui/clock.png" alt="Wait" width={16} height={16} />
                                    {cooldown.timeLeft}
                                </span>
                            )}
                        </span>
                    </div>
                </div>

                {/* Convert button */}
                <button
                    onClick={handleConvert}
                    disabled={isWLDDisabled || isConverting || !canConvert || !cooldown.ready}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2
                        ${isWLDDisabled || isConverting || !canConvert || !cooldown.ready
                            ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-void-purple to-void-blue text-white shadow-lg shadow-void-purple/20 hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                >
                    {isConverting ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Processing...
                        </>
                    ) : (
                        <>
                            <div className="w-5 h-5 relative">
                                <Image src="/assets/icons/wld.png" alt="WLD" fill className="object-contain" />
                            </div>
                            Convert to 0.01 WLD
                        </>
                    )}
                </button>

                {/* Info */}
                <div className="mt-6 text-xs text-text-secondary text-center space-y-1">
                    <p>• Minimum threshold: {PARTICLES_PER_WLD.toLocaleString()} particles</p>
                    <p>• Maximum daily claim: 0.01 WLD</p>
                    <p>• Cooldown: 24 hours between claims</p>
                </div>
            </motion.div>

            {/* My Withdrawals */}
            {
                withdrawals.length > 0 && (
                    <div className="mt-8 bg-void-dark/30 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xl font-bold mb-4">My Withdrawals</h3>
                        <div className="space-y-3">
                            {withdrawals.map((w) => (
                                <div key={w.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                                    <div>
                                        <div className="font-bold">{w.wld_amount} WLD</div>
                                        <div className="text-xs text-text-secondary">{new Date(w.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <div className={`font-bold uppercase text-sm ${getStatusColor(w.status)}`}>
                                        {w.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }
        </div >
    )
}
