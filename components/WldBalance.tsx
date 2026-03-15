import { useGameStore } from '@/store/gameStore'

export default function WldBalance() {
    const particles = useGameStore((state) => state.particles)
    return (
        <div className="px-3 py-1 rounded-full bg-void-purple/20 border border-void-purple/30 text-sm">
            💎 {particles >= 10000 ? `${Math.floor(particles / 10000) * 0.01} WLD` : '0 WLD'}
        </div>
    )
}
