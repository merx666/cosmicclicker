'use client'

import { useGameStore } from '@/store/gameStore'

export default function WldBadge() {
    // ⚡ Bolt Optimization:
    // 💡 What: Extracted particles state subscription into this isolated component.
    // 🎯 Why: `particles` updates every second and on every click. Reading it in GameScreen forced the entire app to re-render.
    // 📊 Impact: Prevents massive cascading re-renders across all tabs, keeping the UI smooth.
    const particles = useGameStore((state) => state.particles)

    return (
        <div className="px-3 py-1 rounded-full bg-void-purple/20 border border-void-purple/30 text-sm">
            💎 {particles >= 10000 ? `${Math.floor(particles / 10000) * 0.01} WLD` : '0 WLD'}
        </div>
    )
}
