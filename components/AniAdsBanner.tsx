'use client'

import { useGameStore } from '@/store/gameStore'
import DynamicAdRotator from './DynamicAdRotator'

export default function AniAdsBanner() {
    const nullifierHash = useGameStore((state) => state.nullifierHash)

    if (!nullifierHash) return null

    return (
        <DynamicAdRotator />
    )
}
