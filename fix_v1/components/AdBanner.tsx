'use client';

import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

interface AdBannerProps {
    dataAdSlot: string;
    dataAdFormat?: string;
    dataFullWidthResponsive?: boolean;
}

export default function AdBanner({
    dataAdSlot,
    dataAdFormat = 'auto',
    dataFullWidthResponsive = true,
}: AdBannerProps) {
    const adRef = useRef<HTMLModElement>(null);

    useEffect(() => {
        try {
            if (adRef.current && (window.adsbygoogle = window.adsbygoogle || [])) {
                // Push only if the ad hasn't been populated yet to avoid duplicates/errors in React strict mode or navigation
                // However, adsbygoogle usually handles this check, but safe to push.
                // We wrap in a check or try/catch effectively.
                (window.adsbygoogle || []).push({});
            }
        } catch (e) {
            console.error('AdSense error', e);
        }
    }, []);

    return (
        <div className="w-full my-4 overflow-hidden rounded-lg bg-void-dark/50 flex justify-center items-center min-h-[100px] border border-void-purple/20">
            <ins
                className="adsbygoogle"
                style={{ display: 'block', width: '100%' }}
                data-ad-client="ca-pub-8391099480247941"
                data-ad-slot={dataAdSlot}
                data-ad-format={dataAdFormat}
                data-full-width-responsive={dataFullWidthResponsive}
                ref={adRef}
            />
            <div className="text-[10px] text-text-secondary absolute pointer-events-none opacity-50">
                Google Ad
            </div>
        </div>
    );
}
