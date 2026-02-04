'use client'

import Script from 'next/script'

export default function ApiTinyAd() {
    return (
        <>
            <div
                id="apitiny-container"
                data-tinyadz-container="true"
            />
            <Script
                src="https://cdn.apitiny.net/scripts/v2.0/main.js"
                data-site-id="6974b43ddda381ae5f477c2c"
                data-test-mode="false"
                strategy="afterInteractive"
            />
        </>
    )
}
