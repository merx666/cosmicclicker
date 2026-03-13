'use client' // Error components must be Client Components

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const t = useTranslations('Game')

    useEffect(() => {
        console.error('Captured by error.tsx:', error)
    }, [error])

    return (
        <div className="min-h-screen bg-void-dark text-white flex flex-col items-center justify-center p-4 z-50 fixed inset-0">
            <h2 className="text-2xl font-bold mb-4 text-red-500">Something went wrong!</h2>
            <div className="bg-red-900/30 p-4 rounded-lg mb-4 w-full max-w-2xl overflow-auto border border-red-500/50 shadow-lg shadow-red-500/20">
                <p className="font-bold text-red-400 mb-2">Error Message:</p>
                <pre className="whitespace-pre-wrap text-xs bg-black/50 p-2 rounded text-red-100 font-mono">
                    {error.message || 'Unknown error'}
                </pre>

                <p className="font-bold text-red-400 mt-4 mb-2">Error Stack:</p>
                <pre className="whitespace-pre-wrap text-xs bg-black/50 p-2 rounded text-red-100 font-mono">
                    {error.stack || 'No stack trace available'}
                </pre>

                {error.digest && (
                    <p className="mt-4 text-xs text-gray-400">Digest ID: {error.digest}</p>
                )}
            </div>
            <button
                className="px-6 py-3 bg-red-600/80 hover:bg-red-500 rounded-lg transition-colors font-bold mt-4 border border-red-400/30"
                onClick={() => reset()}
            >
                Try Again / Odśwież
            </button>
        </div>
    )
}
