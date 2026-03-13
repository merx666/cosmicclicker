'use client'

import { useState } from 'react'
import { MiniKit, type MiniAppWalletAuthSuccessPayload } from '@worldcoin/minikit-js'

interface WorldIDState {
    isVerified: boolean
    userHash: string | null
    isLoading: boolean
    error: string | null
}

export function useWorldID() {
    const [state, setState] = useState<WorldIDState>({
        isVerified: false,
        userHash: null,
        isLoading: false,
        error: null
    })

    const verify = async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }))

        try {
            console.log('[useWorldID] Starting wallet authentication...')

            // Check if MiniKit is installed
            if (!MiniKit.isInstalled()) {
                throw new Error('MiniKit SDK is not installed. Please open in WorldApp.')
            }

            console.log('[useWorldID] MiniKit is installed, preparing nonce...')

            // 1. Fetch nonce from backend
            const res = await fetch(`/api/nonce`)
            if (!res.ok) {
                throw new Error('Failed to generate authentication nonce')
            }
            const { nonce } = await res.json()
            console.log('[useWorldID] Received Nonce')

            // 2. Call MiniKit Wallet Authentication
            const { commandPayload: generateMessageResult, finalPayload } = await MiniKit.commandsAsync.walletAuth({
                nonce: nonce,
                requestId: '0', // Optional
                expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
                notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
                statement: 'Sign in to Void Collector to start playing and earning WLD!',
            })

            console.log('[useWorldID] MiniKit.walletAuth result:', finalPayload)

            if (!finalPayload || finalPayload.status === 'error') {
                console.error('[useWorldID] Error or no finalPayload:', finalPayload)
                throw new Error(finalPayload?.error_code || 'Authentication was cancelled or failed')
            }

            // Extract wallet address from the walletAuth payload
            const userAddress = (finalPayload as MiniAppWalletAuthSuccessPayload).address

            if (!userAddress) {
                throw new Error('No wallet address received from authentication')
            }

            // 3. Send to backend for server-side verification of SIWE message
            console.log('[useWorldID] Sending to /api/verify-world-id...')
            const response = await fetch('/api/verify-world-id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payload: finalPayload,
                    nonce: nonce,
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

            setState({
                isVerified: true,
                userHash: userAddress,
                isLoading: false,
                error: null
            })
        } catch (error: any) {
            console.error('[useWorldID] Authentication error:', error)
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message || 'Unknown authentication error'
            }))
        }
    }

    const logout = () => {
        setState({
            isVerified: false,
            userHash: null,
            isLoading: false,
            error: null
        })
    }

    return {
        isVerified: state.isVerified,
        userAddress: state.userHash, // Kept as userAddress alias to not break existing references
        isLoading: state.isLoading,
        error: state.error,
        verify,
        logout
    }
}
