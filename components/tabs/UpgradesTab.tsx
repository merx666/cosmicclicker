'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useGameStore } from '@/store/gameStore'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { MiniKit, Tokens, Network, tokenToDecimals } from '@worldcoin/minikit-js'

const RECEIVER_ADDRESS = '0xeF648A1876a38612Ea1eF7A2DC8DF7Cbe186835a'

interface Upgrade {
    id: string
    name: string
    description: string
    image: string
    baseCost: number
    currentLevel: number
    maxLevel: number
    effect: (level: number) => string
}

interface WldUpgrade {
    id: string
    name: string
    description: string
    icon: string
    costWld: number
    effect: string
}

export default function UpgradesTab() {
    const {
        particles,
        upgradeClickPower,
        upgradeAutoCollector,
        purchaseUpgrade,
        unlockedPremiumUpgrades,
        nullifierHash
    } = useGameStore()

    const [isPurchasing, setIsPurchasing] = useState<string | null>(null)

    const upgrades: Upgrade[] = [
        {
            id: 'click_power',
            name: 'Click Power',
            description: 'Increase particles per click',
            image: '/assets/nav/upgrades.png',
            baseCost: 127,
            currentLevel: upgradeClickPower,
            maxLevel: 50,
            effect: (level) => `+${level} per click`
        },
        {
            id: 'auto_collector',
            name: 'Void Drone',
            description: 'Automatic particle collection',
            image: '/assets/premium/statistics.png',
            baseCost: 1270,
            currentLevel: upgradeAutoCollector,
            maxLevel: 30,
            effect: (level) => `+${level} per second`
        },
    ]

    const wldUpgrades: WldUpgrade[] = [
        {
            id: 'void_core_multiplier',
            name: 'Void Core Multiplier (PROMO 50% OFF!)',
            description: 'Permanently doubles your Click Power.',
            icon: '💎',
            costWld: 5,
            effect: 'x2 Particles/Click'
        },
        {
            id: 'overclocked_drone',
            name: 'Overclocked Drone (PROMO 33% OFF!)',
            description: 'Permanently doubles your Auto Collector speed.',
            icon: '🤖',
            costWld: 10,
            effect: 'x2 Particles/Second'
        }
    ]

    const calculateCost = (baseCost: number, currentLevel: number) => {
        return Math.floor(baseCost * Math.pow(1.15, currentLevel))
    }

    const handlePurchase = (upgrade: Upgrade) => {
        if (upgrade.currentLevel >= upgrade.maxLevel) {
            toast.error('Maximum level reached!')
            return
        }

        const cost = calculateCost(upgrade.baseCost, upgrade.currentLevel)
        const newLevel = upgrade.currentLevel + 1

        const success = purchaseUpgrade(upgrade.id, cost, newLevel)

        if (success) {
            toast.success(`${upgrade.name} upgraded to level ${newLevel}! 🎉`)
        } else {
            toast.error('Not enough particles!')
        }
    }

    const handleWldPurchase = async (upgrade: WldUpgrade) => {
        if (!MiniKit.isInstalled) {
            toast.error('World App opens is required for this action')
            return
        }

        try {
            setIsPurchasing(upgrade.id)

            const reference = crypto.randomUUID().replace(/-/g, '')
            const amountInWei = tokenToDecimals(upgrade.costWld, Tokens.WLD).toString()

            const payload = {
                reference,
                to: RECEIVER_ADDRESS,
                tokens: [{
                    symbol: Tokens.WLD,
                    token_amount: amountInWei
                }],
                description: `Void Collector - ${upgrade.name}`,
                network: Network.WorldChain
            }

            const { commandPayload } = await MiniKit.commandsAsync.pay(payload)

            if ((commandPayload as any)?.status === 'success') {
                const response = await fetch('/api/purchase-wld-upgrade', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        upgrade_id: upgrade.id,
                        amount: upgrade.costWld,
                        transaction_ref: reference,
                        nullifier_hash: nullifierHash
                    })
                })

                if (response.ok) {
                    toast.success(`${upgrade.name} unlocked successfully!`)
                    useGameStore.setState(state => ({
                        unlockedPremiumUpgrades: [...(state.unlockedPremiumUpgrades || []), upgrade.id]
                    }))
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
            console.error('WLD Upgrade purchase error:', error)
            toast.error('Something went wrong during purchase')
        } finally {
            setIsPurchasing(null)
        }
    }

    return (
        <div className="py-8 space-y-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">🚀 Upgrades</h2>
                <p className="text-text-secondary">Enhance your particle collecting operations</p>
            </div>

            {/* Premium WLD Upgrades */}
            <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-particle-glow">
                    <span>💎</span> Premium WLD Upgrades
                </h3>
                <div className="space-y-4">
                    {wldUpgrades.map((upgrade, idx) => {
                        const isUnlocked = unlockedPremiumUpgrades?.includes(upgrade.id)

                        return (
                            <motion.div
                                key={upgrade.id}
                                className={`bg-void-dark/80 border ${isUnlocked ? 'border-success/50' : 'border-[#00ffcc]/30'} rounded-xl p-6 relative overflow-hidden`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                {isUnlocked && (
                                    <div className="absolute top-0 right-0 bg-success/20 text-success text-xs font-bold px-3 py-1 pb-2 rounded-bl-xl">
                                        ✓ UNLOCKED
                                    </div>
                                )}
                                <div className="flex items-start gap-4">
                                    <div className={`relative w-12 h-12 shrink-0 rounded-lg flex items-center justify-center text-2xl border ${isUnlocked ? 'bg-success/10 border-success/30' : 'bg-[#00ffcc]/10 border-[#00ffcc]/20'}`}>
                                        <span>{upgrade.icon}</span>
                                    </div>

                                    <div className="flex-1">
                                        <div className="mb-2">
                                            <h3 className="text-xl font-bold text-white">{upgrade.name}</h3>
                                            <p className="text-sm text-text-secondary">{upgrade.description}</p>
                                        </div>

                                        <div className="mb-4">
                                            <div className="text-sm text-text-secondary mb-1">Effect:</div>
                                            <div className="text-[#00ffcc] font-black tracking-wide">
                                                {upgrade.effect}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleWldPurchase(upgrade)}
                                            disabled={isUnlocked || isPurchasing === upgrade.id}
                                            className={`
                                                w-full py-3 px-6 rounded-lg font-bold transition-all relative
                                                ${isUnlocked
                                                    ? 'bg-success/20 text-success border border-success/50 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-[rgba(0,255,204,0.1)] to-[rgba(59,130,246,0.1)] hover:from-[#00ffcc]/30 hover:to-[#3b82f6]/30 border border-[#00ffcc]/50 text-white'
                                                }
                                            `}
                                        >
                                            {isUnlocked ? (
                                                '✓ ALREADY OWNED'
                                            ) : isPurchasing === upgrade.id ? (
                                                'PROCESSING...'
                                            ) : (
                                                <>UNLOCK FOR {upgrade.costWld} WLD</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>

            {/* Standard Upgrades */}
            <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span>⚡</span> Standard Upgrades
                </h3>
                <div className="space-y-4">
                    {upgrades.map((upgrade, idx) => {
                        const cost = calculateCost(upgrade.baseCost, upgrade.currentLevel)
                        const canAfford = particles >= cost
                        const isMaxLevel = upgrade.currentLevel >= upgrade.maxLevel

                        return (
                            <motion.div
                                key={upgrade.id}
                                className="bg-void-purple/10 border border-void-purple/30 rounded-xl p-6"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + (idx * 0.1) }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="relative w-12 h-12 shrink-0 bg-void-dark/30 rounded-lg p-2 border border-void-purple/20">
                                        <Image
                                            src={upgrade.image}
                                            alt={upgrade.name}
                                            fill
                                            className="object-contain p-1"
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="text-xl font-bold">{upgrade.name}</h3>
                                                <p className="text-sm text-text-secondary">{upgrade.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-text-secondary">Level</div>
                                                <div className="text-lg font-bold text-particle-glow">
                                                    {upgrade.currentLevel}
                                                    <span className="text-sm text-text-secondary">/{upgrade.maxLevel}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <div className="text-sm text-text-secondary mb-1">Effect:</div>
                                            <div className="text-void-blue font-bold">
                                                {upgrade.effect(upgrade.currentLevel)}
                                                {!isMaxLevel && (
                                                    <span className="text-text-secondary"> → {upgrade.effect(upgrade.currentLevel + 1)}</span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handlePurchase(upgrade)}
                                            disabled={!canAfford || isMaxLevel}
                                            className={`
                                                w-full py-3 px-6 rounded-lg font-bold transition-all
                                                ${isMaxLevel
                                                    ? 'bg-success/20 text-success border border-success/50 cursor-not-allowed'
                                                    : canAfford
                                                        ? 'bg-gradient-to-r from-void-purple to-void-blue hover:from-void-purple/80 hover:to-void-blue/80'
                                                        : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                                                }
                                            `}
                                        >
                                            {isMaxLevel ? (
                                                '✓ MAX LEVEL'
                                            ) : (
                                                <>
                                                    <Image src="/assets/nav/collect.png" alt="p" width={14} height={14} className="inline mr-1" />
                                                    {cost.toLocaleString()} particles
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
