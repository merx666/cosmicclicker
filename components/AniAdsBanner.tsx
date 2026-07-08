'use client'

import { useGameStore } from '@/store/gameStore'
import DynamicAdRotator from './DynamicAdRotator'

export default function AniAdsBanner() {
    // ⚡ Bolt: Optimize Zustand selector to prevent re-renders when other state (like particles) changes
    const nullifierHash = useGameStore(state => state.nullifierHash)

    if (!nullifierHash) return null

    return (
        <DynamicAdRotator />
    )
}
