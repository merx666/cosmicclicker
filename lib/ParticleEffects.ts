/**
 * Particle Effects Library for Phaser Game
 * Reusable particle effects for various game events
 */

export class ParticleEffects {
    /**
     * Create explosion effect at position
     */
    static createExplosion(scene: Phaser.Scene, x: number, y: number, color: number = 0xff6600) {
        const particles = scene.add.particles(x, y, 'particle', {
            speed: { min: 100, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 600,
            blendMode: 'ADD',
            tint: color,
            quantity: 20
        })

        scene.time.delayedCall(700, () => {
            particles.destroy()
        })

        return particles
    }

    /**
     * Create sparkle/star effect (for purchases, level ups)
     */
    static createSparkles(scene: Phaser.Scene, x: number, y: number, color: number = 0xffff00) {
        const particles = scene.add.particles(x, y, 'particle', {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 800,
            blendMode: 'ADD',
            tint: color,
            quantity: 15,
            gravityY: -100
        })

        scene.time.delayedCall(900, () => {
            particles.destroy()
        })

        return particles
    }

    /**
     * Create healing effect (green particles rising)
     */
    static createHealEffect(scene: Phaser.Scene, x: number, y: number) {
        const particles = scene.add.particles(x, y, 'particle', {
            speed: { min: 20, max: 40 },
            angle: { min: 260, max: 280 },
            scale: { start: 0.6, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 1000,
            blendMode: 'ADD',
            tint: 0x00ff00,
            quantity: 2,
            frequency: 50
        })

        scene.time.delayedCall(1000, () => {
            particles.destroy()
        })

        return particles
    }

    /**
     * Create lightning/electric effect
     */
    static createLightningEffect(scene: Phaser.Scene, x: number, y: number) {
        const particles = scene.add.particles(x, y, 'particle', {
            speed: { min: 10, max: 50 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0.1 },
            alpha: { start: 1, end: 0 },
            lifespan: 300,
            blendMode: 'ADD',
            tint: 0x00ffff,
            quantity: 10
        })

        scene.time.delayedCall(400, () => {
            particles.destroy()
        })

        return particles
    }

    /**
     * Create gold coins effect (falling coins animation)
     */
    static createGoldCoins(scene: Phaser.Scene, x: number, y: number) {
        const particles = scene.add.particles(x, y, 'particle', {
            speed: { min: 50, max: 100 },
            angle: { min: 240, max: 300 },
            scale: { start: 0.8, end: 0.4 },
            alpha: { start: 1, end: 0 },
            lifespan: 1200,
            blendMode: 'NORMAL',
            tint: 0xffd700,
            quantity: 8,
            gravityY: 200,
            bounce: 0.3
        })

        scene.time.delayedCall(1300, () => {
            particles.destroy()
        })

        return particles
    }

    /**
     * Create hit/impact effect
     */
    static createImpact(scene: Phaser.Scene, x: number, y: number, color: number = 0xff0000) {
        const particles = scene.add.particles(x, y, 'particle', {
            speed: { min: 80, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.6, end: 0 },
            alpha: { start: 0.9, end: 0 },
            lifespan: 400,
            blendMode: 'ADD',
            tint: color,
            quantity: 12
        })

        scene.time.delayedCall(500, () => {
            particles.destroy()
        })

        return particles
    }

    /**
     * Create continuous aura effect (for buffs/debuffs)
     */
    static createAura(scene: Phaser.Scene, container: Phaser.GameObjects.Container, color: number = 0x6600ff) {
        const particles = scene.add.particles(0, 0, 'particle', {
            speed: 20,
            angle: { min: 0, max: 360 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 800,
            blendMode: 'ADD',
            tint: color,
            quantity: 1,
            frequency: 100
        })

        // Attach to container
        container.add(particles)

        return particles
    }

    /**
     * Create projectile trail effect
     */
    static createProjectileTrail(scene: Phaser.Scene, x: number, y: number, color: number = 0xffffff) {
        const particles = scene.add.particles(x, y, 'particle', {
            speed: { min: 10, max: 30 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.7, end: 0 },
            lifespan: 400,
            blendMode: 'ADD',
            tint: color,
            quantity: 2,
            frequency: 30
        })

        return particles
    }

    /**
     * Create a simple white particle texture
     * Call this in preload() or create() before using particles
     */
    static createParticleTexture(scene: Phaser.Scene) {
        const graphics = scene.add.graphics()
        graphics.fillStyle(0xffffff, 1)
        graphics.fillCircle(4, 4, 4)
        graphics.generateTexture('particle', 8, 8)
        graphics.destroy()
    }

    /**
     * Cleanup all particle systems in a scene
     */
    static cleanupAll(scene: Phaser.Scene) {
        scene.children.list
            .filter(child => child instanceof Phaser.GameObjects.Particles.ParticleEmitter)
            .forEach(emitter => emitter.destroy())
    }
}
