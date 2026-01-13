'use client'

import { useState } from 'react'
import { MiniKit, type MiniAppWalletAuthSuccessPayload } from '@worldcoin/minikit-js'

interface WorldIDState {
    isVerified: boolean
    userAddress: string | null
    isLoading: boolean
    error: string | null
}

export function useWorldID() {
    const [state, setState] = useState<WorldIDState>({
        isVerified: false,
        userAddress: null,
        isLoading: false,
        error: null
    })

    // No localStorage caching - force verification every time for security

    const verify = async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }))

        try {
            console.log('[useWorldID] Starting verification...')

            // Check if MiniKit is installed
            if (!MiniKit.isInstalled()) {
                throw new Error('MiniKit SDK is not installed. Please open in WorldApp.')
            }

            console.log('[useWorldID] MiniKit is installed, calling walletAuth...')

            // Use walletAuth (Sign in with World ID) instead of verify
            // This doesn't require Incognito Actions configuration
            const result = await MiniKit.commandsAsync.walletAuth({
                nonce: Date.now().toString(), // Simple nonce based on timestamp
                requestId: '0', // Optional request ID
                expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
                statement: 'Sign in to Void Collector to start playing and earning WLD!'
            })

            console.log('[useWorldID] MiniKit.walletAuth result:', result)

            const { finalPayload } = result

            if (!finalPayload || finalPayload.status === 'error') {
                console.error('[useWorldID] Error or no finalPayload:', finalPayload)
                throw new Error(finalPayload?.error_code || 'Authentication was cancelled')
            }

            console.log('[useWorldID] finalPayload:', finalPayload)

            // Extract address from the walletAuth payload
            const userAddress = (finalPayload as MiniAppWalletAuthSuccessPayload).address

            if (!userAddress) {
                throw new Error('No wallet address received from authentication')
            }

            // Send to backend for server-side verification
            console.log('[useWorldID] Sending to /api/verify-world-id...')
            const response = await fetch('/api/verify-world-id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...finalPayload,
                    wallet_address: userAddress
                })
            })

            console.log('[useWorldID] API response status:', response.status)

            if (!response.ok) {
                const errorData = await response.json()
                console.error('[useWorldID] API error:', errorData)
                throw new Error(errorData.error || 'Verification failed')
            }

            const data = await response.json()
            console.log('[useWorldID] API success:', data)

            // NO localStorage - force verification every time for security

            setState({
                isVerified: true,
                userAddress: userAddress,
                isLoading: false,
                error: null
            })
        } catch (error: any) {
            console.error('[useWorldID] Verification error:', error)
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message || 'Unknown verification error'
            }))
        }
    }

    const logout = () => {
        // No localStorage to clear anymore
        setState({
            isVerified: false,
            userAddress: null,
            isLoading: false,
            error: null
        })
    }

    return {
        isVerified: state.isVerified,
        userAddress: state.userAddress,
        isLoading: state.isLoading,
        error: state.error,
        verify,
        logout
    }
}
