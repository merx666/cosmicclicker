'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
// @ts-ignore
import { AniAds } from '@/lib/ani-ads-sdk/dist/index.mjs'
import DynamicAdRotator from './DynamicAdRotator'

interface ApiTinyAdProps {
    userWallet?: string
}

export default function ApiTinyAd({ userWallet }: ApiTinyAdProps) {
    const isTelegram = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true'
    const nullifierHash = useGameStore((state) => state.nullifierHash)
    const activeWallet = userWallet || nullifierHash

    // Log parameters for debugging in WebView/Console
    useEffect(() => {
        console.log('[ApiTinyAd] Mounted. Config:', {
            isTelegram,
            activeWallet,
            nullifierHash,
            userWallet
        })
    }, [isTelegram, activeWallet, nullifierHash, userWallet])

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            {/* Ani Ads (Only for WorldApp / MiniKit) */}
            {!isTelegram && activeWallet && (
                <div className="w-full max-w-[400px] flex justify-center">
                    <AniAds
                        creator_wallet="0xc7d0ef606a313bfd69e6cc1c44065df8d99b8dfc"
                        app_name="Void Collector"
                        user_wallet_address={activeWallet}
                    />
                </div>
            )}

            {/* Zoptymalizowany rotator Monetag / TinyAdz */}
            <DynamicAdRotator />
        </div>
    )
}




