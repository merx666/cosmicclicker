'use client';

import { useEffect, useRef, useState } from 'react';

// ==========================================
// KONFIGURACJA BANNERÓW REKLAMOWYCH
// ==========================================

// Prawdopodobieństwo wylosowania Monetag (0.5 = 50%)
const CONST_MONETAG_WEIGHT = 0.5;

// Interwał odświeżania w milisekundach (45000 ms = 45 sekund)
const CONST_REFRESH_INTERVAL_MS = 45000;

// Konfiguracja stref Monetag z panelu
const MONETAG_CONFIG = {
    // Incredible tag (Vignette Banner)
    VIGNETTE_ZONE_ID: '11060294',
    
    // Loud tag (Direct link) - Wklej tutaj wygenerowany link bezpośredni z Monetag
    DIRECT_LINK_URL: 'https://omg10.com/4/11049299',
};

// Identyfikatory dla TinyAdz
const TINYADZ_SITE_ID = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true'
    ? '6a1394dc2429acc1400a1d83'
    : '6974b43ddda381ae5f477c2c';

/**
 * Inicjalizacja reklamy Monetag
 * @param container Element kontenera DOM
 * @param onDirectLinkClick Funkcja obsługująca kliknięcie w Direct Link
 */
function initMonetag(container: HTMLDivElement, onDirectLinkClick: () => void) {
    console.log(`[AdRotator] Inicjalizacja Monetag (Vignette: ${MONETAG_CONFIG.VIGNETTE_ZONE_ID})...`);
    
    // 1. Tworzenie kontenera dla skryptu Vignette
    const adDiv = document.createElement('div');
    adDiv.id = 'monetag-native-ad';
    adDiv.style.display = 'none';
    container.appendChild(adDiv);

    // 2. Wstrzyknięcie skryptu Vignette Banner (incredible tag)
    const script = document.createElement('script');
    script.src = `https://alwingulla.com/act/files/micro.tag.min.js?z=${MONETAG_CONFIG.VIGNETTE_ZONE_ID}`;
    script.setAttribute('data-zone', MONETAG_CONFIG.VIGNETTE_ZONE_ID);
    script.setAttribute('data-cfasync', 'false');
    script.async = true;
    script.className = 'monetag-script';
    container.appendChild(script);

    // 3. Renderowanie estetycznego natywnego baneru (Direct Link) w slocie, aby nie był pusty
    const bannerWrapper = document.createElement('div');
    bannerWrapper.className = 'w-full flex justify-center';
    
    const banner = document.createElement('div');
    banner.className = 'w-full max-w-[360px] h-[75px] bg-gradient-to-r from-purple-900/60 via-indigo-950/80 to-blue-900/60 border border-purple-500/30 rounded-2xl flex flex-col justify-center items-center backdrop-blur-md relative overflow-hidden cursor-pointer hover:border-purple-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.15)] group';
    
    banner.innerHTML = `
        <div class="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
        <span class="text-[9px] uppercase tracking-widest text-purple-400 font-bold opacity-80 group-hover:text-purple-300 transition-colors">Void Portal Bonus</span>
        <span class="text-xs text-white font-semibold mt-0.5 tracking-wide group-hover:scale-105 transition-transform duration-300">CLAIM FREE VOID PARTICLES 🌌</span>
        <span class="text-[8px] text-gray-500 absolute bottom-1 right-2 scale-90">Sponsored</span>
    `;

    banner.addEventListener('click', onDirectLinkClick);
    bannerWrapper.appendChild(banner);
    container.appendChild(bannerWrapper);
}

/**
 * Czyszczenie reklamy Monetag
 */
function cleanupMonetag(container: HTMLDivElement) {
    console.log('[AdRotator] Czyszczenie Monetag...');
    container.innerHTML = '';
}

/**
 * Inicjalizacja reklamy TinyAdz
 */
function initTinyAdz(container: HTMLDivElement) {
    console.log(`[AdRotator] Inicjalizacja TinyAdz (SiteID: ${TINYADZ_SITE_ID})...`);

    // Kontener dla TinyAdz (estetyczny skeleton bez tekstu)
    const adDiv = document.createElement('div');
    adDiv.setAttribute('ta-ad-container', '');
    adDiv.className = 'w-full max-w-[360px] min-h-[75px] bg-[#120b29]/20 border border-blue-500/5 rounded-2xl flex justify-center items-center backdrop-blur-sm';
    container.appendChild(adDiv);

    // Skrypt TinyAdz
    const script = document.createElement('script');
    script.src = 'https://cdn.apitiny.net/scripts/v2.0/main.js';
    script.setAttribute('data-site-id', TINYADZ_SITE_ID);
    script.setAttribute('data-test-mode', 'false');
    script.async = true;
    script.className = 'tinyadz-script';
    container.appendChild(script);
}

/**
 * Czyszczenie reklamy TinyAdz
 */
function cleanupTinyAdz(container: HTMLDivElement) {
    console.log('[AdRotator] Czyszczenie TinyAdz...');
    const scriptInBody = document.querySelector('script[src*="apitiny.net"]');
    if (scriptInBody) {
        scriptInBody.remove();
    }
    container.innerHTML = '';
}

// ==========================================
// KOMPONENT REAKTOWY
// ==========================================

interface DynamicAdRotatorProps {
    onAdClick?: () => void;
}

export default function DynamicAdRotator({ onAdClick }: DynamicAdRotatorProps = {}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedNetwork, setSelectedNetwork] = useState<'monetag' | 'tinyadz'>('monetag');
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

    const handleDirectLinkClick = () => {
        console.log('[AdRotator] Kliknięcie w Direct Link. Przekierowanie...');
        onAdClick?.();
        if (typeof window !== 'undefined') {
            window.open(MONETAG_CONFIG.DIRECT_LINK_URL, '_blank');
        }
    };

    const drawNetwork = (): 'monetag' | 'tinyadz' => {
        const rand = Math.random();
        const network = rand < CONST_MONETAG_WEIGHT ? 'monetag' : 'tinyadz';
        console.log(`[AdRotator] Losowanie: ${Math.round(rand * 100)}% -> Wybrano: ${network.toUpperCase()}`);
        return network;
    };

    // Pętla odświeżania z Visibility API
    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        const startInterval = () => {
            if (intervalId) clearInterval(intervalId);
            
            intervalId = setInterval(() => {
                if (document.visibilityState === 'visible') {
                    console.log('[AdRotator] Karta aktywna. Odświeżam slot reklamowy...');
                    setSelectedNetwork(drawNetwork());
                    setRefreshTrigger(prev => prev + 1);
                }
            }, CONST_REFRESH_INTERVAL_MS);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('[AdRotator] Karta aktywna. Wznawiam pętlę.');
                setSelectedNetwork(drawNetwork());
                setRefreshTrigger(prev => prev + 1);
                startInterval();
            } else {
                console.log('[AdRotator] Karta nieaktywna. Wstrzymuję pętlę.');
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

    // Zarządzanie cyklem życia reklam w kontenerze DOM
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.innerHTML = '';

        if (selectedNetwork === 'monetag') {
            initMonetag(container, handleDirectLinkClick);
        } else {
            initTinyAdz(container);
        }

        console.log(`[AdRotator] Załadowano: ${selectedNetwork.toUpperCase()}. Kolejny refresh za ${CONST_REFRESH_INTERVAL_MS / 1000}s.`);

        return () => {
            if (container) {
                if (selectedNetwork === 'monetag') {
                    cleanupMonetag(container);
                } else {
                    cleanupTinyAdz(container);
                }
            }
        };
    }, [selectedNetwork, refreshTrigger]);

    return (
        <div className="w-full flex justify-center items-center py-4 px-2">
            <div 
                ref={containerRef}
                onClick={onAdClick}
                id="monetag-tinyadz-rotator-container"
                className="w-full max-w-[360px] flex justify-center items-center min-h-[75px]"
            />
        </div>
    );
}
