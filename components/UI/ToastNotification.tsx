'use client'

import { useState, useEffect, useCallback } from 'react'

interface Toast {
    id: number
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
    icon?: string
}

let toastId = 0
let addToastGlobal: ((message: string, type: Toast['type'], icon?: string) => void) | null = null

// Global function to show toast from anywhere
export function showToast(message: string, type: Toast['type'] = 'info', icon?: string) {
    if (addToastGlobal) {
        addToastGlobal(message, type, icon)
    }
}

export default function ToastNotification() {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((message: string, type: Toast['type'], icon?: string) => {
        const id = ++toastId
        setToasts(prev => [...prev, { id, message, type, icon }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 3500)
    }, [])

    useEffect(() => {
        addToastGlobal = addToast
        return () => { addToastGlobal = null }
    }, [addToast])

    if (toasts.length === 0) return null

    const typeStyles: Record<Toast['type'], { bg: string, border: string, color: string }> = {
        success: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)', color: '#22c55e' },
        error: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', color: '#ef4444' },
        info: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', color: '#3b82f6' },
        warning: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', color: '#f59e0b' },
    }

    const defaultIcons: Record<Toast['type'], string> = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️',
    }

    return (
        <div style={{
            position: 'fixed',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            pointerEvents: 'none',
            width: '90%',
            maxWidth: '380px',
        }}>
            {toasts.map(toast => {
                const style = typeStyles[toast.type]
                return (
                    <div key={toast.id} style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: style.bg,
                        border: `1px solid ${style.border}`,
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        color: style.color,
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        animation: 'toastIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        pointerEvents: 'auto',
                    }}>
                        <span style={{ fontSize: '18px' }}>{toast.icon || defaultIcons[toast.type]}</span>
                        <span>{toast.message}</span>
                    </div>
                )
            })}
            <style>{`
                @keyframes toastIn {
                    from { opacity: 0; transform: translateY(-20px) scale(0.9); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    )
}
