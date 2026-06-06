'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface GameOverModalProps {
    isOpen: boolean
    wave: number
    hasReviveToken: boolean
    onRevive: () => void
    onQuit: () => void
    onBuyRevive: () => void
}

export default function GameOverModal({ isOpen, wave, hasReviveToken, onRevive, onQuit, onBuyRevive }: GameOverModalProps) {
    const [isAnimating, setIsAnimating] = useState(false)

    const handleRevive = () => {
        setIsAnimating(true)
        setTimeout(() => {
            onRevive()
            setIsAnimating(false)
        }, 300)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 30 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        style={{
                            width: '100%',
                            maxWidth: '380px',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            border: '1px solid rgba(239,68,68,0.3)',
                            background: 'linear-gradient(180deg, rgba(30,5,5,0.98) 0%, rgba(15,5,15,0.98) 100%)',
                            boxShadow: '0 0 60px rgba(239,68,68,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '32px 24px 16px',
                            textAlign: 'center',
                            borderBottom: '1px solid rgba(239,68,68,0.15)'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '8px' }}>💀</div>
                            <h2 style={{
                                fontSize: '28px',
                                fontWeight: '900',
                                color: '#ef4444',
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                textShadow: '0 0 20px rgba(239,68,68,0.5)',
                                margin: 0
                            }}>
                                GAME OVER
                            </h2>
                            <p style={{
                                color: '#a1a1aa',
                                fontSize: '14px',
                                marginTop: '8px',
                                letterSpacing: '0.1em'
                            }}>
                                Fallen at Wave {wave}
                            </p>
                        </div>

                        {/* Actions */}
                        <div style={{ padding: '24px' }}>
                            {hasReviveToken ? (
                                <button
                                    onClick={handleRevive}
                                    disabled={isAnimating}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(34,197,94,0.4)',
                                        background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))',
                                        color: '#22c55e',
                                        fontSize: '16px',
                                        fontWeight: '700',
                                        letterSpacing: '0.05em',
                                        cursor: 'pointer',
                                        marginBottom: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <span style={{ fontSize: '20px' }}>🔄</span>
                                    USE REVIVE TOKEN
                                </button>
                            ) : (
                                <button
                                    onClick={onBuyRevive}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(139,92,246,0.4)',
                                        background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05))',
                                        color: '#a78bfa',
                                        fontSize: '16px',
                                        fontWeight: '700',
                                        letterSpacing: '0.05em',
                                        cursor: 'pointer',
                                        marginBottom: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <span style={{ fontSize: '20px' }}>🛒</span>
                                    BUY REVIVE TOKEN
                                </button>
                            )}

                            <button
                                onClick={onQuit}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(113,113,122,0.3)',
                                    background: 'rgba(39,39,42,0.4)',
                                    color: '#a1a1aa',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    letterSpacing: '0.05em',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                RETURN TO MENU
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
