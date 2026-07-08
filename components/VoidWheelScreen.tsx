'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Gift, Shield, Zap, Sparkles, RefreshCw, AlertTriangle, CheckCircle, Trophy, Play } from 'lucide-react'
import { MiniKit, Tokens, tokenToDecimals } from '@worldcoin/minikit-js'
import { useGameStore } from '@/store/gameStore'
import { useWorldID } from '@/hooks/useWorldID'
import AniAdsBanner from '@/components/AniAdsBanner'
import ToastNotification, { showToast } from '@/components/UI/ToastNotification'

// Target Creator Wallet for payments
const CREATOR_WALLET = '0xc7d0ef606a313bfd69e6cc1c44065df8d99b8dfc'

interface VoidWheelScreenProps {
    onBackToMenu: () => void
}

// Sektory koła (zgodne z mapowaniem symboli w API):
const SECTORS = [
    { id: 0, name: 'SMALL DRIFT', color: '#3b82f6', label: 'Particles (S)', desc: '10K+ Particles' },
    { id: 1, name: 'MEDIUM DRIFT', color: '#1d4ed8', label: 'Particles (M)', desc: '25K+ Particles' },
    { id: 2, name: 'MEGA DRIFT', color: '#a855f7', label: 'Particles (XL)', desc: '50K+ Particles' },
    { id: 3, name: 'BRONZE VIP', color: '#cd7f32', label: 'VIP Status lvl 1', desc: 'VIP Status lvl 1' },
    { id: 4, name: 'SILVER VIP', color: '#c0c0c0', label: 'VIP Status lvl 2', desc: 'VIP Status lvl 2' },
    { id: 5, name: 'GOLD VIP', color: '#ffd700', label: 'VIP Status lvl 3', desc: 'VIP Status lvl 3' },
    { id: 6, name: 'PLATINUM VIP', color: '#e5e4e2', label: 'VIP Status lvl 4', desc: 'VIP Status lvl 4' },
    { id: 7, name: 'WLD DROP', color: '#ec4899', label: '0.01 WLD', desc: 'Token payout' }
]

export default function VoidWheelScreen({ onBackToMenu }: VoidWheelScreenProps) {
    const nullifierHash = useGameStore(state => state.nullifierHash)
    const { userAddress } = useWorldID()
    const isTelegram = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true'

    const [isSpinning, setIsSpinning] = useState(false)
    const [rotation, setRotation] = useState(0)
    const [lastReward, setLastReward] = useState<any | null>(null)
    const [showRewardModal, setShowRewardModal] = useState(false)
    const [freeSpinCooldown, setFreeSpinCooldown] = useState<number | null>(null) // Seconds left
    const [loadingAd, setLoadingAd] = useState(false)
    const [adSpinsCount, setAdSpinsCount] = useState(0)
    const [userBalance, setUserBalance] = useState({ particles: 0, vipTier: 0 })
    
    // TinyAPI Ad States
    const [adSecondsLeft, setAdSecondsLeft] = useState(8)
    const [adAction, setAdAction] = useState<'spin' | 'double'>('spin')
    const [freeSpinAvailableState, setFreeSpinAvailableState] = useState(true)

    const wheelRef = useRef<HTMLDivElement>(null)

    // Load local storage states (Free spins cooldown, ad spins count)
    useEffect(() => {
        const checkCooldown = async () => {
            if (!nullifierHash) return
            try {
                const res = await fetch('/api/user/profile')
                const profileData = await res.json()
                if (profileData && profileData.user) {
                    setUserBalance({
                        particles: profileData.user.particles || 0,
                        vipTier: profileData.user.vipTier || 0
                    })
                }
            } catch (e) {
                console.error('Failed to load user profile stats:', e)
            }
        }
        checkCooldown()

        const lastFree = localStorage.getItem('last_free_spin')
        if (lastFree) {
            const timePassed = Date.now() - parseInt(lastFree, 10)
            const cooldown = 24 * 60 * 60 * 1000
            if (timePassed < cooldown) {
                setFreeSpinCooldown(Math.ceil((cooldown - timePassed) / 1000))
            }
        }

        const lastAdReset = localStorage.getItem('last_ad_spin_reset')
        const todayStr = new Date().toDateString()
        if (lastAdReset !== todayStr) {
            localStorage.setItem('last_ad_spin_reset', todayStr)
            localStorage.setItem('ad_spins_today', '0')
            setAdSpinsCount(0)
        } else {
            const count = localStorage.getItem('ad_spins_today')
            setAdSpinsCount(count ? parseInt(count, 10) : 0)
        }
    }, [nullifierHash])

    // Timer for cooldown
    useEffect(() => {
        if (freeSpinCooldown === null || freeSpinCooldown <= 0) return
        const timer = setInterval(() => {
            setFreeSpinCooldown(prev => {
                if (prev !== null && prev > 1) return prev - 1
                return null
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [freeSpinCooldown])

    // Cooldown state helper
    useEffect(() => {
        if (freeSpinCooldown !== null) {
            setFreeSpinAvailableState(false)
        } else {
            setFreeSpinAvailableState(true)
        }
    }, [freeSpinCooldown])

    // Ad Timer countdown
    useEffect(() => {
        if (!loadingAd) return
        setAdSecondsLeft(8)
        const timer = setInterval(() => {
            setAdSecondsLeft(prev => {
                if (prev > 1) {
                    if (typeof window !== 'undefined' && MiniKit.isInstalled()) {
                        MiniKit.commands.sendHapticFeedback({ hapticsType: 'impact', style: 'light' })
                    }
                    return prev - 1
                }
                clearInterval(timer)
                if (typeof window !== 'undefined' && MiniKit.isInstalled()) {
                    MiniKit.commands.sendHapticFeedback({ hapticsType: 'notification', style: 'success' })
                }
                return 0
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [loadingAd])

    // Dynamic injection of TinyAPI script with explicit 'site-id' and 'data-site-id' attributes
    useEffect(() => {
        if (!loadingAd) return

        // 1. Create script tag
        const script = document.createElement('script')
        script.src = "https://cdn.apitiny.net/scripts/v2.0/main.js"
        script.async = true
        
        // Custom attributes (apitiny requires site-id attribute directly on script to initialize)
        const isTelegram = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true'
        const siteId = isTelegram ? '6a1394dc2429acc1400a1d83' : '6974b43ddda381ae5f477c2c'
        script.setAttribute('site-id', siteId)
        script.setAttribute('data-site-id', siteId)
        script.setAttribute('data-test-mode', 'false')
        script.setAttribute('test-mode', 'false')

        // 2. Append to target container
        const container = document.getElementById('apitiny-ad-container')
        if (container) {
            container.appendChild(script)
        }

        return () => {
            // Cleanup: remove script and any generated ads on modal close
            if (container) {
                container.innerHTML = ''
            }
        }
    }, [loadingAd])

    const formatCooldown = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const triggerHaptic = () => {
        if (typeof window !== 'undefined' && MiniKit.isInstalled()) {
            MiniKit.commands.sendHapticFeedback({
                hapticsType: 'impact',
                style: 'light'
            })
        }
    }

    const triggerSuccessHaptic = () => {
        if (typeof window !== 'undefined' && MiniKit.isInstalled()) {
            MiniKit.commands.sendHapticFeedback({
                hapticsType: 'notification',
                style: 'success'
            })
        }
    }

    const resolveSpin = (data: any, spinVariant: string) => {
        // Determine winner index based on API symbols
        let symbolIdx = data.symbols ? data.symbols[0] : 0
        if (data.rewardType === 'wld') {
            symbolIdx = 7
        } else if (data.rewardType === 'vip') {
            symbolIdx = 2 + data.rewardValue
        } else if (data.rewardType === 'particles') {
            if (data.rewardValue >= 300000) {
                symbolIdx = 2
            } else if (data.rewardValue >= 25000) {
                symbolIdx = 1
            } else {
                symbolIdx = 0
            }
        }

        symbolIdx = Math.max(0, Math.min(7, symbolIdx))

        const targetSectorAngle = 360 - (symbolIdx * 45) - 22.5
        const fullSpins = 360 * 6
        const newRotation = rotation + fullSpins + targetSectorAngle

        setRotation(newRotation)

        const tickInterval = setInterval(() => {
            triggerHaptic()
        }, 120)

        setTimeout(() => {
            clearInterval(tickInterval)
            setIsSpinning(false)
            triggerSuccessHaptic()

            if (spinVariant === 'free') {
                localStorage.setItem('last_free_spin', Date.now().toString())
                setFreeSpinAvailableState(false)
                setFreeSpinCooldown(24 * 60 * 60)
            }

            // Show reward modal
            setLastReward({
                type: data.rewardType,
                value: data.rewardValue,
                message: data.message,
                sectorName: SECTORS[symbolIdx].name,
                color: SECTORS[symbolIdx].color
            })
            setShowRewardModal(true)

            // Refresh stats
            setUserBalance(prev => ({
                particles: data.particles !== undefined ? data.particles : (data.rewardType === 'particles' ? prev.particles + data.rewardValue : prev.particles),
                vipTier: data.vipTier !== undefined ? data.vipTier : (data.rewardType === 'vip' ? Math.max(prev.vipTier, data.rewardValue) : prev.vipTier)
            }))

            if (data.particles !== undefined) {
                useGameStore.setState({
                    particles: data.particles,
                    achievements: data.achievements,
                    vipTier: data.vipTier
                })
            }
        }, 5200)
    }

    const getParticleSpinCost = () => {
        const achievements = useGameStore.getState().achievements || {}
        const lastSpinDate = achievements.last_void_wheel_spin_date
        const todayStr = new Date().toISOString().split('T')[0]
        
        let spinsCount = achievements.void_wheel_spins_bought_today || 0
        if (lastSpinDate !== todayStr) {
            spinsCount = 0
        }
        
        return 10000 * Math.pow(5, spinsCount)
    }

    // handleSpin Action triggered by buttons
    const handleSpin = async (variant: 'free' | 'small' | 'big' | 'ad' | 'particles') => {
        if (isSpinning) return

        if (!nullifierHash) {
            showToast('⚠️ Musisz zalogować się przez World ID, aby kręcić kołem.', 'error')
            return
        }

        setIsSpinning(true)
        setLastReward(null)

        const isTelegram = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true'

        try {
            let transactionRef = ''

            if (variant === 'free' && freeSpinCooldown !== null) {
                showToast('⏱️ Twój darmowy spin jest jeszcze na cooldownie.', 'error')
                setIsSpinning(false)
                return
            }

            if (variant === 'free') {
                transactionRef = `free_${Date.now()}_${Math.random().toString(36).slice(2)}`
            } else if (variant === 'particles') {
                const cost = getParticleSpinCost()
                if (useGameStore.getState().particles < cost) {
                    showToast('⚠️ Niewystarczająca ilość cząsteczek!', 'error')
                    setIsSpinning(false)
                    return
                }
                transactionRef = `particle_spin_${Date.now()}_${Math.random().toString(36).slice(2)}`
            } else if (variant === 'ad') {
                if (adSpinsCount >= 3) {
                    showToast('⚠️ Osiągnąłeś limit spinów za reklamy (3/3).', 'error')
                    setIsSpinning(false)
                    return
                }
                setIsSpinning(false)
                setAdAction('spin')
                setLoadingAd(true)
                return
            } else {
                const uuid = window.crypto.randomUUID()

                if (isTelegram) {
                    // Telegram Stars payment flow
                    const tgWebApp = (window as any).Telegram?.WebApp
                    if (!tgWebApp) {
                        showToast('⚠️ Telegram WebApp nie jest zainstalowany.', 'error')
                        setIsSpinning(false)
                        return
                    }

                    const priceStars = variant === 'big' ? 100 : 30
                    const itemId = variant === 'big' ? 'wheel_spin_big' : 'wheel_spin_small'
                    const title = variant === 'big' ? 'Wheel Big Spin' : 'Wheel Small Spin'

                    // Request Telegram Stars Invoice
                    const invoiceRes = await fetch('/api/telegram/pay-stars', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            itemId,
                            priceStars,
                            title,
                            description: `Spin the Void Wheel (${title}) for rewards!`,
                            reference: uuid
                        })
                    })

                    const invoiceData = await invoiceRes.json()
                    if (!invoiceRes.ok || !invoiceData.success) {
                        showToast(`❌ Błąd płatności Stars: ${invoiceData.error || 'Nieznany błąd'}`, 'error')
                        setIsSpinning(false)
                        return
                    }

                    // Open Telegram invoice modal
                    tgWebApp.openInvoice(invoiceData.invoiceLink, async (status: string) => {
                        if (status === 'paid') {
                            try {
                                const res = await fetch('/api/minigames/roulette', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        nullifier_hash: nullifierHash,
                                        transaction_ref: uuid,
                                        wallet_address: userAddress || '',
                                        variant: variant
                                    })
                                })

                                const data = await res.json()
                                if (!res.ok) {
                                    showToast(`❌ Błąd: ${data.error || 'Nieznany błąd serwera'}`, 'error')
                                    setIsSpinning(false)
                                    return
                                }

                                // Run resolution and animations
                                resolveSpin(data, variant)

                            } catch (err) {
                                showToast('❌ Wystąpił błąd zapisu losowania.', 'error')
                                setIsSpinning(false)
                            }
                        } else {
                            showToast('❌ Płatność Stars anulowana lub nieudana.', 'error')
                            setIsSpinning(false)
                        }
                    })
                    return
                } else {
                    // Paid spin using MiniKit
                    if (!MiniKit.isInstalled()) {
                        showToast('⚠️ MiniKit nie jest zainstalowany.', 'error')
                        setIsSpinning(false)
                        return
                    }

                    const costWld = variant === 'big' ? 1.5 : 0.45
                    
                    const payload = {
                        reference: uuid,
                        to: CREATOR_WALLET,
                        tokens: [
                            {
                                symbol: Tokens.WLD,
                                token_amount: tokenToDecimals(costWld, Tokens.WLD).toString()
                            }
                        ],
                        description: `Void Wheel ${variant === 'big' ? 'Big' : 'Small'} Spin`
                    }

                    const payResult = await MiniKit.commandsAsync.pay(payload) as any
                    if (!payResult || payResult.status === 'error') {
                        showToast('❌ Płatność anulowana lub nieudana.', 'error')
                        setIsSpinning(false)
                        return
                    }
                    transactionRef = payResult.reference || uuid
                }
            }

            // Call backend API for free/paid spin (WorldApp WLD / Free / Ad)
            const res = await fetch('/api/minigames/roulette', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nullifier_hash: nullifierHash,
                    transaction_ref: transactionRef,
                    wallet_address: userAddress || '',
                    variant: variant
                })
            })

            const data = await res.json()
            if (!res.ok) {
                showToast(`❌ Błąd: ${data.error || 'Nieznany błąd serwera'}`, 'error')
                setIsSpinning(false)
                return
            }

            resolveSpin(data, variant)

        } catch (error: any) {
            console.error('Spin error:', error)
            showToast('❌ Wystąpił błąd komunikacji z serwerem.', 'error')
            setIsSpinning(false)
        }
    }

    // handleSpinAfterAd runs after completing the apitiny rewarded ad
    const handleSpinAfterAd = async () => {
        setLoadingAd(false)
        setIsSpinning(true)
        setLastReward(null)

        try {
            const transactionRef = `ad_${Date.now()}_${Math.random().toString(36).slice(2)}`

            const res = await fetch('/api/minigames/roulette', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nullifier_hash: nullifierHash,
                    transaction_ref: transactionRef,
                    wallet_address: userAddress || '',
                    variant: 'free'
                })
            })

            const data = await res.json()
            if (!res.ok) {
                showToast(`❌ Błąd: ${data.error || 'Nieznany błąd serwera'}`, 'error')
                setIsSpinning(false)
                return
            }

            let symbolIdx = data.symbols ? data.symbols[0] : 0
            if (data.rewardType === 'wld') {
                symbolIdx = 7
            } else if (data.rewardType === 'vip') {
                symbolIdx = 2 + data.rewardValue
            } else if (data.rewardType === 'particles') {
                if (data.rewardValue >= 300000) {
                    symbolIdx = 2
                } else if (data.rewardValue >= 25000) {
                    symbolIdx = 1
                } else {
                    symbolIdx = 0
                }
            }

            symbolIdx = Math.max(0, Math.min(7, symbolIdx))

            const targetSectorAngle = 360 - (symbolIdx * 45) - 22.5
            const fullSpins = 360 * 6
            const newRotation = rotation + fullSpins + targetSectorAngle

            setRotation(newRotation)

            const tickInterval = setInterval(() => {
                triggerHaptic()
            }, 120)

            setTimeout(() => {
                clearInterval(tickInterval)
                setIsSpinning(false)
                triggerSuccessHaptic()

                const nextCount = adSpinsCount + 1
                localStorage.setItem('ad_spins_today', nextCount.toString())
                setAdSpinsCount(nextCount)

                // Show reward modal
                setLastReward({
                    type: data.rewardType,
                    value: data.rewardValue,
                    message: data.message,
                    sectorName: SECTORS[symbolIdx].name,
                    color: SECTORS[symbolIdx].color
                })
                setShowRewardModal(true)

                // Refresh stats
                setUserBalance(prev => ({
                    particles: data.rewardType === 'particles' ? prev.particles + data.rewardValue : prev.particles,
                    vipTier: data.rewardType === 'vip' ? Math.max(prev.vipTier, data.rewardValue) : prev.vipTier
                }))
            }, 5200)

        } catch (error) {
            console.error('Spin after ad error:', error)
            showToast('❌ Błąd komunikacji z serwerem.', 'error')
            setIsSpinning(false)
        }
    }

    // handleDoubleAfterAd runs after completing ad for doubling reward
    const handleDoubleAfterAd = async () => {
        setLoadingAd(false)
        if (!lastReward || lastReward.type !== 'particles') return

        try {
            const transactionRef = `double_${Date.now()}_${Math.random().toString(36).slice(2)}`
            
            const res = await fetch('/api/minigames/roulette', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nullifier_hash: nullifierHash,
                    transaction_ref: transactionRef,
                    wallet_address: userAddress || '',
                    variant: 'free'
                })
            })

            const data = await res.json()
            if (!res.ok) {
                showToast(`❌ Błąd: ${data.error || 'Nieznany błąd serwera'}`, 'error')
                return
            }

            showToast(`🔥 Podwojono nagrodę! Dodatkowe ${lastReward.value.toLocaleString()} cząsteczek przyznane.`, 'success')
            
            setUserBalance(prev => ({
                ...prev,
                particles: prev.particles + lastReward.value
            }))
            
            setLastReward((prev: any) => ({
                ...prev,
                message: `Double Win! +${(prev.value * 2).toLocaleString()} total particles!`,
                value: prev.value * 2
            }))

        } catch (e) {
            console.error('Double reward error:', e)
            showToast('❌ Błąd podczas podwajania nagrody.', 'error')
        }
    }

    return (
        <div className="min-h-screen bg-void-dark flex flex-col text-white font-sans overflow-y-auto pb-12 select-none relative pt-[env(safe-area-inset-top)] px-4">
            
            {/* Header HUD */}
            <header className="w-full flex justify-between items-center py-4 border-b border-pink-500/20 mb-4">
                <button 
                    onClick={onBackToMenu}
                    disabled={isSpinning}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pink-950/20 border border-pink-500/30 text-pink-400 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> MENU
                </button>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-pink-300">VOID WHEEL</span>
                </div>
            </header>

            {/* Main Area */}
            <main className="w-full max-w-md mx-auto flex flex-col items-center flex-1">
                
                {/* Stats Panel */}
                <div className="w-full grid grid-cols-2 gap-3 mb-4">
                    <div className="glass-panel p-3 border border-pink-500/20 bg-pink-950/5 rounded-xl flex items-center justify-between">
                        <div>
                            <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Cząsteczki</span>
                            <p className="text-sm font-black text-pink-300 mt-0.5">{userBalance.particles.toLocaleString()}</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                            <Sparkles className="w-4 h-4 text-pink-400" />
                        </div>
                    </div>
                    <div className="glass-panel p-3 border border-pink-500/20 bg-pink-950/5 rounded-xl flex items-center justify-between">
                        <div>
                            <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Status VIP</span>
                            <p className="text-sm font-black text-pink-300 mt-0.5">
                                {userBalance.vipTier === 0 ? 'BRAK' : `LVL ${userBalance.vipTier}`}
                            </p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                            <Shield className="w-4 h-4 text-pink-400" />
                        </div>
                    </div>
                </div>

                {/* Ads Banner Top */}
                <div className="w-full mb-4">
                    <AniAdsBanner />
                </div>

                {/* THE WHEEL */}
                <div className="relative w-72 h-72 my-4 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-[6px] border-pink-500/30 shadow-[0_0_50px_rgba(236,72,153,0.4)] animate-pulse" />
                    <div className="absolute -inset-1 rounded-full border-2 border-pink-400/50" />

                    <div className="absolute -top-3 z-30 drop-shadow-[0_4px_10px_rgba(236,72,153,0.6)]">
                        <div className="w-6 h-6 bg-pink-500 rotate-45 rounded-tl-sm border-l border-t border-white" />
                    </div>

                    <div 
                        ref={wheelRef}
                        style={{ 
                            transform: `rotate(${rotation}deg)`,
                            transition: isSpinning ? 'transform 5.2s cubic-bezier(0.15, 0.85, 0.35, 1)' : 'none'
                        }}
                        className="w-[264px] h-[264px] rounded-full overflow-hidden relative bg-black/90 border-4 border-pink-950 select-none shadow-inner"
                    >
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            {SECTORS.map((sector, i) => {
                                const startAngle = i * 45
                                const endAngle = (i + 1) * 45
                                const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180)
                                const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180)
                                const x2 = 50 + 50 * Math.cos((endAngle * Math.PI) / 180)
                                const y2 = 50 + 50 * Math.sin((endAngle * Math.PI) / 180)

                                return (
                                    <path 
                                        key={sector.id}
                                        d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                                        fill={sector.color}
                                        stroke="#050510"
                                        strokeWidth="0.8"
                                        opacity="0.85"
                                        className="transition-all hover:opacity-100 duration-200"
                                    />
                                )
                            })}
                        </svg>

                        {SECTORS.map((sector, i) => {
                            const angle = (i * 45) + 22.5
                            return (
                                <div 
                                    key={sector.id}
                                    style={{
                                        transform: `rotate(${angle}deg)`,
                                        transformOrigin: '50% 50%',
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'start',
                                        paddingTop: '20px'
                                    }}
                                    className="pointer-events-none select-none text-[8px] font-black tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] text-center uppercase"
                                >
                                    <div className="flex flex-col items-center mt-2">
                                        <span>{sector.name.split(' ')[0]}</span>
                                        <span className="text-[6px] opacity-75">{sector.name.split(' ')[1] || ''}</span>
                                    </div>
                                </div>
                            )
                        })}

                        <div className="absolute inset-[102px] rounded-full bg-black border-[3px] border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.6)] flex items-center justify-center z-20">
                            <Trophy className="w-5 h-5 text-pink-400" />
                        </div>
                    </div>
                </div>

                {/* Spin Controls */}
                <div className="w-full flex flex-col gap-3 mt-4">
                    
                    {/* Free/Particle Spin Button */}
                    <div className="w-full flex flex-col">
                        {freeSpinAvailableState ? (
                            <button
                                onClick={() => handleSpin('free')}
                                disabled={isSpinning}
                                className="w-full py-3.5 rounded-xl font-black uppercase text-sm tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 disabled:opacity-50 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-pink-500/20 text-white cursor-pointer"
                            >
                                <Gift className="w-4 h-4" /> 
                                DARMOWY SPIN (24H)
                            </button>
                        ) : (
                            <button
                                onClick={() => handleSpin('particles')}
                                disabled={isSpinning || useGameStore.getState().particles < getParticleSpinCost()}
                                className={`w-full py-3.5 rounded-xl font-black uppercase text-sm tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 disabled:opacity-50 text-white cursor-pointer ${
                                    useGameStore.getState().particles < getParticleSpinCost()
                                        ? 'bg-zinc-800 border border-zinc-700 opacity-50 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 shadow-pink-500/10'
                                }`}
                            >
                                <RefreshCw className="w-4 h-4" /> 
                                Kup kolejny spin za {getParticleSpinCost().toLocaleString()} cząstek
                            </button>
                        )}
                        {!freeSpinAvailableState && freeSpinCooldown !== null && (
                            <p className="text-[10px] text-center text-white/40 mt-1.5 uppercase tracking-widest font-semibold">
                                Kolejny darmowy spin za: <span className="text-pink-400 font-bold font-mono">{formatCooldown(freeSpinCooldown)}</span>
                            </p>
                        )}
                    </div>

                    {/* Spin for Ad Button */}
                    <button
                        onClick={() => handleSpin('ad')}
                        disabled={isSpinning || adSpinsCount >= 3}
                        className="w-full py-3.5 rounded-xl font-black uppercase text-sm tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 disabled:opacity-40 border-2 border-pink-500/30 bg-pink-950/20 text-pink-300 hover:bg-pink-950/40 hover:border-pink-500/50"
                    >
                        <RefreshCw className="w-4 h-4" /> 
                        Spin za Reklamę ({3 - adSpinsCount}/3 dzisiaj)
                    </button>

                    {/* Divider */}
                    <div className="flex items-center w-full my-1">
                        <div className="flex-1 h-[1px] bg-white/10" />
                        <span className="px-3 text-[10px] text-white/30 uppercase tracking-widest font-bold">Premium Spins</span>
                        <div className="flex-1 h-[1px] bg-white/10" />
                    </div>

                    {/* Paid Spins */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleSpin('small')}
                            disabled={isSpinning}
                            className="py-3 rounded-xl font-bold uppercase text-xs tracking-wider flex flex-col items-center justify-center gap-0.5 border border-blue-500/30 bg-blue-950/10 hover:bg-blue-950/30 hover:border-blue-500/50 text-blue-300 transition-all disabled:opacity-50"
                        >
                            <span className="font-black text-sm">SMALL SPIN</span>
                            <span className="text-[10px] opacity-75 font-semibold text-blue-400">
                                {isTelegram ? 'Koszt: 30 Stars' : 'Koszt: 0.45 WLD'}
                            </span>
                        </button>
                        <button
                            onClick={() => handleSpin('big')}
                            disabled={isSpinning}
                            className="py-3 rounded-xl font-bold uppercase text-xs tracking-wider flex flex-col items-center justify-center gap-0.5 border border-purple-500/30 bg-purple-950/10 hover:bg-purple-950/30 hover:border-purple-500/50 text-purple-300 transition-all disabled:opacity-50"
                        >
                            <span className="font-black text-sm">BIG SPIN</span>
                            <span className="text-[10px] opacity-75 font-semibold text-purple-400">
                                {isTelegram ? 'Koszt: 100 Stars' : 'Koszt: 1.50 WLD'}
                            </span>
                        </button>
                    </div>
                </div>
            </main>

            {/* Ads Banner Bottom */}
            <div className="mt-8 border-t border-white/5 pt-4">
                <AniAdsBanner />
            </div>

            {/* TinyAPI Ads Overlay (Rewarded Ad) */}
            <AnimatePresence>
                {loadingAd && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-sm"
                    >
                        {/* Simulated Ad Container for TinyAPI Rendering */}
                        <div className="w-full max-w-xs aspect-video bg-black/60 border-2 border-pink-500/30 rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden mb-6 shadow-[0_0_30px_rgba(236,72,153,0.3)]">
                            <div id="apitiny-ad-container" className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/40">
                                <Sparkles className="w-10 h-10 text-pink-500 animate-spin mb-3 opacity-60" />
                                <p className="text-[10px] text-white/40 tracking-widest font-black uppercase">REKLAMA SPONSORA</p>
                                <p className="text-[8px] text-white/20 uppercase tracking-widest mt-1">tinyapi.net</p>
                            </div>
                        </div>

                        <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 uppercase tracking-widest text-center">
                            {adAction === 'spin' ? 'ZARABIANIE SPINU' : 'PODWAJANIE NAGRODY'}
                        </h3>
                        <p className="text-xs text-white/50 text-center mt-2 max-w-xs leading-relaxed uppercase tracking-wider mb-8">
                            Oglądaj reklamę, aby odblokować nagrodę w sieci Web3.
                        </p>

                        <div className="w-full max-w-xs">
                            {adSecondsLeft > 0 ? (
                                <button disabled className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white/35 font-bold uppercase text-xs tracking-widest font-mono">
                                    Odblokowanie za: {adSecondsLeft}s
                                </button>
                            ) : (
                                <button 
                                    onClick={adAction === 'spin' ? handleSpinAfterAd : handleDoubleAfterAd}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-lg shadow-pink-500/35 animate-bounce"
                                >
                                    ODBIERZ NAGRODĘ
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reward Modal */}
            <AnimatePresence>
                {showRewardModal && lastReward && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="glass-panel w-full max-w-sm border-2 border-pink-500 shadow-[0_0_50px_rgba(236,72,153,0.5)] p-6 rounded-2xl text-center bg-black/90 relative"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center border-2 border-pink-500/30 mx-auto mb-4 animate-bounce">
                                <Gift className="w-8 h-8 text-pink-400" />
                            </div>

                            <h3 className="text-2xl font-black tracking-tight text-pink-300 uppercase">
                                WYGRANA!
                            </h3>
                            <div 
                                style={{ color: lastReward.color }} 
                                className="text-base font-black uppercase mt-1 tracking-wider"
                            >
                                {lastReward.sectorName}
                            </div>

                            <p className="text-sm text-white/70 mt-4 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5 font-semibold">
                                {lastReward.message}
                            </p>

                            {/* 2X Reward Ad Trigger Button */}
                            {lastReward.type === 'particles' && (
                                <button
                                    onClick={() => {
                                        setShowRewardModal(false)
                                        setAdAction('double')
                                        setLoadingAd(true)
                                    }}
                                    className="w-full mt-4 py-3 rounded-xl border-2 border-emerald-500 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-950/40 hover:border-emerald-400 font-black uppercase text-xs tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5"
                                >
                                    <Play className="w-3.5 h-3.5" fill="currentColor" /> PODWÓJ 2X (REKLAMA)
                                </button>
                            )}

                            <button
                                onClick={() => setShowRewardModal(false)}
                                className="w-full mt-3 py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black uppercase text-xs tracking-wider transition-all active:scale-95 shadow-lg shadow-pink-500/10"
                            >
                                ODBIERZ
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <ToastNotification />
        </div>
    )
}
