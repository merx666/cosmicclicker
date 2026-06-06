import { Scene } from 'phaser'
import { DIFFICULTY_LEVELS } from '@/lib/gameEconomy'

// Cyberpunk Palette
const COLORS = {
    NEON_BLUE: 0x00f3ff,
    NEON_PINK: 0xbc13fe,
    NEON_GREEN: 0x0aff00,
    NEON_RED: 0xff003c,
    VOID_DARK: 0x050510,
    VOID_GRID: 0x1a1a2e
}

enum EnemyType {
    SCOUT = 'scout',
    TANK = 'tank',
    SWARM = 'swarm',
    BOSS = 'boss'
}

interface EnemyConfig {
    type: EnemyType
    hp: number
    speed: number
    reward: number
    color: number
    size: number
    shape: string // 'circle', 'square', 'triangle', 'pentagon'
}

const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
    [EnemyType.SCOUT]: { type: EnemyType.SCOUT, hp: 1, speed: 200, reward: 10, color: COLORS.NEON_RED, size: 10, shape: 'triangle' },
    [EnemyType.TANK]: { type: EnemyType.TANK, hp: 4, speed: 60, reward: 30, color: COLORS.NEON_PINK, size: 20, shape: 'square' },
    [EnemyType.SWARM]: { type: EnemyType.SWARM, hp: 1, speed: 160, reward: 15, color: COLORS.NEON_GREEN, size: 8, shape: 'circle' },
    [EnemyType.BOSS]: { type: EnemyType.BOSS, hp: 20, speed: 40, reward: 300, color: COLORS.NEON_PINK, size: 40, shape: 'pentagon' }
}

export default class TowerDefenseScene extends Scene {
    bastion!: Phaser.GameObjects.Container
    enemies!: Phaser.Physics.Arcade.Group
    turrets!: Phaser.GameObjects.Group
    bullets!: Phaser.Physics.Arcade.Group
    grid!: Phaser.GameObjects.TileSprite

    // Phase 3: Radar
    radarGraphics!: Phaser.GameObjects.Graphics
    radarContainer!: Phaser.GameObjects.Container

    credits: number = 100
    health: number = 100
    waveNumber: number = 1

    // Game State
    spawnRate: number = 2000
    nextSpawn: number = 0
    enemiesInWave: number = 6
    enemiesSpawned: number = 0
    enemiesAlive: number = 0
    isGameOver: boolean = false
    maxTurrets: number = 8

    // Phase 3: Tactical State
    isWaveActive: boolean = false // Starts false for initial prep
    waveTimer: number = 0
    waveDelay: number = 15000 // 15 seconds
    nextWaveTime: number = 0

    // Phase 3: Abilities
    shieldActive: boolean = false
    shieldCooldown: number = 0
    shieldDuration: number = 5000
    shieldCD: number = 60000

    // Phase 4: Economy
    buildType: 'basic' | 'sniper' | 'flame' = 'basic'
    inventory: any[] = []

    constructor() {
        super({ key: 'TowerDefenseScene' })
    }

    preload() {
        // Generate Procedural Textures instead of loading images
        this.generateTextures()
    }

    create() {
        // --- FX SETUP ---
        // Enable intense bloom for that Cyberpunk look
        this.cameras.main.postFX.addBloom(0xffffff, 1, 1, 1.2, 1.2)

        // Difficulty
        const difficultyKey = this.registry.get('difficulty') || 'easy'
        // @ts-ignore
        const difficulty = DIFFICULTY_LEVELS[difficultyKey] || DIFFICULTY_LEVELS.easy
        this.credits = difficulty.startCredits || 150
        this.health = difficulty.health || 300
        this.maxTurrets = difficultyKey === 'insane' ? 4 : (difficultyKey === 'hard' ? 6 : 8)

        // Inventory
        this.inventory = this.registry.get('inventory') || []

        // Background - Cyber Grid
        this.grid = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'neon_grid')
            .setOrigin(0)
            .setAlpha(0.3)

        // Deep background color
        this.cameras.main.setBackgroundColor(COLORS.VOID_DARK)

        // Bastion (Player Base)
        this.createBastion()

        // Groups
        this.enemies = this.physics.add.group()
        this.turrets = this.add.group()
        this.bullets = this.physics.add.group()

        // Phase 3: Radar Setup
        this.createRadar()

        // Inputs
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.isGameOver) return

            // Check if clicked ON a turret
            const clickedTurret = this.getTurretAt(pointer.x, pointer.y)
            if (clickedTurret) {
                this.selectTurret(clickedTurret)
            } else {
                this.placeTurret(pointer.x, pointer.y)
            }
        })

        // Collisions
        this.physics.add.overlap(this.enemies, this.bullets, this.enemyHit, undefined, this)
        this.physics.add.overlap(this.enemies, this.bastion, this.bastionHit, undefined, this)

        // Phase 3: Listeners
        window.addEventListener('start-wave', () => this.startWave())
        window.addEventListener('activate-shield', () => this.activateShield())
        window.addEventListener('upgrade-turret', (e: any) => this.upgradeTurret(e.detail.id))

        // Phase 4: Build Type Listener
        window.addEventListener('set-build-type', (e: any) => {
            this.buildType = e.detail.type
        })

        // Update inventory listener (from React)
        // Note: Initial sync is via registry, dynamic updates via re-registry set in React
        // But we can also add a method to update it
        // @ts-ignore
        this.events.on('update-inventory', (inv) => this.inventory = inv)

        // UI Updates (Initial)
        this.updateUI()
        this.startTacticalPhase() // Start with prep phase
    }

    // Method to be called from React via game instance
    updateInventory(inv: any[]) {
        this.inventory = inv
    }

    update(time: number, delta: number) {
        if (this.isGameOver) return

        // Scroll Grid based on mouse or time for "flying through voids" effect
        this.grid.tilePositionX += 0.5
        this.grid.tilePositionY += 0.5

        // Phase 3: Wave Logic / Tactical Phase
        if (this.isWaveActive) {
            // Spawning Logic
            if (this.enemiesSpawned < this.enemiesInWave) {
                if (time > this.nextSpawn) {
                    this.spawnEnemy()
                    this.enemiesSpawned++
                    this.nextSpawn = time + this.spawnRate
                }
            } else if (this.enemies.countActive() === 0 && this.enemiesAlive === 0) {
                if (!this.isGameOver) this.endWave()
            }
        } else {
            // Tactical Phase Countdown
            if (time > this.nextWaveTime && this.nextWaveTime > 0) {
                this.startWave()
            }
        }

        // Turret Fire Logic
        this.turrets.children.entries.forEach((t: any) => {
            if (this.isWaveActive || this.enemiesAlive > 0) { // Only fire if enemies exist
                if (time > t.nextFire) {
                    const range = t.range || 250
                    const enemy = this.getNearestEnemy(t.x, t.y, range)
                    if (enemy) {
                        this.fireBullet(t.x, t.y, enemy, t)
                        t.nextFire = time + (t.fireRate || 500)
                    }
                }
            }
        })

        // Enemy Movement
        this.enemies.children.entries.forEach((e: any) => {
            this.physics.moveToObject(e, this.bastion, e.speed)
            e.rotation += 0.05 // Spin enemies
        })

        // Clean bullets
        this.bullets.children.entries.forEach((b: any) => {
            if (!this.cameras.main.worldView.contains(b.x, b.y)) b.destroy()
        })

        // Phase 3: Update Radar
        this.updateRadar()
    }

    // --- PHASE 3 METHODS ---

    createRadar() {
        // Radar Container bottom right
        const radarSize = 140
        const margin = 20
        const x = this.scale.width - radarSize / 2 - margin
        const y = this.scale.height - radarSize / 2 - margin - 40 // Move up a bit to clear bottom HUD

        this.radarContainer = this.add.container(x, y).setScrollFactor(0).setDepth(200) // Higher depth

        this.radarGraphics = this.add.graphics()
        this.radarContainer.add(this.radarGraphics)

        // Radar background ring (Darker, more opaque)
        const bg = this.add.circle(0, 0, radarSize / 2, 0x000510, 0.9)
        bg.setStrokeStyle(2, COLORS.NEON_BLUE)
        this.radarContainer.add(bg)

        // Sweeping line animation
        const sweep = this.add.line(0, 0, 0, 0, 0, -radarSize / 2, COLORS.NEON_BLUE, 0.5)
        this.radarContainer.add(sweep)

        this.tweens.add({
            targets: sweep,
            angle: 360,
            duration: 2000,
            repeat: -1
        })
    }

    updateRadar() {
        if (!this.radarGraphics) return
        this.radarGraphics.clear()

        // Scale constant
        const radarRadius = 70
        const scaleX = (radarRadius * 2) / this.scale.width
        const scaleY = (radarRadius * 2) / this.scale.height
        const scale = Math.min(scaleX, scaleY) * 0.9 // Keep it contained

        // Draw Bastion (Center) (Larger)
        this.radarGraphics.fillStyle(COLORS.NEON_BLUE, 1)
        this.radarGraphics.fillCircle(0, 0, 4)

        // Draw Enemies
        this.radarGraphics.fillStyle(COLORS.NEON_RED, 1)
        const enemies = this.enemies.getChildren()
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i] as any
            if (!e.active) continue

            // Rel to center (Bastion is center of world mostly? No, map is screen size)
            // Bastion is at center of screen, but map might scroll.
            // Let's assume map is screen size 1:1 for now
            const dx = (e.x - this.scale.width / 2) * scale
            const dy = (e.y - this.scale.height / 2) * scale

            // Clamp to radar radius
            if (dx * dx + dy * dy < radarRadius * radarRadius) {
                this.radarGraphics.fillCircle(dx, dy, 4) // Larger dots
            } else {
                // Draw indicators at edge if out of range
                const angle = Math.atan2(dy, dx)
                this.radarGraphics.fillCircle(Math.cos(angle) * radarRadius, Math.sin(angle) * radarRadius, 3)
            }
        }

        // Draw Turrets
        this.radarGraphics.fillStyle(COLORS.NEON_GREEN, 1)
        const turrets = this.turrets.getChildren()
        for (let i = 0; i < turrets.length; i++) {
            const t = turrets[i] as any
            const dx = (t.x - this.scale.width / 2) * scale
            const dy = (t.y - this.scale.height / 2) * scale
            if (dx * dx + dy * dy < radarRadius * radarRadius) {
                this.radarGraphics.fillRect(dx - 2, dy - 2, 5, 5) // Larger squares
            }
        }
    }

    startTacticalPhase() {
        this.isWaveActive = false
        this.nextWaveTime = this.time.now + this.waveDelay

        // Dispatch event for UI Timer
        window.dispatchEvent(new CustomEvent('update-phase', {
            detail: {
                phase: 'tactical',
                nextWaveTime: this.nextWaveTime
            }
        }))

        // Auto-heal a bit?
        if (this.health < 100) this.health = Math.min(100, this.health + 10)
        this.updateUI()
    }

    startWave() {
        if (this.isWaveActive) return
        this.isWaveActive = true
        this.enemiesSpawned = 0
        this.nextSpawn = this.time.now

        window.dispatchEvent(new CustomEvent('update-phase', {
            detail: { phase: 'combat' }
        }))
    }

    endWave() {
        this.waveNumber++
        this.enemiesInWave += 2
        this.spawnRate *= 0.95
        this.updateUI()
        this.startTacticalPhase()
    }

    activateShield() {
        if (this.shieldActive || this.time.now < this.shieldCooldown) return

        this.shieldActive = true
        this.shieldCooldown = this.time.now + this.shieldCD

        // Visuals
        const shield = this.add.circle(this.bastion.x, this.bastion.y, 90, COLORS.NEON_BLUE, 0.3)
        shield.setStrokeStyle(4, 0xffffff)

        this.tweens.add({
            targets: shield,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: 10,
            onComplete: () => {
                this.shieldActive = false
                shield.destroy()
            }
        })

        window.dispatchEvent(new CustomEvent('shield-status', {
            detail: { active: true, cooldown: this.shieldCD }
        }))
    }

    getTurretAt(x: number, y: number) {
        let clicked: any = null
        this.turrets.children.entries.forEach((t: any) => {
            if (Phaser.Math.Distance.Between(x, y, t.x, t.y) < 30) {
                clicked = t
            }
        })
        return clicked
    }

    selectTurret(turret: any) {
        window.dispatchEvent(new CustomEvent('turret-selected', {
            detail: {
                id: turret.id || Math.random().toString(),
                level: turret.level || 1,
                x: turret.x,
                y: turret.y
            }
        }))
        // @ts-ignore
        this.selectedTurret = turret
    }

    upgradeTurret(id: string) {
        // @ts-ignore
        const t = this.selectedTurret
        if (!t) return

        if (this.credits >= 100) {
            this.credits -= 100
            t.level = (t.level || 1) + 1
            t.range = (t.range || 250) + 50
            t.fireRate = Math.max(100, (t.fireRate || 500) - 50)

            const glow = this.add.circle(0, 0, 20 + t.level * 5, COLORS.NEON_PINK, 0.4)
            t.addAt(glow, 0)

            this.updateUI()
            this.selectTurret(t)
        }
    }

    // GameOver logic
    gameOver() {
        this.isGameOver = true
        this.physics.pause()

        // Responsive Text
        const fontSize = Math.min(this.scale.width / 10, 64)
        const text = this.add.text(this.scale.width / 2, this.scale.height / 2, 'SYSTEM FAILURE', {
            fontFamily: 'Orbitron',
            fontSize: `${fontSize}px`,
            color: '#ff003c',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(200)

        this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, 'BASTION BREACHED', {
            fontFamily: 'Rajdhani',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(200)

        // Dispatch Check
        window.dispatchEvent(new CustomEvent('game-over', {
            detail: { wave: this.waveNumber }
        }))
    }

    // --- GAMEPLAY METHODS ---

    createBastion() {
        const cx = this.scale.width / 2
        const cy = this.scale.height / 2

        this.bastion = this.add.container(cx, cy)

        // Pulse Aura
        const aura = this.add.circle(0, 0, 60, COLORS.NEON_BLUE, 0.2)
        this.tweens.add({
            targets: aura,
            scale: { from: 1, to: 1.5 },
            alpha: { from: 0.2, to: 0 },
            duration: 2000,
            repeat: -1
        })

        // Core Shape
        const core = this.add.sprite(0, 0, 'bastion_core')
        core.setTint(COLORS.NEON_BLUE)

        this.bastion.add([aura, core])
        this.physics.add.existing(this.bastion, true)
        // @ts-ignore
        this.bastion.body.setCircle(30)
    }

    placeTurret(x: number, y: number) {
        // Validation based on type cost? For now all 50
        const cost = 50
        if (this.credits < cost || this.turrets.getLength() >= this.maxTurrets) {
            this.cameras.main.shake(100, 0.005) // Error feedback
            return
        }

        const turret = this.add.container(x, y)

        let color = COLORS.NEON_BLUE
        let range = 250
        let fireRate = 400
        let damage = 1
        let type = this.buildType

        if (type === 'sniper') {
            color = COLORS.NEON_GREEN
            range = 600
            fireRate = 1200
            damage = 5
        } else if (type === 'flame') {
            color = COLORS.NEON_RED
            range = 150
            fireRate = 100
            damage = 0.5
        }

        const base = this.add.circle(0, 0, 15, color, 0.3)
        // Sprite based on type? use shape texturing
        const gun = this.add.sprite(0, 0, 'turret_head')
        gun.setTint(color)
        if (type === 'sniper') gun.setScale(1, 1.5) // Longer barrel
        if (type === 'flame') gun.setScale(1.5, 0.8) // Wide barrel

        turret.add([base, gun])
        this.turrets.add(turret)

        // @ts-ignore
        turret.nextFire = 0
        // @ts-ignore
        turret.fireRate = fireRate
        // @ts-ignore
        turret.range = range
        // @ts-ignore
        turret.damage = damage
        // @ts-ignore
        turret.level = 1
        // @ts-ignore
        turret.type = type

        this.credits -= cost
        this.updateUI()

        // Spawn effect
        this.addExplosion(x, y, color, 10, 0.5)
    }

    spawnEnemy() {
        let type = EnemyType.SCOUT
        if (this.waveNumber > 3 && Math.random() > 0.7) type = EnemyType.TANK
        if (this.waveNumber % 5 === 0) type = EnemyType.BOSS

        const config = ENEMY_CONFIGS[type]

        // Random Edge Spawn
        let x, y
        const edge = Phaser.Math.Between(0, 3)
        if (edge === 0) { x = Phaser.Math.Between(0, this.scale.width); y = -50 }
        else if (edge === 1) { x = this.scale.width + 50; y = Phaser.Math.Between(0, this.scale.height) }
        else if (edge === 2) { x = Phaser.Math.Between(0, this.scale.width); y = this.scale.height + 50 }
        else { x = -50; y = Phaser.Math.Between(0, this.scale.height) }

        const enemy = this.add.container(x, y)
        const shape = this.add.sprite(0, 0, `shape_${config.shape}`)
        shape.setTint(config.color)
        shape.setDisplaySize(config.size * 2, config.size * 2)

        enemy.add(shape)
        this.physics.add.existing(enemy)
        this.enemies.add(enemy)

        // @ts-ignore
        enemy.hp = config.hp
        // @ts-ignore
        enemy.speed = config.speed
        // @ts-ignore
        enemy.reward = config.reward
        // @ts-ignore
        enemy.body.setCircle(config.size)
        // @ts-ignore
        enemy.color = config.color
        this.enemiesAlive++
    }

    fireBullet(x: number, y: number, target: any, sourceTurret: any) {
        // Muzzle Flash
        this.createMuzzleFlash(x, y, sourceTurret.list[1].rotation, sourceTurret.list[1].tintTopLeft)

        const bullet = this.add.sprite(x, y, 'projectile')
        bullet.setTint(sourceTurret.list[1].tintTopLeft) // Match turret color

        let speed = 600
        if (sourceTurret.type === 'sniper') speed = 1200
        if (sourceTurret.type === 'flame') speed = 300

        bullet.setScale(0.8)

        this.physics.add.existing(bullet)
        this.bullets.add(bullet)

        this.physics.moveToObject(bullet, target, speed)

        // Pass damage data to bullet for collision
        // @ts-ignore
        bullet.damage = sourceTurret.damage || 1

        // Trail Effect
        if (sourceTurret.type === 'sniper' || sourceTurret.type === 'basic') {
            const trail = this.add.particles(0, 0, 'projectile', {
                speed: 10,
                scale: { start: 0.5, end: 0 },
                alpha: { start: 0.5, end: 0 },
                tint: bullet.tintTopLeft,
                lifespan: 100,
                blendMode: 'ADD',
                follow: bullet
            })
            // Clean up emitter when bullet is destroyed? Phaser handles follow update, but we need to auto-kill
            // We'll trust Phaser's follow logic, but ideally we should track and destroy
            // For now, simple lifespan is enough
        }
    }

    createMuzzleFlash(x: number, y: number, rotation: number, color: number) {
        const flash = this.add.circle(x, y, 8, color, 1)
        flash.setBlendMode(Phaser.BlendModes.ADD)

        // Offset slightly in direction of rotation (if we had accurate barrel tip tracking)
        // For now, center is fine for top-down

        this.tweens.add({
            targets: flash,
            scale: { from: 1, to: 0 },
            alpha: { from: 1, to: 0 },
            duration: 100,
            onComplete: () => flash.destroy()
        })
    }

    showDamageText(x: number, y: number, damage: number, isCritical: boolean = false) {
        const style = {
            fontFamily: 'Rajdhani',
            fontSize: isCritical ? '24px' : '16px',
            color: isCritical ? '#ff003c' : '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }

        const text = this.add.text(x, y - 20, damage.toString(), style).setOrigin(0.5)

        this.tweens.add({
            targets: text,
            y: y - 50,
            alpha: 0,
            scale: isCritical ? 1.5 : 1,
            duration: 800,
            ease: 'Back.out',
            onComplete: () => text.destroy()
        })
    }

    enemyHit(enemy: any, bullet: any) {
        const dmg = bullet.damage || 1
        bullet.destroy()
        enemy.hp -= dmg

        // Visual Feedback
        this.showDamageText(enemy.x, enemy.y, dmg, dmg > 2)

        if (enemy.hp <= 0) {
            this.addExplosion(enemy.x, enemy.y, enemy.color, 15)
            this.credits += enemy.reward
            enemy.destroy()
            this.enemiesAlive--
            this.updateUI()
        } else {
            // Flash white
            const shape = enemy.list[0] as Phaser.GameObjects.Sprite
            shape.setTint(0xffffff)
            this.time.delayedCall(50, () => shape.setTint(enemy.color))
        }
    }

    bastionHit(bastion: any, enemy: any) {
        // Void Shield Logic
        if (this.shieldActive) {
            enemy.destroy()
            this.enemiesAlive--
            this.addExplosion(enemy.x, enemy.y, COLORS.NEON_BLUE, 20)
            return
        }

        enemy.destroy()
        this.enemiesAlive--
        this.health -= 10
        this.cameras.main.shake(200, 0.02)
        this.updateUI()

        if (this.health <= 0) {
            this.gameOver()
        }
    }

    nextWave() {
        this.endWave()
    }



    // --- UTILS ---

    generateTextures() {
        const graphics = this.make.graphics({ x: 0, y: 0 }, false)

        // 1. Neon Grid
        graphics.lineStyle(1, 0x00f3ff)
        graphics.strokeRect(0, 0, 64, 64)
        graphics.generateTexture('neon_grid', 64, 64)
        graphics.clear()

        // 2. Shapes
        // Triangle (Scout)
        graphics.fillStyle(0xffffff)
        graphics.fillTriangle(0, 32, 16, 0, 32, 32)
        graphics.generateTexture('shape_triangle', 32, 32)
        graphics.clear()

        // Square (Tank)
        graphics.fillStyle(0xffffff)
        graphics.fillRect(0, 0, 32, 32)
        graphics.generateTexture('shape_square', 32, 32)
        graphics.clear()

        // Circle (Swarm)
        graphics.fillStyle(0xffffff)
        graphics.fillCircle(16, 16, 16)
        graphics.generateTexture('shape_circle', 32, 32)
        graphics.clear()

        // Pentagon (Boss) - approximated
        graphics.fillStyle(0xffffff)
        graphics.fillCircle(32, 32, 32) // placeholder
        graphics.generateTexture('shape_pentagon', 64, 64)
        graphics.clear()

        // 3. Bastion Core
        graphics.lineStyle(4, 0xffffff)
        graphics.strokeCircle(32, 32, 28)
        graphics.fillCircle(32, 32, 10)
        graphics.generateTexture('bastion_core', 64, 64)
        graphics.clear()

        // 4. Turret Head
        graphics.fillStyle(0xffffff)
        graphics.fillRect(0, 0, 10, 24)
        graphics.generateTexture('turret_head', 10, 24)
        graphics.clear()

        // 5. Projectile
        graphics.fillStyle(0xffffff)
        graphics.fillCircle(4, 4, 4)
        graphics.generateTexture('projectile', 8, 8)
        graphics.clear()
    }

    addExplosion(x: number, y: number, color: number, count: number = 10, scale: number = 1) {
        const particle = this.add.particles(x, y, 'shape_circle', {
            speed: { min: 50, max: 200 },
            scale: { start: 0.4 * scale, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: color,
            lifespan: 500,
            blendMode: 'ADD',
            quantity: count
        })
        this.time.delayedCall(500, () => particle.destroy())
    }

    getNearestEnemy(x: number, y: number, range: number) {
        let nearest: any = null
        let minDist = range
        this.enemies.children.entries.forEach((e: any) => {
            const dist = Phaser.Math.Distance.Between(x, y, e.x, e.y)
            if (dist < minDist) {
                minDist = dist
                nearest = e
            }
        })
        return nearest
    }

    updateUI() {
        // Dispatch to React
        window.dispatchEvent(new CustomEvent('update-ui', {
            detail: {
                credits: this.credits,
                health: this.health,
                wave: this.waveNumber
            }
        }))
    }
}
