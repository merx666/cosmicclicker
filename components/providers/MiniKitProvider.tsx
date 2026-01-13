'use client'

import { ReactNode, useEffect, useState } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'

interface MiniKitProviderProps {
    children: ReactNode
}

export function MiniKitProvider({ children }: MiniKitProviderProps) {
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        const installMiniKit = async () => {
            try {
                const appId = process.env.NEXT_PUBLIC_MINIKIT_APP_ID
                if (!appId) {
                    console.warn('MINIKIT_APP_ID not configured')
                    setIsReady(true) // Allow development without MiniKit
                    return
                }

                await MiniKit.install(appId)
                setIsReady(true)
            } catch (error) {
                console.error('Failed to install MiniKit:', error)
                setIsReady(true) // Still render app even if MiniKit fails
            }
        }

        installMiniKit()
    }, [])

    if (!isReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-void-dark">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-particle-glow mx-auto mb-4"></div>
                    <p className="text-text-secondary">Initializing Void Collector...</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
