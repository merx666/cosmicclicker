'use client'

import React from 'react'
import { X, Shield, Zap, Target } from 'lucide-react'
import { useState } from 'react'
import { ShieldIcon, AssassinIcon, RangerIcon, HealerIcon, MageIcon, WarriorIcon } from './Icons'

interface UnitShopModalProps {
    isOpen: boolean
    onClose: () => void
    credits: number
    onPurchase: (unitType: string, cost: number) => void
}

const UNIT_CATALOG = [
    {
        id: 'tank',
        name: 'BASTION',
        IconComponent: ShieldIcon,
        color: '#3b82f6',
        hp: 1000,
        dmg: 50,
        range: 1,
        cost: 100,
        description: 'Heavy armor tank unit. High HP, close range.'
    },
    {
        id: 'assassin',
        name: 'SPECTRE',
        IconComponent: AssassinIcon,
        color: '#a855f7',
        hp: 400,
        dmg: 150,
        range: 1,
        cost: 120,
        description: 'Fast melee assassin. High damage, low HP.'
    },
    {
        id: 'ranger',
        name: 'VALKYRIE',
        IconComponent: RangerIcon,
        color: '#facc15',
        hp: 500,
        dmg: 80,
        range: 3,
        cost: 150,
        description: 'Long-range archer. Attacks from distance.'
    },
    {
        id: 'healer',
        name: 'LIFEBRINGER',
        IconComponent: HealerIcon,
        color: '#10b981',
        hp: 400,
        dmg: 30,
        range: 2,
        cost: 140,
        description: 'Support unit. Heals nearby allies every 3 seconds.'
    },
    {
        id: 'mage',
        name: 'ARCHMAGE',
        IconComponent: MageIcon,
        color: '#8b5cf6',
        hp: 350,
        dmg: 120,
        range: 3,
        cost: 180,
        description: 'AOE caster. Lightning chains to multiple enemies.'
    },
    {
        id: 'warrior',
        name: 'TITAN',
        IconComponent: WarriorIcon,
        color: '#ef4444',
        hp: 1200,
        dmg: 60,
        range: 1,
        cost: 160,
        description: 'Mighty tank. Taunts enemies to attack him first.'
    }
]

export default function UnitShopModal({ isOpen, onClose, credits, onPurchase }: UnitShopModalProps) {
    const [selectedUnit, setSelectedUnit] = useState<string | null>(null)

    if (!isOpen) return null

    const handlePurchase = (unitType: string, cost: number) => {
        if (credits >= cost) {
            onPurchase(unitType, cost)
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-2xl max-h-[85vh] overflow-y-auto border-2 border-neon-pink shadow-[0_0_40px_rgba(188,19,254,0.6)] rounded-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-black/90 backdrop-blur-md p-4 border-b border-neon-pink/30 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-cyber font-bold text-neon-pink">UNIT ARMORY</h2>
                        <p className="text-sm text-gray-400 mt-1">Deploy tactical units to your reserve</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-xs text-gray-400">CREDITS</div>
                            <div className="text-2xl font-cyber text-neon-blue">{credits}</div>
                        </div>
                        <button
                            onClick={onClose}
                            className="glass-button p-2 hover:bg-red-500/20 border-red-500"
                        >
                            <X size={24} className="text-red-500" />
                        </button>
                    </div>
                </div>

                {/* Unit Grid */}
                <div className="p-3 grid gap-3">
                    {UNIT_CATALOG.map((unit) => {
                        const canAfford = credits >= unit.cost
                        const isSelected = selectedUnit === unit.id

                        return (
                            <div
                                key={unit.id}
                                onClick={() => setSelectedUnit(unit.id)}
                                className={`glass-panel p-4 border-2 transition-all cursor-pointer ${isSelected
                                    ? 'border-neon-green shadow-[0_0_20px_rgba(10,255,0,0.4)] scale-[1.02]'
                                    : canAfford
                                        ? 'border-white/20 hover:border-white/50 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                        : 'border-gray-800 opacity-50 cursor-not-allowed'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Unit Icon - Gradient + First Letter */}
                                    <div
                                        className="w-16 h-16 rounded-lg flex items-center justify-center border-2"
                                        style={{
                                            borderColor: unit.color,
                                            background: `linear-gradient(135deg, ${unit.color}40 0%, ${unit.color}20 100%)`,
                                            boxShadow: canAfford ? `0 0 15px ${unit.color}60` : 'none'
                                        }}
                                    >
                                        <span
                                            className="text-3xl font-black"
                                            style={{ color: unit.color }}
                                        >
                                            {unit.name.charAt(0)}
                                        </span>
                                    </div>

                                    {/* Unit Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xl font-cyber font-bold" style={{ color: unit.color }}>
                                                {unit.name}
                                            </h3>
                                            <div className={`px-3 py-1 rounded-lg border ${canAfford
                                                ? 'bg-neon-green/10 border-neon-green text-neon-green'
                                                : 'bg-red-500/10 border-red-500 text-red-500'
                                                }`}>
                                                <span className="text-xs font-bold">{unit.cost} CR</span>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-400 mb-3">{unit.description}</p>

                                        {/* Stats */}
                                        <div className="flex gap-4 text-xs">
                                            <div className="flex items-center gap-1">
                                                <Shield size={14} className="text-blue-400" />
                                                <span className="text-gray-300">{unit.hp} HP</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Zap size={14} className="text-red-400" />
                                                <span className="text-gray-300">{unit.dmg} DMG</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Target size={14} className="text-yellow-400" />
                                                <span className="text-gray-300">Range {unit.range}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Purchase Button */}
                                {isSelected && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handlePurchase(unit.id, unit.cost)
                                        }}
                                        disabled={!canAfford}
                                        className={`w-full mt-4 py-3 rounded-lg font-bold uppercase tracking-wider transition-all ${canAfford
                                            ? 'bg-neon-green/20 border-2 border-neon-green text-neon-green hover:bg-neon-green/30 hover:shadow-[0_0_20px_rgba(10,255,0,0.4)]'
                                            : 'bg-gray-800 border-2 border-gray-700 text-gray-500 cursor-not-allowed'
                                            }`}
                                    >
                                        {canAfford ? 'DEPLOY UNIT' : 'INSUFFICIENT CREDITS'}
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Footer Tip */}
                <div className="p-4 bg-black/60 border-t border-neon-pink/20 text-center">
                    <p className="text-xs text-gray-500">
                        TIP: Units are deployed to your RESERVE. Drag them to the board before combat starts.
                    </p>
                </div>
            </div>
        </div>
    )
}
