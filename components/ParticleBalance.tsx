'use client'

import { useGameStore } from '@/store/gameStore'

export default function ParticleBalance() {
    // ⚡ Bolt Optimization: Isolate particle state subscription to prevent unnecessary re-renders of the entire GameScreen component
    // particles state updates 60 times a second when holding spacebar, which causes the whole screen to re-render.
    // By creating a separate component, only this small piece of UI re-renders.
    const particles = useGameStore((state) => state.particles)

    return (
        <div className="px-3 py-1 rounded-full bg-void-purple/20 border border-void-purple/30 text-sm">
            💎 {particles >= 10000 ? `${Math.floor(particles / 10000) * 0.01} WLD` : '0 WLD'}
        </div>
    )
}
