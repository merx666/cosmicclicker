'use client'

import { useState } from 'react'
import { MiniKit, VerificationLevel, type MiniAppVerifyActionSuccessPayload } from '@worldcoin/minikit-js'

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
            console.log('[useWorldID] Starting verification...')

            // Check if MiniKit is installed
            if (!MiniKit.isInstalled()) {
                throw new Error('MiniKit SDK is not installed. Please open in WorldApp.')
            }

            console.log('[useWorldID] MiniKit is installed, preparing signed request...')

            const action = 'verify'

            // 1. Fetch nonce/signature from backend (required for World ID 4.0 signed requests)
            const prepareResponse = await fetch(`/api/world-id/prepare?action=${action}`)
            if (!prepareResponse.ok) {
                throw new Error('Failed to prepare verification (server signature error)')
            }

            const rpContext = await prepareResponse.json()
            console.log('[useWorldID] Received RP Context:', rpContext)

            // 2. Call MiniKit Verify — pass action and verification_level
            // Signal omitted (undefined) — empty string '' can cause hash mismatch
            const result = await MiniKit.commandsAsync.verify({
                action,
                verification_level: VerificationLevel.Orb,
            })

            console.log('[useWorldID] MiniKit.verify result:', result)

            const { finalPayload } = result

            if (!finalPayload || finalPayload.status === 'error') {
                console.error('[useWorldID] Error or no finalPayload:', finalPayload)
                throw new Error(finalPayload?.error_code || 'Authentication was cancelled')
            }

            console.log('[useWorldID] finalPayload:', finalPayload)

            // Extract nullifier_hash from the verify payload
            const userHash = (finalPayload as MiniAppVerifyActionSuccessPayload).nullifier_hash

            if (!userHash) {
                throw new Error('No nullifier_hash received from verification')
            }

            // 3. Send to backend for server-side verification
            // Pass the nonce from prepare so backend can use it with the new V4 API
            console.log('[useWorldID] Sending to /api/verify-world-id...')
            const response = await fetch('/api/verify-world-id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payload: finalPayload,
                    action,
                    signal: undefined,
                    nonce: rpContext.nonce,
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
                userHash: userHash,
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
