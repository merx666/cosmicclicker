'use client'

import React from 'react'
import { useTranslation } from '@/lib/i18n'
import { motion, AnimatePresence } from 'framer-motion'

interface GuideModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function GuideModal({ isOpen, onClose }: GuideModalProps) {
    const { t } = useTranslation()

    const sections = [
        { titleKey: 'guide.basics_title', descKey: 'guide.basics_desc' },
        { titleKey: 'guide.units_title', descKey: 'guide.units_desc' },
        { titleKey: 'guide.credits_title', descKey: 'guide.credits_desc' },
    ]

    const tips = [
        'guide.tip1',
        'guide.tip2',
        'guide.tip3',
        'guide.tip4',
    ]

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
                        background: 'rgba(5,5,16,0.95)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 15 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 15 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        style={{
                            width: '100%',
                            maxWidth: '430px',
                            maxHeight: '85vh',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            border: '1px solid rgba(139,92,246,0.2)',
                            background: 'linear-gradient(180deg, rgba(10,4,21,0.98) 0%, rgba(15,8,30,0.98) 100%)',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '20px 20px 16px',
                            borderBottom: '1px solid rgba(139,92,246,0.15)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <h2 style={{
                                fontSize: '20px',
                                fontWeight: 800,
                                letterSpacing: '2px',
                                background: 'linear-gradient(135deg, #a78bfa 0%, #bc13fe 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                📖 {t('guide.title')}
                            </h2>
                            <button
                                onClick={onClose}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'rgba(255,255,255,0.6)',
                                    fontSize: '18px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Scrollable content */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '20px',
                            WebkitOverflowScrolling: 'touch',
                        }}>
                            {/* Sections */}
                            {sections.map((section, idx) => (
                                <div key={idx} style={{
                                    background: 'rgba(139,92,246,0.06)',
                                    border: '1px solid rgba(139,92,246,0.15)',
                                    borderRadius: '14px',
                                    padding: '18px',
                                    marginBottom: '14px',
                                }}>
                                    <h3 style={{
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        color: '#e0e0ff',
                                        marginBottom: '10px',
                                    }}>
                                        {t(section.titleKey)}
                                    </h3>
                                    <p style={{
                                        fontSize: '13px',
                                        color: '#9ca3af',
                                        lineHeight: 1.6,
                                    }}>
                                        {t(section.descKey)}
                                    </p>
                                </div>
                            ))}

                            {/* Pro Tips */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(234,179,8,0.08) 0%, rgba(234,179,8,0.03) 100%)',
                                border: '1px solid rgba(234,179,8,0.2)',
                                borderRadius: '14px',
                                padding: '18px',
                            }}>
                                <h3 style={{
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    color: '#fbbf24',
                                    marginBottom: '14px',
                                }}>
                                    {t('guide.tips_title')}
                                </h3>
                                {tips.map((tipKey, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex',
                                        gap: '10px',
                                        marginBottom: idx < tips.length - 1 ? '12px' : 0,
                                        alignItems: 'flex-start',
                                    }}>
                                        <span style={{
                                            width: '22px',
                                            height: '22px',
                                            borderRadius: '6px',
                                            background: 'rgba(234,179,8,0.15)',
                                            border: '1px solid rgba(234,179,8,0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '11px',
                                            color: '#fbbf24',
                                            fontWeight: 700,
                                            flexShrink: 0,
                                            marginTop: '1px',
                                        }}>
                                            {idx + 1}
                                        </span>
                                        <p style={{
                                            fontSize: '13px',
                                            color: '#d1d5db',
                                            lineHeight: 1.5,
                                        }}>
                                            {t(tipKey)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
