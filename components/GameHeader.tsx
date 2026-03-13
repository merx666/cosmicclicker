'use client'

import { useTranslations } from 'next-intl'
import { useGameStore } from '@/store/gameStore'

export default function GameHeader() {
    const t = useTranslations('Game')

    // PERFORMANCE OPTIMIZATION (Bolt ⚡):
    // Subscribing to `particles` here instead of in `GameScreen`.
    // Since `particles` updates every second (via auto-collector),
    // extracting this prevents the entire `GameScreen` from re-rendering every second.
    const particles = useGameStore((state) => state.particles)

    return (
        <header className="sticky top-0 z-40 bg-void-dark/80 backdrop-blur-lg border-b border-void-purple/20">
            <div className="max-w-2xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-void-purple to-particle-glow bg-clip-text text-transparent">
                        {t('title')}
                    </h1>
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1 rounded-full bg-void-purple/20 border border-void-purple/30 text-sm">
                            💎 {particles >= 10000 ? `${Math.floor(particles / 10000) * 0.01} WLD` : '0 WLD'}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
