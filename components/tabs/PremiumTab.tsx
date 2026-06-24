'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useShallow } from 'zustand/react/shallow'
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
        vipTier,
        purchasePremiumUpgrade,
        equipSkin,
        equipTheme,
        unlockedSkins,
        unlockedThemes,
        claimDailyBonus,
        lastDailyBonusTime,
        loginStreak,
        nullifierHash,
        loadGameState
    } = useGameStore(useShallow(state => ({
        premiumParticleSkin: state.premiumParticleSkin,
        premiumBackgroundTheme: state.premiumBackgroundTheme,
        premiumLuckyParticle: state.premiumLuckyParticle,
        premiumOfflineEarnings: state.premiumOfflineEarnings,
        premiumDailyBonus: state.premiumDailyBonus,
        premiumVIP: state.premiumVIP,
        vipTier: state.vipTier,
        purchasePremiumUpgrade: state.purchasePremiumUpgrade,
        equipSkin: state.equipSkin,
        equipTheme: state.equipTheme,
        unlockedSkins: state.unlockedSkins,
        unlockedThemes: state.unlockedThemes,
        claimDailyBonus: state.claimDailyBonus,
        lastDailyBonusTime: state.lastDailyBonusTime,
        loginStreak: state.loginStreak,
        nullifierHash: state.nullifierHash,
        loadGameState: state.loadGameState
    })))

    const [purchasing, setPurchasing] = useState<string | null>(null)

    // Telegram-specific states
    const isTelegram = typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true' || !!(window as any).Telegram?.WebApp)
    const [paymentMethodItem, setPaymentMethodItem] = useState<any | null>(null)
    const [verifyingTon, setVerifyingTon] = useState(false)
    const [tonWalletConnected, setTonWalletConnected] = useState(false)
    const [tonConnectUI, setTonConnectUI] = useState<any>(null)
    const [tonPrice, setTonPrice] = useState<number>(5.25)

    useEffect(() => {
        if (isTelegram) {
            // Fetch TON price once on mount
            fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd')
                .then(r => r.json())
                .then(data => {
                    const price = data['the-open-network']?.usd
                    if (price) setTonPrice(price)
                })
                .catch(e => console.warn('Failed to fetch TON price on mount:', e))

            // Initialize TON Connect
            if (typeof window !== 'undefined' && window.TonConnectSDK) {
                try {
                    const ui = new window.TonConnectSDK.TonConnectUI({
                        manifestUrl: 'https://tgvoid.skyreel.art/tonconnect-manifest.json'
                    })
                    setTonConnectUI(ui)
                    setTonWalletConnected(ui.connected)

                    const unsubscribe = ui.onStatusChange((wallet: any) => {
                        setTonWalletConnected(!!wallet)
                    })
                    return () => unsubscribe()
                } catch (e) {
                    console.error('Failed to initialize TON Connect UI:', e)
                }
            }
        }
    }, [isTelegram])

    const upgrades: PremiumUpgrade[] = [
        // Cosmetic
        {
            id: 'particle_skin_rainbow',
            name: 'Rainbow Particle',
            description: 'Transform your void particle into a mesmerizing rainbow effect',
            image: '/assets/premium/rainbow.png',
            price: 0.13,
            category: 'cosmetic',
            owned: unlockedSkins.includes('rainbow')
        },
        {
            id: 'particle_skin_gold',
            name: 'Golden Particle',
            description: 'Make your particle shine with prestigious golden glow',
            image: '/assets/premium/gold.png',
            price: 0.19,
            category: 'cosmetic',
            owned: unlockedSkins.includes('gold')
        },
        {
            id: 'background_nebula',
            name: 'Nebula Theme',
            description: 'Beautiful purple nebula background with animated stars',
            image: '/assets/premium/nebula.png',
            price: 0.15,
            category: 'cosmetic',
            owned: unlockedThemes.includes('nebula')
        },
        {
            id: 'background_galaxy',
            name: 'Galaxy Theme',
            description: 'Deep space galaxy with swirling cosmic dust',
            image: '/assets/premium/galaxy.png',
            price: 0.23,
            category: 'cosmetic',
            owned: unlockedThemes.includes('galaxy')
        },

        // Boosts
        {
            id: 'lucky_particle',
            name: 'Lucky Particle',
            description: '5% chance to earn 2x particles per click',
            image: '/assets/premium/lucky.png',
            price: 0.19,
            category: 'boost',
            owned: premiumLuckyParticle
        },
        {
            id: 'offline_earnings',
            name: 'Offline Earnings',
            description: 'Earn 10% of particles while away (max 4 hours)',
            image: '/assets/premium/offline.png',
            price: 0.25,
            category: 'boost',
            owned: premiumOfflineEarnings
        },
        {
            id: 'daily_bonus',
            name: 'Daily Bonus',
            description: '+760 particles every day with login streaks',
            image: '/assets/premium/daily.png',
            price: 0.35,
            category: 'boost',
            owned: premiumDailyBonus
        },

        // VIP
        {
            id: 'vip',
            name: 'VIP Status (PROMO -50%!)',
            description: 'Unlock ALL premium features at once!',
            image: '/assets/premium/vip.png',
            price: 5.00,
            category: 'advanced',
            owned: premiumVIP
        }
    ]

    const handlePurchase = async (upgradeId: string, price: number) => {
        // Handle tier purchases vs regular upgrades
        let upgradeName = ''
        let isTierPurchase = false

        if (upgradeId.startsWith('vip_tier_')) {
            isTierPurchase = true
            const tier = parseInt(upgradeId.replace('vip_tier_', ''))
            const tierNames = ['', 'Bronze VIP', 'Silver VIP', 'Gold VIP', 'Platinum VIP']
            upgradeName = tierNames[tier] || 'VIP Tier'
        } else {
            upgradeName = upgrades.find(u => u.id === upgradeId)?.name || 'Premium Upgrade'

            // Check if already owned
            const upgrade = upgrades.find(u => u.id === upgradeId)
            if (upgrade?.owned) {
                toast.error('Already owned')
                return
            }
        }

        if (isTelegram) {
            setPaymentMethodItem({
                id: upgradeId,
                name: upgradeName,
                description: `Purchase ${upgradeName}`,
                price: price
            })
            return
        }

        setPurchasing(upgradeId)

        try {
            // Check if MiniKit is installed
            if (!MiniKit.isInstalled()) {
                toast.error('⚠️ MiniKit not installed (not in WorldApp)')
                setPurchasing(null)
                return
            }

            // Handle tier purchases vs regular upgrades
            let upgradeName = ''
            let isTierPurchase = false

            if (upgradeId.startsWith('vip_tier_')) {
                isTierPurchase = true
                const tier = parseInt(upgradeId.replace('vip_tier_', ''))
                const tierNames = ['', 'Bronze VIP', 'Silver VIP', 'Gold VIP', 'Platinum VIP']
                upgradeName = tierNames[tier] || 'VIP Tier'
            } else {
                upgradeName = upgrades.find(u => u.id === upgradeId)?.name || 'Premium Upgrade'

                // Check if already owned
                const upgrade = upgrades.find(u => u.id === upgradeId)
                if (upgrade?.owned) {
                    toast.error('Already owned')
                    setPurchasing(null)
                    return
                }
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
                if (isTierPurchase) {
                    // Tier purchase - save to backend
                    const tier = parseInt(upgradeId.replace('vip_tier_', ''))
                    const state = useGameStore.getState()

                    if (!state.nullifierHash) {
                        toast.error('Not authenticated')
                        setPurchasing(null)
                        return
                    }

                    const response = await fetch('/api/purchase-tier', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tier,
                            transaction_ref: uuid,
                            amount: price,
                            nullifier_hash: state.nullifierHash
                        })
                    })

                    if (response.ok) {
                        // Reload game state to get new tier
                        await state.loadGameState(state.nullifierHash)
                        toast.success(`✅ ${upgradeName} unlocked!`)
                    } else {
                        const error = await response.json()
                        console.error('[Premium] Tier purchase failed:', error)
                        toast.error(`Failed to save tier: ${error.error || 'Unknown error'}`)
                    }
                } else {
                    // Regular upgrade
                    purchasePremiumUpgrade(upgradeId)
                    toast.success(`✅ ${upgradeName} unlocked!`)
                }
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

    const payWithStars = async (item: any) => {
        setPurchasing(item.id)
        setPaymentMethodItem(null)
        try {
            const priceStars = Math.round(item.price * 50) // 1 USD = 50 Stars
            const response = await fetch('/api/telegram/pay-stars', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId: item.id,
                    priceStars,
                    title: item.name,
                    description: item.description
                })
            })
            const data = await response.json()
            if (!response.ok || !data.success) {
                toast.error(data.error || 'Failed to create invoice')
                return
            }

            const tg = (window as any).Telegram
            if (tg?.WebApp) {
                tg.WebApp.openInvoice(data.invoiceLink, async (status: string) => {
                    if (status === 'paid') {
                        toast.success(`✅ ${item.name} purchased successfully!`)
                        if (nullifierHash) {
                            await loadGameState(nullifierHash)
                        }
                        window.location.reload()
                    } else if (status === 'cancelled') {
                        toast.error('Payment cancelled')
                    } else {
                        toast.error('Payment failed or pending')
                    }
                })
            } else {
                toast.error('Telegram WebApp interface not found')
            }
        } catch (err: any) {
            console.error(err)
            toast.error('Error processing Stars payment')
        } finally {
            setPurchasing(null)
        }
    }

    const payWithTon = async (item: any) => {
        if (!tonConnectUI) {
            toast.error('TON Connect not initialized')
            return
        }

        if (!tonWalletConnected) {
            try {
                await tonConnectUI.openModal()
                return
            } catch (e) {
                toast.error('Failed to open wallet modal')
                return
            }
        }

        setPurchasing(item.id)
        setPaymentMethodItem(null)
        setVerifyingTon(true)
        toast.loading('Sending transaction request to wallet...', { id: 'ton-purchase' })

        try {
            const configRes = await fetch('/api/telegram/verify-ton')
            const configData = await configRes.json()
            const merchantAddress = configData.merchantAddress

            if (!merchantAddress) {
                toast.error('Merchant TON wallet not configured on server', { id: 'ton-purchase' })
                setVerifyingTon(false)
                setPurchasing(null)
                return
            }

            const tonAmount = item.price / tonPrice
            const tonAmountNano = Math.ceil(tonAmount * 1e9)

            if (!nullifierHash) {
                toast.error('Session not found. Please log in again.', { id: 'ton-purchase' })
                setVerifyingTon(false)
                setPurchasing(null)
                return
            }

            const expectedComment = `VC-${nullifierHash}-${item.id}`

            const textToHex = (text: string) => {
                let hex = ''
                for (let i = 0; i < text.length; i++) {
                    hex += text.charCodeAt(i).toString(16).padStart(2, '0')
                }
                return hex
            }
            const payloadHex = '00000000' + textToHex(expectedComment)

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 360,
                messages: [
                    {
                        address: merchantAddress,
                        amount: tonAmountNano.toString(),
                        payload: payloadHex
                    }
                ]
            }

            await tonConnectUI.sendTransaction(transaction)

            toast.loading('Transaction submitted. Confirming on blockchain...', { id: 'ton-purchase' })

            let attempts = 0
            const maxAttempts = 15
            const verifyInterval = setInterval(async () => {
                attempts++
                try {
                    const verifyRes = await fetch('/api/telegram/verify-ton', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: nullifierHash,
                            itemId: item.id
                        })
                    })
                    const verifyData = await verifyRes.json()

                    if (verifyRes.ok && verifyData.success) {
                        clearInterval(verifyInterval)
                        setVerifyingTon(false)
                        setPurchasing(null)
                        toast.success(`✅ ${item.name} purchased successfully via TON!`, { id: 'ton-purchase' })
                        if (nullifierHash) {
                            await loadGameState(nullifierHash)
                        }
                        window.location.reload()
                    } else if (attempts >= maxAttempts) {
                        clearInterval(verifyInterval)
                        setVerifyingTon(false)
                        setPurchasing(null)
                        toast.error('Verification timed out. Purchase will be processed once transaction is confirmed.', { id: 'ton-purchase' })
                    }
                } catch (err) {
                    console.error('Error verifying TON purchase:', err)
                    if (attempts >= maxAttempts) {
                        clearInterval(verifyInterval)
                        setVerifyingTon(false)
                        setPurchasing(null)
                        toast.error('Verification timed out or failed.', { id: 'ton-purchase' })
                    }
                }
            }, 4000)

        } catch (err: any) {
            console.error('TON Purchase failed:', err)
            toast.error(err.message || 'Transaction rejected by wallet', { id: 'ton-purchase' })
            setVerifyingTon(false)
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
            toast.success(`🎁 Daily bonus claimed! +760 particles (Streak: ${loginStreak + 1})`)
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
                <p className="text-text-secondary">
                    {isTelegram ? 'Exclusive upgrades powered by Stars, TON & VOID' : 'Exclusive upgrades powered by WLD & VOID'}
                </p>
            </div>

            {/* VIP Tier Section */}
            <div className="mb-10">
                <h3 className="text-xl font-bold mb-4 text-center">👑 Poziomy VIP</h3>

                {/* Current Tier Badge */}
                {vipTier > 0 && (
                    <div className="mb-6 text-center">
                        <div className="inline-block px-4 py-2 bg-gradient-to-r from-void-purple to-void-blue rounded-full shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                            <span className="text-sm font-bold text-white">
                                Aktualny Status: {['', '🥉 Bronze VIP', '🥈 Silver VIP', '🥇 Gold VIP', '💎 Platinum VIP'][vipTier]}
                            </span>
                        </div>
                    </div>
                )}

                {/* Tier Cards */}
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { tier: 1, name: '🥉 Bronze VIP', price: 1.75, originalPrice: 4.00, discount: '56%', benefits: ['Wszystkie ulepszenia', 'Lucky 5% szans na 2x'] },
                        { tier: 2, name: '🥈 Silver VIP', price: 2.75, originalPrice: 6.00, discount: '54%', benefits: ['Lucky 8% szans na 2x', '+2 na kliknięcie', 'Brak reklam'] },
                        { tier: 3, name: '🥇 Gold VIP', price: 3.75, originalPrice: 9.00, discount: '58%', benefits: ['Lucky 12% na 3x', 'Mega 1% na 10x', 'Priorytet'], isPopular: true },
                        { tier: 4, name: '💎 Platinum VIP', price: 5.00, originalPrice: 12.00, discount: '58%', benefits: ['Lucky 15% na 5x', 'Mega 3% na 15x', 'Natychmiastowe'] }
                    ].map(({ tier, name, price, originalPrice, discount, benefits, isPopular }) => {
                        const isCurrent = vipTier === tier
                        const canUpgrade = vipTier < tier
                        const tierColors = ['', 'from-amber-600/10 to-amber-800/10 border-amber-500/20 hover:border-amber-500/40',
                            'from-gray-400/10 to-gray-600/10 border-gray-400/20 hover:border-gray-400/40',
                            'from-yellow-500/20 to-yellow-700/20 border-yellow-400/50 shadow-[0_0_15px_rgba(234,179,8,0.15)]',
                            'from-purple-500/10 to-pink-500/10 border-purple-400/20 hover:border-purple-400/40']

                        return (
                            <div
                                key={tier}
                                className={`relative p-4 bg-gradient-to-br ${tierColors[tier]} border rounded-2xl flex flex-col justify-between transition-all duration-300 ${
                                    isCurrent ? 'ring-2 ring-particle-glow border-transparent' : ''
                                } ${isPopular ? 'ring-2 ring-yellow-400 border-transparent scale-[1.02]' : ''}`}
                            >
                                {/* Popular/Decoy Badge */}
                                {isPopular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-yellow-400 text-black text-[10px] font-black rounded-full uppercase tracking-wider shadow-md">
                                        Najpopularniejszy 🔥
                                    </div>
                                )}

                                <div>
                                    <div className="text-center mb-2">
                                        <div className="font-extrabold text-sm text-white tracking-wide">{name}</div>
                                        {/* Slashed pricing & Discount percentages (Price Psychology) */}
                                        <div className="flex items-center justify-center gap-1.5 mt-1">
                                            <span className="text-xs line-through text-text-secondary">
                                                {isTelegram ? `${Math.round(originalPrice * 50)} ⭐️` : `${originalPrice.toFixed(2)} WLD`}
                                            </span>
                                            <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-black">
                                                -{discount}
                                            </span>
                                        </div>
                                        <div className="text-sm font-black text-yellow-400 mt-0.5">
                                            {isTelegram ? `${Math.round(price * 50)} ⭐️` : `${price.toFixed(2)} WLD`}
                                        </div>
                                        {isTelegram && (
                                            <div className="text-[10px] text-text-secondary">
                                                / {(price / tonPrice).toFixed(3)} TON
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-[11px] text-text-secondary space-y-1.5 my-3 border-t border-white/5 pt-3">
                                        {benefits.map((b, i) => <div key={i} className="flex items-start gap-1"><span>•</span> <span>{b}</span></div>)}
                                    </div>
                                </div>

                                <div>
                                    {isCurrent && (
                                        <div className="mt-2 text-xs font-black text-center text-green-400 tracking-widest bg-green-500/10 py-1.5 rounded-lg border border-green-500/20">
                                            AKTYWNY
                                        </div>
                                    )}
                                    {canUpgrade && (
                                        <button
                                            onClick={() => {
                                                const tierPrices = [0, 1.75, 2.75, 3.75, 5.00]
                                                const upgradeCost = tierPrices[tier] - tierPrices[vipTier]

                                                console.log('[Premium] Tier purchase:', { tier, vipTier, price, upgradeCost })
                                                if (upgradeCost > 0) {
                                                    handlePurchase(`vip_tier_${tier}`, upgradeCost)
                                                } else {
                                                    toast.error("Nie możesz przejść na niższy lub ten sam poziom")
                                                }
                                            }}
                                            className={`mt-2 w-full py-2 hover:scale-105 rounded-xl text-xs font-bold transition-all duration-200 ${
                                                isPopular 
                                                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-extrabold shadow-lg shadow-yellow-500/20' 
                                                    : 'bg-void-purple hover:bg-void-purple/80 text-white'
                                            }`}
                                        >
                                            {vipTier === 0 ? 'Kupuję' : 'Ulepszam'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Daily Bonus & Interactive Streak Track Section */}
            {premiumDailyBonus && (
                <motion.div
                    className="mb-8 p-6 bg-gradient-to-br from-void-purple/20 via-void-blue/15 to-transparent border-2 border-particle-glow/30 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl animate-bounce">🎁</span>
                                <h3 className="font-extrabold text-lg text-white">Codzienny Bonus</h3>
                            </div>
                            <p className="text-xs text-text-secondary">
                                Seria logowań: <span className="text-yellow-400 font-bold">{loginStreak} dni</span> 🔥
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-semibold text-text-secondary mb-2">
                                Następny za: <span className="text-particle-glow font-bold">{getCooldownStatus()}</span>
                            </div>
                            <button
                                onClick={handleClaimDaily}
                                disabled={getCooldownStatus() !== 'Ready!'}
                                className={`
                                    px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300
                                    ${getCooldownStatus() === 'Ready!'
                                        ? 'bg-gradient-to-r from-void-purple to-void-blue hover:scale-105 shadow-[0_0_15px_rgba(139,92,246,0.4)] text-white'
                                        : 'bg-white/5 text-white/30 border border-white/5 opacity-50 cursor-not-allowed'
                                    }
                                `}
                            >
                                Odbierz +760 cząsteczek
                            </button>
                        </div>
                    </div>

                    {/* Choice Architecture & Streak Progression Grid */}
                    <div className="mt-6 border-t border-white/5 pt-5">
                        <div className="text-xs font-bold text-white/70 mb-3 uppercase tracking-wider">Twoja seria w tym tygodniu:</div>
                        <div className="grid grid-cols-7 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                                const currentStreakDay = loginStreak > 0 ? ((loginStreak - 1) % 7) + 1 : 0
                                const isReady = getCooldownStatus() === 'Ready!'
                                const isClaimed = day < currentStreakDay || (day === currentStreakDay && !isReady)
                                const isCurrent = day === currentStreakDay && isReady

                                return (
                                    <div
                                        key={day}
                                        className={`relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-300 ${
                                            isClaimed
                                                ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-[inset_0_0_10px_rgba(74,222,128,0.05)]'
                                                : isCurrent
                                                    ? 'bg-particle-glow/20 border-particle-glow text-white shadow-[0_0_10px_rgba(192,132,252,0.4)] animate-pulse'
                                                    : 'bg-white/5 border-white/5 text-white/30'
                                        }`}
                                    >
                                        <span className="text-[9px] font-semibold mb-1">Dzień {day}</span>
                                        <span className="text-base select-none">
                                            {isClaimed ? '✅' : day === 7 ? '👑' : '🎁'}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Loss Aversion Warning Banner */}
                    {loginStreak > 0 && (
                        <div className="mt-4 p-3 bg-red-950/20 border border-red-500/20 rounded-2xl flex items-start gap-3">
                            <span className="text-base select-none">⚠️</span>
                            <div className="text-[11px] text-red-200/90 leading-relaxed">
                                <span className="font-bold text-red-400">Ochrona serii logowań:</span> Twoja seria to obecnie <span className="font-bold text-red-400">{loginStreak} dni</span>. Odbieraj nagrody codziennie! Jeśli pominiesz jeden dzień, licznik serii logowań zresetuje się całkowicie do zera.
                            </div>
                        </div>
                    )}
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
                                                    ) : isTelegram ? (
                                                        <>⭐️ {Math.round(upgrade.price * 50)} / {(upgrade.price / tonPrice).toFixed(3)} TON</>
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

            {/* Telegram Payment Method Selection Modal */}
            {paymentMethodItem && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(5, 3, 15, 0.85)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    zIndex: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '380px',
                        background: 'radial-gradient(circle at top left, #1c0e35 0%, #0a0518 100%)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '24px',
                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(139, 92, 246, 0.15)',
                        padding: '24px',
                        position: 'relative',
                    }}>
                        {/* Title */}
                        <h3 style={{
                            fontSize: '20px',
                            fontWeight: 800,
                            color: '#e0e0ff',
                            textAlign: 'center',
                            marginBottom: '6px',
                            letterSpacing: '0.5px'
                        }}>
                            Select Payment Method
                        </h3>
                        <p style={{
                            fontSize: '12px',
                            color: '#9ca3af',
                            textAlign: 'center',
                            marginBottom: '20px'
                        }}>
                            Choose how you want to purchase <span style={{ color: '#fbbf24', fontWeight: 600 }}>{paymentMethodItem.name}</span>
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Stars Payment Card */}
                            <div 
                                onClick={() => payWithStars(paymentMethodItem)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(251, 191, 36, 0.2)',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        fontSize: '24px',
                                        background: 'rgba(251, 191, 36, 0.1)',
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        ⭐
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#f3f4f6' }}>Telegram Stars</div>
                                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Fast in-app checkout</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#fbbf24' }}>
                                    {Math.round(paymentMethodItem.price * 50)} ⭐️
                                </div>
                            </div>

                            {/* TON Connect Payment Card */}
                            <div 
                                onClick={() => payWithTon(paymentMethodItem)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(56, 189, 248, 0.2)',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        fontSize: '24px',
                                        background: 'rgba(56, 189, 248, 0.1)',
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        💎
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#f3f4f6' }}>TON Connect</div>
                                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                                            {tonWalletConnected ? 'Wallet connected' : 'Connect wallet'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8' }}>
                                    {(paymentMethodItem.price / tonPrice).toFixed(3)} TON
                                </div>
                            </div>
                        </div>

                        {/* Cancel Button */}
                        <button
                            onClick={() => setPaymentMethodItem(null)}
                            style={{
                                width: '100%',
                                marginTop: '20px',
                                padding: '12px',
                                borderRadius: '14px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.05)',
                                color: '#9ca3af',
                                fontWeight: 700,
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
