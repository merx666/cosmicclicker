'use client'

import { useGameStore } from '@/store/gameStore'

export default function WldBalance() {
    // ⚡ Bolt: Isolate `particles` state to prevent full GameScreen re-renders
    // `particles` changes every second or on click. By subscribing to it here,
    // only this small component re-renders instead of the entire GameScreen structure.
    const particles = useGameStore((state) => state.particles)

    return (
        <div className="px-3 py-1 rounded-full bg-void-purple/20 border border-void-purple/30 text-sm">
            💎 {particles >= 10000 ? `${Math.floor(particles / 10000) * 0.01} WLD` : '0 WLD'}
        </div>
    )
}
