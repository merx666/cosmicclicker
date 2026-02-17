
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const CONTEST_STORAGE_KEY = 'void_contest_finished_v3_FORCE' // Changed key to reset for users, implies "finished" interaction

export default function ContestModal() {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        // Check if user has already interacting with the contest
        const hasFinished = localStorage.getItem(CONTEST_STORAGE_KEY)
        if (!hasFinished) {
            // Small delay to active feeling of "new content" after login
            const timer = setTimeout(() => {
                setIsOpen(true)
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [])

    // Close for this session, but don't mark as "finished" (forever) unless they click the link?
    // User said: "przenosi na portal x.com niech znika na zawwsze" (disappear forever after link click)
    // User said: "wyswietlac wylacvcznie przez 1 wejscie" (display only on 1 entry)
    // I will interpret "1 wejscie" as: if they close it, it shouldn't show again this session? Or forever?
    // "wyswietlac wylacvcznie przez 1 wejscie" -> Display ONLY for 1 entry.
    // "po nacisnieciu hyperlinku ... niech znika na zawsze" -> after clicking link, disappears forever.
    // So:
    // 1. If seen once (even if closed), don't show again? OR show until clicked?
    // Let's stick to: Show once per session (sessionStorage) UNLESS clicked (localStorage).
    // actually "wyswietlac wylacvcznie przez 1 wejscie" usually means "show once".
    // Let's use localStorage for "seen_once" AND "clicked".

    const handleClose = () => {
        setIsOpen(false)
        // Mark as seen so it doesn't pop up again automatically? 
        // User said "wyswietlac wylacvcznie przez 1 wejscie" (display only for 1 entry).
        // So if I close it, it's gone for good? 
        // "po nacisnieciu hyperlinku ... niech znika na zawsze" implies if I DON'T click it, maybe it comes back?
        // Let's make it: 
        // Show ONCE. If closed, marked as seen (forever). 
        // If clicked, marked as seen (forever).
        localStorage.setItem(CONTEST_STORAGE_KEY, 'true')
    }

    const handleLinkClick = () => {
        localStorage.setItem(CONTEST_STORAGE_KEY, 'true')
        setIsOpen(false)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-sm bg-[#0a0415] border border-void-purple/50 rounded-2xl shadow-[0_0_30px_rgba(107,47,181,0.3)] overflow-hidden"
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-3 right-3 p-2 text-text-secondary hover:text-white bg-white/5 rounded-full z-10"
                        >
                            <X size={20} />
                        </button>

                        {/* Content */}
                        <div className="p-6 text-center">
                            <div className="mb-4 text-5xl animate-pulse">🎁</div>

                            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-void-purple to-void-blue bg-clip-text text-transparent">
                                100 WLD GIVEAWAY
                            </h2>

                            <p className="text-gray-300 mb-6 text-sm leading-relaxed">
                                We are giving away <span className="text-void-purple font-bold">100 WLD</span> to our community!
                                <br />
                                Follow, Reply & Repost to win.
                            </p>

                            <a
                                href="https://x.com/Void_WorldApp/status/2022238416042172826"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={handleLinkClick}
                                className="block w-full py-3 px-6 rounded-xl font-bold text-white
                         bg-gradient-to-r from-void-purple to-void-blue
                         hover:shadow-[0_0_20px_rgba(61,90,241,0.5)]
                         transform hover:scale-105 transition-all duration-200"
                            >
                                View Contest on X
                            </a>

                            <p className="mt-4 text-xs text-text-secondary">
                                Limited time event. The Void rewards the loyal.
                            </p>
                        </div>

                        {/* Decorative bottom bar */}
                        <div className="h-1 w-full bg-gradient-to-r from-void-purple via-void-blue to-void-purple" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
