'use client'

import { useWorldID } from '@/hooks/useWorldID'
import GameScreen from '@/components/GameScreen'
import { motion } from 'framer-motion'

export default function Home() {
  const { isVerified, userAddress, isLoading, error, verify } = useWorldID()

  // Show verification screen if not verified
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-void-dark flex items-center justify-center px-4 safe-area-top safe-area-bottom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🌌</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-void-purple to-particle-glow bg-clip-text text-transparent mb-2">
              Void Collector
            </h1>
            <p className="text-text-secondary">
              Collect Void Particles and earn WLD
            </p>
          </div>

          <div className="bg-void-purple/5 border-2 border-void-purple/30 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🔐</div>
              <h2 className="text-xl font-bold mb-2">World ID Verification</h2>
              <p className="text-sm text-text-secondary">
                Verify your identity to start playing
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={verify}
              disabled={isLoading}
              className={`
                w-full py-4 px-6 rounded-xl font-bold text-lg
                bg-gradient-to-r from-void-purple to-void-blue
                hover:scale-105 active:scale-95
                transition-all flex items-center justify-center gap-3
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
                  Verifying...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Verify with World ID
                </>
              )}
            </button>

            <div className="mt-6 pt-6 border-t border-void-purple/20">
              <p className="text-xs text-text-secondary text-center">
                🔒 Secure verification through WorldApp
                <br />
                Your privacy is protected
              </p>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-text-secondary">
            <p>You need WorldApp to play</p>
          </div>
        </motion.div>
      </div>
    )
  }

  // User is verified - show game with their wallet address
  return <GameScreen userHash={userAddress!} />
}
