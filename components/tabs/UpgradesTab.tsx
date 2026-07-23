'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useGameStore } from '@/store/gameStore'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { MiniKit, Tokens, Network, tokenToDecimals } from '@worldcoin/minikit-js'
import { trackEvent } from '@/lib/analytics'
import { useTranslations } from 'next-intl'
import { Zap, Cpu, Sparkles, Star, Palette, Image as ImageIcon, Rocket, Coins, Check, Gem } from 'lucide-react'

import { ADMIN_WALLET_ADDRESS } from '@/lib/constants'

const RECEIVER_ADDRESS = ADMIN_WALLET_ADDRESS

interface Upgrade {
    id: string
    nameKey: string
    descKey: string
    icon: any
    baseCost: number
    currentLevel: number
    maxLevel: number
    effect: (level: number) => string
}

interface WldUpgrade {
    id: string
    nameKey: string
    descKey: string
    icon: any
    costWld: number
    effect: string
}

interface CosmicItem {
    id: string
    nameKey: string
    descKey: string
    icon: any
    costParticles: number
    type: 'skin' | 'theme'
    value: string
}

export default function UpgradesTab() {
    const t = useTranslations('Upgrades')
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
    } = useGameStore()

    const isTelegram = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true'

    const [isPurchasing, setIsPurchasing] = useState<string | null>(null)

    const upgrades: Upgrade[] = [
        {
            id: 'click_power',
            nameKey: 'clickPower',
            descKey: 'clickPowerDesc',
            icon: Zap,
            baseCost: 127,
            currentLevel: upgradeClickPower,
            maxLevel: 50,
            effect: (level) => `+${level} per click`
        },
        {
            id: 'auto_collector',
            nameKey: 'voidDrone',
            descKey: 'voidDroneDesc',
            icon: Cpu,
            baseCost: 1270,
            currentLevel: upgradeAutoCollector,
            maxLevel: 30,
            effect: (level) => `+${level} per second`
        }
    ]

    const wldUpgrades: WldUpgrade[] = [
        {
            id: 'void_core_multiplier',
            nameKey: 'voidCore',
            descKey: 'voidCoreDesc',
            icon: Gem,
            costWld: 5,
            effect: 'x2 Particles/Click'
        },
        {
            id: 'overclocked_drone',
            nameKey: 'overclockedDrone',
            descKey: 'overclockedDroneDesc',
            icon: Star,
            costWld: 10,
            effect: 'x2 Particles/Second'
        }
    ]

    const cosmicItems: CosmicItem[] = [
        {
            id: 'crystal_skin',
            nameKey: 'crystalSkin',
            descKey: 'crystalSkinDesc',
            icon: Palette,
            costParticles: 5000000,
            type: 'skin',
            value: 'crystal'
        },
        {
            id: 'dark_matter_skin',
            nameKey: 'darkMatterSkin',
            descKey: 'darkMatterSkinDesc',
            icon: Palette,
            costParticles: 15000000,
            type: 'skin',
            value: 'dark_matter'
        },
        {
            id: 'supernova_skin',
            nameKey: 'supernovaSkin',
            descKey: 'supernovaSkinDesc',
            icon: Palette,
            costParticles: 50000000,
            type: 'skin',
            value: 'supernova'
        },
        {
            id: 'deep_space_theme',
            nameKey: 'deepSpaceTheme',
            descKey: 'deepSpaceThemeDesc',
            icon: ImageIcon,
            costParticles: 10000000,
            type: 'theme',
            value: 'deep_space'
        },
        {
            id: 'supernova_theme',
            nameKey: 'supernovaTheme',
            descKey: 'supernovaThemeDesc',
            icon: ImageIcon,
            costParticles: 25000000,
            type: 'theme',
            value: 'supernova'
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
                toast.success(t('equipSkinToast'))
            } else {
                equipTheme(item.value)
                toast.success(t('equipThemeToast'))
            }
            return
        }

        if (particles < item.costParticles) {
            toast.error(t('notEnoughParticles'))
            return
        }

        const success = purchaseCosmicItem(item.type, item.value, item.costParticles)
        if (success) {
            toast.success(`${t('unlockedToast')} ${t(item.nameKey as any)}! 🎉`)
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
            toast.error(t('maxLevel'))
            return
        }

        const cost = calculateCost(upgrade.baseCost, upgrade.currentLevel)
        const newLevel = upgrade.currentLevel + 1

        const success = purchaseUpgrade(upgrade.id, cost, newLevel)

        if (success) {
            toast.success(`${t(upgrade.nameKey as any)} upgraded to level ${newLevel}! 🎉`)
            trackEvent('purchase_upgrade', 'gameplay', upgrade.id, newLevel)
        } else {
            toast.error(t('notEnoughParticles'))
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
                        title: t(upgrade.nameKey as any),
                        description: t(upgrade.descKey as any),
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
                                toast.success(`${t(upgrade.nameKey as any)} unlocked successfully! 🎉`)
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
                    description: `Void Collector - ${t(upgrade.nameKey as any)}`,
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
                        toast.success(`${t(upgrade.nameKey as any)} unlocked successfully!`)
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
        <div className="py-8 space-y-8 max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-4 bg-white/5 rounded-full mb-4">
                    <Rocket className="w-8 h-8 text-white/80" />
                </div>
                <h2 className="text-3xl font-black mb-2 text-white">{t('title')}</h2>
                <p className="text-white/50 font-medium">{t('subtitle')}</p>
            </div>

            {/* Premium WLD Upgrades */}
            <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white/90">
                    <Gem className="w-5 h-5 text-fuchsia-400" /> {isTelegram ? t('premiumTitle') : t('premiumTitle')}
                </h3>
                <div className="space-y-3">
                    {wldUpgrades.map((upgrade, idx) => {
                        const isUnlocked = unlockedPremiumUpgrades?.includes(upgrade.id)

                        return (
                            <motion.div
                                key={upgrade.id}
                                className={`bg-white/5 border ${isUnlocked ? 'border-success/30' : 'border-white/10'} rounded-2xl p-4 relative overflow-hidden`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`relative w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border ${isUnlocked ? 'bg-success/10 border-success/30 text-success' : 'bg-white/5 border-white/10 text-white/80'}`}>
                                        <upgrade.icon className="w-6 h-6" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="mb-2">
                                            <h3 className="font-bold text-white tracking-tight flex items-center justify-between">
                                                {t(upgrade.nameKey as any)}
                                                {isUnlocked && <Check className="w-4 h-4 text-success shrink-0" />}
                                            </h3>
                                            <p className="text-xs text-white/50">{t(upgrade.descKey as any)}</p>
                                        </div>

                                        <div className="mb-4 text-xs font-medium text-white/80 bg-white/5 rounded-lg px-3 py-2 inline-block">
                                            {upgrade.effect}
                                        </div>

                                        <button
                                            onClick={() => handleWldPurchase(upgrade)}
                                            disabled={isUnlocked || isPurchasing === upgrade.id}
                                            className={`
                                                w-full py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-95
                                                ${isUnlocked
                                                    ? 'bg-success/10 text-success cursor-not-allowed border border-success/20'
                                                    : 'bg-white text-black hover:bg-gray-200'
                                                }
                                            `}
                                        >
                                            {isUnlocked ? (
                                                t('alreadyOwned')
                                            ) : isPurchasing === upgrade.id ? (
                                                t('processing')
                                            ) : (
                                                <>{t('unlockFor')} {isTelegram ? `${upgrade.costWld * 60} ${t('stars')}` : `${upgrade.costWld} ${t('wld')}`}</>
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
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white/90">
                    <Zap className="w-5 h-5 text-yellow-400" /> {t('standardTitle')}
                </h3>
                <div className="space-y-3">
                    {upgrades.map((upgrade, idx) => {
                        const cost = calculateCost(upgrade.baseCost, upgrade.currentLevel)
                        const canAfford = particles >= cost
                        const isMaxLevel = upgrade.currentLevel >= upgrade.maxLevel

                        return (
                            <motion.div
                                key={upgrade.id}
                                className="bg-white/5 border border-white/10 rounded-2xl p-4"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + (idx * 0.1) }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="relative w-12 h-12 shrink-0 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-white/80">
                                        <upgrade.icon className="w-6 h-6" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-bold text-white tracking-tight">{t(upgrade.nameKey as any)}</h3>
                                                <p className="text-xs text-white/50">{t(upgrade.descKey as any)}</p>
                                            </div>
                                            <div className="text-right ml-2 shrink-0">
                                                <div className="text-[10px] uppercase text-white/50 font-bold">{t('level')}</div>
                                                <div className="text-sm font-black text-white">
                                                    {upgrade.currentLevel}
                                                    <span className="text-xs text-white/40 font-medium ml-1">/{upgrade.maxLevel}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-4 text-xs font-medium text-white/80 bg-white/5 rounded-lg px-3 py-2 inline-flex gap-2">
                                            <span className="text-white/40">{t('effect')}:</span> 
                                            {upgrade.effect(upgrade.currentLevel)}
                                            {!isMaxLevel && (
                                                <span className="text-white/40">→ <span className="text-white">{upgrade.effect(upgrade.currentLevel + 1)}</span></span>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handlePurchase(upgrade)}
                                            disabled={!canAfford || isMaxLevel}
                                            className={`
                                                w-full py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2
                                                ${isMaxLevel
                                                    ? 'bg-success/10 text-success border border-success/20 cursor-not-allowed'
                                                    : canAfford
                                                        ? 'bg-white text-black hover:bg-gray-200'
                                                        : 'bg-white/5 text-white/40 cursor-not-allowed border border-white/10'
                                                }
                                            `}
                                        >
                                            {isMaxLevel ? (
                                                t('maxLevel')
                                            ) : (
                                                <>
                                                    <Coins className="w-4 h-4" />
                                                    {cost.toLocaleString()}
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
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white/90">
                    <Sparkles className="w-5 h-5 text-purple-400" /> {t('cosmicStore')}
                </h3>
                <div className="space-y-3">
                    {cosmicItems.map((item, idx) => {
                        const isUnlocked = item.type === 'skin'
                            ? unlockedSkins?.includes(item.value)
                            : unlockedThemes?.includes(item.value)
                        const equipped = isEquipped(item)
                        const canAfford = particles >= item.costParticles

                        return (
                            <motion.div
                                key={item.id}
                                className={`bg-white/5 border ${isUnlocked ? 'border-success/30' : 'border-white/10'} rounded-2xl p-4`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + (idx * 0.1) }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="relative w-12 h-12 shrink-0 bg-white/5 rounded-xl flex items-center justify-center text-white/80 border border-white/10">
                                        <item.icon className="w-6 h-6" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-bold text-white tracking-tight flex items-center gap-2">
                                                    {t(item.nameKey as any)}
                                                </h3>
                                                <p className="text-xs text-white/50 mt-1">{t(item.descKey as any)}</p>
                                            </div>
                                            {isUnlocked && !equipped && (
                                                <span className="text-[10px] uppercase bg-success/20 text-success px-2 py-1 rounded font-bold shrink-0 ml-2">
                                                    {t('unlocked')}
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleCosmicPurchase(item)}
                                            disabled={!isUnlocked && !canAfford}
                                            className={`
                                                w-full py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2
                                                ${equipped
                                                    ? 'bg-success/10 text-success border border-success/20 cursor-default'
                                                    : isUnlocked
                                                        ? 'bg-white text-black hover:bg-gray-200'
                                                        : canAfford
                                                            ? 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                                                            : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
                                                }
                                            `}
                                        >
                                            {equipped ? (
                                                <><Check className="w-4 h-4" /> {t('equipped')}</>
                                            ) : isUnlocked ? (
                                                t('equip')
                                            ) : (
                                                <>
                                                    <Coins className="w-4 h-4" />
                                                    {t('unlockForCosmic')} {item.costParticles.toLocaleString()}
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
