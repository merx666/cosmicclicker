'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { MiniKit } from '@worldcoin/minikit-js'
import { getVoidBalance } from '@/lib/token'

export default function VoidClubTab() {
    const {
        nullifierHash,
        loadGameState
    } = useGameStore()

    const [voidBalance, setVoidBalance] = useState<number | null>(null)
    const [checkingVoid, setCheckingVoid] = useState(false)

    // Check VOID balance on mount
    useEffect(() => {
        const checkBalance = async () => {
            // @ts-ignore
            if (MiniKit.walletAddress) {
                // @ts-ignore
                const bal = await getVoidBalance(MiniKit.walletAddress)
                setVoidBalance(bal)
            }
        }
        checkBalance()
    }, [])

    const verifyHoldings = async () => {
        if (!nullifierHash) {
            toast.error('Log in first')
            return
        }
        setCheckingVoid(true)
        try {
            // 1. Update balance display immediately
            // @ts-ignore
            if (MiniKit.walletAddress) {
                // @ts-ignore
                const bal = await getVoidBalance(MiniKit.walletAddress)
                setVoidBalance(bal)
            }

            // 2. Server verification & Sync
            const res = await fetch('/api/verify-void', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nullifier_hash: nullifierHash })
            })

            const data = await res.json()

            if (data.success) {
                // Update local balance display from server check
                if (typeof data.balance === 'number') {
                    setVoidBalance(data.balance)
                }

                if (data.updated) {
                    toast.success(`VIP Updated! Tier: ${data.vipLevelName}`)
                    await loadGameState(nullifierHash) // Reload to get new tier
                } else {
                    toast.success('Holdings verified. Tier up to date.')
                }
            } else {
                toast.error(data.error || 'Verification failed')
            }
        } catch (e) {
            console.error(e)
            toast.error('Failed to verify')
        } finally {
            setCheckingVoid(false)
        }
    }

    return (
        <div className="py-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">🟣 Void Club</h2>
                <p className="text-text-secondary">Exclusive access for $VOID holders</p>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8 overflow-hidden rounded-3xl border border-void-purple/50 shadow-[0_0_30px_rgba(139,92,246,0.15)] bg-black/80 relative group"
            >
                {/* Background Effect */}
                <div className="absolute inset-0 bg-[url('/assets/void-texture.png')] opacity-20 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-black to-blue-900/40 opacity-80"></div>

                {/* Animated Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shine" />

                <div className="relative p-8 text-center">
                    <div className="mb-6 inline-block">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 blur-lg opacity-50 rounded-full"></div>
                            <div className="relative bg-black/50 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-xl">
                                <span className="text-xs font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-blue-300 uppercase">
                                    Void Club Exclusive
                                </span>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-4xl font-black italic text-white mb-3 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-white to-purple-400">
                            HOLD $VOID
                        </span>
                        <br />
                        <span className="text-gray-500 text-2xl not-italic font-medium">GET VIP STATUS</span>
                    </h3>

                    <p className="text-sm text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
                        Hold tokens in your wallet to automatically unlock VIP tiers.
                        <br />
                        <span className="text-white font-semibold">No payment required. Instant access.</span>
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
                        <div className="bg-gradient-to-b from-white/10 to-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2">Your Balance</div>
                            <div className="text-2xl font-bold text-white font-mono tracking-tight">
                                {voidBalance === null ? (
                                    <div className="h-8 w-24 bg-white/10 animate-pulse rounded mx-auto" />
                                ) : (
                                    <>
                                        {voidBalance.toLocaleString()}
                                        <span className="text-sm text-purple-400 ml-1">$VOID</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="bg-gradient-to-b from-white/10 to-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1">
                                <span className="text-[8px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded uppercase font-bold">Goal</span>
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2">Next Tier</div>
                            <div className="text-2xl font-bold text-yellow-400 font-mono tracking-tight">
                                1,000
                                <span className="text-sm text-yellow-600/80 ml-1">$VOID</span>
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1">Unlocks Silver VIP</div>
                        </div>
                    </div>

                    <button
                        onClick={verifyHoldings}
                        disabled={checkingVoid}
                        className={`
                            w-full max-w-md mx-auto py-4 rounded-xl font-bold text-sm uppercase tracking-widest
                            bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 
                            hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500
                            shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)]
                            transition-all active:scale-[0.98] border border-white/10
                            flex items-center justify-center gap-3 group
                        `}
                    >
                        {checkingVoid ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Verifying on World Chain...</span>
                            </>
                        ) : (
                            <>
                                <span className="text-lg">⚡</span>
                                <span>Verify Holdings & Upgrade</span>
                            </>
                        )}
                    </button>

                    <a
                        href="https://puf.world"
                        target="_blank"
                        className="inline-flex items-center gap-1 mt-6 text-xs text-gray-500 hover:text-white transition-colors group/link"
                    >
                        <span>Trade $VOID on PUF.WORLD</span>
                        <span className="group-hover/link:translate-x-0.5 transition-transform">→</span>
                    </a>
                </div>
            </motion.div>
        </div>
    )
}
