import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { showToast } from '@/components/UI/ToastNotification'
import { SHOP_CATALOG } from '@/lib/gameEconomy'

interface ConsumableBarProps {
    inventory: any[]
    onConsumeUpdated: () => void
}

export default function ConsumableBar({ inventory, onConsumeUpdated }: ConsumableBarProps) {
    const [consumingId, setConsumingId] = useState<string | null>(null)

    // Filter valid consumables
    const availableConsumables = inventory?.filter((item: any) => {
        const catalogItem = SHOP_CATALOG.find(c => c.id === item.item_id)
        return catalogItem && catalogItem.type === 'consumable' && item.quantity > 0
    }) || []

    const handleConsume = async (itemId: string) => {
        if (consumingId) return
        setConsumingId(itemId)

        try {
            const res = await fetch('/api/shop/consume', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId })
            })

            const data = await res.json()

            if (data.success) {
                // Dispatch event to game
                window.dispatchEvent(new CustomEvent('use-consumable', { detail: { itemId } }))
                showToast(`Item used successfully!`, 'success')
                onConsumeUpdated()
            } else {
                showToast(data.error || 'Failed to use item', 'error')
            }
        } catch (error) {
            console.error('Consume error:', error)
            showToast('Failed to connect to server', 'error')
        } finally {
            setConsumingId(null)
        }
    }

    if (availableConsumables.length === 0) return null

    return (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center justify-center gap-3 z-40">
            <AnimatePresence>
                {availableConsumables.map((invItem: any) => {
                    const catalogItem = SHOP_CATALOG.find(c => c.id === invItem.item_id)
                    if (!catalogItem) return null

                    return (
                        <motion.button
                            key={invItem.item_id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            whileHover={{ scale: 1.1, y: -5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleConsume(invItem.item_id)}
                            disabled={consumingId === invItem.item_id}
                            className="relative group p-3 bg-gradient-to-t from-slate-900 to-indigo-900 rounded-2xl border-2 border-indigo-400/30 shadow-lg shadow-indigo-900/50 hover:border-indigo-400 hover:shadow-indigo-500/50 transition-all overflow-visible flex items-center justify-center min-w-[50px] min-h-[50px]"
                        >
                            <span className="text-2xl drop-shadow-md">
                                {catalogItem.name.split(' ')[0]} {/* Quick hack for emoji/icon if it exists */}
                            </span>
                            <div className="absolute -top-3 -right-3 bg-rose-600 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-slate-900 shadow-xl">
                                {invItem.quantity}
                            </div>
                            
                            {/* Disabled Overlay */}
                            {consumingId === invItem.item_id && (
                                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center backdrop-blur-sm z-10">
                                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-slate-900/90 text-white text-xs px-3 py-2 rounded-lg border border-indigo-400/30 w-max max-w-[200px] opacity-0 group-hover:opacity-100 placeholder-transparent transition-opacity pointer-events-none z-50">
                                <p className="font-bold text-indigo-300">{catalogItem.name}</p>
                                <p className="text-[10px] text-slate-300 mt-1 whitespace-pre-wrap">{catalogItem.description}</p>
                            </div>
                        </motion.button>
                    )
                })}
            </AnimatePresence>
        </div>
    )
}
