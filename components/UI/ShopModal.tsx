'use client'

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
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5,5,16,0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '430px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(139,92,246,0.2)',
                background: 'linear-gradient(180deg, rgba(10,4,21,0.98) 0%, rgba(15,8,30,0.98) 100%)',
            }}>
                {/* Header */}
                <div style={{
                    padding: '18px 20px 14px',
                    background: 'rgba(0,0,0,0.4)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <div>
                        <h2 style={{
                            fontSize: '20px',
                            fontWeight: 800,
                            letterSpacing: '2px',
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            {t('shop.title')}
                        </h2>
                        <div style={{
                            fontSize: '10px',
                            color: '#06b6d4',
                            letterSpacing: '3px',
                            marginTop: '2px',
                            fontWeight: 600,
                        }}>
                            AUTHORIZED ACCESS ONLY
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '18px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Flash Sale Banner */}
                <div style={{
                    background: 'rgba(188,19,254,0.12)',
                    borderBottom: '1px solid rgba(188,19,254,0.3)',
                    padding: '8px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#e879f9',
                        letterSpacing: '1px',
                    }}>
                        {t('shop.flash_sale')}
                    </span>
                    <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#f472b6',
                        letterSpacing: '1px',
                    }}>
                        {t('shop.limited')}
                    </span>
                </div>

                {/* Category Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '6px',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                }}>
                    {categoryKeys.map(key => (
                        <button
                            key={key}
                            onClick={() => setSelectedCategory(key)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '12px',
                                letterSpacing: '1px',
                                whiteSpace: 'nowrap',
                                border: selectedCategory === key
                                    ? '1px solid #06b6d4'
                                    : '1px solid rgba(255,255,255,0.1)',
                                background: selectedCategory === key
                                    ? 'rgba(6,182,212,0.15)'
                                    : 'transparent',
                                color: selectedCategory === key
                                    ? '#06b6d4'
                                    : '#6b7280',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                flexShrink: 0,
                                textTransform: 'uppercase',
                            }}
                        >
                            {categoryLabels[key]}
                        </button>
                    ))}
                </div>

                {/* Items List */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
                    WebkitOverflowScrolling: 'touch',
                }}>
                    {currentItems.map((item: ShopItem) => {
                        const owned = isOwned(item.id, item.type)
                        const isHighlight = highlightItem === item.id
                        const isConsumable = item.type === 'consumable'

                        return (
                            <div
                                key={item.id}
                                style={{
                                    background: isHighlight
                                        ? 'rgba(234,179,8,0.08)'
                                        : owned
                                            ? 'rgba(34,197,94,0.06)'
                                            : 'rgba(139,92,246,0.04)',
                                    border: isHighlight
                                        ? '1px solid rgba(234,179,8,0.4)'
                                        : owned
                                            ? '1px solid rgba(34,197,94,0.2)'
                                            : '1px solid rgba(139,92,246,0.12)',
                                    borderRadius: '14px',
                                    padding: '16px',
                                    marginBottom: '12px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Discount badge */}
                                {item.discountText && !owned && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                        background: '#dc2626',
                                        color: 'white',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        padding: '4px 10px',
                                        borderBottomLeftRadius: '10px',
                                    }}>
                                        {item.discountText}
                                    </div>
                                )}

                                {/* Owned badge */}
                                {owned && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        background: '#22c55e',
                                        color: '#000',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        padding: '4px 10px',
                                        borderBottomRightRadius: '10px',
                                    }}>
                                        ✓ {t('shop.owned')}
                                    </div>
                                )}

                                {/* Title + Price row */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: '8px',
                                }}>
                                    <h3 style={{
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        color: isHighlight ? '#fbbf24' : '#e0e0ff',
                                        paddingRight: '12px',
                                    }}>
                                        {item.name}
                                    </h3>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        {item.originalPrice && (
                                            <div style={{
                                                fontSize: '10px',
                                                color: '#6b7280',
                                                textDecoration: 'line-through',
                                            }}>
                                                {isTelegram ? `${Math.round(item.originalPrice * 50)} Stars` : `${item.originalPrice} WLD`}
                                            </div>
                                        )}
                                        <div style={{
                                            fontSize: '18px',
                                            fontWeight: 800,
                                            color: '#fbbf24',
                                        }}>
                                            {isTelegram ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                                    <div style={{ fontSize: '15px', color: '#fbbf24', fontWeight: 800 }}>
                                                        {Math.round(item.price * 50)} ⭐️
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 'bold' }}>
                                                        {(item.price / tonPrice).toFixed(3)} TON
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {item.price} <span style={{ fontSize: '11px', color: '#d97706' }}>WLD</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <p style={{
                                    fontSize: '12px',
                                    color: '#9ca3af',
                                    marginBottom: '10px',
                                    lineHeight: 1.5,
                                }}>
                                    {item.description}
                                </p>

                                {/* Stats */}
                                {item.stats && (
                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '6px',
                                        marginBottom: '12px',
                                    }}>
                                        {item.stats.damage && (
                                            <span style={{
                                                fontSize: '11px',
                                                background: 'rgba(239,68,68,0.12)',
                                                color: '#fca5a5',
                                                padding: '3px 8px',
                                                borderRadius: '6px',
                                                border: '1px solid rgba(239,68,68,0.2)',
                                            }}>
                                                ⚔️ {item.stats.damage} DMG
                                            </span>
                                        )}
                                        {item.stats.range && (
                                            <span style={{
                                                fontSize: '11px',
                                                background: 'rgba(59,130,246,0.12)',
                                                color: '#93c5fd',
                                                padding: '3px 8px',
                                                borderRadius: '6px',
                                                border: '1px solid rgba(59,130,246,0.2)',
                                            }}>
                                                🎯 {item.stats.range} RNG
                                            </span>
                                        )}
                                        {item.stats.special && (
                                            <span style={{
                                                fontSize: '11px',
                                                background: 'rgba(139,92,246,0.12)',
                                                color: '#c4b5fd',
                                                padding: '3px 8px',
                                                borderRadius: '6px',
                                                border: '1px solid rgba(139,92,246,0.2)',
                                            }}>
                                                ✦ {item.stats.special}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Buy Button */}
                                <button
                                    onClick={() => handlePurchase(item)}
                                    disabled={(owned && !isConsumable) || purchasing === item.id}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        fontWeight: 700,
                                        fontSize: '14px',
                                        cursor: (owned && !isConsumable) ? 'not-allowed' : 'pointer',
                                        background: (owned && !isConsumable)
                                            ? 'rgba(107,114,128,0.2)'
                                            : purchasing === item.id
                                                ? 'rgba(107,114,128,0.3)'
                                                : 'linear-gradient(135deg, #22c55e 0%, #059669 100%)',
                                        color: (owned && !isConsumable)
                                            ? '#6b7280'
                                            : 'white',
                                        boxShadow: (owned && !isConsumable) || purchasing === item.id
                                            ? 'none'
                                            : '0 4px 15px rgba(34,197,94,0.3)',
                                        transition: 'all 0.15s',
                                        letterSpacing: '1px',
                                    }}
                                >
                                    {owned && !isConsumable
                                        ? t('shop.owned')
                                        : purchasing === item.id
                                            ? t('shop.processing')
                                            : isTelegram
                                                ? `Kup za Stars/TON — $${item.price.toFixed(2)}`
                                                : `Kup za WLD — ${item.price} WLD`
                                    }
                                </button>

                                {item.priceParticles && (
                                    <button
                                        onClick={() => handlePurchaseParticles(item)}
                                        disabled={purchasing === item.id || useGameStore.getState().particles < item.priceParticles}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '10px',
                                            border: '1px solid rgba(139,92,246,0.3)',
                                            fontWeight: 700,
                                            fontSize: '14px',
                                            cursor: (useGameStore.getState().particles < item.priceParticles) ? 'not-allowed' : 'pointer',
                                            background: (useGameStore.getState().particles < item.priceParticles)
                                                ? 'rgba(107,114,128,0.1)'
                                                : purchasing === item.id
                                                    ? 'rgba(107,114,128,0.3)'
                                                    : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                                            color: (useGameStore.getState().particles < item.priceParticles)
                                                ? '#6b7280'
                                                : 'white',
                                            boxShadow: (useGameStore.getState().particles < item.priceParticles) || purchasing === item.id
                                                ? 'none'
                                                : '0 4px 15px rgba(139,92,246,0.3)',
                                            transition: 'all 0.15s',
                                            letterSpacing: '1px',
                                            marginTop: '8px'
                                        }}
                                    >
                                        {purchasing === item.id
                                            ? t('shop.processing')
                                            : `Kup za ${item.priceParticles.toLocaleString()} Cząsteczek`
                                        }
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px 16px',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(0,0,0,0.3)',
                    textAlign: 'center',
                }}>
                    <p style={{ fontSize: '10px', color: '#6b7280' }}>{t('shop.footer1')}</p>
                    <p style={{ fontSize: '10px', color: '#4b5563', marginTop: '2px' }}>{t('shop.footer2')}</p>
                </div>
            </div>

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
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(251, 191, 36, 0.05)'
                                    e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.4)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                                    e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.2)'
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
                                        justifyContent: 'center',
                                        boxShadow: '0 0 10px rgba(251, 191, 36, 0.15)'
                                    }}>
                                        🌟
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#f3f4f6' }}>Telegram Stars</div>
                                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>Instant delivery</div>
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: '16px',
                                    fontWeight: 800,
                                    color: '#fbbf24',
                                    background: 'rgba(251, 191, 36, 0.1)',
                                    padding: '6px 12px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(251, 191, 36, 0.2)'
                                }}>
                                    {Math.round(paymentMethodItem.price * 50)} ⭐️
                                </div>
                            </div>

                            {/* TON Connect Payment Card */}
                            <div 
                                onClick={() => payWithTon(paymentMethodItem)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(0, 136, 204, 0.2)',
                                    borderRadius: '16px',
                                    padding: '16px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(0, 136, 204, 0.05)'
                                    e.currentTarget.style.borderColor = 'rgba(0, 136, 204, 0.4)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                                    e.currentTarget.style.borderColor = 'rgba(0, 136, 204, 0.2)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        fontSize: '24px',
                                        background: 'rgba(0, 136, 204, 0.1)',
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 0 10px rgba(0, 136, 204, 0.15)'
                                    }}>
                                        💎
                                    </div>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#f3f4f6' }}>TON Connect</div>
                                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                                            {tonWalletConnected ? 'Wallet connected' : 'Connect wallet'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: '15px',
                                    fontWeight: 800,
                                    color: '#0088cc',
                                    background: 'rgba(0, 136, 204, 0.1)',
                                    padding: '6px 12px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(0, 136, 204, 0.2)'
                                }}>
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
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                background: 'transparent',
                                color: '#9ca3af',
                                fontWeight: 600,
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'white'
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#9ca3af'
                                e.currentTarget.style.background = 'transparent'
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
