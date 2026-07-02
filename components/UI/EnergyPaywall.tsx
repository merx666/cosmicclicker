'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { MiniKit, Tokens, tokenToDecimals } from '@worldcoin/minikit-js'
import { Zap, Clock, ShieldCheck, Infinity as InfinityIcon, Loader2, X } from 'lucide-react'

const PACKAGES = [
    { id: 'boost_1h', name: 'Boost Energii', duration: '1 godzina', price: 0.2, icon: Zap, color: 'text-blue-400', border: 'hover:border-blue-500/50', bg: 'bg-blue-500/10' },
    { id: 'overdrive_12h', name: 'Overdrive', duration: '12 godzin', price: 1.0, icon: Clock, color: 'text-purple-400', border: 'hover:border-purple-500/50', bg: 'bg-purple-500/10' },
    { id: 'void_master_7d', name: 'Void Master', duration: '7 dni', price: 5.0, icon: ShieldCheck, color: 'text-amber-400', border: 'hover:border-amber-500/50', bg: 'bg-amber-500/10' },
    { id: 'singularity_perm', name: 'Singularity', duration: 'Permanentnie', price: 10.0, icon: InfinityIcon, color: 'text-red-400', border: 'hover:border-red-500/50', bg: 'bg-red-500/10' }
]

export function EnergyPaywall() {
    const showEnergyPaywall = useGameStore(state => state.showEnergyPaywall)
    const setShowEnergyPaywall = useGameStore(state => state.setShowEnergyPaywall)
    const nullifierHash = useGameStore(state => state.nullifierHash)
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState<{ msg: string, type: 'error' | 'success' } | null>(null)

    if (!showEnergyPaywall) return null

    const showToast = (msg: string, type: 'error' | 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    const handlePurchase = async (pkg: typeof PACKAGES[0]) => {
        if (!MiniKit.isInstalled()) {
            showToast('MiniKit nie jest zainstalowany', 'error')
            return
        }

        setLoading(true)
        try {
            // 1. Generate Nonce
            const nonceRes = await fetch('/api/pay/generate-nonce', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packageId: pkg.id, nullifierHash })
            })
            const { id: reference } = await nonceRes.json()

            if (!reference) throw new Error('Błąd generowania transakcji')

            // 2. Trigger MiniKit Pay
            const payResult = await MiniKit.commandsAsync.pay({
                reference,
                to: process.env.NEXT_PUBLIC_MERCHANT_WALLET || '0xc7d0ef606a313bfd69e6cc1c44065df8d99b8dfc',
                tokens: [{
                    symbol: Tokens.WLD,
                    token_amount: tokenToDecimals(pkg.price, Tokens.WLD).toString()
                }],
                description: `Zakup: ${pkg.name}`
            })

            if (payResult?.finalPayload?.status === 'success') {
                // 3. Confirm Transaction
                const confirmRes = await fetch('/api/pay/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ payload: payResult.finalPayload })
                })
                const confirmData = await confirmRes.json()

                if (confirmData.success) {
                    showToast('Płatność zakończona sukcesem!', 'success')
                    setTimeout(() => {
                        setShowEnergyPaywall(false)
                        window.location.reload()
                    }, 2000)
                } else {
                    throw new Error('Błąd weryfikacji po stronie serwera')
                }
            } else {
                throw new Error('Anulowano lub błąd płatności')
            }
        } catch (error: any) {
            console.error(error)
            showToast(error.message || 'Wystąpił błąd', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#1a1b26]/95 border border-indigo-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
                {/* Accent glow line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500" />
                
                {/* Background glow blob */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                <button 
                    onClick={() => setShowEnergyPaywall(false)}
                    className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    disabled={loading}
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-6 mt-4">
                    <div className="inline-flex items-center justify-center p-4 rounded-full bg-red-500/10 mb-4 border border-red-500/20">
                        <Zap size={32} className="text-red-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">Brak Energii</h2>
                    <p className="text-slate-400 text-sm px-4">
                        Wyczerpałeś darmowy limit <span className="text-white font-bold">1000 kliknięć</span> na tę godzinę. Czekaj na reset lub zdejmij limit natychmiast!
                    </p>
                </div>

                <div className="space-y-3 mb-6 relative z-10">
                    {PACKAGES.map(pkg => (
                        <button
                            key={pkg.id}
                            disabled={loading}
                            onClick={() => handlePurchase(pkg)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl bg-[#242636] hover:bg-[#2a2c3d] border border-white/5 ${pkg.border} transition-all group`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${pkg.bg} ${pkg.color} group-hover:scale-110 transition-transform`}>
                                    <pkg.icon size={24} />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-white text-base">{pkg.name}</div>
                                    <div className="text-xs text-slate-400 font-medium">{pkg.duration}</div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="font-black text-white text-lg">{pkg.price} WLD</span>
                            </div>
                        </button>
                    ))}
                </div>

                <button 
                    onClick={() => setShowEnergyPaywall(false)}
                    className="w-full py-3 rounded-xl font-bold text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors relative z-10"
                    disabled={loading}
                >
                    Poczekam na odnowienie
                </button>

                {toast && (
                    <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shadow-lg backdrop-blur-md z-50 animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-green-500/20 text-green-400 border border-green-500/50'}`}>
                        {toast.msg}
                    </div>
                )}

                {loading && (
                    <div className="absolute inset-0 bg-[#1a1b26]/80 backdrop-blur-sm flex flex-col items-center justify-center z-40 rounded-3xl">
                        <Loader2 className="animate-spin text-purple-500 mb-4" size={48} />
                        <span className="font-bold text-white tracking-widest text-sm uppercase">Przetwarzanie</span>
                    </div>
                )}
            </div>
        </div>
    )
}
