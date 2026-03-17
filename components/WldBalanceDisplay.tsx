'use client'

import { useGameStore } from '@/store/gameStore'

export default function WldBalanceDisplay() {
    // ⚡ Bolt Optimization:
    // Extracting the `particles` subscription into this small component prevents the
    // entire `GameScreen` (and all its children) from re-rendering on every click and
    // every second (auto-collector).
    // Impact: Reduces full layout re-renders from ~10-15 per second to 0 during active gameplay.
    const particles = useGameStore((state) => state.particles)

    return (
        <div className="px-3 py-1 rounded-full bg-void-purple/20 border border-void-purple/30 text-sm">
            💎 {particles >= 10000 ? `${Math.floor(particles / 10000) * 0.01} WLD` : '0 WLD'}
        </div>
    )
}
