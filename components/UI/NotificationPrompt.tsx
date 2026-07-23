'use client'

import React, { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { MiniKit, Permission } from '@worldcoin/minikit-js'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import toast from 'react-hot-toast'

export default function NotificationPrompt() {
    const t = useTranslations('Notifications')
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Only show if we haven't asked before and minikit is installed
        const hasPrompted = localStorage.getItem('notifications_prompted')
        if (!hasPrompted && MiniKit.isInstalled()) {
            // Slight delay so it doesn't pop immediately on load
            const timer = setTimeout(() => {
                setIsVisible(true)
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleEnable = async () => {
        try {
            const response = await MiniKit.commandsAsync.requestPermission({
                permission: Permission.Notifications
            })
            
            if (response?.finalPayload.status === 'success') {
                toast.success(t('enabled'))
            }
        } catch (error) {
            console.error('Failed to request notifications:', error)
        } finally {
            localStorage.setItem('notifications_prompted', 'true')
            setIsVisible(false)
        }
    }

    const handleDismiss = () => {
        localStorage.setItem('notifications_prompted', 'true')
        setIsVisible(false)
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-sm"
                >
                    <div className="bg-purple-950/90 backdrop-blur-md border border-purple-500/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                                <Bell className="w-5 h-5 text-purple-300 animate-bounce" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white text-sm mb-1">{t('title')}</h3>
                                <p className="text-xs text-white/70 mb-3">{t('description')}</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleEnable}
                                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-colors"
                                    >
                                        {t('enable')}
                                    </button>
                                    <button
                                        onClick={handleDismiss}
                                        className="py-2 px-4 bg-white/5 hover:bg-white/10 text-white/50 text-xs font-bold rounded-xl transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
