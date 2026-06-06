'use client'

interface TurretMenuProps {
    data: {
        id: string
        level: number
        x: number
        y: number
    } | null
    onClose: () => void
}

export default function TurretMenu({ data, onClose }: TurretMenuProps) {
    if (!data) return null

    // Determine position - render near the clicked turret (or center of screen if easier for touch)
    // For simplicity, let's use a nice centered bottom panel or floating over coordinate
    // Since we don't have screen coordinates easily from Phaser world coordinates without projection, 
    // let's stick to a UI panel.

    const handleUpgrade = () => {
        window.dispatchEvent(new CustomEvent('upgrade-turret', {
            detail: { id: data.id }
        }))
        onClose()
    }

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] pointer-events-auto">
            <div className="glass-panel p-6 rounded-2xl border border-neon-pink shadow-[0_0_30px_rgba(188,19,254,0.4)] min-w-[300px] text-center">
                <div className="text-xs text-neon-pink font-mono mb-2 track-widest">TURRET SYSTEM ACCESS</div>
                <h3 className="text-3xl font-cyber font-bold text-white mb-4">
                    TURRET LV.{data.level}
                </h3>

                <div className="flex justify-between text-sm text-gray-300 mb-6 px-4">
                    <div>
                        <div className="text-neon-blue">RANGE</div>
                        <div className="font-bold">{250 + (data.level - 1) * 50}</div>
                    </div>
                    <div>
                        <div className="text-neon-blue">RATE</div>
                        <div className="font-bold">{Math.max(100, 500 - (data.level - 1) * 50)}ms</div>
                    </div>
                </div>

                <button
                    onClick={handleUpgrade}
                    className="w-full bg-neon-pink/20 border border-neon-pink text-white font-bold py-3 rounded-lg hover:bg-neon-pink/40 hover:shadow-[0_0_15px_rgba(188,19,254,0.6)] transition-all uppercase tracking-wider"
                >
                    UPGRADE SYSTEM <br />
                    <span className="text-xs opacity-70">100 CREDITS</span>
                </button>

                <button
                    onClick={onClose}
                    className="mt-4 text-xs text-gray-400 hover:text-white underline decoration-dotted"
                >
                    CLOSE CONNECTION
                </button>
            </div>
        </div>
    )
}
