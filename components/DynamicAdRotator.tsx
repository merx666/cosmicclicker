'use client';

import { useEffect, useState, useRef } from 'react';

// ==========================================
// KONFIGURACJA BANNERÓW REKLAMOWYCH
// ==========================================

const CONST_MONETAG_WEIGHT = 0.5;
const CONST_REFRESH_INTERVAL_MS = 45000;

const MONETAG_CONFIG = {
    VIGNETTE_ZONE_ID: '11060294',
    DIRECT_LINK_URL: 'https://omg10.com/4/11049299',
};

const TINYADZ_SITE_ID = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true'
    ? '6a1394dc2429acc1400a1d83'
    : '6974b43ddda381ae5f477c2c';

function MonetagAd({ onAdClick }: { onAdClick?: () => void }) {
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const script = document.createElement('script');
        script.src = `https://alwingulla.com/act/files/micro.tag.min.js?z=${MONETAG_CONFIG.VIGNETTE_ZONE_ID}`;
        script.setAttribute('data-zone', MONETAG_CONFIG.VIGNETTE_ZONE_ID);
        script.setAttribute('data-cfasync', 'false');
        script.async = true;
        document.body.appendChild(script);

        return () => {
            const existingScript = document.querySelector(`script[src*="micro.tag.min.js?z=${MONETAG_CONFIG.VIGNETTE_ZONE_ID}"]`);
            if (existingScript) existingScript.remove();
        };
    }, []);

    const handleDirectLinkClick = () => {
        onAdClick?.();
        if (typeof window !== 'undefined') {
            window.open(MONETAG_CONFIG.DIRECT_LINK_URL, '_blank');
        }
    };

    return (
        <div 
            onClick={handleDirectLinkClick}
            className="w-full max-w-[360px] h-[75px] bg-gradient-to-r from-purple-900/60 via-indigo-950/80 to-blue-900/60 border border-purple-500/30 rounded-2xl flex flex-col justify-center items-center backdrop-blur-md relative overflow-hidden cursor-pointer hover:border-purple-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.15)] group mx-auto"
        >
            <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
            <span className="text-[9px] uppercase tracking-widest text-purple-400 font-bold opacity-80 group-hover:text-purple-300 transition-colors">Void Portal Bonus</span>
            <span className="text-xs text-white font-semibold mt-0.5 tracking-wide group-hover:scale-105 transition-transform duration-300">CLAIM FREE VOID PARTICLES 🌌</span>
            <span className="text-[8px] text-gray-500 absolute bottom-1 right-2 scale-90">Sponsored</span>
        </div>
    );
}

function TinyAdzAd() {
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const script = document.createElement('script');
        script.src = 'https://cdn.apitiny.net/scripts/v2.0/main.js';
        script.setAttribute('data-site-id', TINYADZ_SITE_ID);
        script.setAttribute('data-test-mode', 'false');
        script.async = true;
        document.body.appendChild(script);

        return () => {
            const existingScript = document.querySelector('script[src*="apitiny.net"]');
            if (existingScript) existingScript.remove();
        };
    }, []);

    return (
        <div className="w-full flex justify-center items-center">
            <div 
                {...{ 'ta-ad-container': '' }}
                className="w-full max-w-[360px] min-h-[75px] bg-[#120b29]/20 border border-blue-500/5 rounded-2xl flex justify-center items-center backdrop-blur-sm"
            />
        </div>
    );
}

// ==========================================
// KOMPONENT REAKTOWY
// ==========================================

interface DynamicAdRotatorProps {
    onAdClick?: () => void;
}

export default function DynamicAdRotator({ onAdClick }: DynamicAdRotatorProps = {}) {
    const [selectedNetwork, setSelectedNetwork] = useState<'monetag' | 'tinyadz'>('monetag');
    const [mounted, setMounted] = useState(false);

    const drawNetwork = (): 'monetag' | 'tinyadz' => {
        const rand = Math.random();
        return rand < CONST_MONETAG_WEIGHT ? 'monetag' : 'tinyadz';
    };

    useEffect(() => {
        setMounted(true);
        setSelectedNetwork(drawNetwork());

        let intervalId: NodeJS.Timeout | null = null;

        const startInterval = () => {
            if (intervalId) clearInterval(intervalId);
            intervalId = setInterval(() => {
                if (document.visibilityState === 'visible') {
                    setSelectedNetwork(drawNetwork());
                }
            }, CONST_REFRESH_INTERVAL_MS);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                setSelectedNetwork(drawNetwork());
                startInterval();
            } else {
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
            }
        };

        if (document.visibilityState === 'visible') {
            startInterval();
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (intervalId) clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    if (!mounted) {
        return <div className="w-full max-w-[360px] min-h-[75px] bg-[#120b29]/20 border border-blue-500/5 rounded-2xl flex justify-center items-center backdrop-blur-sm mx-auto"></div>;
    }

    return (
        <div className="w-full flex justify-center items-center py-4 px-2">
            <div className="w-full max-w-[360px] min-h-[75px] relative">
                <div style={{ display: selectedNetwork === 'monetag' ? 'block' : 'none', width: '100%' }}>
                    <MonetagAd onAdClick={onAdClick} />
                </div>
                <div style={{ display: selectedNetwork === 'tinyadz' ? 'block' : 'none', width: '100%' }}>
                    <TinyAdzAd />
                </div>
            </div>
        </div>
    );
}
