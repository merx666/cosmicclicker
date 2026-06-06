'use client'

import { useState } from 'react'
import { MiniKit, Tokens, tokenToDecimals } from '@worldcoin/minikit-js'
import { POWER_UPS } from '@/lib/powerUps'
import { showToast } from '@/components/UI/ToastNotification'

interface PowerUpButtonsProps {
    onPowerUpPurchased: (powerUpId: string) => void
}

export default function PowerUpButtons({ onPowerUpPurchased }: PowerUpButtonsProps) {
    const [purchasing, setPurchasing] = useState<string | null>(null)

    const handlePurchase = async (powerUpId: string) => {
        const powerUp = POWER_UPS.find(p => p.id === powerUpId)
        if (!powerUp) return

        setPurchasing(powerUpId)

        try {
            if (MiniKit.isInstalled()) {
                const merchantAddress = process.env.NEXT_PUBLIC_WALLET_ADDRESS
                if (!merchantAddress || merchantAddress === '0xYOUR_WALLET') {
                    showToast('Configuration Error: Wallet not set', 'error')
                    setPurchasing(null)
                    return
                }

                const initRes = await fetch('/api/initiate-payment', { method: 'POST' })
                const { id } = await initRes.json()

                const res = await MiniKit.commandsAsync.pay({
                    reference: id,
                    to: merchantAddress,
                    tokens: [{
                        symbol: Tokens.WLD,
                        token_amount: tokenToDecimals(powerUp.price, Tokens.WLD).toString()
                    }],
                    description: `${powerUp.name} - ${powerUp.description}`
                })

                console.log('[DEBUG-PAYMENT] Pay result:', res)

                if (res.finalPayload.status === 'success') {
                    // Verify on backend 
                    // Note: Ideally call backend purchase endpoint like shop, but for powerups we just activate client side for now + maybe log
                    // Or call a verify endpoint
                    onPowerUpPurchased(powerUpId)
                    showToast(`${powerUp.name} activated!`, 'success', '✅')
                } else {
                    console.warn('[DEBUG-PAYMENT] Payment failed or cancelled:', res)
                    showToast('Payment cancelled', 'warning')
                }
            } else {
                // Dev mode - just activate
                console.warn('MiniKit not installed, activating power-up for dev')
                onPowerUpPurchased(powerUpId)
            }
        } catch (error) {
            console.error('Power-up purchase error:', error)
            showToast('Purchase failed', 'error')
        } finally {
            setPurchasing(null)
        }
    }

    return (
        <div className="fixed right-2 top-20 z-[90] flex flex-col gap-2 pointer-events-auto">
            {POWER_UPS.filter(p => p.id !== 'revive').map(powerUp => (
                <button
                    key={powerUp.id}
                    onClick={() => handlePurchase(powerUp.id)}
                    disabled={purchasing === powerUp.id}
                    className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-black px-3 py-2 rounded-lg font-bold text-xs shadow-lg border border-orange-400/50 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                    title={powerUp.description}
                >
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-lg">{powerUp.icon}</span>
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] leading-tight">{powerUp.name}</span>
                            <span className="text-[9px] text-orange-900 leading-tight">
                                {purchasing === powerUp.id ? '...' : `${powerUp.price} WLD`}
                            </span>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    )
}
