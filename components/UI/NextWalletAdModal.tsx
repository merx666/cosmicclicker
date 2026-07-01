'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink } from 'lucide-react'

interface NextWalletAdModalProps {
  onClose?: () => void
}

export default function NextWalletAdModal({ onClose }: NextWalletAdModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [timeLeft, setTimeLeft] = useState(5)
  const [canClose, setCanClose] = useState(false)

  const adUrl = 'https://world.org/mini-app?app_id=app_fc0b450998cdd2fbf6efb90d491f7cce&path=&draft_id=meta_16d33ebc3b71dc5cf29380f6e6306f68'

  useEffect(() => {
    // Sprawdź czy reklama była już wyświetlona
    const hasBeenShown = localStorage.getItem('next_wallet_ad_shown')
    if (!hasBeenShown) {
      setIsOpen(true)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return

    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setCanClose(true)
    }
  }, [isOpen, timeLeft])

  const handleClose = () => {
    if (!canClose) return
    setIsOpen(false)
    localStorage.setItem('next_wallet_ad_shown', 'true')
    if (onClose) onClose()
  }

  const handleAdClick = () => {
    window.open(adUrl, '_blank')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-purple-500/20 bg-void-dark/95 shadow-[0_0_80px_rgba(168,85,247,0.25)] flex flex-col"
          >
            {/* Ad Banner Image */}
            <div className="relative w-full aspect-[2/1] overflow-hidden bg-void-purple/5 border-b border-white/5">
              <img
                src="/next-wallet-banner.jpg"
                alt="Next Wallet Banner"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-void-dark to-transparent opacity-60" />
              
              {/* Badge */}
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-cyan-500/20 backdrop-blur-md border border-cyan-400/30">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                  New Partner Application
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8 flex flex-col items-center text-center">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/next-wallet-icon.jpg"
                  alt="Next Wallet Icon"
                  className="w-12 h-12 rounded-xl border border-purple-500/30 shadow-lg shadow-purple-500/10 object-cover"
                />
                <h2 className="text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-400">
                  NEXT WALLET
                </h2>
              </div>

              <p className="text-sm text-gray-300 leading-relaxed max-w-sm mb-8">
                Poznaj Next Wallet – bezpieczny, połączony i w pełni zweryfikowany portfel kryptowalutowy dedykowany dla ekosystemu World App.
              </p>

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={handleAdClick}
                  className="flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-cyan-500 via-purple-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all duration-300 border border-white/10 active:scale-[0.98] hover:scale-[1.02]"
                >
                  <span>Otwórz Next Wallet</span>
                  <ExternalLink className="w-4 h-4" />
                </button>

                <button
                  onClick={handleClose}
                  disabled={!canClose}
                  className={`w-full py-3.5 px-6 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
                    canClose
                      ? 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10 cursor-pointer active:scale-[0.98]'
                      : 'bg-white/[0.02] text-gray-500 border-white/5 cursor-not-allowed'
                  }`}
                >
                  {canClose ? 'Zamknij reklamę' : `Zamknij za ${timeLeft}s`}
                </button>
              </div>
            </div>

            {/* Small corner close X button (only active after countdown) */}
            {canClose && (
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-gray-400 hover:text-white transition-all border border-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
