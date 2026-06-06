'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface ImprovedButtonProps {
    children: ReactNode
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'locked'
    icon?: string
    subtitle?: string
    disabled?: boolean
    className?: string
}

export default function ImprovedButton({
    children,
    onClick,
    variant = 'primary',
    icon,
    subtitle,
    disabled = false,
    className = ''
}: ImprovedButtonProps) {
    const variantStyles = {
        primary: 'from-indigo-600 to-purple-600 border-indigo-400/40 hover:border-indigo-300/60 shadow-indigo-500/30',
        secondary: 'from-cyan-600 to-blue-600 border-cyan-400/40 hover:border-cyan-300/60 shadow-cyan-500/30',
        success: 'from-emerald-600 to-green-600 border-emerald-400/40 hover:border-emerald-300/60 shadow-emerald-500/30',
        warning: 'from-amber-600 to-orange-600 border-amber-400/40 hover:border-amber-300/60 shadow-amber-500/30',
        locked: 'from-gray-700 to-gray-800 border-gray-600/40 cursor-not-allowed'
    }

    return (
        <motion.button
            whileHover={!disabled ? { scale: 1.03, y: -4 } : {}}
            whileTap={!disabled ? { scale: 0.97 } : {}}
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={`
                relative flex flex-col items-center justify-center gap-2 
                p-6 rounded-2xl 
                bg-gradient-to-br ${variantStyles[disabled ? 'locked' : variant]}
                border-2 
                backdrop-blur-md
                shadow-lg hover:shadow-xl
                transition-all duration-300
                group overflow-hidden
                ${disabled ? 'opacity-60' : ''}
                ${className}
            `}
        >
            {/* Hover Effect Overlay */}
            {!disabled && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            )}

            {/* Icon */}
            {icon && (
                <div className="text-5xl relative z-10 filter drop-shadow-lg">
                    {icon}
                </div>
            )}

            {/* Content */}
            <div className="text-center relative z-10">
                <div className="text-base font-black text-white uppercase tracking-wider leading-tight">
                    {children}
                </div>
                {subtitle && (
                    <div className="text-xs text-white/80 font-semibold mt-1">
                        {subtitle}
                    </div>
                )}
            </div>
        </motion.button>
    )
}
