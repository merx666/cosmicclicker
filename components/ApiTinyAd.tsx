'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
// @ts-ignore
import { AniAds } from '@/lib/ani-ads-sdk/dist/index.mjs'

interface ApiTinyAdProps {
    userWallet?: string
}

export default function ApiTinyAd({ userWallet }: ApiTinyAdProps) {
    const isTelegram = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true'
    const siteId = isTelegram ? '6a1394dc2429acc1400a1d83' : '6974b43ddda381ae5f477c2c'
    const nullifierHash = useGameStore((state) => state.nullifierHash)
    const activeWallet = userWallet || nullifierHash

    // Log parameters for debugging in WebView/Console
    useEffect(() => {
        console.log('[ApiTinyAd] Mounted. Config:', {
            isTelegram,
            siteId,
            activeWallet,
            nullifierHash,
            userWallet
        })
    }, [isTelegram, siteId, activeWallet, nullifierHash, userWallet])

    // Dynamically load TinyAds script after container is mounted to avoid Next.js page switch races
    useEffect(() => {
        if (typeof window === 'undefined') return

        console.log('[ApiTinyAd] Initializing TinyAds script for siteId:', siteId)

        // Clean up any existing script to avoid duplicates
        const existingScript = document.querySelector('script[src*="apitiny.net"]')
        if (existingScript) {
            existingScript.remove()
        }

        const script = document.createElement('script')
        script.src = 'https://cdn.apitiny.net/scripts/v2.0/main.js'
        script.setAttribute('data-site-id', siteId)
        // Production mode (data-test-mode=false) for both WorldApp and Telegram
        script.setAttribute('data-test-mode', 'false')
        script.async = true

        document.body.appendChild(script)

        return () => {
            script.remove()
        }
    }, [siteId, isTelegram])

    return (
        <div className="flex flex-col items-center gap-4 w-full pb-20">
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

            {/* Tiny Ads container */}
            <div
                {...{ 'ta-ad-container': '' }}
                className="w-full flex justify-center min-h-[50px]"
            />
        </div>
    )
}




