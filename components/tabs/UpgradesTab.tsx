'use client'

import Image from 'next/image'
import { useGameStore } from '@/store/gameStore'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

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

export default function UpgradesTab() {
    const particles = useGameStore((state) => state.particles)
    const upgradeClickPower = useGameStore((state) => state.upgradeClickPower)
    const upgradeAutoCollector = useGameStore((state) => state.upgradeAutoCollector)
    const purchaseUpgrade = useGameStore((state) => state.purchaseUpgrade)

    const upgrades: Upgrade[] = [
        {
            id: 'click_power',
            name: 'Click Power',
            description: 'Increase particles per click',
            image: '/assets/nav/upgrades.png', // Reusing Rocket icon
            baseCost: 100,
            currentLevel: upgradeClickPower,
            maxLevel: 50,
            effect: (level) => `+${level} per click`
        },
        {
            id: 'auto_collector',
            name: 'Void Drone',
            description: 'Automatic particle collection',
            image: '/assets/premium/statistics.png', // Using Stats icon as "System/Drone" placeholder
            baseCost: 1000,
            currentLevel: upgradeAutoCollector,
            maxLevel: 30,
            effect: (level) => `+${level} per second`
        },
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

    return (
        <div className="py-8 space-y-4">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">🚀 Upgrades</h2>
                <p className="text-text-secondary">Upgrade your particle collecting system</p>
            </div>

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
                            transition={{ delay: idx * 0.1 }}
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
    )
}
