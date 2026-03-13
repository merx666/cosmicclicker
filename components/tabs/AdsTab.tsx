'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MiniKit, Tokens, Network, tokenToDecimals } from '@worldcoin/minikit-js'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { useGameStore } from '@/store/gameStore'

const RECEIVER_ADDRESS = '0xeF648A1876a38612Ea1eF7A2DC8DF7Cbe186835a'

interface PricingTier {
    id: number
    label: string
    weeks: number
    price: number
}

const PRICING_TIERS: PricingTier[] = [
    { id: 1, label: '1 Week', weeks: 1, price: 15 },
    { id: 2, label: '2 Weeks', weeks: 2, price: 25 },
    { id: 3, label: '3 Weeks', weeks: 3, price: 35 },
    { id: 4, label: '1 Month', weeks: 4, price: 45 },
]

export default function AdsTab() {
    const { nullifierHash } = useGameStore()
    const [selectedTier, setSelectedTier] = useState<number>(1)
    const [isPurchasing, setIsPurchasing] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [transactionId, setTransactionId] = useState('')

    const selectedPricing = PRICING_TIERS.find(t => t.id === selectedTier)

    const handlePurchase = async () => {
        if (!MiniKit.isInstalled) {
            toast.error('World App opens is required for this action')
            return
        }
        if (!selectedPricing) return

        try {
            setIsPurchasing(true)

            const reference = crypto.randomUUID().replace(/-/g, '')
            const amountInWei = tokenToDecimals(selectedPricing.price, Tokens.WLD).toString()

            const payload = {
                reference,
                to: RECEIVER_ADDRESS,
                tokens: [{
                    symbol: Tokens.WLD,
                    token_amount: amountInWei
                }],
                description: `Void Collector - Ad Banner (${selectedPricing.label})`,
                network: Network.WorldChain
            }

            const { commandPayload } = await MiniKit.commandsAsync.pay(payload)

            if ((commandPayload as any)?.status === 'success') {
                const response = await fetch('/api/purchase-ad', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tier: selectedTier,
                        amount: selectedPricing.price,
                        transaction_ref: reference,
                        nullifier_hash: nullifierHash
                    })
                })

                if (response.ok) {
                    setTransactionId(reference)
                    setShowSuccessModal(true)
                } else {
                    const data = await response.json()
                    toast.error(data.error || 'Failed to process payment on server')
                }
            } else if ((commandPayload as any)?.status === 'error') {
                toast.error(`Payment failed: ${(commandPayload as any)?.error_code}`)
            } else {
                toast.error('Payment cancelled')
            }
        } catch (error) {
            console.error('Ad purchase error:', error)
            toast.error('Something went wrong during purchase')
        } finally {
            setIsPurchasing(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-void-dark pb-[100px] overflow-y-auto no-scrollbar pt-6">
            <div className="px-5 mb-6">
                <h1 className="text-3xl font-black italic bg-gradient-to-r from-[#00ffcc] to-[#3b82f6] text-transparent bg-clip-text text-shadow-glow flex items-center gap-2">
                    <span>📡</span> MEDIA / ADS
                </h1>
                <p className="text-text-secondary text-sm mt-3 leading-relaxed">
                    Promote your project, social media, or tokens natively in the Void Collector app. Reach thousands of highly engaged users every day!
                </p>
            </div>

            {/* Current Banner Slots */}
            <div className="px-5 mb-8 space-y-3">
                <h2 className="text-text-primary font-bold text-lg mb-4 flex items-center gap-2">
                    <span>📺</span> Premium Ad Slots (0/5 taken)
                </h2>

                {[1, 2, 3, 4, 5].map((slot) => (
                    <div
                        key={slot}
                        className="bg-void-card/60 border border-void-border/50 rounded-2xl h-24 sm:h-32 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-sm group transition-all"
                    >
                        {/* Placeholder Content */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#00ffcc]/5 to-transparent opacity-50" />
                        <p className="text-text-secondary/60 font-medium text-sm z-10 group-hover:text-text-primary/80 transition-colors">
                            SLOT #{slot} — AVAILABLE
                        </p>
                        <p className="text-[10px] text-text-secondary/40 z-10 mt-1">1200x400 px or 3:1 ratio</p>
                    </div>
                ))}
            </div>

            {/* Purchase Section */}
            <div className="px-5 mb-10">
                <div className="bg-gradient-to-br from-[#1a1b26] to-[#0f111a] border border-[#00ffcc]/30 rounded-3xl p-5 shadow-[0_0_30px_rgba(0,255,204,0.1)]">
                    <h3 className="text-xl font-bold text-white mb-2">Book a Banner Slot</h3>
                    <p className="text-text-secondary text-xs mb-5">
                        Choose duration, pay automatically in WLD, and email us your banner. It's that easy.
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                        {PRICING_TIERS.map((tier) => (
                            <button
                                key={tier.id}
                                onClick={() => setSelectedTier(tier.id)}
                                className={`p-3 rounded-2xl border transition-all flex flex-col items-center gap-1 ${selectedTier === tier.id
                                    ? 'bg-[#00ffcc]/10 border-[#00ffcc] shadow-[0_0_15px_rgba(0,255,204,0.2)]'
                                    : 'bg-black/20 border-white/10 opacity-70 hover:opacity-100'
                                    }`}
                            >
                                <span className="text-white font-bold text-sm">{tier.label}</span>
                                <span className="text-[#00ffcc] font-black text-lg">{tier.price} WLD</span>
                            </button>
                        ))}
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-5">
                        <p className="text-yellow-400 text-[11px] leading-tight font-medium">
                            <span className="mr-1">⚠️</span>
                            After payment, you will receive instructions to send your banner (1200x400 px) & link via email. Ads are reviewed before going live.
                        </p>
                    </div>

                    <button
                        onClick={handlePurchase}
                        disabled={isPurchasing}
                        className="w-full bg-gradient-to-b from-[#00ffcc] to-[#00b38c] text-[#0a0b10] py-4 rounded-xl font-black text-lg tracking-wide hover:shadow-[0_0_30px_rgba(0,255,204,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all relative overflow-hidden"
                    >
                        {isPurchasing ? 'PROCESSING...' : `PAY ${selectedPricing?.price} WLD`}
                        {!isPurchasing && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
                        )}
                    </button>
                    <p className="text-center text-[10px] text-text-secondary mt-3">
                        Payment automated via MiniKit directly to Void Collector pool.
                    </p>
                </div>
            </div>

            {/* Success Modal */}
            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#1a1b26] border border-[#00ffcc]/50 rounded-3xl p-6 w-full max-w-sm relative overflow-hidden text-center"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#00ffcc] to-[#3b82f6]" />

                            <div className="w-16 h-16 bg-[#00ffcc]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#00ffcc]/50">
                                <span className="text-3xl text-[#00ffcc]">✅</span>
                            </div>

                            <h3 className="text-2xl font-black text-white mb-2">Payment Confirmed!</h3>
                            <p className="text-text-secondary text-sm mb-6">
                                Your banner slot is now reserved. There's just one last step to get it live.
                            </p>

                            <div className="bg-black/30 border border-white/5 rounded-xl p-4 mb-6 text-left">
                                <h4 className="text-white font-bold text-sm mb-2 opacity-80 uppercase tracking-wider">Next Steps:</h4>
                                <ol className="list-decimal list-inside text-text-secondary text-sm space-y-2 marker:text-[#00ffcc]">
                                    <li>Prepare your banner image (ideal size: 1200x400 px, max 2MB)</li>
                                    <li>Decide on the URL you want to route users to</li>
                                    <li>Send both to <strong className="text-white">admin@skyreel.art</strong></li>
                                </ol>
                                <div className="mt-4 pt-3 border-t border-white/5">
                                    <p className="text-[#00ffcc] text-xs font-mono break-all opacity-80">
                                        Subject: Ad Banner - {transactionId}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
                            >
                                Got it
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
