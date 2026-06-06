'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode, useState } from 'react'

interface TooltipProps {
    content: string
    children: ReactNode
    delay?: number
    position?: 'top' | 'bottom' | 'left' | 'right'
}

export default function Tooltip({ content, children, delay = 300, position = 'top' }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false)
    let timeout: NodeJS.Timeout

    const showTooltip = () => {
        timeout = setTimeout(() => setIsVisible(true), delay)
    }

    const hideTooltip = () => {
        clearTimeout(timeout)
        setIsVisible(false)
    }

    const getPositionStyles = () => {
        switch (position) {
            case 'top':
                return 'bottom-full left-1/2 -translate-x-1/2 mb-2'
            case 'bottom':
                return 'top-full left-1/2 -translate-x-1/2 mt-2'
            case 'left':
                return 'right-full top-1/2 -translate-y-1/2 mr-2'
            case 'right':
                return 'left-full top-1/2 -translate-y-1/2 ml-2'
        }
    }

    return (
        <div
            className="relative inline-block"
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onTouchStart={showTooltip}
            onTouchEnd={hideTooltip}
        >
            {children}

            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute ${getPositionStyles()} z-[9999] pointer-events-none`}
                    >
                        <div className="px-3 py-2 bg-slate-900 border border-indigo-500/50 rounded-lg shadow-xl backdrop-blur-sm">
                            <p className="text-xs text-white whitespace-nowrap font-medium">
                                {content}
                            </p>
                            {/* Arrow */}
                            <div
                                className={`absolute w-2 h-2 bg-slate-900 border-indigo-500/50 rotate-45 ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-b border-r' :
                                        position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2 border-t border-l' :
                                            position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2 border-t border-r' :
                                                'left-[-4px] top-1/2 -translate-y-1/2 border-b border-l'
                                    }`}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
