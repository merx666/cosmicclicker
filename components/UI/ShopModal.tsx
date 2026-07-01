'use client'

import { motion } from 'framer-motion'

import { useState, useEffect } from 'react'
import { MiniKit, Tokens, tokenToDecimals, Network } from '@worldcoin/minikit-js'
import { useTranslation } from '@/lib/i18n'
import { showToast } from '@/components/UI/ToastNotification'
import { useGameStore } from '@/store/gameStore'

declare global {
    interface Window {
        TonConnectSDK?: any;
    }
}

interface ShopModalProps {
    isOpen: boolean
    onClose: () => void
    userInventory?: any[]
    highlightItem?: string
}

interface ShopItem {
    id: string
    name: string
    description: string
    type: string
    price: number
    priceParticles?: number // NEW: for particle purchases
    permanent: boolean
    icon?: string
    stats?: any
    discountText?: string
    originalPrice?: number
    timeLeft?: number
}

export default function ShopModal({ isOpen, onClose, userInventory = [], highlightItem }: ShopModalProps) {
    const { t } = useTranslation()
    const [catalog, setCatalog] = useState<any>(null)
    const [selectedCategory, setSelectedCategory] = useState('towers')
    const [purchasing, setPurchasing] = useState<string | null>(null)
    
    // Telegram-specific states
    const isTelegram = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true'
    const [paymentMethodItem, setPaymentMethodItem] = useState<ShopItem | null>(null)
    const [verifyingTon, setVerifyingTon] = useState(false)
    const [tonWalletConnected, setTonWalletConnected] = useState(false)
    const [tonConnectUI, setTonConnectUI] = useState<any>(null)
    const [tonPrice, setTonPrice] = useState<number>(5.25)

    useEffect(() => {
        if (isOpen) {
            fetchCatalog()
            
            // Fetch TON price once on open
            if (isTelegram) {
                fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd')
                    .then(r => r.json())
                    .then(data => {
                        const price = data['the-open-network']?.usd
                        if (price) setTonPrice(price)
                    })
                    .catch(e => console.warn('Failed to fetch TON price on open:', e))
            }
        }
    }, [isOpen])

    useEffect(() => {
        if (typeof window !== 'undefined' && window.TonConnectSDK && isTelegram && isOpen) {
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
    }, [isOpen, isTelegram])

    useEffect(() => {
        if (catalog && highlightItem) {
            for (const [cat, data] of Object.entries(catalog.categories)) {
                // @ts-ignore
                if (data.some(i => i.id === highlightItem)) {
                    setSelectedCategory(cat)
                    break
                }
            }
        }
    }, [catalog, highlightItem])

    const fetchCatalog = async () => {
        try {
            const res = await fetch('/api/shop/catalog')
            const data = await res.json()
            setCatalog(data)
        } catch (error) {
            console.error('Failed to fetch catalog:', error)
        }
    }

    const handlePurchase = async (item: ShopItem) => {
        if (isTelegram) {
            setPaymentMethodItem(item)
            return
        }

        setPurchasing(item.id)

        try {
            if (MiniKit.isInstalled()) {
                // === PRODUCTION: Real WLD payment via MiniKit ===
                const merchantAddress = '0xc7d0ef606a313bfd69e6cc1c44065df8d99b8dfc'

                const initRes = await fetch('/api/initiate-payment', { method: 'POST' })
                const { id } = await initRes.json()

                const res = await MiniKit.commandsAsync.pay({
                    reference: id,
                    to: merchantAddress,
                    tokens: [{
                        symbol: Tokens.WLD,
                        token_amount: tokenToDecimals(item.price, Tokens.WLD).toString()
                    }],
                    network: Network.WorldChain,
                    description: `Purchase ${item.name}`
                })

                if (res.finalPayload.status === 'success') {
                    const purchaseRes = await fetch('/api/shop/purchase', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ itemId: item.id, payload: res.finalPayload, isDev: false })
                    })
                    const data = await purchaseRes.json()
                    if (data.success) {
                        showToast(`${item.name} purchased!`, 'success', '✅')
                        onClose()
                        try {
                            await useGameStore.getState().saveGameState()
                        } catch (e) {
                            console.error('Failed to save game state before reload:', e)
                        }
                        window.location.reload()
                    } else {
                        showToast(data.error || 'Unknown error', 'error')
                    }
                } else {
                    showToast('Payment cancelled or failed', 'warning')
                }
            } else {
                // === DEV MODE: Skip payment, register purchase as dev ===
                await new Promise(r => setTimeout(r, 500))

                const res = await fetch('/api/shop/purchase', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ itemId: item.id, payload: { status: 'success' }, isDev: true })
                })
                const data = await res.json()
                if (data.success) {
                    showToast(`${item.name} purchased! (DEV)`, 'success', '✅')
                    onClose()
                    try {
                        await useGameStore.getState().saveGameState()
                    } catch (e) {
                        console.error('Failed to save game state before reload (DEV):', e)
                    }
                    window.location.reload()
                } else {
                    showToast(data.error || 'Unknown error', 'error')
                }
            }
        } catch (error) {
            console.error('Purchase error:', error)
            showToast('Purchase failed. Please try again.', 'error')
        } finally {
            setPurchasing(null)
        }
    }

    const handlePurchaseParticles = async (item: any) => {
        setPurchasing(item.id)
        try {
            const res = await fetch('/api/shop/purchase-particles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: item.id })
            })
            const data = await res.json()
            if (data.success) {
                showToast(`Aktywowano booster ${item.name}!`, 'success', '💥')
                // Update game state in Zustand store
                useGameStore.setState({
                    particles: data.particles,
                    achievements: data.achievements
                })
                onClose()
            } else {
                showToast(data.error || 'Błąd zakupu', 'error')
            }
        } catch (error) {
            console.error('Particle purchase failed:', error)
            showToast('Zakup nie powiódł się', 'error')
        } finally {
            setPurchasing(null)
        }
    }

    const payWithStars = async (item: ShopItem) => {
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
                showToast(data.error || 'Failed to create invoice', 'error')
                return
            }

            const tg = (window as any).Telegram
            if (tg?.WebApp) {
                tg.WebApp.openInvoice(data.invoiceLink, async (status: string) => {
                    if (status === 'paid') {
                        showToast(`${item.name} purchased successfully!`, 'success', '✅')
                        try {
                            await useGameStore.getState().saveGameState()
                        } catch (e) {}
                        window.location.reload()
                    } else if (status === 'cancelled') {
                        showToast('Payment cancelled', 'warning')
                    } else {
                        showToast('Payment failed or pending', 'error')
                    }
                })
            } else {
                showToast('Telegram WebApp interface not found', 'error')
            }
        } catch (err: any) {
            console.error(err)
            showToast('Error processing Stars payment', 'error')
        } finally {
            setPurchasing(null)
        }
    }

    const payWithTon = async (item: ShopItem) => {
        if (!tonConnectUI) {
            showToast('TON Connect not initialized', 'error')
            return
        }

        if (!tonWalletConnected) {
            try {
                await tonConnectUI.openModal()
                return
            } catch (e) {
                showToast('Failed to open wallet modal', 'error')
                return
            }
        }

        setPurchasing(item.id)
        setPaymentMethodItem(null)
        setVerifyingTon(true)
        showToast('Sending transaction request to wallet...', 'info', '⏳')

        try {
            const configRes = await fetch('/api/telegram/verify-ton')
            const configData = await configRes.json()
            const merchantAddress = configData.merchantAddress

            if (!merchantAddress) {
                showToast('Merchant TON wallet not configured on server', 'error')
                setVerifyingTon(false)
                setPurchasing(null)
                return
            }

            const tonAmount = item.price / tonPrice
            const tonAmountNano = Math.ceil(tonAmount * 1e9)

            const nullifierHash = useGameStore.getState().nullifierHash
            if (!nullifierHash) {
                showToast('Session not found. Please log in again.', 'error')
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

            showToast('Transaction submitted. Confirming on blockchain...', 'info', '⏳')

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
                        showToast(`${item.name} purchased successfully via TON!`, 'success', '✅')
                        try {
                            await useGameStore.getState().saveGameState()
                        } catch (e) {}
                        window.location.reload()
                    } else if (attempts >= maxAttempts) {
                        clearInterval(verifyInterval)
                        setVerifyingTon(false)
                        setPurchasing(null)
                        showToast('Verification timed out. Purchase will be processed once transaction is confirmed.', 'warning')
                    }
                } catch (err) {
                    console.error('Error verifying TON purchase:', err)
                    if (attempts >= maxAttempts) {
                        clearInterval(verifyInterval)
                        setVerifyingTon(false)
                        setPurchasing(null)
                        showToast('Verification timed out or failed.', 'error')
                    }
                }
            }, 4000)

        } catch (err: any) {
            console.error('TON Purchase failed:', err)
            showToast(err.message || 'Transaction rejected by wallet', 'error')
            setVerifyingTon(false)
            setPurchasing(null)
        }
    }

    const isOwned = (itemId: string, itemType: string) => {
        if (itemType === 'consumable') return false
        return userInventory.some(inv => inv.item_id === itemId)
    }

    if (!isOpen || !catalog) return null

    const categoryKeys = ['towers', 'consumables', 'skins', 'bundles', 'boosts'] as const
    const categoryLabels: Record<string, string> = {
        towers: t('shop.towers'),
        consumables: t('shop.consumables'),
        skins: t('shop.skins'),
        bundles: t('shop.bundles'),
        boosts: t('shop.boosts') || 'Boosts'
    }

    const currentItems = catalog.categories[selectedCategory] || []

    return (
        <div className="fixed inset-0 bg-[#05030f]/95 backdrop-blur-lg z-[100] flex items-center justify-center p-3">
            <div className="w-full max-w-[430px] max-h-[90vh] flex flex-col rounded-3xl overflow-hidden border border-purple-500/20 bg-gradient-to-b from-[#0a0415]/98 to-[#0f081e]/98 shadow-2xl">
                {/* Header */}
                <div className="px-5 py-4.5 bg-black/40 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black tracking-widest bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent uppercase">
                            {t('shop.title')}
                        </h2>
                        <div className="text-[9px] text-cyan-400 font-bold tracking-[0.25em] mt-0.5">
                            AUTHORIZED ACCESS ONLY
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 text-white/60 text-lg flex items-center justify-center cursor-pointer hover:bg-white/10 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Flash Sale Banner */}
                <div className="bg-purple-600/10 border-b border-purple-500/20 px-4 py-2 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-fuchsia-400 tracking-wider uppercase">
                        {t('shop.flash_sale')}
                    </span>
                    <span className="text-[10px] font-bold text-pink-400 tracking-wider uppercase">
                        {t('shop.limited')}
                    </span>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-1.5 px-4 py-3 border-b border-white/5 overflow-x-auto no-scrollbar">
                    {categoryKeys.map(key => (
                        <button
                            key={key}
                            onClick={() => setSelectedCategory(key)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-wider uppercase whitespace-nowrap cursor-pointer transition-colors flex-shrink-0 ${
                                selectedCategory === key
                                    ? 'border border-cyan-500/30 bg-cyan-500/15 text-cyan-400'
                                    : 'border border-white/10 bg-transparent text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            {categoryLabels[key]}
                        </button>
                    ))}
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {currentItems.map((item: ShopItem) => {
                        const owned = isOwned(item.id, item.type)
                        const isHighlight = highlightItem === item.id
                        const isConsumable = item.type === 'consumable'

                        return (
                            <div
                                key={item.id}
                                className={`relative overflow-hidden rounded-2xl p-4 transition-colors ${
                                    isHighlight
                                        ? 'bg-amber-500/5 border border-amber-500/30 shadow-[0_0_15px_rgba(234,179,8,0.05)]'
                                        : owned
                                            ? 'bg-emerald-500/5 border border-emerald-500/25'
                                            : 'bg-purple-500/5 border border-purple-500/15 hover:border-purple-500/30'
                                }`}
                            >
                                {/* Discount badge */}
                                {item.discountText && !owned && (
                                    <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-bl-xl uppercase tracking-wider">
                                        {item.discountText}
                                    </div>
                                )}

                                {/* Owned badge */}
                                {owned && (
                                    <div className="absolute top-0 left-0 bg-emerald-500 text-black text-[10px] font-extrabold px-2.5 py-1 rounded-br-xl uppercase tracking-wider">
                                        ✓ {t('shop.owned')}
                                    </div>
                                )}

                                {/* Title + Price row */}
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className={`text-base font-black tracking-wide ${isHighlight ? 'text-amber-400' : 'text-purple-100'} pr-3`}>
                                        {item.name}
                                    </h3>
                                    <div className="text-right flex-shrink-0">
                                        {item.originalPrice && (
                                            <div className="text-[10px] text-gray-500 line-through">
                                                {isTelegram ? `${Math.round(item.originalPrice * 50)} Stars` : `${item.originalPrice} WLD`}
                                            </div>
                                        )}
                                        <div className="text-lg font-black text-amber-400">
                                            {isTelegram ? (
                                                <div className="flex flex-col items-end gap-0.5">
                                                    <div className="text-[14px] text-amber-400 font-extrabold">
                                                        {Math.round(item.price * 50)} ⭐️
                                                    </div>
                                                    <div className="text-[10px] text-blue-400 font-bold">
                                                        {(item.price / tonPrice).toFixed(3)} TON
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {item.price} <span className="text-[10px] text-amber-600 font-bold">WLD</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                                    {item.description}
                                </p>

                                {/* Stats */}
                                {item.stats && (
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {item.stats.damage && (
                                            <span className="text-[10px] font-bold bg-red-500/10 text-red-300 px-2.5 py-1 rounded-lg border border-red-500/20 flex items-center gap-1">
                                                ⚔️ {item.stats.damage} DMG
                                            </span>
                                        )}
                                        {item.stats.range && (
                                            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-500/20 flex items-center gap-1">
                                                🎯 {item.stats.range} RNG
                                            </span>
                                        )}
                                        {item.stats.special && (
                                            <span className="text-[10px] font-bold bg-purple-500/10 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/20 flex items-center gap-1">
                                                ✦ {item.stats.special}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Buy Button */}
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handlePurchase(item)}
                                    disabled={(owned && !isConsumable) || purchasing === item.id}
                                    className={`w-full py-3.5 rounded-xl border-none font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center cursor-pointer ${
                                        owned && !isConsumable
                                            ? 'bg-gray-800/40 text-gray-500 pointer-events-none'
                                            : purchasing === item.id
                                                ? 'bg-gray-700/50 text-gray-400 pointer-events-none'
                                                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_4px_15px_rgba(16,185,129,0.25)]'
                                    }`}
                                >
                                    {owned && !isConsumable
                                        ? t('shop.owned')
                                        : purchasing === item.id
                                            ? t('shop.processing')
                                            : isTelegram
                                                ? `Kup za Stars/TON — $${item.price.toFixed(2)}`
                                                : `Kup za WLD — ${item.price} WLD`
                                    }
                                </motion.button>

                                {item.priceParticles && (
                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handlePurchaseParticles(item)}
                                        disabled={purchasing === item.id || useGameStore.getState().particles < item.priceParticles}
                                        className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center cursor-pointer mt-2 ${
                                            (useGameStore.getState().particles < item.priceParticles)
                                                ? 'bg-gray-800/30 text-gray-600 border border-white/5 pointer-events-none'
                                                : purchasing === item.id
                                                    ? 'bg-gray-700/50 text-gray-400 pointer-events-none'
                                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_4px_15px_rgba(139,92,246,0.25)] border border-purple-500/20'
                                        }`}
                                    >
                                        {purchasing === item.id
                                            ? t('shop.processing')
                                            : `Kup za ${item.priceParticles.toLocaleString()} Cząsteczek`
                                        }
                                    </motion.button>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-white/5 bg-black/20 text-center">
                    <p className="text-[10px] text-gray-500 leading-normal">{t('shop.footer1')}</p>
                    <p className="text-[10px] text-gray-600 mt-1 leading-normal">{t('shop.footer2')}</p>
                </div>
            </div>

            {/* Telegram Payment Method Selection Modal */}
            {paymentMethodItem && (
                <div className="fixed inset-0 bg-[#05030f]/85 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <div className="w-full max-w-[380px] bg-gradient-to-br from-[#1c0e35] to-[#0a0518] border border-purple-500/25 rounded-3xl p-6 shadow-2xl relative">
                        {/* Title */}
                        <h3 className="text-lg font-black text-purple-100 text-center mb-1 uppercase tracking-wider">
                            Select Payment Method
                        </h3>
                        <p className="text-[11px] text-gray-400 text-center mb-5 leading-normal">
                            Choose how you want to purchase <span className="text-amber-400 font-bold">{paymentMethodItem.name}</span>
                        </p>

                        <div className="flex flex-col gap-3">
                            {/* Stars Payment Card */}
                            <div 
                                onClick={() => payWithStars(paymentMethodItem)}
                                className="bg-white/5 border border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/5 rounded-2xl p-4 cursor-pointer flex items-center justify-between transition-all shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl bg-amber-500/10 w-11 h-11 rounded-xl flex items-center justify-center shadow-[0_0_10px_rgba(251,191,36,0.15)]">
                                        🌟
                                    </div>
                                    <div className="text-left">
                                        <div className="text-sm font-black text-gray-100">Telegram Stars</div>
                                        <div className="text-[10px] text-gray-400">Instant delivery</div>
                                    </div>
                                </div>
                                <div className="text-sm font-black text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                                    {Math.round(paymentMethodItem.price * 50)} ⭐️
                                </div>
                            </div>

                            {/* TON Connect Payment Card */}
                            <div 
                                onClick={() => payWithTon(paymentMethodItem)}
                                className="bg-white/5 border border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/5 rounded-2xl p-4 cursor-pointer flex items-center justify-between transition-all shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl bg-cyan-500/10 w-11 h-11 rounded-xl flex items-center justify-center shadow-[0_0_10px_rgba(0,136,204,0.15)]">
                                        💎
                                    </div>
                                    <div className="text-left">
                                        <div className="text-sm font-black text-gray-100">TON Connect</div>
                                        <div className="text-[10px] text-gray-400">
                                            {tonWalletConnected ? 'Wallet connected' : 'Connect wallet'}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm font-black text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20">
                                    {(paymentMethodItem.price / tonPrice).toFixed(3)} TON
                                </div>
                            </div>
                        </div>

                        {/* Cancel Button */}
                        <button
                            onClick={() => setPaymentMethodItem(null)}
                            className="w-full mt-5 py-3 rounded-xl border border-white/5 bg-transparent text-gray-400 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
