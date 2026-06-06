'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

interface Season3PRScreenProps {
  userAddress: string
  onLogout: () => void
}

export default function Season3PRScreen({ userAddress, onLogout }: Season3PRScreenProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-void-dark flex items-center justify-center px-4 md:px-8 safe-area-top safe-area-bottom overflow-hidden relative font-sans text-foreground select-none">
      
      {/* Animated nebula background particles */}
      {isMounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(40)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 5 + 2,
                height: Math.random() * 5 + 2,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: ['#a855f7', '#6366f1', '#3b82f6', '#ec4899'][i % 4],
              }}
              animate={{
                y: [0, -50, 0],
                opacity: [0.1, 0.45, 0.1],
                scale: [1, 1.6, 1],
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                delay: Math.random() * 4,
              }}
            />
          ))}
        </div>
      )}

      {/* Floating glowing orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-void-purple/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-void-blue/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Cosmic grid layout */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-2xl w-full relative z-10"
      >
        
        {/* Header Badge */}
        <div className="flex justify-center mb-6">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-void-purple/10 border border-void-purple/40 backdrop-blur-md shadow-[0_0_15px_rgba(107,47,181,0.2)]"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-xs font-bold tracking-[0.25em] text-purple-300 uppercase">
              Season 3 Underway
            </span>
          </motion.div>
        </div>

        {/* Glassmorphic main panel */}
        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          
          {/* Internal glowing line at the top */}
          <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
          
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-300 via-white to-blue-300 bg-clip-text text-transparent mb-4">
              DATABASE UPGRADE & MATRIX ALIGNMENT
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-void-purple to-void-blue mx-auto rounded-full" />
          </div>

          {/* PR Message */}
          <div className="text-text-secondary text-sm md:text-base space-y-4 leading-relaxed font-medium text-justify opacity-90 border-b border-white/5 pb-8 mb-8">
            <p>
              Dear Cosmic Collector,
            </p>
            <p>
              We are pleased to inform you that our primary quantum ledger and reward processing engines are currently undergoing an extensive system architecture modernization. This deployment is a crucial phase in our migration timeline to prepare for the official launch of <span className="text-white font-semibold">Season 3: The Void Ascension</span>.
            </p>
            <p>
              Our engineering task force is actively upgrading the database clusters, scaling high-frequency event streaming, and implementing next-generation click-telemetry checks. These updates are necessary to deliver a seamless, high-performance experience under heavy network loads.
            </p>
            <p>
              To protect the integrity of the active database synchronization process, public gameplay access has been temporarily restricted. Only authenticated testing signatures with direct deployment authorization are permitted to pass through the security perimeter at this time.
            </p>
            <p className="italic text-xs text-text-secondary/70">
              Estimated synchronization window completion: Q2 2026.
            </p>
          </div>

          {/* Quantum core loading animation */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-full max-w-sm">
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-void-purple via-void-blue to-void-purple rounded-full"
                  style={{ backgroundSize: '200% 100%' }}
                  animate={{
                    backgroundPosition: ['0% 0%', '200% 0%'],
                    width: ['10%', '60%', '35%', '85%', '97%'],
                  }}
                  transition={{
                    backgroundPosition: { duration: 2.5, repeat: Infinity, ease: 'linear' },
                    width: { duration: 12, repeat: Infinity, ease: 'easeInOut' },
                  }}
                />
              </div>
              <div className="flex justify-between items-center mt-2 px-1">
                <span className="text-[10px] text-text-secondary/60 uppercase tracking-widest font-bold">
                  Syncing quantum matrix
                </span>
                <span className="text-[10px] text-purple-300 font-bold">
                  97.4%
                </span>
              </div>
            </div>
          </div>

          {/* Credentials lock block */}
          <div className="bg-red-950/15 border border-red-500/20 rounded-2xl p-4 md:p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="text-2xl mt-0.5 filter drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]">🔒</div>
              <div>
                <h4 className="text-xs uppercase tracking-wider font-bold text-red-400 mb-1">
                  Access Status: Restricted
                </h4>
                <p className="text-xs text-text-secondary/80 font-mono truncate max-w-xs md:max-w-md">
                  Signed as: <span className="text-gray-300">{userAddress}</span>
                </p>
              </div>
            </div>
            
            {/* Disconnect button */}
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-white hover:text-red-200 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]"
            >
              <span>🚪</span> Disconnect
            </button>
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-text-secondary/40 mt-6 tracking-widest uppercase">
          Void Operations Protocol v4.0.3-alpha • void.skyreel.art
        </p>

      </motion.div>
    </div>
  )
}
