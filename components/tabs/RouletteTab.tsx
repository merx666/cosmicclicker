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
]

export default function RouletteTab() {
    const { nullifierHash, particles, addParticles } = useGameStore()
    const [isSpinning, setIsSpinning] = useState(false)
    const [variant, setVariant] = useState<'small' | 'big'>('small')
    const [reels, setReels] = useState([0, 0, 0]) // Indices of symbols
    const [lastWin, setLastWin] = useState<{ type: string, value: number, message: string } | null>(null)

    const COST_SMALL = 0.45
    const COST_BIG = 1.5

    // Symbols configuration
    const SYMBOLS = [
        { id: 0, icon: '🗑️', color: 'text-gray-500', name: 'Trash' },
        { id: 1, icon: '✨', color: 'text-blue-400', name: 'Particles' },
        { id: 2, icon: '🌟', color: 'text-purple-400', name: 'Mega Particles' },
        { id: 3, icon: '🥉', color: 'text-amber-700', name: 'Bronze' },
        { id: 4, icon: '🥈', color: 'text-gray-300', name: 'Silver' },
        { id: 5, icon: '🥇', color: 'text-yellow-400', name: 'Gold' },
        { id: 6, icon: '💎', color: 'text-cyan-400', name: 'Platinum' },
    ]

    const handleSpin = async () => {
        if (isSpinning) return

        if (!MiniKit.isInstalled()) {
            toast.error('MiniKit not installed')
            return
        }

        const cost = variant === 'small' ? COST_SMALL : COST_BIG

        setIsSpinning(true)
        setLastWin(null)

        try {
            // 1. Payment
            const uuid = window.crypto.randomUUID()
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

            const paymentPromise = MiniKit.commandsAsync.pay(payload)

            // Visual spin start
            const spinInterval = setInterval(() => {
                setReels(prev => prev.map(() => Math.floor(Math.random() * SYMBOLS.length)))
            }, 100)

            const result = await paymentPromise as any

            if (result?.finalPayload?.status === 'success') {
                // 3. Call API
                const response = await fetch('/api/minigames/roulette', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nullifier_hash: nullifierHash,
                        transaction_ref: uuid,
                        variant: variant
                    })
                })

                const data = await response.json()

                clearInterval(spinInterval)

                if (response.ok) {
                    // Set final reels
                    if (data.symbols) {
                        setReels(data.symbols)
                    } else {
                        // Fallback logic if no symbols returned
                        const symbolIdx = data.rewardType === 'vip' ? (data.rewardValue + 2) : (data.rewardValue > 100000 ? 2 : 1)
                        setReels([symbolIdx, symbolIdx, symbolIdx])
                    }

                    // 4. Show Result Delay
                    await new Promise(resolve => setTimeout(resolve, 500))

                    setLastWin({
                        type: data.rewardType,
                        value: data.rewardValue,
                        message: data.message
                    })

                    if (data.rewardType === 'particles') {
                        addParticles(data.rewardValue)
                        toast.success(`+${data.rewardValue.toLocaleString()} Particles!`)
                    } else if (data.rewardType === 'vip') {
                        toast.success('👑 VIP UPGRADE!', { duration: 5000 })
                        useGameStore.getState().loadGameState(nullifierHash!)
                    }

                } else {
                    toast.error(`Spin Error: ${data.error}`)
                }

            } else {
                clearInterval(spinInterval)
                toast.error('Payment cancelled')
            }

        } catch (error) {
            console.error('Spin error:', error)
            toast.error('Failed to spin')
            // Ensure spinning stops
            setIsSpinning(false)
        } finally {
            setIsSpinning(false)
        }
    }

    return (
        <div className="flex flex-col items-center min-h-[70vh] py-4 bg-gradient-to-b from-[#1a1b4b] to-[#0f1035]">
            {/* Fake Winners Ticker */}
            <div className="w-full bg-black/40 border-y border-white/5 py-2 mb-6 overflow-hidden relative">
                <motion.div
                    className="flex gap-8 whitespace-nowrap"
                    animate={{ x: [0, -1000] }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
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

            <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                Void Machine
            </h2>

            {/* Toggle */}
            <div className="flex bg-black/30 p-1 rounded-full border border-white/10 mb-8 relative">
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
            <div className="w-[80%] h-4 bg-blue-800 rounded-b-xl opacity-50 mb-8" />

            {/* Spin Button */}
            <button
                onClick={handleSpin}
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

            {/* Prize Table */}
            <div className="mt-8 mx-4 p-4 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm w-full max-w-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 text-center">Prize Table ({variant.toUpperCase()})</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between p-2 bg-black/20 rounded">
                        <span className="flex gap-1">💎💎💎</span>
                        <span className="text-cyan-300">Platinum</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-black/20 rounded">
                        <span className="flex gap-1">🥇🥇🥇</span>
                        <span className="text-yellow-400">Gold</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-black/20 rounded">
                        <span className="flex gap-1">🥈🥈🥈</span>
                        <span className="text-gray-300">Silver</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-black/20 rounded">
                        <span className="flex gap-1">🥉🥉🥉</span>
                        <span className="text-amber-600">Bronze</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
