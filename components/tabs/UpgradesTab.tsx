'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useGameStore } from '@/store/gameStore'
import { useShallow } from 'zustand/react/shallow'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { MiniKit, Tokens, Network, tokenToDecimals } from '@worldcoin/minikit-js'
import { trackEvent } from '@/lib/analytics'

import { ADMIN_WALLET_ADDRESS } from '@/lib/constants'

const RECEIVER_ADDRESS = ADMIN_WALLET_ADDRESS

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
    // ⚡ Bolt Optimization: Wrapped selector in useShallow to prevent re-renders from unrelated state changes.
    const {
        particles,
        upgradeClickPower,
        upgradeAutoCollector,
        purchaseUpgrade,
        unlockedPremiumUpgrades,
        nullifierHash,
        unlockedSkins,
        unlockedThemes,
        purchaseCosmicItem,
        equipSkin,
        equipTheme,
        premiumParticleSkin,
        premiumBackgroundTheme
    } = useGameStore(useShallow(state => ({
        particles: state.particles,
        upgradeClickPower: state.upgradeClickPower,
        upgradeAutoCollector: state.upgradeAutoCollector,
        purchaseUpgrade: state.purchaseUpgrade,
        unlockedPremiumUpgrades: state.unlockedPremiumUpgrades,
        nullifierHash: state.nullifierHash,
        unlockedSkins: state.unlockedSkins,
        unlockedThemes: state.unlockedThemes,
        purchaseCosmicItem: state.purchaseCosmicItem,
        equipSkin: state.equipSkin,
        equipTheme: state.equipTheme,
        premiumParticleSkin: state.premiumParticleSkin,
        premiumBackgroundTheme: state.premiumBackgroundTheme
    })))

    const isTelegram = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true'

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

    const handleCosmicPurchase = (item: CosmicItem) => {
        const isUnlocked = item.type === 'skin'
            ? unlockedSkins?.includes(item.value)
            : unlockedThemes?.includes(item.value)

        if (isUnlocked) {
            if (item.type === 'skin') {
                equipSkin(item.value)
                toast.success('Wyposażono nową skórkę portalu!')
            } else {
                equipTheme(item.value)
                toast.success('Wyposażono nowy motyw tła!')
            }
            return
        }

        if (particles < item.costParticles) {
            toast.error('Masz za mało cząsteczek!')
            return
        }

        const success = purchaseCosmicItem(item.type, item.value, item.costParticles)
        if (success) {
            toast.success(`Odblokowano: ${item.name}! 🎉`)
        } else {
            toast.error('Błąd podczas zakupu.')
        }
    }

    const isEquipped = (item: CosmicItem) => {
        if (item.type === 'skin') {
            return premiumParticleSkin === item.value
        }
        return premiumBackgroundTheme === item.value
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
            trackEvent('purchase_upgrade', 'gameplay', upgrade.id, newLevel)
        } else {
            toast.error('Not enough particles!')
        }
    }

    const handleWldPurchase = async (upgrade: WldUpgrade) => {
        if (!isTelegram && !MiniKit.isInstalled()) {
            toast.error('World App is required for this action')
            return
        }

        try {
            setIsPurchasing(upgrade.id)
            const reference = crypto.randomUUID().replace(/-/g, '')

            if (isTelegram) {
                // Telegram Stars payment flow
                const tgWebApp = (window as any).Telegram?.WebApp
                if (!tgWebApp) {
                    toast.error('⚠️ Telegram WebApp is not available.')
                    setIsPurchasing(null)
                    return
                }

                const priceStars = upgrade.costWld * 60

                // Request Telegram Stars Invoice
                const invoiceRes = await fetch('/api/telegram/pay-stars', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        itemId: upgrade.id,
                        priceStars,
                        title: upgrade.name,
                        description: upgrade.description,
                        reference
                    })
                })

                const invoiceData = await invoiceRes.json()
                if (!invoiceRes.ok || !invoiceData.success) {
                    toast.error(`❌ Błąd płatności Stars: ${invoiceData.error || 'Nieznany błąd'}`)
                    setIsPurchasing(null)
                    return
                }

                // Open Telegram invoice modal
                tgWebApp.openInvoice(invoiceData.invoiceLink, async (status: string) => {
                    if (status === 'paid') {
                        try {
                            setIsPurchasing(upgrade.id)
                            const response = await fetch('/api/purchase-wld-upgrade', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    upgrade_id: upgrade.id,
                                    amount: priceStars,
                                    transaction_ref: reference,
                                    nullifier_hash: nullifierHash
                                })
                            })

                            if (response.ok) {
                                toast.success(`${upgrade.name} unlocked successfully! 🎉`)
                                trackEvent('purchase_premium_upgrade', 'gameplay', upgrade.id)
                                useGameStore.setState(state => ({
                                    unlockedPremiumUpgrades: [...(state.unlockedPremiumUpgrades || []), upgrade.id]
                                }))
                            } else {
                                const data = await response.json()
                                toast.error(data.error || 'Failed to process payment on server')
                            }
                        } catch (err) {
                            toast.error('❌ Błąd zapisu ulepszenia Stars.')
                        } finally {
                            setIsPurchasing(null)
                        }
                    } else {
                        toast.error('❌ Płatność Stars anulowana lub nieudana.')
                        setIsPurchasing(null)
                    }
                })
            } else {
                // WorldApp / MiniKit payment flow
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
                        trackEvent('purchase_premium_upgrade', 'gameplay', upgrade.id)
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
                setIsPurchasing(null)
            }
        } catch (error) {
            console.error('Upgrade purchase error:', error)
            toast.error('Something went wrong during purchase')
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
                    <span>💎</span> {isTelegram ? 'Premium Stars Upgrades' : 'Premium WLD Upgrades'}
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
                                                <>{isTelegram ? `UNLOCK FOR ${upgrade.costWld * 60} STARS` : `UNLOCK FOR ${upgrade.costWld} WLD`}</>
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

            {/* Cosmic Store */}
            <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-particle-glow">
                    <span>✨</span> Cosmic Store (Sinks)
                </h3>
                <div className="space-y-4">
                    {cosmicItems.map((item, idx) => {
                        const isUnlocked = item.type === 'skin'
                            ? unlockedSkins?.includes(item.value)
                            : unlockedThemes?.includes(item.value)
                        const equipped = isEquipped(item)
                        const canAfford = particles >= item.costParticles

                        return (
                            <motion.div
                                key={item.id}
                                className={`bg-void-purple/10 border ${isUnlocked ? 'border-success/30' : 'border-void-purple/30'} rounded-xl p-6`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + (idx * 0.1) }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="relative w-12 h-12 shrink-0 bg-void-dark/30 rounded-lg flex items-center justify-center text-2xl border border-void-purple/20">
                                        <span>{item.icon}</span>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="text-xl font-bold">{item.name}</h3>
                                                <p className="text-sm text-text-secondary">{item.description}</p>
                                            </div>
                                            {isUnlocked && (
                                                <span className="text-xs bg-success/20 text-success px-2 py-1 rounded">
                                                    Odblokowane
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleCosmicPurchase(item)}
                                            disabled={!isUnlocked && !canAfford}
                                            className={`
                                                w-full py-3 px-6 rounded-lg font-bold transition-all
                                                ${equipped
                                                    ? 'bg-success/20 text-success border border-success/50 cursor-default'
                                                    : isUnlocked
                                                        ? 'bg-gradient-to-r from-void-purple to-void-blue hover:from-void-purple/80 hover:to-void-blue/80'
                                                        : canAfford
                                                            ? 'bg-[#00ffcc]/20 hover:bg-[#00ffcc]/30 border border-[#00ffcc]/50 text-white'
                                                            : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                                                }
                                            `}
                                        >
                                            {equipped ? (
                                                '✓ WYPOSAŻONE'
                                            ) : isUnlocked ? (
                                                'WYPOSAŻ'
                                            ) : (
                                                <>
                                                    <Image src="/assets/nav/collect.png" alt="p" width={14} height={14} className="inline mr-1" />
                                                    Odblokuj za {item.costParticles.toLocaleString()} cząsteczek
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

interface CosmicItem {
    id: string
    name: string
    description: string
    icon: string
    costParticles: number
    type: 'skin' | 'theme'
    value: string
}

const cosmicItems: CosmicItem[] = [
    {
        id: 'crystal_skin',
        name: '🔮 Kryształowy Portal',
        description: 'Krystaliczne fasetki odbijające energię próżni.',
        icon: '🔮',
        costParticles: 5000000,
        type: 'skin',
        value: 'crystal'
    },
    {
        id: 'dark_matter_skin',
        name: '🌌 Portal Ciemnej Materii',
        description: 'Tajemniczy wir, pozostawiający za sobą cienie.',
        icon: '🌌',
        costParticles: 15000000,
        type: 'skin',
        value: 'dark_matter'
    },
    {
        id: 'supernova_skin',
        name: '🔥 Portal Supernowej',
        description: 'Ogniste rozbłyski krążące wokół jądra.',
        icon: '🔥',
        costParticles: 50000000,
        type: 'skin',
        value: 'supernova'
    },
    {
        id: 'deep_space_theme',
        name: '🌠 Motyw Głębokiego Kosmosu',
        description: 'Ciemnogranatowe tło galaktyki z jasnymi błyskami.',
        icon: '🌠',
        costParticles: 10000000,
        type: 'theme',
        value: 'deep_space'
    },
    {
        id: 'supernova_theme',
        name: '☀️ Motyw Supernowej',
        description: 'Intensywna eksplozja kosmiczna z rozbłyskami słońca.',
        icon: '☀️',
        costParticles: 25000000,
        type: 'theme',
        value: 'supernova'
    }
]
