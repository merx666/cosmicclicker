'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles, TrendingUp, TrendingDown, Clock, RefreshCw, Play, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react'
import { MiniKit, Tokens, tokenToDecimals } from '@worldcoin/minikit-js'
import { useGameStore } from '@/store/gameStore'
import { useWorldID } from '@/hooks/useWorldID'
import AniAdsBanner from '@/components/AniAdsBanner'
import ToastNotification, { showToast } from '@/components/UI/ToastNotification'

interface VoidPredictionsScreenProps {
    onBackToMenu: () => void
}

const CREATOR_WALLET = '0xc7d0ef606a313bfd69e6cc1c44065df8d99b8dfc'
const BET_COST_WLD = 0.15

export default function VoidPredictionsScreen({ onBackToMenu }: VoidPredictionsScreenProps) {
    const nullifierHash = useGameStore((state) => state.nullifierHash)
    const { userAddress } = useWorldID()
    const isTelegram = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true'

    const [gameState, setGameState] = useState<any>({
        user: { particles: 0, betsThisHour: 0 },
        currentRound: null,
        currentWldPrice: null,
        activeBets: [],
        history: [],
        recentBets: []
    })
    
    const [isLoading, setIsLoading] = useState(true)
    const [betPosition, setBetPosition] = useState<'up' | 'down' | null>(null)
    const [submittingBet, setSubmittingBet] = useState(false)
    const [activeTab, setActiveTab] = useState<'bet' | 'history'>('bet')

    // Free ad predictions state
    const [adClaimId, setAdClaimId] = useState<number | null>(null)
    const [adVerifyTimeLeft, setAdVerifyTimeLeft] = useState<number>(0)
    const [submittingAdClaim, setSubmittingAdClaim] = useState<boolean>(false)
    const adTimerRef = useRef<NodeJS.Timeout | null>(null)

    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

    const fetchState = async (silent = false) => {
        if (!silent) setIsLoading(true)
        try {
            const res = await fetch('/api/minigames/predictions')
            if (res.ok) {
                const data = await res.json()
                setGameState(data)
            }
        } catch (e) {
            console.error('Failed to load predictions state:', e)
        } finally {
            if (!silent) setIsLoading(false)
        }
    }

    // Polling state updates and timers cleanup
    useEffect(() => {
        fetchState()
        
        pollIntervalRef.current = setInterval(() => {
            fetchState(true)
        }, 4000)

        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
            if (adTimerRef.current) clearInterval(adTimerRef.current)
        }
    }, [])

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

    // Initiate Monetag ad viewing
    const handleWatchAd = async () => {
        if (!nullifierHash) {
            showToast('⚠️ Musisz zalogować się przez World ID, aby zagrać.', 'error')
            return
        }

        if (!gameState.currentRound) {
            showToast('⏱️ Brak aktywnej rundy.', 'error')
            return
        }

        if (gameState.currentRound.status !== 'open') {
            showToast('⏱️ Runda jest już zablokowana.', 'error')
            return
        }

        if (!betPosition) {
            showToast('⚠️ Wybierz kierunek (UP / DOWN) przed obejrzeniem reklamy.', 'error')
            return
        }

        if (gameState.user.freeBetsToday >= 2) {
            showToast('❌ Wykorzystałeś już limit 2 darmowych prognoz na dobę.', 'error')
            return
        }

        setSubmittingAdClaim(true)
        try {
            const res = await fetch('/api/minigames/predictions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'initiate_ad_claim' })
            })

            const data = await res.json()
            if (res.ok && data.claimId && data.url) {
                setAdClaimId(data.claimId)
                triggerHaptic()

                const isTelegram = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true'
                if (isTelegram && (window as any).Telegram?.WebApp) {
                    if (typeof (window as any).show_11049498 === 'function') {
                        showToast('🚀 Inicjowanie reklamy Monetag...', 'success')
                        ;(window as any).show_11049498()
                            .then(() => {
                                triggerSuccessHaptic()
                                showToast('✅ Reklama obejrzana! Możesz teraz zatwierdzić darmową prognozę.', 'success')
                                setAdVerifyTimeLeft(0)
                            })
                            .catch((err: any) => {
                                console.warn('Monetag TMA SDK error or closed:', err)
                                showToast('❌ Reklama nie została obejrzana w całości.', 'error')
                                setAdClaimId(null)
                            })
                    } else {
                        showToast('❌ Monetag SDK not loaded', 'error')
                        setAdClaimId(null)
                    }
                } else {
                    showToast('🚀 Otwieranie reklamy... Obejrzyj ją przez co najmniej 12 sekund.', 'success')
                    // Open Monetag direct smartlink in a new tab
                    window.open(data.url, '_blank')

                    // Start 12-second countdown
                    setAdVerifyTimeLeft(12)
                    if (adTimerRef.current) clearInterval(adTimerRef.current)
                    
                    adTimerRef.current = setInterval(() => {
                        setAdVerifyTimeLeft((prev) => {
                            if (prev <= 1) {
                                if (adTimerRef.current) clearInterval(adTimerRef.current)
                                triggerSuccessHaptic()
                                showToast('✅ Reklama obejrzana! Możesz teraz zatwierdzić darmową prognozę.', 'success')
                                return 0
                            }
                            return prev - 1
                        })
                    }, 1000)
                }
            } else {
                showToast(`❌ ${data.error || 'Błąd inicjowania reklamy'}`, 'error')
            }
        } catch (e) {
            showToast('❌ Błąd połączenia z serwerem.', 'error')
        } finally {
            setSubmittingAdClaim(false)
        }
    }

    // Place free ad-verified prediction bet
    const handlePlaceAdBet = async () => {
        if (!betPosition || !adClaimId) return
        if (adVerifyTimeLeft > 0) {
            showToast(`⏳ Poczekaj jeszcze ${adVerifyTimeLeft}s na weryfikację reklamy.`, 'error')
            return
        }

        setSubmittingAdClaim(true)
        try {
            const res = await fetch('/api/minigames/predictions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roundId: gameState.currentRound.id,
                    position: betPosition,
                    isFreeAd: true,
                    claimId: adClaimId
                })
            })

            const data = await res.json()
            if (res.ok) {
                triggerSuccessHaptic()
                showToast('🚀 Darmowa prognoza postawiona pomyślnie! Wygrana zasili Twoje cząsteczki.', 'success')
                setBetPosition(null)
                setAdClaimId(null)
                setAdVerifyTimeLeft(0)
                fetchState(true)
            } else {
                showToast(`❌ ${data.error || 'Błąd zapisu darmowego zakładu'}`, 'error')
            }
        } catch (e) {
            showToast('❌ Błąd połączenia z serwerem.', 'error')
        } finally {
            setSubmittingAdClaim(false)
        }
    }

    // Submit paid prediction bet
    const handlePlaceBet = async () => {
        if (!nullifierHash) {
            showToast('⚠️ Musisz zalogować się przez World ID, aby zagrać.', 'error')
            return
        }

        if (!gameState.currentRound) {
            showToast('⏱️ Brak aktywnej rundy.', 'error')
            return
        }

        if (gameState.currentRound.status !== 'open') {
            showToast('⏱️ Runda jest już zablokowana.', 'error')
            return
        }

        const position = betPosition
        if (!position) {
            showToast('⚠️ Wybierz kierunek (UP / DOWN).', 'error')
            return
        }

        const isTelegram = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true'

        if (gameState.user.betsThisHour >= 2) {
            showToast('❌ Limit godzinny osiągnięty (max 2 prognozy na godzinę).', 'error')
            return
        }

        if (!isTelegram && !MiniKit.isInstalled()) {
            showToast('⚠️ MiniKit nie jest zainstalowany.', 'error')
            return
        }

        setSubmittingBet(true)
        try {
            const uuid = window.crypto.randomUUID()

            if (isTelegram) {
                // Telegram Stars payment flow
                const tgWebApp = (window as any).Telegram?.WebApp
                if (!tgWebApp) {
                    showToast('⚠️ Telegram WebApp nie jest zainstalowany.', 'error')
                    setSubmittingBet(false)
                    return
                }

                // Request Telegram Stars Invoice
                const invoiceRes = await fetch('/api/telegram/pay-stars', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        itemId: 'prediction_bet',
                        priceStars: 15,
                        title: 'Prediction Bet',
                        description: `Void Prediction Round #${gameState.currentRound.epoch}`,
                        reference: uuid
                    })
                })

                const invoiceData = await invoiceRes.json()
                if (!invoiceRes.ok || !invoiceData.success) {
                    showToast(`❌ Błąd płatności Stars: ${invoiceData.error || 'Nieznany błąd'}`, 'error')
                    setSubmittingBet(false)
                    return
                }

                // Open Telegram invoice modal
                tgWebApp.openInvoice(invoiceData.invoiceLink, async (status: string) => {
                    if (status === 'paid') {
                        // Place prediction bet on backend
                        try {
                            setSubmittingBet(true)
                            const res = await fetch('/api/minigames/predictions', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    roundId: gameState.currentRound.id,
                                    position,
                                    transactionRef: uuid
                                })
                            })

                            const data = await res.json()
                            if (res.ok) {
                                showToast(`🚀 Prognoza postawiona pomyślnie! (15 Stars na ${position.toUpperCase()})`, 'success')
                                setBetPosition(null)
                                fetchState(true)
                            } else {
                                showToast(`❌ ${data.error || 'Błąd zapisu zakładu'}`, 'error')
                            }
                        } catch (err) {
                            showToast('❌ Błąd zapisu zakładu Stars.', 'error')
                        } finally {
                            setSubmittingBet(false)
                        }
                    } else {
                        showToast('❌ Płatność Stars anulowana lub nieudana.', 'error')
                        setSubmittingBet(false)
                    }
                })
            } else {
                // WorldApp / MiniKit payment flow
                const payload = {
                    reference: uuid,
                    to: CREATOR_WALLET,
                    tokens: [
                        {
                            symbol: Tokens.WLD,
                            token_amount: tokenToDecimals(BET_COST_WLD, Tokens.WLD).toString()
                        }
                    ],
                    description: `Void Prediction Round #${gameState.currentRound.epoch}`
                }

                const payResult = await MiniKit.commandsAsync.pay(payload) as any
                if (!payResult || payResult.status === 'error') {
                    showToast('❌ Płatność anulowana lub nieudana.', 'error')
                    setSubmittingBet(false)
                    return
                }

                const transactionRef = payResult.reference || uuid

                const res = await fetch('/api/minigames/predictions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roundId: gameState.currentRound.id,
                        position,
                        transactionRef
                    })
                })

                const data = await res.json()
                if (res.ok) {
                    triggerSuccessHaptic()
                    showToast(`🚀 Prognoza postawiona pomyślnie! (${BET_COST_WLD} WLD na ${position.toUpperCase()})`, 'success')
                    setBetPosition(null)
                    fetchState(true)
                } else {
                    showToast(`❌ ${data.error || 'Błąd zapisu zakładu'}`, 'error')
                }
                setSubmittingBet(false)
            }
        } catch (e) {
            showToast('❌ Wystąpił błąd komunikacji.', 'error')
            setSubmittingBet(false)
        }
    }

    const { currentRound, currentWldPrice, activeBets, history, recentBets } = gameState

    const wldTrend = currentWldPrice && currentRound?.lockPrice
        ? (currentWldPrice >= currentRound.lockPrice ? 'up' : 'down')
        : 'stable'

    return (
        <div className="min-h-screen bg-[#05020c] flex flex-col text-white font-sans overflow-y-auto pb-12 select-none relative pt-[env(safe-area-inset-top)] px-4">
            
            {/* Header HUD */}
            <header className="w-full flex justify-between items-center py-4 border-b border-blue-500/20 mb-4">
                <button 
                    onClick={onBackToMenu}
                    disabled={submittingBet}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-950/20 border border-blue-500/30 text-blue-400 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all disabled:opacity-50"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> MENU
                </button>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">VOID PREDICTIONS</span>
                </div>
            </header>

            {/* Main Content */}
            <main className="w-full max-w-md mx-auto flex flex-col flex-1">
                
                {/* Stats Panel */}
                <div className="w-full grid grid-cols-2 gap-3 mb-4">
                    <div className="glass-panel p-3 border border-blue-500/20 bg-blue-950/5 rounded-xl flex items-center justify-between">
                        <div>
                            <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider block">Limity Prognoz</span>
                            <p className="text-[10px] font-black text-blue-300 mt-0.5">
                                Paid: {gameState.user.betsThisHour || 0} / 2 (godz.)
                            </p>
                            <p className="text-[10px] font-black text-purple-400">
                                Free: {gameState.user.freeBetsToday || 0} / 2 (doba)
                            </p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Clock className="w-4 h-4 text-blue-400" />
                        </div>
                    </div>
                    <div className="glass-panel p-3 border border-blue-500/20 bg-blue-950/5 rounded-xl flex items-center justify-between">
                        <div>
                            <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Cena WLD Live</span>
                            <p className={`text-sm font-black mt-0.5 flex items-center gap-1 ${wldTrend === 'up' ? 'text-emerald-400' : wldTrend === 'down' ? 'text-rose-400' : 'text-white'}`}>
                                {currentWldPrice ? `$${currentWldPrice.toFixed(4)}` : 'Wczytywanie...'}
                                {wldTrend === 'up' && <TrendingUp className="w-3 h-3" />}
                                {wldTrend === 'down' && <TrendingDown className="w-3 h-3" />}
                            </p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '6s' }} />
                        </div>
                    </div>
                </div>

                {/* Ads Banner Top */}
                <div className="w-full mb-4">
                    <AniAdsBanner />
                </div>

                {/* Tabs */}
                <div className="w-full grid grid-cols-2 gap-2 bg-blue-950/10 p-1 rounded-xl border border-blue-500/10 mb-4">
                    <button
                        onClick={() => setActiveTab('bet')}
                        className={`py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'bet' ? 'bg-blue-500 text-black shadow-lg' : 'text-blue-400/80 hover:text-white'}`}
                    >
                        Prognoza Rundy
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'history' ? 'bg-blue-500 text-black shadow-lg' : 'text-blue-400/80 hover:text-white'}`}
                    >
                        Twoje Zakłady & Wyniki
                    </button>
                </div>

                {activeTab === 'bet' ? (
                    <div className="flex flex-col gap-4">
                        
                        {/* Active Round Info */}
                        {currentRound ? (
                            <div className="bg-[#120b29] border border-blue-500/30 rounded-2xl p-5 shadow-[0_4px_20px_rgba(59,130,246,0.15)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 flex items-center gap-1.5 text-blue-400 text-xs">
                                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                                    <span className="font-mono font-bold">
                                        {currentRound.status === 'open' 
                                            ? `BETS: ${currentRound.secondsToLock}s` 
                                            : `LOCK: ${currentRound.secondsToEnd}s`}
                                    </span>
                                </div>

                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-blue-500/10 text-blue-300 border border-blue-500/25">
                                    RUNDA #{currentRound.epoch} — {currentRound.status.toUpperCase()}
                                </span>

                                <div className="mt-4 flex flex-col gap-1">
                                    <span className="text-[10px] text-white/40 uppercase font-semibold">Cena Referencyjna (Lock)</span>
                                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-500 tracking-wider">
                                        ${currentRound.lockPrice.toFixed(4)}
                                    </span>
                                </div>

                                {currentRound.status === 'locked' && (
                                    <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2 text-[10px] text-yellow-400 uppercase font-bold tracking-wider">
                                        <Clock className="w-3.5 h-3.5" /> Zakłady zablokowane. Czekamy na wynik...
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-blue-950/10 border border-blue-500/20 rounded-2xl p-6 text-center">
                                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-300">Generowanie rundy</h3>
                                <p className="text-xs text-white/40 mt-1 uppercase">Pobieranie ceny live z API...</p>
                            </div>
                        )}

                        {/* Bet Placement */}
                        {currentRound && currentRound.status === 'open' && (
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
                                <h3 className="text-xs text-white/50 uppercase font-bold tracking-widest text-center mb-1">WYBIERZ KIERUNEK PROGNOZY</h3>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => { triggerHaptic(); setBetPosition('up') }}
                                        className={`py-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 ${betPosition === 'up' 
                                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.25)]' 
                                            : 'bg-black/40 border-white/5 text-white/50 hover:text-white/80 hover:border-white/10'}`}
                                    >
                                        <TrendingUp className="w-6 h-6 text-emerald-400" />
                                        <span className="text-xs font-black uppercase tracking-wider">WLD WZROŚNIE</span>
                                    </button>
                                    <button
                                        onClick={() => { triggerHaptic(); setBetPosition('down') }}
                                        className={`py-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 ${betPosition === 'down' 
                                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.25)]' 
                                            : 'bg-black/40 border-white/5 text-white/50 hover:text-white/80 hover:border-white/10'}`}
                                    >
                                        <TrendingDown className="w-6 h-6 text-rose-400" />
                                        <span className="text-xs font-black uppercase tracking-wider">WLD SPADNIE</span>
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-blue-950/10 border border-blue-500/20 rounded-xl mt-1 text-xs">
                                    <span className="text-white/50 uppercase font-bold">Koszt Prognozy:</span>
                                    <span className="font-black text-blue-300">
                                        {isTelegram ? '15 Stars lub Reklama Monetag' : '0.15 WLD lub Reklama Monetag'}
                                    </span>
                                </div>

                                {activeBets.length > 0 ? (
                                    <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center text-xs text-blue-300 font-bold uppercase tracking-wider">
                                        ✓ Postawiono: {activeBets[0].position.toUpperCase()} ({activeBets[0].is_free_ad ? 'DARMOWY' : (isTelegram ? '15 Stars' : `${BET_COST_WLD} WLD`)})
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3 mt-2">
                                        <button
                                            onClick={handlePlaceBet}
                                            disabled={submittingBet || !betPosition || gameState.user.betsThisHour >= 2 || adVerifyTimeLeft > 0 || submittingAdClaim}
                                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-black font-black uppercase text-xs tracking-wider transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                                        >
                                            {submittingBet ? (isTelegram ? 'Przetwarzanie płatności Stars...' : 'Płacenie przez World App...') : (
                                                gameState.user.betsThisHour >= 2 
                                                    ? 'Limit 2/h (płatny) wyczerpany' 
                                                    : (isTelegram ? 'Zatwierdź prognozę (15 Stars)' : 'Zatwierdź prognozę (0.15 WLD)')
                                            )}
                                        </button>

                                        <div className="flex items-center gap-2 text-white/10 my-0.5 text-[9px] uppercase font-black justify-center">
                                            <div className="h-[1px] bg-white/5 flex-1" />
                                            LUB
                                            <div className="h-[1px] bg-white/5 flex-1" />
                                        </div>

                                        {adVerifyTimeLeft > 0 ? (
                                            <button
                                                onClick={handlePlaceAdBet}
                                                disabled={adVerifyTimeLeft > 0 || submittingAdClaim || submittingBet}
                                                className={`w-full py-3.5 rounded-xl text-black font-black uppercase text-xs tracking-wider transition-all active:scale-98 text-center ${adVerifyTimeLeft <= 0 ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-500/80 cursor-wait'}`}
                                            >
                                                Weryfikacja reklamy... ({adVerifyTimeLeft}s)
                                            </button>
                                        ) : (
                                            adClaimId ? (
                                                <button
                                                    onClick={handlePlaceAdBet}
                                                    disabled={submittingAdClaim || submittingBet}
                                                    className="w-full py-3.5 rounded-xl bg-emerald-400 text-black font-black uppercase text-xs tracking-wider transition-all active:scale-98 text-center animate-pulse shadow-lg shadow-emerald-500/20"
                                                >
                                                    {submittingAdClaim ? 'Zapisywanie zakładu...' : 'Zatwierdź darmową prognozę'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleWatchAd}
                                                    disabled={submittingAdClaim || !betPosition || gameState.user.freeBetsToday >= 2 || submittingBet}
                                                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-black uppercase text-xs tracking-wider transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
                                                >
                                                    {submittingAdClaim ? 'Ładowanie reklamy...' : (
                                                        gameState.user.freeBetsToday >= 2
                                                            ? 'Wykorzystano limit darmowy (2/doba)'
                                                            : 'Darmowa prognoza (Obejrzyj reklamę)'
                                                    )}
                                                </button>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Recent History Table */}
                        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 mt-2">
                            <h3 className="text-xs text-white/50 uppercase font-black tracking-widest mb-4">HISTORIA OSTATNICH RUND</h3>
                            <div className="flex flex-col gap-2.5">
                                {history && history.length > 0 ? (
                                    history.map((h: any, idx: number) => {
                                        const isUp = h.outcome === 'up'
                                        const isDown = h.outcome === 'down'
                                        return (
                                            <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white/40 font-bold">RUNDA #{h.epoch}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${isUp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : isDown ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-white/10 text-white border border-white/20'}`}>
                                                        {h.outcome.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 font-mono font-semibold text-white/80">
                                                    <span className="text-white/40 text-[9px] uppercase">Lock: ${h.lockPrice.toFixed(4)}</span>
                                                    <span>→</span>
                                                    <span className={isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-white'}>
                                                        ${h.endPrice.toFixed(4)}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <p className="text-xs text-white/30 text-center uppercase py-4 font-bold">Brak rozegranych rund</p>
                                )}
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        
                        {/* User Bets */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                            <h3 className="text-xs text-white/50 uppercase font-black tracking-widest mb-4">TWOJA HISTORIA ZAKŁADÓW</h3>
                            
                            <div className="flex flex-col gap-4">
                                {recentBets && recentBets.length > 0 ? (
                                    recentBets.map((b: any, idx: number) => {
                                        const isWin = b.position === b.outcome
                                        const isResolved = b.outcome !== null
                                        const isDraw = b.outcome === 'draw'

                                        return (
                                            <div key={idx} className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                                                
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-bold text-white/60">Runda #{b.epoch}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${isWin ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : isDraw ? 'bg-white/10 text-white/70' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                                                        {isWin ? 'WYGRANA' : isDraw ? 'REMIS' : 'PRZEGRANA'}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 py-1 border-t border-b border-white/5 text-center">
                                                    <div>
                                                        <span className="text-[8px] text-white/40 uppercase font-bold block">Kierunek</span>
                                                        <span className={`text-xs font-black uppercase ${b.position === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {b.position.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] text-white/40 uppercase font-bold block">Stawka</span>
                                                        <span className="text-xs font-black text-white/90">
                                                            {b.isFreeAd ? 'REKLAMA' : (isTelegram ? '15 Stars' : `${b.amount} WLD`)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] text-white/40 uppercase font-bold block">Wypłata</span>
                                                        <span className={`text-xs font-black ${isWin || isDraw ? 'text-emerald-400' : 'text-white/40'}`}>
                                                            {isResolved ? (
                                                                b.isFreeAd ? (
                                                                    isWin ? '+5K particles' : '0 particles'
                                                                ) : (
                                                                    isWin ? '+250K particles' : (isDraw ? '+150K particles' : '0 particles')
                                                                )
                                                            ) : 'CZEKA'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {(isWin || isDraw) && (
                                                    <div className="flex items-center gap-1.5 text-[9px] text-emerald-400/90 font-bold uppercase tracking-wider justify-center">
                                                        <ShieldCheck className="w-3.5 h-3.5" /> Cząsteczki dodane bezpośrednio do Twojego salda
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="text-center py-6">
                                        <AlertTriangle className="w-8 h-8 text-white/20 mx-auto mb-2" />
                                        <p className="text-xs text-white/30 uppercase font-semibold">Nie postawiłeś jeszcze żadnego zakładu.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </main>

            {/* Ads Banner Bottom */}
            <div className="mt-8 border-t border-white/5 pt-4">
                <AniAdsBanner />
            </div>

            <ToastNotification />
        </div>
    )
}
