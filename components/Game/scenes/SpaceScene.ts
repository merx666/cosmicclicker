import { Scene } from 'phaser'

export default class SpaceScene extends Scene {
    player!: Phaser.GameObjects.Container
    playerSprite!: Phaser.GameObjects.Sprite
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    grid!: Phaser.GameObjects.TileSprite

    // Input State
    joystickVector: { x: number, y: number } = { x: 0, y: 0 }
    isFiring: boolean = false
    lastFired: number = 0
    bullets!: Phaser.Physics.Arcade.Group

    // Game State
    enemies!: Phaser.Physics.Arcade.Group
    explosionEmitter!: Phaser.GameObjects.Particles.ParticleEmitter
    score: number = 0
    scoreText!: Phaser.GameObjects.Text
    lastSpawn: number = 0
    isGameOver: boolean = false

    constructor() {
        super({ key: 'SpaceScene' })
    }

    preload() {
        // Generate neon grid texture
        const gridGfx = this.make.graphics({ x: 0, y: 0 }, false)
        gridGfx.lineStyle(1, 0x00f3ff, 0.3)

        // Draw grid pattern
        const gridSize = 50
        for (let x = 0; x < 500; x += gridSize) {
            gridGfx.lineBetween(x, 0, x, 500)
        }
        for (let y = 0; y < 500; y += gridSize) {
            gridGfx.lineBetween(0, y, 500, y)
        }

        gridGfx.generateTexture('neon_grid', 500, 500)
        gridGfx.destroy()
    }

    create() {
        // --- SETUP ---
        this.isGameOver = false
        this.score = 0
        this.lastSpawn = 0

        // Dark Void Background
        this.cameras.main.setBackgroundColor(0x050510)
        this.cameras.main.postFX.addBloom(0xffffff, 1, 1, 1.2, 1.2) // Cyberpunk Bloom

        // Infinite Grid
        this.grid = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'neon_grid')
            .setOrigin(0)
            .setAlpha(0.2)
            .setScrollFactor(0) // Logic handled manually for "movement" feel

        // --- PLAYER ---
        this.createPlayer()

        // --- ENEMIES ---
        this.enemies = this.physics.add.group({
            maxSize: 50
        })

        // Enemy Texture (Red Diamond)
        const enemyGfx = this.make.graphics({ x: 0, y: 0 }, false)
        enemyGfx.lineStyle(2, 0xff0044)
        enemyGfx.fillStyle(0x330011)
        enemyGfx.beginPath()
        enemyGfx.moveTo(0, -15)
        enemyGfx.lineTo(15, 0)
        enemyGfx.lineTo(0, 15)
        enemyGfx.lineTo(-15, 0)
        enemyGfx.closePath()
        enemyGfx.strokePath()
        enemyGfx.fillPath()
        enemyGfx.generateTexture('ship_enemy', 32, 32)
        enemyGfx.clear()

        // --- INPUT ---
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys()
        }

        // --- CAMERA ---
        this.cameras.main.startFollow(this.player)
        this.cameras.main.setZoom(1)
        // HUD (Score) - Fixed to Camera
        this.scoreText = this.add.text(20, 50, 'SCORE: 0', {
            fontFamily: 'Orbitron',
            fontSize: '24px',
            color: '#00f3ff'
        }).setScrollFactor(0).setDepth(2000)

        // Handle Resizing
        this.scale.on('resize', this.resize, this)
        this.resize({ width: this.scale.width, height: this.scale.height })

        // Create bullets group
        this.bullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 20
        })

        // Generate bullet texture
        const bulletGfx = this.make.graphics({ x: 0, y: 0 }, false)
        bulletGfx.fillStyle(0xff0000)
        bulletGfx.fillCircle(4, 4, 4)
        bulletGfx.generateTexture('bullet', 8, 8)
        bulletGfx.clear()

        // Generate explosion particle texture
        const particleGfx = this.make.graphics({ x: 0, y: 0 }, false)
        particleGfx.fillStyle(0xffaa00)
        particleGfx.fillCircle(4, 4, 4)
        particleGfx.generateTexture('explosion_particle', 8, 8)
        particleGfx.clear()

        // Create explosion emitter
        this.explosionEmitter = this.add.particles(0, 0, 'explosion_particle', {
            lifespan: 600,
            speed: { min: 50, max: 200 },
            scale: { start: 1.5, end: 0 },
            alpha: { start: 1, end: 0 },
            blendMode: 'ADD',
            emitting: false
        })

        // Setup Input Listeners
        window.addEventListener('joystick-move', (e: any) => {
            this.joystickVector = { x: e.detail.x, y: e.detail.y }
        })

        window.addEventListener('joystick-end', () => {
            this.joystickVector = { x: 0, y: 0 }
        })

        window.addEventListener('fire-start', () => {
            this.isFiring = true
        })

        window.addEventListener('fire-end', () => {
            this.isFiring = false
        })

        // --- COLLISIONS ---
        this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletHit, undefined, this)
        this.physics.add.overlap(this.player, this.enemies, this.handlePlayerHit, undefined, this)
    }

    createPlayer() {
        // Placeholder Player Ship (Triangle)
        const graphics = this.make.graphics({ x: 0, y: 0 }, false)
        graphics.lineStyle(2, 0x00f3ff)
        graphics.fillStyle(0x000510)
        graphics.beginPath()
        graphics.moveTo(0, -20)
        graphics.lineTo(15, 15)
        graphics.lineTo(0, 10)
        graphics.lineTo(-15, 15)
        graphics.closePath()
        graphics.strokePath()
        graphics.fillPath()
        graphics.generateTexture('ship_player', 32, 40)
        graphics.clear()

        this.player = this.add.container(this.scale.width / 2, this.scale.height / 2)
        this.playerSprite = this.add.sprite(0, 0, 'ship_player')
        this.player.add(this.playerSprite)

        this.physics.add.existing(this.player)
        // @ts-ignore
        this.player.body.setDrag(100)
        // @ts-ignore
        this.player.body.setAngularDrag(100)
        // @ts-ignore
        this.player.body.setMaxVelocity(300)
        // @ts-ignore
        this.player.body.setSize(24, 24) // Smaller hitbox
    }

    handleBulletHit(bullet: any, enemy: any) {
        if (!bullet.active || !enemy.active) return

        // Spawn explosion at enemy position before destroying
        this.explosionEmitter.explode(20, enemy.x, enemy.y)

        bullet.setActive(false).setVisible(false)
        enemy.destroy() // Simple destroy for now

        this.score += 100
        this.scoreText.setText('SCORE: ' + this.score)

        // Screen shake
        this.cameras.main.shake(50, 0.005)
    }

    handlePlayerHit(player: any, enemy: any) {
        if (!enemy.active) return

        enemy.destroy()
        this.cameras.main.shake(200, 0.02)
        this.cameras.main.flash(200, 255, 0, 0)

        // Logic for Game Over / Health
        this.gameOver()
    }

    spawnEnemy() {
        if (this.isGameOver) return

        const x = this.player.x + Phaser.Math.Between(-500, 500)
        const y = this.player.y + Phaser.Math.Between(-500, 500)

        // Dont spawn too close
        if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 300) return

        const enemy = this.enemies.create(x, y, 'ship_enemy')
        if (enemy) {
            enemy.setAlpha(0).setScale(0.1)
            this.tweens.add({
                targets: enemy,
                alpha: 1,
                scale: 1,
                duration: 400
            })
        }
    }

    fireBullet() {
        if (!this.player || !this.bullets) return

        const bullet = this.bullets.get(this.player.x, this.player.y)
        if (bullet) {
            bullet.setActive(true).setVisible(true)
            bullet.setPosition(this.player.x, this.player.y)

            // Velocity based on player rotation
            const speed = 600
            const rotation = this.player.rotation - Math.PI / 2
            this.physics.velocityFromRotation(rotation, speed, bullet.body.velocity)

            // Destroy after time
            this.time.delayedCall(2000, () => {
                if (bullet.active) bullet.setActive(false).setVisible(false)
            })
        }
    }

    update(time: number, delta: number) {
        if (this.isGameOver) return
        if (!this.player || !this.player.body) return

        const body = this.player.body as Phaser.Physics.Arcade.Body

        // --- SPAWNING ---
        if (this.enemies.countActive() < 10) {
            if (time > this.lastSpawn) {
                this.spawnEnemy()
                this.lastSpawn = time + 1000 // Spawn every 1s
            }
        }

        // --- ENEMY AI ---
        this.enemies.getChildren().forEach((e: any) => {
            if (e.active) {
                this.physics.moveToObject(e, this.player, 100) // Move to player
                e.rotation = Phaser.Math.Angle.Between(e.x, e.y, this.player.x, this.player.y) + Math.PI / 2
            }
        })

        // --- SHOOTING ---
        if (this.isFiring) {
            if (time > this.lastFired) {
                this.fireBullet()
                this.lastFired = time + 200 // 200ms fire rate
            }
        }

        // --- MOVEMENT ---
        // Combine Keyboard and Joystick
        let turn = 0
        let thrust = 0

        // Keyboard (Legacy / Debug)
        if (this.cursors.left.isDown) turn = -1
        else if (this.cursors.right.isDown) turn = 1

        if (this.cursors.up.isDown) thrust = 1

        // Apply Keyboard Physics (Tank Controls)
        if (turn !== 0) {
            body.setAngularVelocity(turn * 200)
        } else if (this.joystickVector.x === 0 && this.joystickVector.y === 0) {
            // Only stop rotation if no joystick input
            body.setAngularVelocity(0)
        }

        if (thrust > 0) {
            this.physics.velocityFromRotation(this.player.rotation - Math.PI / 2, 200, body.acceleration)
        } else if (this.joystickVector.x === 0 && this.joystickVector.y === 0) {
            body.setAcceleration(0)
        }

        // Joystick Override (Direct Control)
        if (this.joystickVector.x !== 0 || this.joystickVector.y !== 0) {
            const angle = Math.atan2(this.joystickVector.y, this.joystickVector.x)
            const targetRotation = angle + Math.PI / 2 // Offset for Up-facing sprite

            // Snap to angle (or use angular velocity to smooth it - specific to user preference, start with snap for precision)
            this.player.setRotation(targetRotation)

            // Thrust in the direction of the stick
            const magnitude = Math.sqrt(this.joystickVector.x ** 2 + this.joystickVector.y ** 2)
            const clampedMagnitude = Math.min(magnitude, 1) // Cap at 1

            // Move in the direction the stick is pointing (which is now player rotation)
            this.physics.velocityFromRotation(angle, 200 * clampedMagnitude, body.acceleration)
        }

        // Parallax Grid (Fake movement relative to player)
        this.grid.tilePositionX = this.cameras.main.scrollX * 0.5
        this.grid.tilePositionY = this.cameras.main.scrollY * 0.5
    }

    gameOver() {
        this.isGameOver = true
        this.physics.pause()

        // Responsive Text
        const fontSize = Math.min(this.scale.width / 8, 64)
        const text = this.add.text(this.scale.width / 2, this.scale.height / 2, 'GAME OVER', {
            fontFamily: 'Orbitron',
            fontSize: `${fontSize}px`,
            color: '#ff003c',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2000).setScrollFactor(0)

        this.add.text(this.scale.width / 2, this.scale.height / 2 + 50, 'Tap to Restart', {
            fontFamily: 'Rajdhani',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(2000).setScrollFactor(0)

        this.time.delayedCall(500, () => {
            this.input.once('pointerdown', () => {
                this.scene.restart()
            })
        })
    }

    resize(gameSize: { width: number, height: number }) {
        if (this.grid) {
            this.grid.setSize(gameSize.width, gameSize.height)
        }
        if (this.cameras.main) {
            this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height)
        }
    }
}
