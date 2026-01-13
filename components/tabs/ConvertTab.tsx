'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export default function ConvertTab() {
    const particles = useGameStore((state) => state.particles)
    const nullifierHash = useGameStore((state) => state.nullifierHash)
    const lastClaimTime = useGameStore((state) => state.lastClaimTime)
    const [isConverting, setIsConverting] = useState(false)
    const [dailyStats, setDailyStats] = useState({
        totalClaimed: 0,
        remaining: 100,
        limitReached: false,
        conversions: 0,
        maxDaily: 100
    })

    const PARTICLES_PER_WLD = 75000  // Changed from 35000 - economic safety
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

    // Fetch daily stats on mount and refresh every 30s
    useEffect(() => {
        fetchDailyStats()
        const interval = setInterval(fetchDailyStats, 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchDailyStats = async () => {
        try {
            const res = await fetch('/api/daily-stats')
            const data = await res.json()
            setDailyStats(data)
        } catch (error) {
            console.error('Failed to fetch daily stats:', error)
        }
    }

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
                fetchDailyStats() // Refresh stats
            } else if (res.ok) {
                toast.success(`✅ Claimed ${WLD_AMOUNT} WLD! ${data.remaining.toFixed(2)} WLD remaining today.`)
                fetchDailyStats() // Refresh stats
            } else {
                toast.error(data.error || 'Conversion failed')
            }
        } catch (error) {
            console.error('[Convert] Error:', error)
            toast.error('Smart contract under development. Try again later!')
        } finally {
            setIsConverting(false)
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
                <div className="mb-6 p-4 bg-void-dark/50 rounded-xl">
                    <div className="text-sm text-text-secondary mb-2">Exchange rate:</div>
                    <div className="text-xl font-bold">
                        {PARTICLES_PER_WLD.toLocaleString()} particles = {WLD_AMOUNT} WLD
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
                            className={`h-3 rounded-full ${
                                dailyStats.limitReached 
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
                    disabled={!canConvert || !cooldown.ready || isConverting}
                    className={`
            w-full py-4 px-6 rounded-xl font-bold text-lg transition-all
            ${canConvert && cooldown.ready && !isConverting
                            ? 'bg-gradient-to-r from-warning to-success hover:scale-105'
                            : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                        }
          `}
                >
                    {isConverting ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                            Converting...
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                            <Image src="/assets/nav/upgrades.png" alt="Launch" width={20} height={20} />
                            Convert & Claim WLD
                        </div>
                    )}
                </button>

                {/* Info */}
                <div className="mt-6 text-xs text-text-secondary text-center space-y-1">
                    <p>• Minimum threshold: {PARTICLES_PER_WLD.toLocaleString()} particles</p>
                    <p>• Maximum daily claim: 0.01 WLD</p>
                    <p>• Cooldown: 24 hours between claims</p>
                </div>
            </motion.div>
        </div>
    )
}
