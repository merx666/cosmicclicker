'use client'

import { useGameStore } from '@/store/gameStore'

export default function AniAdsBanner() {
    // ⚡ Bolt Perf Optimization: Specific selector prevents this component from re-rendering on passive particle generation
    const nullifierHash = useGameStore(state => state.nullifierHash)

    if (!nullifierHash) return null

    return (
        <div className="w-full flex justify-center items-center py-2 px-1">
            <div 
                {...{ 'ta-ad-container': '' }} 
                className="w-full max-w-[360px] min-h-[75px] bg-[#120b29]/40 border border-blue-500/20 rounded-2xl flex justify-center items-center relative overflow-hidden backdrop-blur-sm"
            >
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
                    <span className="text-[8px] uppercase tracking-widest text-blue-400 font-black">Sponsored</span>
                </div>
            </div>
        </div>
    )
}
