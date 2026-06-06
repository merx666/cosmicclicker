'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function AdsTab() {
    const [isLoading, setIsLoading] = useState(true)
    const isTelegram = process.env.NEXT_PUBLIC_IS_TELEGRAM === 'true'

    useEffect(() => {
        if (typeof window === 'undefined' || isTelegram) return

        console.log('[AdsTab] Initializing TinyAdz booking widget with seed 8288...')

        // Clean up any existing script to avoid duplicates
        const existingScript = document.querySelector('script[src*="tinysnippet.net"]')
        if (existingScript) {
            existingScript.remove()
        }

        const script = document.createElement('script')
        script.src = 'https://cdn.tinysnippet.net/scripts/v2.0/manager.js'
        script.async = true
        script.onload = () => {
            console.log('[AdsTab] TinyAdz manager script loaded.')
            setIsLoading(false)
        }

        document.body.appendChild(script)

        return () => {
            script.remove()
        }
    }, [isTelegram])

    if (isTelegram) {
        return (
            <div className="flex flex-col h-full bg-void-dark pb-[100px] overflow-y-auto no-scrollbar pt-6 px-5">
                <div className="mb-6">
                    <h1 className="text-3xl font-black italic bg-gradient-to-r from-[#00ffcc] to-[#3b82f6] text-transparent bg-clip-text text-shadow-glow flex items-center gap-2">
                        <span>📡</span> PROMOTE YOUR BRAND
                    </h1>
                    <p className="text-text-secondary text-sm mt-3 leading-relaxed">
                        Natively promote your project, tokens, or community in Void Collector. Get noticed by thousands of active crypto users daily!
                    </p>
                </div>

                <div className="w-full max-w-[480px] mx-auto mt-6 bg-[#1a1b26]/50 border border-void-purple/20 rounded-3xl p-6 text-center backdrop-blur-md shadow-[0_0_30px_rgba(139,92,246,0.15)]">
                    <div className="text-5xl mb-4">🔮</div>
                    <h3 className="text-xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
                        Dostępne w WorldApp
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed mb-6">
                        System rezerwacji i zakupów reklam TinyAdz jest zintegrowany bezpośrednio z ekosystemem **WorldApp** za pomocą protokołu World ID.
                    </p>
                    <div className="bg-[#00ffcc]/10 border border-[#00ffcc]/20 rounded-xl p-3 mb-6">
                        <p className="text-[11px] text-[#00ffcc] leading-tight font-medium">
                            💡 Otwórz Void Collector w swojej aplikacji **World App**, aby błyskawicznie kupić i uruchomić reklamę!
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-void-dark pb-[100px] overflow-y-auto no-scrollbar pt-6">
            <div className="px-5 mb-6">
                <h1 className="text-3xl font-black italic bg-gradient-to-r from-[#00ffcc] to-[#3b82f6] text-transparent bg-clip-text text-shadow-glow flex items-center gap-2">
                    <span>📡</span> PROMOTE YOUR BRAND
                </h1>
                <p className="text-text-secondary text-sm mt-3 leading-relaxed">
                    Natively promote your project, tokens, or community in Void Collector. Get noticed by thousands of active crypto users daily!
                </p>
            </div>

            {/* Container for the Widget */}
            <div className="px-5 mb-10 w-full flex flex-col items-center">
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[480px] bg-[#0e0720]/80 rounded-3xl p-3 shadow-[0_0_50px_rgba(139,92,246,0.15)] border border-void-purple/20 overflow-hidden relative"
                >
                    {isLoading && (
                        <div className="absolute inset-0 bg-[#0e0720]/95 flex flex-col items-center justify-center gap-3 z-20 rounded-3xl">
                            <div className="w-10 h-10 border-4 border-t-[#00ffcc] border-r-transparent border-b-[#3b82f6] border-l-transparent rounded-full animate-spin" />
                            <p className="text-xs text-[#00ffcc] uppercase tracking-widest font-black animate-pulse">
                                Loading Banners...
                            </p>
                        </div>
                    )}

                    <iframe
                        width="100%"
                        height="240"
                        frameBorder="0"
                        className="ta-widget rounded-2xl animate-fade-in"
                        data-min-height="100"
                        id="widget6a14381c5a9dedc3c99f2ece-seed1797"
                        src="https://app.tinyadz.com/widgets/6a14381c5a9dedc3c99f2ece?seed=1797&previewMode=false&showInPopup=false&theme=light"
                        style={{ border: 'none', background: 'transparent', display: 'block', minHeight: '240px' }}
                        title="TinyAdz Partner Banners"
                    />
                </motion.div>
                
                <p className="text-[10px] text-text-secondary/50 mt-4 text-center max-w-xs">
                    Ad placement and campaign management securely powered by TinyAdz.
                </p>
            </div>
        </div>
    )
}

