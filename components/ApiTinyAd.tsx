'use client'

import Script from 'next/script'

export default function ApiTinyAd() {
    return (
        <>
            {/* Ad container for TinyAdz */}
            <div
                id="apitiny-container"
                data-tinyadz-container="true"
                style={{
                    position: 'fixed',
                    bottom: '80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    width: '100%',
                    maxWidth: '320px',
                    minHeight: '50px',
                    display: 'flex',
                    justifyContent: 'center'
                }}
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
