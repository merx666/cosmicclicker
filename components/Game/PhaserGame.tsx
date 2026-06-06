'use client'
import { useEffect, useRef } from 'react'
import * as Phaser from 'phaser'
import TowerDefenseScene from './scenes/TowerDefenseScene'
import SpaceScene from './scenes/SpaceScene'
import TacticsScene from './scenes/TacticsScene'

export default function PhaserGame({ difficulty = 'easy', inventory = [], mode = 'space' }: { difficulty?: string, inventory?: any[], mode?: 'defense' | 'space' | 'tactics' }) {
    const gameRef = useRef<HTMLDivElement>(null)
    const gameInstance = useRef<Phaser.Game | null>(null)

    // Re-initialize game when mode changes (Simplest way to switch "Game Type")
    useEffect(() => {
        if (!gameRef.current) return

        if (gameInstance.current) {
            gameInstance.current.destroy(true)
            gameInstance.current = null
        }

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: gameRef.current,
            width: '100%',
            height: '100%',
            backgroundColor: '#050510',
            physics: {
                default: 'arcade',
                arcade: {
                    debug: false,
                    gravity: { x: 0, y: 0 } // Zero gravity space
                }
            },
            // Load correct scene based on mode
            scene: mode === 'tactics' ? [TacticsScene] : (mode === 'space' ? [SpaceScene] : [TowerDefenseScene]),
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        }

        gameInstance.current = new Phaser.Game(config)
        gameInstance.current.registry.set('difficulty', difficulty)
        gameInstance.current.registry.set('inventory', inventory)

        return () => {
            if (gameInstance.current) {
                gameInstance.current.destroy(true)
                gameInstance.current = null
            }
        }
    }, [mode]) // Re-run when mode changes

    // Update inventory without destroy
    useEffect(() => {
        if (gameInstance.current) {
            gameInstance.current.registry.set('inventory', inventory)
            // Notify active scene
            const key = mode === 'space' ? 'SpaceScene' : (mode === 'tactics' ? 'TacticsScene' : 'TowerDefenseScene')
            const scene = gameInstance.current.scene.getScene(key) as any
            if (scene && scene.updateInventory) {
                scene.updateInventory(inventory)
            }
        }
    }, [inventory, mode])

    return <div ref={gameRef} className="w-full h-screen overflow-hidden" />
}
