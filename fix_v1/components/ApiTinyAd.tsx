'use client'

import Script from 'next/script'
// @ts-ignore
import { AniAds } from '@/lib/ani-ads-sdk/dist/index.mjs'

interface ApiTinyAdProps {
    userWallet?: string
}

export default function ApiTinyAd({ userWallet }: ApiTinyAdProps) {
    return (
        <div className="flex flex-col items-center gap-4 w-full pb-20">
            {/* Ani Ads */}
            {userWallet && (
                <div className="w-full max-w-[400px] flex justify-center">
                    <AniAds
                        creator_wallet="0x68b4aa6fB4f00dD1A8F8d9AfD6401e4baF67C817"
                        app_name="Void Collector"
                        user_wallet_address={userWallet}
                    />
                </div>
            )}

            {/* Tiny Ads */}
            <div
                id="apitiny-container"
                data-tinyadz-container="true"
                className="w-full flex justify-center"
            />
            <Script
                src="https://cdn.apitiny.net/scripts/v2.0/main.js"
                data-site-id="6974b43ddda381ae5f477c2c"
                data-test-mode="false"
                strategy="afterInteractive"
            />
        </div>
    )
}
