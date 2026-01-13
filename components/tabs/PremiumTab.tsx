'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { MiniKit, Tokens, Network, tokenToDecimals } from '@worldcoin/minikit-js'
import Image from 'next/image'

interface PremiumUpgrade {
    id: string
    name: string
    description: string
    image: string
    price: number // WLD
    category: 'cosmetic' | 'qol' | 'boost' | 'advanced'
    owned: boolean
}

export default function PremiumTab() {
    const {
        premiumParticleSkin,
        premiumBackgroundTheme,
        premiumLuckyParticle,
        premiumOfflineEarnings,
        premiumDailyBonus,
        premiumVIP,
        purchasePremiumUpgrade,
        equipSkin,
        equipTheme,
        unlockedSkins,
        unlockedThemes,
        claimDailyBonus,
        lastDailyBonusTime,
        loginStreak
    } = useGameStore()

    const [purchasing, setPurchasing] = useState<string | null>(null)

    const upgrades: PremiumUpgrade[] = [
        // Cosmetic
        {
            id: 'particle_skin_rainbow',
            name: 'Rainbow Particle',
            description: 'Transform your void particle into a mesmerizing rainbow effect',
            image: '/assets/premium/rainbow.png',
            price: 0.10,
            category: 'cosmetic',
            owned: unlockedSkins.includes('rainbow')
        },
        {
            id: 'particle_skin_gold',
            name: 'Golden Particle',
            description: 'Make your particle shine with prestigious golden glow',
            image: '/assets/premium/gold.png',
            price: 0.15,
            category: 'cosmetic',
            owned: unlockedSkins.includes('gold')
        },
        {
            id: 'background_nebula',
            name: 'Nebula Theme',
            description: 'Beautiful purple nebula background with animated stars',
            image: '/assets/premium/nebula.png',
            price: 0.12,
            category: 'cosmetic',
            owned: unlockedThemes.includes('nebula')
        },
        {
            id: 'background_galaxy',
            name: 'Galaxy Theme',
            description: 'Deep space galaxy with swirling cosmic dust',
            image: '/assets/premium/galaxy.png',
            price: 0.18,
            category: 'cosmetic',
            owned: unlockedThemes.includes('galaxy')
        },

        // Boosts
        {
            id: 'lucky_particle',
            name: 'Lucky Particle',
            description: '5% chance to earn 2x particles per click',
            image: '/assets/premium/lucky.png',
            price: 0.15,
            category: 'boost',
            owned: premiumLuckyParticle
        },
        {
            id: 'offline_earnings',
            name: 'Offline Earnings',
            description: 'Earn 10% of particles while away (max 4 hours)',
            image: '/assets/premium/offline.png',
            price: 0.20,
            category: 'boost',
            owned: premiumOfflineEarnings
        },
        {
            id: 'daily_bonus',
            name: 'Daily Bonus',
            description: '+500 particles every day with login streaks',
            image: '/assets/premium/daily.png',
            price: 0.18,
            category: 'boost',
            owned: premiumDailyBonus
        },

        // VIP
        {
            id: 'vip',
            name: 'VIP Status',
            description: 'Unlock ALL premium features at once!',
            image: '/assets/premium/vip.png',
            price: 0.25,
            category: 'advanced',
            owned: premiumVIP
        }
    ]

    const handlePurchase = async (upgradeId: string, price: number) => {
        setPurchasing(upgradeId)

        try {
            // Check if MiniKit is installed
            if (!MiniKit.isInstalled()) {
                toast.error('⚠️ MiniKit not installed (not in WorldApp)')
                setPurchasing(null)
                return
            }

            // Get upgrade name for display
            const upgradeName = upgrades.find(u => u.id === upgradeId)?.name || 'Premium Upgrade'

            // Check if already owned
            const upgrade = upgrades.find(u => u.id === upgradeId)
            if (upgrade?.owned) {
                toast.error('Already owned')
                setPurchasing(null)
                return
            }

            // Validate minimum payment amount (World App requirement)
            if (price < 0.1) {
                toast.error('⚠️ Minimum payment is 0.1 WLD (World App requirement)')
                setPurchasing(null)
                return
            }

            // Generate UUID for reference
            const uuid = window.crypto.randomUUID()

            const payload = {
                reference: uuid,
                to: '0xc7d0ef606a313bfd69e6cc1c44065df8d99b8dfc',
                tokens: [
                    {
                        symbol: Tokens.WLD,
                        token_amount: tokenToDecimals(price, Tokens.WLD).toString()
                    }
                ],
                network: Network.WorldChain,
                description: upgradeName
            }

            // Initiate WLD payment through MiniKit with Timeout
            const paymentPromise = MiniKit.commandsAsync.pay(payload)

            // Timeout race - increased to 15s
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Payment timed out after 15s')), 15000)
            )

            const result = await Promise.race([paymentPromise, timeoutPromise]) as any
            const { finalPayload } = result

            if (finalPayload?.status === 'success') {
                // Payment successful - unlock upgrade
                purchasePremiumUpgrade(upgradeId)
                toast.success(`✅ ${upgradeName} unlocked!`)
            } else {
                // Payment cancelled or failed
                const errorMsg = finalPayload?.error_code || 'Payment cancelled'
                toast.error(`❌ ${errorMsg}`)
            }

            setPurchasing(null)
        } catch (error: any) {
            console.error('[Premium] Payment error:', error)
            toast.error(`Payment failed: ${error?.message || 'Unknown error'}`)
            setPurchasing(null)
        }
    }

    const handleEquip = (upgradeId: string) => {
        if (upgradeId.startsWith('particle_skin_')) {
            const skinId = upgradeId.replace('particle_skin_', '')
            equipSkin(skinId)
            toast.success('Particle skin equipped!')
        } else if (upgradeId.startsWith('background_')) {
            const themeId = upgradeId.replace('background_', '')
            equipTheme(themeId)
            toast.success('Background theme equipped!')
        }
    }

    const isActive = (upgradeId: string) => {
        if (upgradeId.includes('particle_skin_')) {
            const skinId = upgradeId.replace('particle_skin_', '')
            return premiumParticleSkin === skinId
        }
        if (upgradeId.includes('background_')) {
            const themeId = upgradeId.replace('background_', '')
            return premiumBackgroundTheme === themeId
        }
        return false
    }

    const handleClaimDaily = () => {
        const success = claimDailyBonus()
        if (success) {
            toast.success(`🎁 Daily bonus claimed! +500 particles (Streak: ${loginStreak + 1})`)
        } else if (!premiumDailyBonus) {
            toast.error('Purchase Daily Bonus upgrade first')
        } else {
            toast.error('Daily bonus not ready yet (24h cooldown)')
        }
    }

    const getCooldownStatus = () => {
        if (!premiumDailyBonus || !lastDailyBonusTime) return 'Ready!'

        const now = Date.now()
        const diff = now - lastDailyBonusTime
        const oneDayMs = 24 * 60 * 60 * 1000

        if (diff >= oneDayMs) return 'Ready!'

        const hoursLeft = Math.floor((oneDayMs - diff) / (60 * 60 * 1000))
        const minutesLeft = Math.floor(((oneDayMs - diff) % (60 * 60 * 1000)) / (60 * 1000))

        return `${hoursLeft}h ${minutesLeft}m`
    }

    const categories = {
        cosmetic: { name: '🎨 Cosmetic', upgrades: upgrades.filter(u => u.category === 'cosmetic') },
        boost: { name: '⚡ Boosts', upgrades: upgrades.filter(u => u.category === 'boost') },
        advanced: { name: '👑 VIP', upgrades: upgrades.filter(u => u.category === 'advanced') }
    }

    return (
        <div className="py-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">💎 Premium Shop</h2>
                <p className="text-text-secondary">Exclusive upgrades powered by WLD</p>
            </div>

            {/* Daily Bonus Section */}
            {premiumDailyBonus && (
                <motion.div
                    className="mb-8 p-6 bg-gradient-to-br from-void-purple/20 to-void-blue/20 border-2 border-particle-glow/30 rounded-2xl"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">🎁</span>
                                <h3 className="font-bold text-lg">Daily Bonus</h3>
                            </div>
                            <p className="text-sm text-text-secondary">
                                Login Streak: {loginStreak} days 🔥
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-text-secondary mb-2">
                                {getCooldownStatus()}
                            </div>
                            <button
                                onClick={handleClaimDaily}
                                disabled={getCooldownStatus() !== 'Ready!'}
                                className={`
                                    px-6 py-2 rounded-lg font-bold text-sm
                                    ${getCooldownStatus() === 'Ready!'
                                        ? 'bg-gradient-to-r from-void-purple to-void-blue hover:scale-105'
                                        : 'bg-gray-600 opacity-50 cursor-not-allowed'
                                    }
                                    transition-all
                                `}
                            >
                                Claim +500
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Upgrade Categories */}
            {Object.entries(categories).map(([key, { name, upgrades: catUpgrades }]) => (
                <div key={key} className="mb-8">
                    <h3 className="text-xl font-bold mb-4">{name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {catUpgrades.map((upgrade) => {
                            const isCosmetic = upgrade.category === 'cosmetic'
                            const act = isActive(upgrade.id)
                            const isOwned = upgrade.owned

                            return (
                                <motion.div
                                    key={upgrade.id}
                                    className={`
                                p-6 rounded-xl border-2
                                ${isOwned
                                            ? 'bg-particle-glow/10 border-particle-glow/50'
                                            : 'bg-void-purple/5 border-void-purple/30'
                                        }
                            `}
                                    whileHover={{ scale: isOwned ? 1 : 1.02 }}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="relative w-16 h-16 shrink-0">
                                            <Image
                                                src={upgrade.image}
                                                alt={upgrade.name}
                                                fill
                                                className="rounded-xl object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-bold">{upgrade.name}</h4>
                                                {isOwned && (
                                                    <span className="text-xs bg-particle-glow/20 text-particle-glow px-2 py-1 rounded">
                                                        Owned
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-text-secondary mb-4">
                                                {upgrade.description}
                                            </p>

                                            {isCosmetic && isOwned ? (
                                                <button
                                                    onClick={() => handleEquip(upgrade.id)}
                                                    disabled={act}
                                                    className={`
                                                w-full py-2 px-4 rounded-lg font-bold text-sm
                                                ${act
                                                            ? 'bg-white/10 text-white cursor-default'
                                                            : 'bg-particle-glow text-black hover:scale-105'
                                                        }
                                                transition-all
                                            `}
                                                >
                                                    {act ? 'Equipped' : 'Equip'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handlePurchase(upgrade.id, upgrade.price)}
                                                    disabled={isOwned || purchasing === upgrade.id}
                                                    className={`
                                                w-full py-2 px-4 rounded-lg font-bold text-sm
                                                ${isOwned
                                                            ? 'bg-gray-600 opacity-50 cursor-not-allowed'
                                                            : 'bg-gradient-to-r from-void-purple to-void-blue hover:scale-105'
                                                        }
                                                transition-all flex items-center justify-center gap-2
                                            `}
                                                >
                                                    {purchasing === upgrade.id ? (
                                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" />
                                                    ) : isOwned ? (
                                                        'Unlocked'
                                                    ) : (
                                                        <>💎 {upgrade.price} WLD</>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}
