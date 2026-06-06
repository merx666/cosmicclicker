import { Scene } from 'phaser'
import { ParticleEffects } from '../../../lib/ParticleEffects'

export default class TacticsScene extends Scene {
    gridWidth = 7
    gridHeight = 6
    tileSize = 64
    boardOffsetX = 0
    boardOffsetY = 100

    // Groups
    tiles!: Phaser.GameObjects.Group
    units!: Phaser.GameObjects.Group
    uiGroup!: Phaser.GameObjects.Group

    // State
    selectedUnit: any = null
    isDragging: boolean = false
    benchSlots: (Phaser.GameObjects.Container | null)[] = [null, null, null, null, null] // 5 Bench slots

    // Combat State
    inCombat: boolean = false
    enemyUnits!: Phaser.GameObjects.Group

    // Wave & Stats Tracking
    currentWave: number = 1
    debugLogs: string[] = [] // Log history
    combatStats = {
        damageDealt: 0,
        unitsLost: 0,
        enemiesKilled: 0
    }

    // Synergy State
    activeSynergies: Record<string, number> = {}
    synergyUI!: Phaser.GameObjects.Container

    static ItemTypes: Record<string, { name: string, icon: string, bonus: string, type: 'dmg' | 'hp' | 'as', value: number }> = {
        'sword': { name: 'BF Sword', icon: '⚔️', bonus: '+20 DMG', type: 'dmg', value: 20 },
        'vest': { name: 'Chain Vest', icon: '🛡️', bonus: '+200 HP', type: 'hp', value: 200 },
        'bow': { name: 'Recurve Bow', icon: '🏹', bonus: '+15% AS', type: 'as', value: 0.15 }
    }

    inventory: string[] = []
    inventoryUI!: Phaser.GameObjects.Group

    // Data definition for Units
    static UnitTypes: Record<string, { color: number, hp: number, dmg: number, range: number, name: string, ability?: string, abilityValue?: number, cost: number, icon: string, traits: string[] }> = {
        // STARTER UNITS (Even Cheaper for better progression)
        'tank': { color: 0x3b82f6, hp: 1000, dmg: 50, range: 1, name: 'Bastion', cost: 60, icon: '', traits: ['Ironclad'] },
        'assassin': { color: 0xa855f7, hp: 400, dmg: 150, range: 1, name: 'Spectre', cost: 120, icon: '', traits: ['Striker'] },
        'ranger': { color: 0xfacc15, hp: 600, dmg: 100, range: 3, name: 'Valkyrie', cost: 200, icon: '', traits: ['Sniper'] },

        // ORIGINAL ADVANCED UNITS
        'healer': { color: 0x10b981, hp: 700, dmg: 30, range: 2, name: 'Lifebringer', ability: 'heal', cost: 400, icon: '', traits: ['Arcane'] },
        'mage': { color: 0x8b5cf6, hp: 500, dmg: 180, range: 2, name: 'Archmage', cost: 350, icon: '', traits: ['Arcane'] },
        'warrior': { color: 0xef4444, hp: 800, dmg: 120, range: 1, name: 'Titan', cost: 250, icon: '', traits: ['Ironclad'] },

        // NEW UNITS WITH SPECIAL ABILITIES
        'bladedancer': { color: 0xff1744, hp: 350, dmg: 200, range: 1, name: 'Bladedancer', ability: 'evasion', abilityValue: 0.25, cost: 180, icon: '', traits: ['Striker'] },
        'fortress': { color: 0x424242, hp: 1500, dmg: 30, range: 1, name: 'Fortress', ability: 'tank_reduce', abilityValue: 0.30, cost: 280, icon: '', traits: ['Ironclad'] },
        'electro': { color: 0x00e5ff, hp: 400, dmg: 80, range: 3, name: 'Electro', ability: 'chain_lightning', abilityValue: 3, cost: 320, icon: '', traits: ['Arcane'] },
        'sniper': { color: 0xff6f00, hp: 450, dmg: 250, range: 5, name: 'Sniper', ability: 'first_shot_crit', abilityValue: 2.0, cost: 380, icon: '', traits: ['Sniper'] },
        'necro': { color: 0x6a1b9a, hp: 550, dmg: 60, range: 2, name: 'Necromancer', ability: 'summon', abilityValue: 0.30, cost: 450, icon: '', traits: ['Arcane'] },
        'paladin': { color: 0xffd700, hp: 900, dmg: 90, range: 1, name: 'Paladin', ability: 'aura_dmg', abilityValue: 0.20, cost: 400, icon: '', traits: ['Ironclad', 'Arcane'] }
    }

    static Traits: Record<string, { name: string, description: string, levels: { count: number, bonus: string, value: number, type: string }[] }> = {
        'Ironclad': {
            name: 'Ironclad',
            description: 'Damage Reduction',
            levels: [
                { count: 2, bonus: '20% DR', value: 0.2, type: 'dr' },
                { count: 3, bonus: '35% DR', value: 0.35, type: 'dr' },
                { count: 4, bonus: '50% DR', value: 0.5, type: 'dr' }
            ]
        },
        'Striker': {
            name: 'Striker',
            description: 'Crit Damage',
            levels: [
                { count: 2, bonus: '+50% Crit Dmg', value: 0.5, type: 'crit' }
            ]
        },
        'Arcane': {
            name: 'Arcane',
            description: 'Magic Damage',
            levels: [
                { count: 2, bonus: '+25% Dmg', value: 0.25, type: 'dmg' },
                { count: 4, bonus: '+60% Dmg', value: 0.60, type: 'dmg' }
            ]
        },
        'Sniper': {
            name: 'Sniper',
            description: 'Range Boost',
            levels: [
                { count: 2, bonus: '+2 Range', value: 2, type: 'range' }
            ]
        }
    }

    credits: number = 900 // Buffed for better early-game progression
    shopContainer!: Phaser.GameObjects.Container

    // PvP State
    isPvP: boolean = false
    pvpOpponentName: string = "Opponent"

    // PvP Ghost Teams (Templates)
    // Structure: Array of units with relative grid positions
    // x mirrored for enemy side
    static GhostTeams = [
        {
            name: "Iron Wall",
            units: [
                { type: 'tank', x: 2, y: 1, star: 2 },
                { type: 'tank', x: 4, y: 1, star: 2 },
                { type: 'healer', x: 3, y: 0, star: 1 },
                { type: 'ranger', x: 0, y: 0, star: 2 },
                { type: 'ranger', x: 6, y: 0, star: 2 }
            ]
        },
        {
            name: "Assassin Rush",
            units: [
                { type: 'assassin', x: 1, y: 1, star: 2 },
                { type: 'assassin', x: 5, y: 1, star: 2 },
                { type: 'bladedancer', x: 3, y: 1, star: 2 },
                { type: 'warrior', x: 2, y: 0, star: 2 },
                { type: 'warrior', x: 4, y: 0, star: 2 }
            ]
        },
        {
            name: "Mage Council",
            units: [
                { type: 'tank', x: 3, y: 1, star: 3 },
                { type: 'mage', x: 1, y: 0, star: 2 },
                { type: 'mage', x: 5, y: 0, star: 2 },
                { type: 'electro', x: 2, y: 0, star: 2 },
                { type: 'electro', x: 4, y: 0, star: 2 }
            ]
        },
        {
            name: "Sniper Nest",
            units: [
                { type: 'fortress', x: 2, y: 1, star: 2 },
                { type: 'fortress', x: 4, y: 1, star: 2 },
                { type: 'sniper', x: 0, y: 0, star: 2 },
                { type: 'sniper', x: 6, y: 0, star: 2 },
                { type: 'ranger', x: 3, y: 0, star: 3 }
            ]
        }
    ]

    constructor() {
        super({ key: 'TacticsScene' })
    }

    preload() {
        // Load unit icons
        this.load.image('unit_tank', '/assets/units/tank.png')
        this.load.image('unit_assassin', '/assets/units/assassin.png')
        this.load.image('unit_ranger', '/assets/units/ranger.png')
        this.load.image('unit_mage', '/assets/units/mage.png')
        this.load.image('unit_healer', '/assets/units/healer.png')
        this.load.image('unit_warrior', '/assets/units/warrior.png')
    }

    create() {
        // --- SETUP ---
        this.cameras.main.setBackgroundColor(0x050515)

        this.tiles = this.add.group()
        this.units = this.add.group()
        this.enemyUnits = this.add.group()
        this.uiGroup = this.add.group()
        this.inventoryUI = this.add.group()

        // Initial Layout
        this.calculateLayout()
        this.createBoard()
        this.createBench()
        this.createStatsPanel()
        this.createUIButtons() // Add Phaser-based UI buttons
        this.createSynergyUI()
        this.createInventoryUI()

        // Input Handling
        this.input.on('dragstart', (pointer: any, gameObject: any) => {
            if (this.inCombat) return // Lock during combat
            this.children.bringToTop(gameObject)
            this.isDragging = true

            // Clear slot data when picked up
            if (gameObject.getData('onBench')) {
                const slotIndex = gameObject.getData('slotIndex')
                if (slotIndex !== undefined) this.benchSlots[slotIndex] = null
            }
        })

        this.input.on('drag', (pointer: any, gameObject: any, dragX: number, dragY: number) => {
            if (this.inCombat) return
            gameObject.x = dragX
            gameObject.y = dragY
        })

        this.input.on('dragend', (pointer: any, gameObject: any) => {
            if (this.inCombat) return
            this.isDragging = false
            this.snapToGrid(gameObject)
        })

        // Listen for React events
        window.addEventListener('buy-unit', (e: any) => {
            if (this.inCombat) return
            this.buyUnit(e.detail.type, e.detail.skin || 'default')
        })

        // Check difficulty for PvP
        const difficulty = this.registry.get('difficulty')
        if (difficulty === 'pvp') {
            this.isPvP = true
            this.pvpOpponentName = "Guest_" + Math.floor(Math.random() * 9000 + 1000)
        }

        // Listen for credit updates from React (Moved to create to avoid duplicates on resize)
        window.addEventListener('update-ui', (e: any) => {
            if (e.detail && e.detail.credits !== undefined) {
                this.credits = e.detail.credits
                if (this.creditsText && this.creditsText.active) {
                    this.creditsText.setText(`CREDITS: ${e.detail.credits}`)
                }
            }
        })

        window.addEventListener('start-combat', () => {
            this.startCombatRound()
        })

        window.addEventListener('next-wave', () => {
            this.currentWave++
            this.inCombat = false
            // Units are already on board, just start next round
        })

        window.addEventListener('retry-wave', () => {
            this.inCombat = false
            // Reset units to full HP
            this.units.getChildren().forEach((u: any) => {
                const maxHp = u.getData('maxHp')
                u.setData('hp', maxHp)
                // Update HP bar
                const hpFill = u.list.find((c: any) => c.fillColor === 0x00ff00) as Phaser.GameObjects.Rectangle
                if (hpFill) hpFill.width = 40
            })
        })

        // Consume Item Event
        window.addEventListener('use-consumable', (e: any) => {
            if (e.detail && e.detail.itemId) {
                this.handleConsumableItem(e.detail.itemId)
            }
        })

        // Resize handler
        this.scale.on('resize', this.resize, this)
    }

    handleConsumableItem(itemId: string) {
        console.log("Using consumable in game:", itemId);
        
        // --- CINEMATIC FEEDBACK ---
        // Full screen flash for "wow" factor
        this.cameras.main.flash(400, 255, 255, 255, false);
        // Camera shake
        this.cameras.main.shake(500, 0.02);

        // Show visual feedback text with glow
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;
        const txt = this.add.text(cx, cy, "ITEM ACTIVATED!", { 
            fontSize: '64px', 
            color: '#ffffff', 
            fontStyle: 'bold',
            stroke: '#00ffff',
            strokeThickness: 8
        }).setOrigin(0.5);
        txt.setDepth(3000);
        
        this.tweens.add({ 
            targets: txt, 
            y: cy - 150, 
            scale: 1.5,
            alpha: 0, 
            duration: 1500, 
            ease: 'Back.easeIn',
            onComplete: () => txt.destroy() 
        });

        switch(itemId) {
            case 'mega_nuke':
            case 'nuke_wave':
                // Destroy all enemies with massive explosions
                const enemies = this.enemyUnits.getChildren();
                [...enemies].forEach((enemy: any) => {
                    // Larger explosion for nukes
                    ParticleEffects.createExplosion(this, enemy.x, enemy.y, 0xff3300);
                    // Add secondary sparkles
                    this.time.delayedCall(100, () => ParticleEffects.createSparkles(this, enemy.x, enemy.y, 0xffaa00));
                    enemy.destroy();
                });
                break;
                
            case 'emergency_shield':
                // Heal all units to full + over-heal visual
                this.units.getChildren().forEach((u: any) => {
                    const maxHp = u.getData('maxHp') || 100;
                    u.setData('hp', maxHp);
                    
                    // Visual heal effect
                    ParticleEffects.createHealEffect(this, u.x, u.y);
                    
                    // Force update HP bar to FULL
                    const hpFill = u.list.find((c: any) => c.fillColor === 0x00ff00) as Phaser.GameObjects.Rectangle;
                    if (hpFill) hpFill.width = 40;
                    
                    // Add shield visual ring
                    const shield = this.add.circle(0, 0, 45, 0x00ffff, 0.2);
                    shield.setStrokeStyle(3, 0x00ffff, 0.8);
                    this.tweens.add({ 
                        targets: shield, 
                        scale: 1.5,
                        alpha: 0, 
                        duration: 1000, 
                        onComplete: () => shield.destroy() 
                    });
                    u.add(shield);
                });
                break;
                
            case 'wave_skip':
                // Skip the current wave if in combat
                if (this.inCombat) {
                    this.endRound(true);
                } else {
                    this.currentWave++;
                }
                
                // Award credits with coins effect
                this.credits += 200;
                ParticleEffects.createGoldCoins(this, cx, cy);
                
                window.dispatchEvent(new CustomEvent('credits-updated', { detail: { credits: this.credits } }));
                if (this.creditsText && this.creditsText.active) {
                    this.creditsText.setText(`CREDITS: ${this.credits}`);
                }
                break;
                
            case 'energy_refill':
                // Restore all units HP
                this.units.getChildren().forEach((u: any) => {
                    const maxHp = u.getData('maxHp') || 100;
                    u.setData('hp', maxHp);
                    ParticleEffects.createHealEffect(this, u.x, u.y);
                    const hpFill = u.list.find((c: any) => c.fillColor === 0x00ff00) as Phaser.GameObjects.Rectangle;
                    if (hpFill) hpFill.width = 40;
                });
                break;
        }
    }

    resize(gameSize: any) {
        console.log(`RESIZE called. New size: ${gameSize.width}x${gameSize.height}`)
        this.calculateLayout()

        // Clear all static tiles (board + bench slots)
        this.tiles.clear(true, true)

        // Clear UI buttons
        this.uiGroup.clear(true, true)
        // Also destroy shop container if it exists
        if (this.shopContainer) {
            this.shopContainer.destroy()
        }

        // Destroy Stats Panel to recreate at new position
        if (this.statsPanel) {
            this.statsPanel.destroy()
        }

        // Clear separate text objects (RESERVE label)
        this.children.getAll().forEach(child => {
            if (child.type === 'Text' && (child as Phaser.GameObjects.Text).text === 'RESERVE') {
                child.destroy()
            }
        })

        // Re-create visuals
        this.createBoard()
        this.createBench()
        this.createStatsPanel()
        this.createUIButtons()

        // Reposition Units
        this.units.getChildren().forEach((u: any) => this.updateUnitPositionOnResize(u))
        this.enemyUnits.getChildren().forEach((u: any) => this.updateUnitPositionOnResize(u))
    }

    calculateLayout() {
        const screenW = this.scale.width
        const screenH = this.scale.height

        // Reserved space for Bottom UI (Stats + Bench + Buttons)
        // Reserve 40% for UI, leaving 60% for Board
        const bottomUIPercent = 0.40
        const topMarginPercent = 0.05

        // Available space for board
        const availableHeight = screenH * (1 - bottomUIPercent - topMarginPercent)
        const availableWidth = screenW * 0.95

        // Calculate tile size to fit the grid
        const maxTileW = availableWidth / this.gridWidth
        const maxTileH = availableHeight / this.gridHeight

        // Use the smaller dimension
        this.tileSize = Math.floor(Math.min(maxTileW, maxTileH))

        // Center board horizontally
        this.boardOffsetX = (screenW - (this.gridWidth * this.tileSize)) / 2

        // Position board
        this.boardOffsetY = screenH * topMarginPercent
    }

    updateUnitPositionOnResize(unit: any) {
        // Update Scale
        const scale = this.tileSize / 64
        unit.setScale(scale)

        if (unit.getData('onBench')) {
            const slot = unit.getData('slotIndex')
            // Match new Bench Position (0.82 H)
            const startY = this.scale.height * 0.82
            const startX = (this.scale.width - (5 * this.tileSize)) / 2
            unit.x = startX + slot * this.tileSize + this.tileSize / 2
            unit.y = startY
        } else {
            // On Grid
            const gridX = unit.getData('gridX')
            const gridY = unit.getData('gridY')

            if (gridX !== undefined && gridY !== undefined) {
                unit.x = this.boardOffsetX + gridX * this.tileSize + this.tileSize / 2
                unit.y = this.boardOffsetY + gridY * this.tileSize + this.tileSize / 2
            }
        }
    }

    createBoard() {
        // Premium Board Background with gradient effect
        const bgGradient = this.add.graphics()
        const boardCenterX = this.boardOffsetX + (this.gridWidth * this.tileSize) / 2
        const boardCenterY = this.boardOffsetY + (this.gridHeight * this.tileSize) / 2
        const boardWidth = this.gridWidth * this.tileSize
        const boardHeight = this.gridHeight * this.tileSize

        // Outer glow
        bgGradient.lineStyle(6, 0x00d9ff, 0.8)
        bgGradient.strokeRect(
            this.boardOffsetX - 3,
            this.boardOffsetY - 3,
            boardWidth + 6,
            boardHeight + 6
        )

        // Inner background with gradient simulation
        bgGradient.fillStyle(0x0a0a1a, 0.95)
        bgGradient.fillRect(this.boardOffsetX, this.boardOffsetY, boardWidth, boardHeight)
        bgGradient.setDepth(5) // Ensure board background stays below units (default depth often > 0 or sorted)

        this.tiles.add(bgGradient)

        // Draw DIVIDER LINE at middle (y=3)
        const dividerY = this.boardOffsetY + (this.gridHeight / 2) * this.tileSize
        const dividerLine = this.add.graphics()
        dividerLine.lineStyle(3, 0xff0000, 0.8)
        dividerLine.beginPath()
        dividerLine.moveTo(this.boardOffsetX, dividerY)
        dividerLine.lineTo(this.boardOffsetX + boardWidth, dividerY)
        dividerLine.strokePath()
        dividerLine.setDepth(100)
        this.tiles.add(dividerLine)

        // Add zone labels
        const enemyLabel = this.add.text(
            boardCenterX,
            this.boardOffsetY + (this.tileSize * 0.3),
            'ENEMY ZONE',
            { fontSize: '14px', color: '#ff4444', fontStyle: 'bold' }
        ).setOrigin(0.5).setDepth(101)

        const playerLabel = this.add.text(
            boardCenterX,
            this.boardOffsetY + boardHeight - (this.tileSize * 0.3),
            'YOUR ZONE',
            { fontSize: '14px', color: '#44ff44', fontStyle: 'bold' }
        ).setOrigin(0.5).setDepth(101)

        this.tiles.add(enemyLabel)
        this.tiles.add(playerLabel)

        // Create premium grid tiles
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const posX = this.boardOffsetX + x * this.tileSize + this.tileSize / 2
                const posY = this.boardOffsetY + y * this.tileSize + this.tileSize / 2

                // Checkerboard with premium colors + zone tint
                const isEven = (x + y) % 2 === 0
                const isEnemyZone = y < (this.gridHeight / 2)
                const tileGfx = this.add.graphics()

                // Gradient fill colors - tint based on zone
                let color1, color2
                if (isEnemyZone) {
                    color1 = isEven ? 0x2a1e1e : 0x1a0f0f // Red tint for enemy zone
                    color2 = isEven ? 0x3a2525 : 0x2a1e1e
                } else {
                    color1 = isEven ? 0x1e2a1e : 0x0f1a0f // Green tint for player zone
                    color2 = isEven ? 0x253a25 : 0x1e2a1e
                }

                const tileX = posX - (this.tileSize / 2) + 1
                const tileY = posY - (this.tileSize / 2) + 1
                const tileW = this.tileSize - 2
                const tileH = this.tileSize - 2

                // Simulated gradient (top to bottom)
                tileGfx.fillGradientStyle(color1, color1, color2, color2, 1, 1, 1, 1)
                tileGfx.fillRect(tileX, tileY, tileW, tileH)

                // Subtle glowing border
                tileGfx.lineStyle(1, 0x475569, 0.4)
                tileGfx.strokeRect(tileX, tileY, tileW, tileH)
                tileGfx.setDepth(6) // Ensure tiles are above the board background (Depth 5)

                this.tiles.add(tileGfx)
            }
        }
    }

    createBench() {
        // Bench positioning - FIXED PERCENTS
        const benchY = this.scale.height * 0.82
        const benchX = (this.scale.width - (5 * this.tileSize)) / 2

        // Bench background
        const benchBg = this.add.rectangle(
            benchX + (5 * this.tileSize) / 2,
            benchY,
            5 * this.tileSize + 10,
            this.tileSize + 10,
            0x000000,
            0.3
        )
        benchBg.setStrokeStyle(2, 0x9333ea, 1)
        benchBg.setDepth(10)

        // Bench label
        const benchLabel = this.add.text(
            benchX + (5 * this.tileSize) / 2,
            benchY - this.tileSize / 2 - 12,
            'RESERVE',
            {
                fontSize: `${Math.max(12, this.tileSize * 0.2)}px`,
                color: '#9333ea',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5)
        benchLabel.setDepth(11)

        this.tiles.add(benchBg)
        this.tiles.add(benchLabel)

        // Create bench slots
        for (let i = 0; i < 5; i++) {
            const posX = benchX + i * this.tileSize + this.tileSize / 2
            const posY = benchY

            const tile = this.add.rectangle(posX, posY, this.tileSize - 4, this.tileSize - 4, 0x2e1a2e, 0.5)
            tile.setStrokeStyle(1, 0xa855f7, 0.5)
            this.tiles.add(tile)
        }
    }

    // Stats Panel
    statsPanel!: Phaser.GameObjects.Container
    waveProgressText!: Phaser.GameObjects.Text
    armyPowerText!: Phaser.GameObjects.Text
    totalHPText!: Phaser.GameObjects.Text
    nextEnemiesText!: Phaser.GameObjects.Text

    createStatsPanel() {
        const w = this.scale.width
        const h = this.scale.height

        // Position at bottom (0.94)
        const panelY = h * 0.94
        const panelWidth = w * 0.94
        const panelHeight = h * 0.08 // 8% height

        this.statsPanel = this.add.container(w / 2, panelY)
        this.statsPanel.setDepth(999)

        // Background
        const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x0a0a1a, 0.95)
        bg.setStrokeStyle(2, 0x3b82f6, 0.5)
        this.statsPanel.add(bg)

        // Title
        /*
        const title = this.add.text(0, -panelHeight * 0.6, 'BATTLE INFO', {
            fontSize: '10px',
            color: '#60a5fa',
            fontStyle: 'bold'
        }).setOrigin(0.5)
        this.statsPanel.add(title)
        */

        // Stats Grid
        const startX = -panelWidth * 0.4
        const spacing = panelWidth * 0.33
        const fontSize = Math.max(12, h * 0.02)

        // Wave Progress
        this.waveProgressText = this.add.text(startX, 0, 'Wave 1', {
            fontSize: `${fontSize}px`,
            color: '#ffffff'
        }).setOrigin(0, 0.5)

        // Army Power
        this.armyPowerText = this.add.text(startX + spacing, 0, '0', {
            fontSize: `${fontSize}px`,
            color: '#22c55e'
        }).setOrigin(0, 0.5)

        // Total HP
        this.totalHPText = this.add.text(startX + spacing * 2, 0, '0/0', {
            fontSize: `${fontSize}px`,
            color: '#ef4444'
        }).setOrigin(0, 0.5)

        this.statsPanel.add([this.waveProgressText, this.armyPowerText, this.totalHPText])

        this.updateStatsPanel()
    }

    updateStatsPanel() {
        if (!this.statsPanel) return

        // Calculate army stats
        const playerUnits = this.units.getChildren().filter((u: any) => u.active)

        let totalPower = 0
        let currentHP = 0
        let maxHP = 0

        playerUnits.forEach((unit: any) => {
            totalPower += unit.getData('dmg') || 0
            currentHP += unit.getData('hp') || 0
            maxHP += unit.getData('maxHp') || 0
        })

        // Update texts
        this.waveProgressText.setText(`Wave ${this.currentWave}`)
        this.armyPowerText.setText(`${totalPower}`)

        const hpColor = currentHP / maxHP > 0.5 ? '#22c55e' : currentHP / maxHP > 0.25 ? '#eab308' : '#ef4444'
        this.totalHPText.setText(`${currentHP}/${maxHP}`)
        this.totalHPText.setColor(hpColor)
    }

    creditsText!: Phaser.GameObjects.Text

    createUIButtons() {
        const screenW = this.scale.width
        const screenH = this.scale.height

        console.log(`Creating UI Buttons at W:${screenW} H:${screenH}`)

        // Create Shop UI first
        this.createShopUI()

        const hasSeenTutorial = localStorage.getItem('void_tutorial_seen')
        if (!hasSeenTutorial) {
            this.time.delayedCall(500, () => this.showTutorial())
        }

        // POSITION BUTTONS: Between Board (60-ish%) and Bench (82%)
        // Target 72%
        const btnY = screenH * 0.72

        const btnWidth = Math.min(160, screenW * 0.35)
        const btnHeight = Math.min(60, screenH * 0.08)
        const fontSize = Math.min(16, screenW * 0.035)
        const gap = screenW * 0.05

        // BUY UNITS Button (Left)
        const buyBtnX = (screenW / 2) - (btnWidth / 2) - gap

        const buyBtnBg = this.add.rectangle(buyBtnX, btnY, btnWidth, btnHeight, 0x3b82f6, 0.4)
        buyBtnBg.setStrokeStyle(2, 0x60a5fa, 1)
        buyBtnBg.setInteractive({ useHandCursor: true })
        buyBtnBg.setDepth(2000)

        const buyBtnText = this.add.text(buyBtnX, btnY, '🛒 BUY\nUNITS', {
            fontSize: `${fontSize}px`,
            color: '#60a5fa',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5)
        buyBtnText.setDepth(2001)

        buyBtnBg.on('pointerdown', () => {
            if (this.inCombat) return
            this.toggleShop()
        })

        buyBtnBg.on('pointerover', () => {
            buyBtnBg.setFillStyle(0x3b82f6, 0.7)
            this.tweens.add({
                targets: buyBtnBg,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            })
        })

        buyBtnBg.on('pointerout', () => {
            buyBtnBg.setFillStyle(0x3b82f6, 0.4)
            this.tweens.add({
                targets: buyBtnBg,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            })
        })

        // START COMBAT Button (Right) - MATCHING SIZE
        const combatBtnX = (screenW / 2) + (btnWidth / 2) + gap

        const combatBtnBg = this.add.rectangle(combatBtnX, btnY, btnWidth, btnHeight, 0x10b981, 0.9)
        combatBtnBg.setStrokeStyle(3, 0x34d399, 1)
        combatBtnBg.setInteractive({ useHandCursor: true })
        combatBtnBg.setDepth(2000)

        const combatBtnText = this.add.text(combatBtnX, btnY, '⚔️ START\nCOMBAT', {
            fontSize: `${fontSize}px`,
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5)
        combatBtnText.setDepth(2001)

        combatBtnBg.on('pointerdown', () => {
            if (this.inCombat) return
            this.startCombatRound()
        })

        combatBtnBg.on('pointerover', () => {
            combatBtnBg.setFillStyle(0x10b981, 1)
            this.tweens.add({
                targets: combatBtnBg,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            })
        })

        combatBtnBg.on('pointerout', () => {
            combatBtnBg.setFillStyle(0x10b981, 0.9)
            this.tweens.add({
                targets: combatBtnBg,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            })
        })

        // Credits Display (Top right) - Better styling
        this.creditsText = this.add.text(screenW - 20, 60, `CREDITS: ${this.credits}`, {
            fontSize: `${Math.min(20, screenW * 0.045)}px`,
            color: '#60a5fa',
            fontStyle: 'bold'
        }).setOrigin(1, 0)
        this.creditsText.setDepth(1000)
        this.creditsText.setStroke('#000000', 2)
        this.creditsText.setShadow(2, 2, '#000000', 3)

        this.uiGroup.addMultiple([buyBtnBg, buyBtnText, combatBtnBg, combatBtnText, this.creditsText])
    }

    createShopUI() {
        const w = this.scale.width
        const h = this.scale.height

        this.shopContainer = this.add.container(0, 0)
        this.shopContainer.setDepth(5000)
        this.shopContainer.setVisible(false)

        // Background blocker — dark overlay
        const bg = this.add.rectangle(w / 2, h / 2, w, h, 0x050510, 0.95)
        bg.setInteractive()
        this.shopContainer.add(bg)

        // ========== HEADER BAR ==========
        const headerH = Math.max(52, h * 0.07)
        const headerBg = this.add.rectangle(w / 2, headerH / 2, w, headerH, 0x0a0a1e, 1)
        headerBg.setStrokeStyle(1, 0x3b82f6, 0.4)
        this.shopContainer.add(headerBg)

        // Title
        const titleSize = Math.max(16, Math.min(22, w * 0.05))
        const title = this.add.text(16, headerH / 2, 'UNIT ARMORY', {
            fontSize: `${titleSize}px`,
            color: '#e0e0ff',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5)
        this.shopContainer.add(title)

        // Credits display in header
        const creditsSize = Math.max(14, Math.min(18, w * 0.04))
        const shopCreditsText = this.add.text(w - 50, headerH / 2, `${this.credits} CR`, {
            fontSize: `${creditsSize}px`,
            color: '#60a5fa',
            fontStyle: 'bold'
        }).setOrigin(1, 0.5)
        this.shopContainer.add(shopCreditsText)

        // Close X button
        const closeBtnSize = Math.max(28, headerH * 0.5)
        const closeBtn = this.add.rectangle(w - 22, headerH / 2, closeBtnSize, closeBtnSize, 0xff0000, 0.15)
        closeBtn.setStrokeStyle(1, 0xff4444, 0.6)
        closeBtn.setInteractive({ useHandCursor: true })
        const closeX = this.add.text(w - 22, headerH / 2, '✕', {
            fontSize: `${Math.max(14, closeBtnSize * 0.55)}px`,
            color: '#ff4444',
            fontStyle: 'bold'
        }).setOrigin(0.5)
        closeBtn.on('pointerdown', () => this.toggleShop())
        this.shopContainer.add([closeBtn, closeX])

        // ========== SCROLLABLE CARD AREA ==========
        const scrollStartY = headerH + 8
        const scrollAreaH = h - scrollStartY - 10

        // Create scrollable container
        const scrollContainer = this.add.container(0, 0)

        // Scroll mask
        const maskShape = this.make.graphics({})
        maskShape.fillStyle(0xffffff)
        maskShape.fillRect(0, scrollStartY, w, scrollAreaH)
        const mask = maskShape.createGeometryMask()
        scrollContainer.setMask(mask)

        // ========== 2-COLUMN CARD LAYOUT ==========
        const unitTypes = Object.keys(TacticsScene.UnitTypes)
        const cols = 2
        const padding = Math.max(6, w * 0.02)
        const gapX = Math.max(6, w * 0.015)
        const gapY = Math.max(8, h * 0.01)
        const cardW = (w - padding * 2 - gapX) / cols
        const cardH = Math.max(100, h * 0.14)

        // Font sizes — readable on mobile
        const nameSize = Math.max(12, Math.min(15, cardW * 0.11))
        const statSize = Math.max(10, Math.min(12, cardW * 0.085))
        const abilitySize = Math.max(9, Math.min(11, cardW * 0.075))
        const costBadgeSize = Math.max(10, Math.min(13, cardW * 0.09))
        const deploySize = Math.max(10, Math.min(13, cardW * 0.09))
        const traitSize = Math.max(8, Math.min(10, cardW * 0.065))

        const rows = Math.ceil(unitTypes.length / cols)
        const totalContentH = rows * (cardH + gapY) + gapY
        const maxScroll = Math.max(0, totalContentH - scrollAreaH)

        // Touch/drag scroll
        let isDragging = false
        let dragStartY = 0
        let scrollStartPos = 0
        let currentScrollY = 0
        let lastPointerY = 0
        let velocity = 0

        bg.on('pointerdown', (pointer: any) => {
            isDragging = true
            dragStartY = pointer.y
            lastPointerY = pointer.y
            scrollStartPos = currentScrollY
            velocity = 0
        })

        bg.on('pointermove', (pointer: any) => {
            if (isDragging) {
                const delta = dragStartY - pointer.y
                velocity = lastPointerY - pointer.y
                lastPointerY = pointer.y
                currentScrollY = Phaser.Math.Clamp(scrollStartPos + delta, 0, maxScroll)
                scrollContainer.y = -currentScrollY
            }
        })

        bg.on('pointerup', () => {
            isDragging = false
            // Momentum scroll
            if (Math.abs(velocity) > 2) {
                this.tweens.add({
                    targets: { val: currentScrollY },
                    val: Phaser.Math.Clamp(currentScrollY + velocity * 8, 0, maxScroll),
                    duration: 400,
                    ease: 'Cubic.easeOut',
                    onUpdate: (_tween: any, target: any) => {
                        currentScrollY = target.val
                        scrollContainer.y = -currentScrollY
                    }
                })
            }
        })

        bg.on('wheel', (_pointer: any, _gameObjects: any, _deltaX: number, deltaY: number) => {
            currentScrollY += deltaY * 0.3
            currentScrollY = Phaser.Math.Clamp(currentScrollY, 0, maxScroll)
            scrollContainer.y = -currentScrollY
        })

        // ========== RENDER UNIT CARDS ==========
        unitTypes.forEach((type, index) => {
            const data = TacticsScene.UnitTypes[type]
            const col = index % cols
            const row = Math.floor(index / cols)

            const x = padding + col * (cardW + gapX) + cardW / 2
            const y = scrollStartY + gapY + row * (cardH + gapY) + cardH / 2

            const colorHex = `#${data.color.toString(16).padStart(6, '0')}`
            const canAfford = this.credits >= data.cost

            // --- Card background ---
            const cardBg = this.add.rectangle(x, y, cardW, cardH, 0x0d0d20, 0.92)
            cardBg.setStrokeStyle(1.5, data.color, canAfford ? 0.7 : 0.25)

            // Left accent bar
            const accentBar = this.add.rectangle(
                x - cardW / 2 + 2, y, 4, cardH - 4, data.color, 0.9
            )

            // --- Unit name (top-left) ---
            const leftPad = x - cardW / 2 + 14
            const nameText = this.add.text(leftPad, y - cardH * 0.35, data.name.toUpperCase(), {
                fontSize: `${nameSize}px`,
                color: colorHex,
                fontStyle: 'bold'
            }).setOrigin(0, 0.5)

            // --- Cost badge (top-right) ---
            const costX = x + cardW / 2 - 10
            const costBadgeBg = this.add.rectangle(costX - 22, y - cardH * 0.35, 50, 20, 0x000000, 0.6)
            costBadgeBg.setStrokeStyle(1, canAfford ? 0x22c55e : 0x666666, 0.7)
            const costText = this.add.text(costX - 22, y - cardH * 0.35, `${data.cost}`, {
                fontSize: `${costBadgeSize}px`,
                color: canAfford ? '#22c55e' : '#666666',
                fontStyle: 'bold'
            }).setOrigin(0.5)

            // --- Stats row: HP / DMG / RNG ---
            const statsY = y - cardH * 0.1
            const statCol1 = leftPad
            const statColSpacing = cardW * 0.32

            const hpText = this.add.text(statCol1, statsY, `❤️${data.hp}`, {
                fontSize: `${statSize}px`,
                color: '#ef4444'
            }).setOrigin(0, 0.5)

            const dmgText = this.add.text(statCol1 + statColSpacing, statsY, `⚔️${data.dmg}`, {
                fontSize: `${statSize}px`,
                color: '#f59e0b'
            }).setOrigin(0, 0.5)

            const rngText = this.add.text(statCol1 + statColSpacing * 2, statsY, `🎯${data.range}`, {
                fontSize: `${statSize}px`,
                color: '#3b82f6'
            }).setOrigin(0, 0.5)

            // --- Ability line (if exists) ---
            const abilityY = y + cardH * 0.08
            const abilityDesc = this.getAbilityDescription(data.ability)
            let abilityText: Phaser.GameObjects.Text | null = null
            if (abilityDesc) {
                abilityText = this.add.text(leftPad, abilityY, abilityDesc, {
                    fontSize: `${abilitySize}px`,
                    color: '#a78bfa',
                    fontStyle: 'italic',
                    wordWrap: { width: cardW - 24 }
                }).setOrigin(0, 0.5)
            }

            // --- Trait badges ---
            const traitY = y + cardH * 0.25
            const traitElements: Phaser.GameObjects.GameObject[] = []
            const traitColors: Record<string, number> = {
                'Ironclad': 0x3b82f6,
                'Striker': 0xef4444,
                'Arcane': 0x8b5cf6,
                'Sniper': 0xf59e0b
            }
            data.traits.forEach((trait, ti) => {
                const tx = leftPad + ti * (cardW * 0.35)
                const tColor = traitColors[trait] || 0x888888
                const tBg = this.add.rectangle(tx + 20, traitY, 44, 16, tColor, 0.2)
                tBg.setStrokeStyle(1, tColor, 0.5)
                const tText = this.add.text(tx + 20, traitY, trait, {
                    fontSize: `${traitSize}px`,
                    color: `#${tColor.toString(16).padStart(6, '0')}`,
                    fontStyle: 'bold'
                }).setOrigin(0.5)
                traitElements.push(tBg, tText)
            })

            // --- DEPLOY button ---
            const btnY = y + cardH * 0.42
            const btnW = cardW - 16
            const btnH = Math.max(22, cardH * 0.2)
            const deployBg = this.add.rectangle(x, btnY, btnW, btnH,
                canAfford ? data.color : 0x333333,
                canAfford ? 0.25 : 0.15
            )
            deployBg.setStrokeStyle(1, canAfford ? data.color : 0x555555, canAfford ? 0.6 : 0.3)
            deployBg.setInteractive({ useHandCursor: true })

            const deployText = this.add.text(x, btnY, canAfford ? 'DEPLOY' : 'NO CR', {
                fontSize: `${deploySize}px`,
                color: canAfford ? '#ffffff' : '#555555',
                fontStyle: 'bold'
            }).setOrigin(0.5)

            // Deploy click handler
            deployBg.on('pointerdown', () => {
                if (this.credits >= data.cost) {
                    this.credits -= data.cost
                    // Update credits in shop header
                    shopCreditsText.setText(`${this.credits} CR`)

                    window.dispatchEvent(new CustomEvent('update-ui', {
                        detail: { credits: this.credits }
                    }))

                    this.toggleShop()
                    this.buyUnit(type, 'default')

                    // Success feedback
                    const success = this.add.text(this.scale.width / 2, this.scale.height / 2, `✅ ${data.name} DEPLOYED!`, {
                        fontSize: '22px',
                        color: '#00ff00',
                        fontStyle: 'bold'
                    }).setOrigin(0.5).setDepth(10000)

                    this.tweens.add({
                        targets: success,
                        alpha: 0,
                        y: this.scale.height / 2 - 50,
                        duration: 1500,
                        onComplete: () => success.destroy()
                    })
                } else {
                    this.cameras.main.shake(200, 0.01)
                    const error = this.add.text(this.scale.width / 2, this.scale.height / 2, '❌ NOT ENOUGH CREDITS', {
                        fontSize: '20px',
                        color: '#ff4444',
                        fontStyle: 'bold'
                    }).setOrigin(0.5).setDepth(10000)

                    this.tweens.add({
                        targets: error,
                        alpha: 0,
                        duration: 1000,
                        onComplete: () => error.destroy()
                    })
                }
            })

            // Hover effect
            deployBg.on('pointerover', () => {
                if (this.credits >= data.cost) {
                    deployBg.setFillStyle(data.color, 0.45)
                }
            })
            deployBg.on('pointerout', () => {
                const affordable = this.credits >= data.cost
                deployBg.setFillStyle(affordable ? data.color : 0x333333, affordable ? 0.25 : 0.15)
            })

            // Collect all elements into scroll container
            const elements: Phaser.GameObjects.GameObject[] = [
                cardBg, accentBar, nameText, costBadgeBg, costText,
                hpText, dmgText, rngText,
                deployBg, deployText,
                ...traitElements
            ]
            if (abilityText) elements.push(abilityText)
            scrollContainer.add(elements)
        })

        this.shopContainer.add(scrollContainer)
    }

    toggleShop() {
        this.shopContainer.setVisible(!this.shopContainer.visible)
    }

    requestPurchase(type: string, cost: number) {
        // Dispatch to React
        window.dispatchEvent(new CustomEvent('request-buy-unit', {
            detail: { type, cost }
        }))
        // Close shop on purchase? Optional. Let's keep it open for multiple buys.
        // But flash feedback
        const feedback = this.add.text(this.scale.width / 2, this.scale.height - 150, 'PROCESSING...', {
            fontSize: '24px',
            color: '#ffff00'
        }).setOrigin(0.5).setDepth(6000)

        this.tweens.add({
            targets: feedback,
            alpha: 0,
            y: this.scale.height - 200,
            duration: 1000,
            onComplete: () => feedback.destroy()
        })
    }

    buyUnit(type: string, skin: string = 'default') {
        const slotIndex = this.benchSlots.findIndex(slot => slot === null)
        if (slotIndex === -1) {
            this.cameras.main.shake(100, 0.01)
            return
        }

        const data = TacticsScene.UnitTypes[type]
        console.log('Attempting to buy unit:', type, data)

        if (!data) {
            console.error('Unit type definition not found for:', type)
            return
        }

        // Visuals
        const unit = this.add.container(0, 0)

        // Use new drawer
        this.drawUnitShape(unit, type, data.color, skin)

        // HP Bar - upgraded with gradient
        const hpBg = this.add.graphics()
        hpBg.fillStyle(0x000000, 0.7)
        hpBg.fillRoundedRect(-20, -34, 40, 5, 2)
        hpBg.lineStyle(1, 0x555555, 0.8)
        hpBg.strokeRoundedRect(-20, -34, 40, 5, 2)

        // Create gradient effect for HP fill (simulate with multiple bars)
        const hpFill = this.add.graphics()
        hpFill.fillGradientStyle(0x00ff00, 0x00ff00, 0x00dd00, 0x00dd00, 1, 1, 0.8, 0.8)
        hpFill.fillRoundedRect(-20, -34, 40, 5, 2)

        unit.add([hpBg, hpFill])
        unit.setData('hpBar', hpFill)

        unit.setSize(48, 48)
        unit.setInteractive({ draggable: true })
        this.children.bringToTop(unit)

        // Update stats panel
        this.updateStatsPanel()
        unit.setData('type', type)
        unit.setData('stats', { ...data })
        unit.setData('hp', data.hp)
        unit.setData('maxHp', data.hp)
        unit.setData('dmg', data.dmg)
        unit.setData('range', data.range)
        unit.setData('nextAttack', 0)
        unit.setData('attackDelay', 1000)
        unit.setData('skin', skin)
        unit.setData('starLevel', 1)

        // Scale based on tile size
        unit.setScale(this.tileSize / 64)

        // Set depth to ensure unit is visible above board background (depth 5-6) and bench (depth 10)
        unit.setDepth(500) // Same depth as enemy units for consistency

        // Position on Bench
        const startY = this.scale.height - (this.tileSize * 2.5)
        const startX = (this.scale.width - (5 * this.tileSize)) / 2
        const posX = startX + slotIndex * this.tileSize + this.tileSize / 2

        unit.setPosition(posX, startY)
        unit.setData('onBench', true)
        unit.setData('slotIndex', slotIndex)

        this.benchSlots[slotIndex] = unit
        this.units.add(unit)

        // Check for merge
        this.time.delayedCall(100, () => this.checkForMerge(type, 1))
    }

    snapToGrid(unit: any) {
        const localX = unit.x - this.boardOffsetX
        const localY = unit.y - this.boardOffsetY

        const gridX = Math.floor(localX / this.tileSize)
        const gridY = Math.floor(localY / this.tileSize)

        // RESTRICTION: Player units can only be placed in BOTTOM HALF (y >= 3)
        const minPlayerY = Math.floor(this.gridHeight / 2) // Row 3 for 6-row grid

        // Check bounds AND zone restriction
        if (gridX >= 0 && gridX < this.gridWidth && gridY >= minPlayerY && gridY < this.gridHeight) {
            // Valid Board Position in Player Zone
            unit.x = this.boardOffsetX + gridX * this.tileSize + this.tileSize / 2
            unit.y = this.boardOffsetY + gridY * this.tileSize + this.tileSize / 2

            unit.setData('onBench', false)
            // Store grid pos
            unit.setData('gridX', gridX)
            unit.setData('gridY', gridY)

            // Update Synergies immediately when placing unit
            this.calculateSynergies()
        } else {
            // Invalid position OR wrong zone - Return to Bench
            const slotIndex = unit.getData('slotIndex')
            this.returnToBench(unit, slotIndex !== undefined ? slotIndex : 0)

            // Flash feedback if trying to place in enemy zone
            if (gridY < minPlayerY && gridX >= 0 && gridX < this.gridWidth) {
                this.cameras.main.shake(100, 0.005)
            }
        }
    }

    returnToBench(unit: any, slotIndex: number) {
        const startY = this.scale.height - (this.tileSize * 2.5)
        const startX = (this.scale.width - (5 * this.tileSize)) / 2
        const posX = startX + slotIndex * this.tileSize + this.tileSize / 2
        unit.x = posX
        unit.y = startY
        unit.setData('onBench', true)
        this.benchSlots[slotIndex] = unit
    }



    drawUnitShape(container: Phaser.GameObjects.Container, type: string, baseColor: number, skin: string = 'default', starLevel: number = 1) {
        try {
            // Get unit data
            const unitData = TacticsScene.UnitTypes[type as keyof typeof TacticsScene.UnitTypes]
            this.log(`DrawUnit: ${type}, Data: ${!!unitData}`)

            // Fallback color
            const color = baseColor || unitData?.color || 0xffffff

            let glowColor = color
            let glowAlpha = 0.9

            // Star Level Visuals
            if (starLevel === 2) {
                glowColor = 0xc0c0c0 // Silver
                glowAlpha = 0.95
            } else if (starLevel === 3) {
                glowColor = 0xffd700 // Gold
                glowAlpha = 1.0
            }

            if (skin === 'gold') {
                glowColor = 0xffd700
                glowAlpha = 0.95
            } else if (skin === 'void') {
                glowColor = 0xbd00ff
                glowAlpha = 0.9
            }

            // Create glow circle (larger outer ring)
            const outerGlow = this.add.graphics()
            outerGlow.lineStyle(3 + (starLevel * 1), glowColor, glowAlpha * 0.5)
            outerGlow.strokeCircle(0, 0, 32 + (starLevel * 2))
            container.add(outerGlow)

            // Create inner glow
            const innerGlow = this.add.graphics()
            innerGlow.lineStyle(2, glowColor, glowAlpha * 0.8)
            innerGlow.strokeCircle(0, 0, 28)
            container.add(innerGlow)

            // Determine which texture to use based on unit type
            let textureKey = 'unit_tank' // default
            if (type === 'tank' || type === 'fortress') {
                textureKey = 'unit_tank'
            } else if (type === 'assassin' || type === 'bladedancer') {
                textureKey = 'unit_assassin'
            } else if (type === 'ranger' || type === 'sniper') {
                textureKey = 'unit_ranger'
            } else if (type === 'mage' || type === 'electro' || type === 'necro') {
                textureKey = 'unit_mage'
            } else if (type === 'healer' || type === 'paladin') {
                textureKey = 'unit_healer'
            } else if (type === 'warrior') {
                textureKey = 'unit_warrior'
            }

            // Create sprite with icon
            const iconSprite = this.add.sprite(0, 0, textureKey)
            iconSprite.setDisplaySize(50, 50) // Scale to fit circle
            iconSprite.setOrigin(0.5)

            // Add tint based on skin
            if (skin === 'gold') {
                iconSprite.setTint(0xffd700)
            } else if (skin === 'void') {
                iconSprite.setTint(0xbd00ff)
            }

            container.add(iconSprite)

            // Add Star Indicators
            if (starLevel > 1) {
                const stars = '★'.repeat(starLevel)
                const starText = this.add.text(0, -35, stars, {
                    fontSize: '14px',
                    stroke: '#000000',
                    strokeThickness: 3
                }).setOrigin(0.5)
                container.add(starText)
            }

            // Store sprite reference for later animations
            container.setData('sprite', iconSprite)
            container.setData('glows', [outerGlow, innerGlow])

        } catch (e: any) {
            this.log(`Error DrawUnit: ${e.message}`)
            console.error(e)
            // Emergency fallback - use old emoji system
            const fallbackData = TacticsScene.UnitTypes[type as keyof typeof TacticsScene.UnitTypes]
            const emoji = fallbackData?.icon || '❓'
            const fallbackText = this.add.text(0, 0, emoji, {
                fontSize: '42px',
                fontStyle: 'bold'
            }).setOrigin(0.5)
            fallbackText.setStroke('#000000', 2)
            container.add(fallbackText)
        }
    }

    log(msg: string) {
        this.debugLogs.push(msg)
        if (this.debugLogs.length > 5) this.debugLogs.shift()
        console.log('[TacticsScene]', msg)
    }

    startCombatRound() {
        if (this.inCombat) return
        this.inCombat = true
        // Wave counter: increment AFTER using for spawn so wave 1 = first combat
        this.currentWave++

        // Calculate Synergies before combat
        this.calculateSynergies()

        // Update stats panel for new wave
        this.updateStatsPanel()
        // Reset stats
        this.combatStats = {
            damageDealt: 0,
            unitsLost: 0,
            enemiesKilled: 0
        }

        this.enemyUnits.clear(true, true)

        if (this.isPvP) {
            this.spawnPvPOpponent()
        } else {
            // Spawn enemies based on wave (PROGRESSIVE SCALING)
            const baseEnemyCount = 2
            // REBALANCED: Gentler scaling for early waves — 0.5 per wave instead of 0.8
            const enemyCount = Math.floor(baseEnemyCount + (this.currentWave * 0.5))
            // REBALANCED: Gentler stat scaling (was 0.04 / 0.02)
            const hpMultiplier = 1 + (this.currentWave * 0.03)
            const dmgMultiplier = 1 + (this.currentWave * 0.015)

            // More variety in later waves
            const availableTypes = ['tank', 'ranger', 'assassin']
            if (this.currentWave >= 5) availableTypes.push('warrior', 'mage')
            if (this.currentWave >= 10) availableTypes.push('healer')

            // Boss every 8 waves (moved from 5 to give players time to build army)
            if (this.currentWave % 8 === 0) {
                this.spawnBoss()
            }

            for (let i = 0; i < enemyCount; i++) {
                const type = availableTypes[Math.floor(Math.random() * availableTypes.length)]
                const gridX = Math.floor(Math.random() * this.gridWidth)
                const gridY = Math.floor(Math.random() * (this.gridHeight / 2)) // Top half
                this.spawnEnemy(type, gridX, gridY, hpMultiplier, dmgMultiplier)
            }
        }

        // Reset player units — PARTIAL HEALING between rounds (40% of lost HP)
        this.units.getChildren().forEach((u: any) => {
            // Skip dead units - they stay dead
            if (!u.active) return

            u.setData('target', null)
            u.setData('nextAttack', 0)

            // Heal 40% of lost HP between rounds (balances difficulty)
            const currentHp = u.getData('hp')
            const maxHp = u.getData('maxHp')
            if (currentHp < maxHp) {
                const lostHp = maxHp - currentHp
                const healAmount = Math.floor(lostHp * 0.4)
                const newHp = Math.min(maxHp, currentHp + healAmount)
                u.setData('hp', newHp)

                // Update HP bar visual
                const hpFill = u.getData('hpBar') as Phaser.GameObjects.Graphics
                if (hpFill) {
                    const hpPercent = Math.max(0, newHp / maxHp)
                    hpFill.clear()
                    if (hpPercent > 0) {
                        let color1 = 0x00ff00
                        let color2 = 0x00dd00
                        if (hpPercent < 0.3) { color1 = 0xff0000; color2 = 0xdd0000 }
                        else if (hpPercent < 0.6) { color1 = 0xffaa00; color2 = 0xdd8800 }
                        hpFill.fillGradientStyle(color1, color1, color2, color2, 1, 1, 0.8, 0.8)
                        hpFill.fillRoundedRect(-20, -34, 40 * hpPercent, 5, 2)
                    }
                }
            }

            // Reset visuals
            u.setAlpha(1)
            u.angle = 0
            const targetScale = this.tileSize / 64
            u.setScale(targetScale)
            u.setVisible(true)
        })
    }

    spawnEnemy(type: string, gridX: number, gridY: number, hpMult: number = 1.0, dmgMult: number = 1.0) {
        // Fallback for generic enemy spawn
        this.spawnGhostUnit(type, gridX, gridY, 1, hpMult, dmgMult)
    }

    spawnPvPOpponent() {
        // Show Opponent Name
        const nameText = this.add.text(this.scale.width / 2, this.boardOffsetY - 30, `VS ${this.pvpOpponentName}`, {
            fontSize: '20px',
            color: '#ff4444',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2000)

        this.tweens.add({
            targets: nameText,
            alpha: 0,
            duration: 3000,
            delay: 1000,
            onComplete: () => nameText.destroy()
        })

        // Select a random team template
        const template = TacticsScene.GhostTeams[Math.floor(Math.random() * TacticsScene.GhostTeams.length)]
        console.log(`Spawning Ghost Team: ${template.name}`)

        // Difficulty scaling for PvP (simulates stronger opponents at higher waves)
        const waveScaling = 1 + (this.currentWave * 0.1)

        template.units.forEach(u => {
            // Adjust star level based on wave?
            // For now, use template star level
            let star = u.star
            if (this.currentWave > 5 && Math.random() < 0.3) star += 1
            if (this.currentWave > 10) star = Math.max(star, 2)
            if (star > 3) star = 3

            this.spawnGhostUnit(u.type, u.x, u.y, star, waveScaling, waveScaling)
        })
    }

    spawnGhostUnit(type: string, gridX: number, gridY: number, starLevel: number = 1, hpMult: number = 1.0, dmgMult: number = 1.0) {
        const data = TacticsScene.UnitTypes[type]
        if (!data) return

        const unit = this.add.container(0, 0)

        // Use new drawer with star level support
        this.drawUnitShape(unit, type, 0xff0000, 'default', starLevel)

        // HP Bar - enemy version with red gradient
        const hpBg = this.add.graphics()
        hpBg.fillStyle(0x000000, 0.7)
        hpBg.fillRoundedRect(-20, -34, 40, 5, 2)
        hpBg.lineStyle(1, 0x555555, 0.8)
        hpBg.strokeRoundedRect(-20, -34, 40, 5, 2)

        const hpFill = this.add.graphics()
        hpFill.fillGradientStyle(0xff0000, 0xff0000, 0xdd0000, 0xdd0000, 1, 1, 0.8, 0.8)
        hpFill.fillRoundedRect(-20, -34, 40, 5, 2)

        unit.add([hpBg, hpFill])
        unit.setData('hpBar', hpFill)

        unit.setSize(48, 48)
        unit.setData('type', type)
        unit.setData('isEnemy', true)

        // Star Level Scaling
        const starMult = Math.pow(1.8, starLevel - 1)

        // PROGRESSIVE SCALING
        const enemyHP = Math.floor(data.hp * starMult * hpMult)
        const enemyDMG = Math.floor(data.dmg * starMult * dmgMult)

        unit.setData('hp', enemyHP)
        unit.setData('maxHp', enemyHP)
        unit.setData('dmg', enemyDMG)
        unit.setData('range', data.range)
        unit.setData('nextAttack', 0)
        unit.setData('attackDelay', 1000)
        unit.setData('gridX', gridX)
        unit.setData('gridY', gridY)
        unit.setData('starLevel', starLevel)

        // Scale unit
        unit.setScale(this.tileSize / 64)
        unit.setDepth(500)

        // Position
        unit.x = this.boardOffsetX + gridX * this.tileSize + this.tileSize / 2
        unit.y = this.boardOffsetY + gridY * this.tileSize + this.tileSize / 2

        this.enemyUnits.add(unit)
    }

    spawnBoss() {
        // Boss is a buffed version of a random unit type
        const bossTypes = ['tank', 'warrior', 'mage']
        const bossType = bossTypes[Math.floor(Math.random() * bossTypes.length)]

        const centerX = Math.floor(this.gridWidth / 2)
        const centerY = 1

        // Boss has buffed HP and DMG (on top of wave multipliers)
        // REBALANCED: Gentler boss scaling
        const waveHpMult = 1 + (this.currentWave * 0.08)
        const waveDmgMult = 1 + (this.currentWave * 0.04)

        // REBALANCED: Reduced boss multiplier (was 2.5x/1.5x → 2.0x/1.3x)
        this.spawnEnemy(bossType, centerX, centerY, waveHpMult * 2.0, waveDmgMult * 1.3)

        // Get the boss that was just spawned and mark it
        const allEnemies = this.enemyUnits.getChildren()
        const boss = allEnemies[allEnemies.length - 1] as any

        if (boss) {
            boss.setData('isBoss', true)
            // Make boss visually larger
            const currentScale = boss.scaleX
            boss.setScale(currentScale * 1.4)

            // Add boss crown emoji above HP bar
            const crown = this.add.text(0, -50, '👑', {
                fontSize: '24px'
            }).setOrigin(0.5)
            boss.add(crown)

            // Add pulsing glow effect for boss
            const bossGlow = this.add.circle(0, 0, 50, 0xff0000, 0.2)
            bossGlow.setStrokeStyle(2, 0xff0000, 0.5)
            boss.addAt(bossGlow, 0) // Add behind other elements

            this.tweens.add({
                targets: bossGlow,
                scaleX: 1.2,
                scaleY: 1.2,
                alpha: 0.1,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            })
        }
    }

    update(time: number, delta: number) {
        if (!this.inCombat) return

        // Process player units
        this.units.getChildren().forEach((unit: any) => {
            if (!unit.active || unit.getData('onBench')) return

            // Process special abilities
            this.processAbilities(unit, time)

            // Normal AI
            this.processUnitAI(unit, this.enemyUnits.getChildren(), time)
        })

        // Process enemy units
        this.enemyUnits.getChildren().forEach((unit: any) => {
            if (!unit.active) return
            this.processUnitAI(unit, this.units.getChildren(), time)
        })

        const playerAlive = this.units.getChildren().filter((u: any) => u.active && !u.getData('onBench')).length
        const enemyAlive = this.enemyUnits.getChildren().filter((u: any) => u.active).length

        if (this.inCombat) {
            if (playerAlive === 0) {
                this.inCombat = false
                this.endRound(false)
            } else if (enemyAlive === 0) {
                this.inCombat = false
                this.endRound(true)
            }
        }
    }

    processAbilities(unit: any, time: number) {
        const unitType = unit.getData('type')
        const ability = TacticsScene.UnitTypes[unitType]?.ability

        if (!ability) return

        // Healer: Heal nearby allies every 3 seconds
        if (ability === 'heal') {
            const lastHeal = unit.getData('lastHeal') || 0

            // Visual pulse every 1s
            const lastPulse = unit.getData('lastPulse') || 0
            if (time - lastPulse > 1000) {
                const pulse = this.add.circle(unit.x, unit.y, 20, 0x00ff00, 0.3)
                this.tweens.add({
                    targets: pulse,
                    scale: 2,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => pulse.destroy()
                })
                unit.setData('lastPulse', time)
            }

            if (time - lastHeal > 3000) {
                this.healNearbyAllies(unit)
                unit.setData('lastHeal', time)
            }
        }

        // Warrior: Taunt Aura Visual
        if (ability === 'taunt') {
            if (!unit.getData('tauntAura')) {
                const aura = this.add.circle(0, 0, 40, 0xff0000, 0.1)
                aura.setStrokeStyle(1, 0xff0000, 0.3)
                unit.add(aura)
                unit.setData('tauntAura', true)

                this.tweens.add({
                    targets: aura,
                    scale: 1.2,
                    alpha: 0,
                    duration: 2000,
                    repeat: -1
                })
            }
        }
    }

    healNearbyAllies(healer: any) {
        const healRange = 2 // Grid cells
        const healAmount = 50
        const healerGridX = healer.getData('gridX')
        const healerGridY = healer.getData('gridY')

        this.units.getChildren().forEach((ally: any) => {
            if (!ally.active || ally === healer || ally.getData('onBench')) return

            const allyGridX = ally.getData('gridX')
            const allyGridY = ally.getData('gridY')
            const dist = Math.abs(allyGridX - healerGridX) + Math.abs(allyGridY - healerGridY)

            if (dist <= healRange) {
                const currentHp = ally.getData('hp')
                const maxHp = ally.getData('maxHp')
                const newHp = Math.min(maxHp, currentHp + healAmount)
                ally.setData('hp', newHp)

                // Update HP bar
                const hpFill = ally.getData('hpBar') as Phaser.GameObjects.Graphics
                if (hpFill) {
                    const hpPercent = Math.max(0, newHp / maxHp)
                    const isEnemy = ally.getData('isEnemy')

                    hpFill.clear()
                    if (hpPercent > 0) {
                        let color1 = isEnemy ? 0xff0000 : 0x00ff00
                        let color2 = isEnemy ? 0xdd0000 : 0x00dd00

                        if (hpPercent < 0.3) {
                            color1 = 0xff0000
                            color2 = 0xdd0000
                        } else if (hpPercent < 0.6) {
                            color1 = 0xffaa00
                            color2 = 0xdd8800
                        }

                        hpFill.fillGradientStyle(color1, color1, color2, color2, 1, 1, 0.8, 0.8)
                        hpFill.fillRoundedRect(-20, -34, 40 * hpPercent, 5, 2)
                    }
                }

                // Visual feedback - green particles
                for (let i = 0; i < 5; i++) {
                    const particle = this.add.circle(ally.x, ally.y, 3, 0x00ff00, 0.8)
                    this.tweens.add({
                        targets: particle,
                        y: ally.y - 20,
                        x: ally.x + Phaser.Math.Between(-10, 10),
                        alpha: 0,
                        duration: 800,
                        onComplete: () => particle.destroy()
                    })
                }
            }
        })
    }

    processUnitAI(unit: any, targets: any[], time: number) {
        if (!unit.active) return

        let target = unit.getData('target')
        const isEnemy = unit.getData('isEnemy')

        // If current target is invalid or doesn't exist, find a new one
        if (!target || !target.active) {
            // Find new target - prioritize Warriors (taunt ability) if enemy
            let minDist = 999999
            let nearest: any = null
            let warriorTarget: any = null

            targets.forEach((t: any) => {
                if (!t.active || t.getData('onBench')) return
                const dist = Phaser.Math.Distance.Between(unit.x, unit.y, t.x, t.y)

                // Check if this is a warrior
                if (t.getData('type') === 'warrior' && dist < this.tileSize * 5) { // Warriors have a "taunt" range
                    if (!warriorTarget || dist < Phaser.Math.Distance.Between(unit.x, unit.y, warriorTarget.x, warriorTarget.y)) {
                        warriorTarget = t
                    }
                }

                // Track nearest anyway
                if (dist < minDist) {
                    minDist = dist
                    nearest = t
                }
            })

            // Prefer warrior if enemy unit (taunt ability)
            if (isEnemy && warriorTarget) {
                target = warriorTarget
                unit.setData('target', warriorTarget)
            } else if (nearest) {
                target = nearest
                unit.setData('target', nearest)
            } else {
                return // No valid targets found
            }
        }

        const dist = Phaser.Math.Distance.Between(unit.x, unit.y, target.x, target.y)
        const range = unit.getData('range') * this.tileSize * 0.7

        if (dist <= range) {
            if (time > unit.getData('nextAttack')) {
                this.attack(unit, target)

                // Attack Speed Calculation
                const attackSpeed = unit.getData('attackDelay') || 1000
                unit.setData('nextAttack', time + attackSpeed)
            }
        } else {
            // Move toward target
            const angle = Phaser.Math.Angle.Between(unit.x, unit.y, target.x, target.y)
            const speed = 2
            let newX = unit.x + Math.cos(angle) * speed
            let newY = unit.y + Math.sin(angle) * speed

            // Enforce board boundaries ONLY (units CAN cross red line during combat!)
            newX = Phaser.Math.Clamp(newX, this.boardOffsetX + 10,
                this.boardOffsetX + (this.gridWidth * this.tileSize) - 10)
            newY = Phaser.Math.Clamp(newY, this.boardOffsetY + 10,
                this.boardOffsetY + (this.gridHeight * this.tileSize) - 10)

            unit.x = newX
            unit.y = newY
        }
    }

    attack(attacker: any, target: any) {
        if (!target.active || !attacker.active) return

        const type = attacker.getData('type')
        const skin = attacker.getData('skin')

        // Ranged Attack (Ranger)
        if (type === 'ranger') {
            const projectile = this.add.circle(attacker.x, attacker.y, 4, 0xffff00)
            this.tweens.add({
                targets: projectile,
                x: target.x,
                y: target.y,
                duration: 200,
                onComplete: () => {
                    projectile.destroy()
                    if (target.active) this.applyDamage(attacker, target)
                }
            })
            return
        }

        // Melee Attack (Lunge)
        const angle = Phaser.Math.Angle.Between(attacker.x, attacker.y, target.x, target.y)
        const offsetX = Math.cos(angle) * 20
        const offsetY = Math.sin(angle) * 20

        this.tweens.add({
            targets: attacker,
            x: attacker.x + offsetX,
            y: attacker.y + offsetY,
            duration: 100,
            yoyo: true,
            ease: 'Power1',
            onYoyo: () => {
                // Hit at the apex of the lunge
                if (target.active) this.applyDamage(attacker, target)
            }
        })
    }

    applyDamage(attacker: any, target: any) {
        // Hit Flash
        if (target instanceof Phaser.GameObjects.Container) {
            const gfx = target.list[0] as Phaser.GameObjects.Graphics // Assuming gfx is first
            if (gfx) {
                // Blink
                this.tweens.add({
                    targets: gfx,
                    alpha: 0.2, // Flash transparent or white overlay?
                    // Better: Tint if it was sprite, but for Graphics we can scale or alpha.
                    // Let's just create a hit spark.
                    duration: 50,
                    yoyo: true
                })
            }

            // Create Hit Effect
            const spark = this.add.circle(target.x, target.y, 10, 0xffffff)
            this.tweens.add({
                targets: spark,
                scale: 0,
                alpha: 0,
                duration: 200,
                onComplete: () => spark.destroy()
            })
        }

        // === ABILITY: EVASION (Bladedancer) ===
        const defenderAbility = target.getData('ability')
        if (defenderAbility === 'evasion') {
            const dodgeChance = target.getData('abilityValue') || 0
            if (Math.random() < dodgeChance) {
                // MISS! Show visual
                const missText = this.add.text(target.x, target.y - 40, 'MISS!', {
                    fontSize: '20px',
                    color: '#ffff00',
                    fontStyle: 'bold'
                }).setOrigin(0.5)
                this.tweens.add({
                    targets: missText,
                    y: target.y - 80,
                    alpha: 0,
                    duration: 800,
                    onComplete: () => missText.destroy()
                })
                return // No damage dealt
            }
        }

        // Damage Calculation with Abilities
        let dmg = attacker.getData('dmg')

        // === SYNERGY: ARCANE (Bonus Magic Dmg) ===
        // Only if attacker is Player Unit (Synergies only for player for now)
        if (!attacker.getData('isEnemy') && this.activeSynergies['Arcane']) {
            const arcaneUnits = TacticsScene.UnitTypes[attacker.getData('type')]?.traits.includes('Arcane')
            if (arcaneUnits) {
                dmg *= (1 + this.activeSynergies['Arcane'])
            }
        }

        // === ABILITY: FIRST SHOT CRIT (Sniper) ===
        const attackerAbility = attacker.getData('ability')
        let isCrit = false

        if (attackerAbility === 'first_shot_crit') {
            const hasNotAttacked = !attacker.getData('hasAttacked')
            if (hasNotAttacked) {
                const critMult = attacker.getData('abilityValue') || 2.0
                dmg *= critMult
                attacker.setData('hasAttacked', true)
                isCrit = true
            }
        }

        // === SYNERGY: STRIKER (Crit Dmg) ===
        if (!attacker.getData('isEnemy') && this.activeSynergies['Striker']) {
            const strikerUnits = TacticsScene.UnitTypes[attacker.getData('type')]?.traits.includes('Striker')
            if (strikerUnits) {
                // Base crit chance? Let's say Strikers always crit on every 3rd attack or just flat bonus
                // Simplified: Strikers have 25% crit chance by default? 
                // Or just modify Crit Damage if they Crit.
                // Let's implement: Strikers have 30% chance to Crit for Base Crit Dmg + Synergy Bonus
                if (Math.random() < 0.30) {
                    isCrit = true
                    const bonusCritDmg = this.activeSynergies['Striker'] // e.g. 0.5 (+50%)
                    dmg *= (1.5 + bonusCritDmg) // Base 1.5x crit + bonus
                }
            }
        }

        if (isCrit) {
            // CRIT visual
            const critText = this.add.text(target.x, target.y - 40, 'CRIT!', {
                fontSize: '24px',
                color: '#ff0000',
                fontStyle: 'bold'
            }).setOrigin(0.5)
            this.tweens.add({
                targets: critText,
                y: target.y - 80,
                alpha: 0,
                scale: 1.5,
                duration: 800,
                onComplete: () => critText.destroy()
            })
        }

        // === ABILITY: AURA DMG (Paladin) ===
        // Check if attacker has nearby Paladin ally
        const allies = attacker.getData('isEnemy') ? this.enemyUnits : this.units
        allies.getChildren().forEach((ally: any) => {
            if (!ally.active || ally === attacker) return
            const allyAbility = ally.getData('ability')
            if (allyAbility === 'aura_dmg') {
                const dist = Phaser.Math.Distance.Between(attacker.x, attacker.y, ally.x, ally.y)
                if (dist < this.tileSize * 2.5) { // Within range 2
                    const auraBonus = ally.getData('abilityValue') || 0
                    dmg *= (1 + auraBonus)
                }
            }
        })

        // === ABILITY: TANK REDUCE (Fortress) ===
        if (defenderAbility === 'tank_reduce') {
            const reduction = target.getData('abilityValue') || 0
            dmg *= (1 - reduction)
        }

        // === SYNERGY: IRONCLAD (Damage Reduction) ===
        if (!target.getData('isEnemy') && this.activeSynergies['Ironclad']) {
            const ironcladUnits = TacticsScene.UnitTypes[target.getData('type')]?.traits.includes('Ironclad')
            if (ironcladUnits) {
                const reduction = this.activeSynergies['Ironclad']
                dmg *= (1 - reduction)
            }
        }

        dmg = Math.floor(dmg) // Round damage

        let hp = target.getData('hp')
        hp -= dmg
        target.setData('hp', hp)

        // Track damage dealt
        if (!attacker.getData('isEnemy')) {
            this.combatStats.damageDealt += dmg
        }

        // Update HP Bar (now using Graphics)
        const maxHp = target.getData('maxHp')
        const hpFill = target.getData('hpBar') as Phaser.GameObjects.Graphics

        if (hpFill) {
            const hpPercent = Math.max(0, hp / maxHp)
            const isEnemy = target.getData('isEnemy')

            // Clear and redraw gradient HP bar
            hpFill.clear()
            if (hpPercent > 0) {
                // Color based on HP percentage and team
                let color1 = isEnemy ? 0xff0000 : 0x00ff00
                let color2 = isEnemy ? 0xdd0000 : 0x00dd00

                if (hpPercent < 0.3) {
                    color1 = 0xff0000
                    color2 = 0xdd0000
                } else if (hpPercent < 0.6) {
                    color1 = 0xffaa00
                    color2 = 0xdd8800
                }

                hpFill.fillGradientStyle(color1, color1, color2, color2, 1, 1, 0.8, 0.8)
                hpFill.fillRoundedRect(-20, -34, 40 * hpPercent, 5, 2)
            }
        }

        if (hp <= 0) {
            this.killUnit(target, attacker)
        }

        // === ABILITY: CHAIN LIGHTNING (Electro) ===
        if (attackerAbility === 'chain_lightning' && !attacker.getData('isEnemy')) {
            this.chainLightning(attacker, target) // New implementation for Electro
        }

        // Mage ability: Lightning chain to nearby enemies (old mage ability)
        const attackerType = attacker.getData('type')
        if (attackerType === 'mage' && !attacker.getData('isEnemy')) {
            this.lightningChain(attacker, target)
        }
    }

    // Chain Lightning for Electro (improved version)
    chainLightning(attacker: any, primaryTarget: any) {
        const chainCount = attacker.getData('abilityValue') || 3
        const enemies = this.enemyUnits.getChildren().filter((e: any) => {
            if (!e.active || e === primaryTarget) return false
            const dist = Phaser.Math.Distance.Between(e.x, e.y, primaryTarget.x, primaryTarget.y)
            return dist < this.tileSize * 4
        })

        const chainTargets = enemies.slice(0, chainCount - 1) // -1 because primary already hit

        chainTargets.forEach((enemy: any, index: number) => {
            const line = this.add.line(0, 0, primaryTarget.x, primaryTarget.y, enemy.x, enemy.y, 0x00e5ff, 1)
            line.setLineWidth(3)
            line.setDepth(1000)

            this.tweens.add({
                targets: line,
                alpha: 0,
                duration: 400,
                onComplete: () => line.destroy()
            })

            setTimeout(() => {
                if (enemy.active) {
                    const chainDmg = Math.floor(attacker.getData('dmg') * 0.6) // 60% damage
                    let hp = enemy.getData('hp')
                    hp -= chainDmg
                    enemy.setData('hp', hp)

                    if (!attacker.getData('isEnemy')) {
                        this.combatStats.damageDealt += chainDmg
                    }

                    const hpFill = enemy.getData('hpBar') as Phaser.GameObjects.Graphics
                    if (hpFill) {
                        const maxHp = enemy.getData('maxHp')
                        const hpPercent = Math.max(0, hp / maxHp)
                        hpFill.clear()
                        if (hpPercent > 0) {
                            hpFill.fillGradientStyle(0xff0000, 0xff0000, 0xdd0000, 0xdd0000, 1, 1, 0.8, 0.8)
                            hpFill.fillRoundedRect(-20, -34, 40 * hpPercent, 5, 2)
                        }
                    }

                    if (hp <= 0) {
                        this.killUnit(enemy, attacker)
                    }
                }
            }, 100 + index * 100)
        })
    }

    lightningChain(mage: any, primaryTarget: any) {
        // Find nearby enemies (not the primary target)
        const enemies = this.enemyUnits.getChildren().filter((e: any) => {
            if (!e.active || e === primaryTarget) return false
            const dist = Phaser.Math.Distance.Between(e.x, e.y, primaryTarget.x, primaryTarget.y)
            return dist < this.tileSize * 3 // Within 3 tiles
        })

        // Chain to max 2 nearby enemies
        const chainTargets = enemies.slice(0, 2)

        chainTargets.forEach((enemy: any, index: number) => {
            // Visual lightning effect
            const line = this.add.line(0, 0, primaryTarget.x, primaryTarget.y, enemy.x, enemy.y, 0x8b5cf6, 1)
            line.setLineWidth(2)
            line.setDepth(1000)

            this.tweens.add({
                targets: line,
                alpha: 0,
                duration: 300,
                onComplete: () => line.destroy()
            })

            // Reduced damage (50% of mage's damage)
            setTimeout(() => {
                if (enemy.active) {
                    const chainDmg = Math.floor(mage.getData('dmg') * 0.5)
                    let hp = enemy.getData('hp')
                    hp -= chainDmg
                    enemy.setData('hp', hp)

                    // Track damage
                    if (!mage.getData('isEnemy')) {
                        this.combatStats.damageDealt += chainDmg
                    }

                    // Update HP bar
                    const hpFill = enemy.list.find((c: any) => (c.fillColor === 0xff0000 || c.fillColor === 0x00ff00) && c.width <= 40) as Phaser.GameObjects.Rectangle
                    if (hpFill) {
                        const maxHp = enemy.getData('maxHp')
                        hpFill.width = 40 * Math.max(0, (hp / maxHp))
                    }

                    if (hp <= 0) {
                        this.killUnit(enemy, mage)
                    }
                }
            }, 100 + index * 100) // Stagger the chain hits
        })
    }

    killUnit(unit: any, killedBy?: any) {
        if (!unit.active) return

        // Track stats
        if (unit.getData('isEnemy')) {
            this.combatStats.enemiesKilled++

            // Item Drop Chance (10%)
            if (Math.random() < 0.10) {
                this.spawnItemDrop(unit.x, unit.y)
            }

            // === ABILITY: SUMMON (Necromancer) ===
            if (killedBy) {
                const killerAbility = killedBy.getData('ability')
                if (killerAbility === 'summon' && !killedBy.getData('isEnemy')) {
                    const summonChance = killedBy.getData('abilityValue') || 0.30
                    if (Math.random() < summonChance) {
                        // Spawn zombie at dead enemy location
                        setTimeout(() => {
                            this.spawnPlayerZombie(unit.x, unit.y)
                        }, 500)
                    }
                }
            }
        } else {
            this.combatStats.unitsLost++
        }

        unit.setActive(false)

        this.tweens.add({
            targets: unit,
            alpha: 0,
            scale: 0,
            angle: 90,
            duration: 500,
            onComplete: () => {
                unit.setVisible(false)
                unit.y = -1000
            }
        })
    }

    // Spawn zombie helper for Necromancer
    spawnPlayerZombie(x: number, y: number) {
        const unit = this.add.container(x, y)

        // Visual
        const gfx = this.add.graphics()
        gfx.fillStyle(0x4a148c, 1)
        gfx.fillCircle(0, 0, this.tileSize / 2.5)
        unit.add(gfx)

        const icon = this.add.text(0, 0, '🧟', {
            fontSize: `${this.tileSize * 0.5}px`
        }).setOrigin(0.5)
        unit.add(icon)

        // HP Bar
        const hpBar = this.add.graphics()
        hpBar.fillGradientStyle(0x00ff00, 0x00ff00, 0x00dd00, 0x00dd00, 1, 1, 0.8, 0.8)
        hpBar.fillRoundedRect(-20, -34, 40, 5, 2)
        unit.add(hpBar)

        // Setup data
        unit.setData('hp', 200)
        unit.setData('maxHp', 200)
        unit.setData('dmg', 50)
        unit.setData('range', 1)
        unit.setData('target', null)
        unit.setData('nextAttack', 0)
        unit.setData('attackDelay', 1000)
        unit.setData('isEnemy', false)
        unit.setData('type', 'zombie')
        unit.setData('hpBar', hpBar)
        unit.setDepth(500) // Zombie needs depth too

        this.units.add(unit)

        // Spawn animation
        unit.setAlpha(0)
        unit.setScale(0)
        this.tweens.add({
            targets: unit,
            alpha: 1,
            scale: this.tileSize / 64,
            duration: 500
        })
    }

    endRound(win: boolean) {
        // Calculate credits earned (if victory) - BUFFED for better progression
        const baseReward = 80 // Buffed from 60
        const waveBonus = this.currentWave * 30 // Buffed from 25
        const bossBonus = (this.currentWave % 8 === 0) ? 250 : 0 // Boss every 8 waves now

        // INTEREST MECHANIC
        // 10% of current gold, max 50 gold (at 500 held)
        const interest = Math.min(50, Math.floor(this.credits * 0.10))

        let creditsEarned = win ? (baseReward + waveBonus + bossBonus) : 0
        creditsEarned += interest // You get interest even on loss? Usually yes.

        // UPDATE CREDITS IN PHASER (FIX!)
        this.credits += creditsEarned

        // Update display
        if (this.creditsText) {
            this.creditsText.setText(`CREDITS: ${this.credits}`)
        }
        // Sync to React
        window.dispatchEvent(new CustomEvent('update-ui', {
            detail: { credits: this.credits }
        }))

        // Emit combat-end event to React
        window.dispatchEvent(new CustomEvent('combat-end', {
            detail: {
                victory: win,
                wave: this.currentWave,
                creditsEarned,
                stats: {
                    ...this.combatStats
                }
            }
        }))

        // Show visual feedback with credits gained
        const mainText = this.add.text(this.scale.width / 2, this.scale.height / 2,
            win ? 'VICTORY!' : 'DEFEAT', {
            fontSize: '64px',
            color: win ? '#00ff00' : '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2000)

        const creditsText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 60,
            `+${creditsEarned} CREDITS\n(${interest} Interest)`, {
            fontSize: '32px',
            color: '#ffd700',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5).setDepth(2000)

        this.tweens.add({
            targets: [mainText, creditsText],
            scale: 1.5,
            alpha: 0,
            duration: 1500,
            onComplete: () => {
                mainText.destroy()
                creditsText.destroy()
            }
        })
    }

    // === HELPER FUNCTIONS ===

    getAbilityDescription(ability?: string): string {
        const descriptions: Record<string, string> = {
            'evasion': 'EVASION: 25% dodge chance',
            'tank_reduce': 'TANK: -30% damage taken',
            'first_shot_crit': 'SNIPER: 2x damage first shot',
            'chain_lightning': 'ELECTRO: Hit 3 enemies',
            'aura_dmg': 'AURA: +20% ally damage in range 2',
            'summon': 'NECRO: 30% spawn zombie on kill',
            'heal': 'HEALER: Heal nearby allies'
        }
        return ability ? descriptions[ability] || '' : ''
    }

    calculateSynergies() {
        // Count active unique units per trait
        const traitCounts: Record<string, Set<string>> = {}
        const playerUnits = this.units.getChildren().filter((u: any) => u.active && !u.getData('onBench'))

        // Reset Stats that are modified by Synergies (like Range)
        playerUnits.forEach((unit: any) => {
            const type = unit.getData('type')
            const baseRange = TacticsScene.UnitTypes[type].range
            unit.setData('range', baseRange)

            // Collect traits
            const unitTraits = TacticsScene.UnitTypes[type]?.traits || []
            unitTraits.forEach(trait => {
                if (!traitCounts[trait]) traitCounts[trait] = new Set()
                traitCounts[trait].add(type)
            })
        })

        // Apply bonuses
        this.activeSynergies = {}

        Object.keys(traitCounts).forEach(trait => {
            const count = traitCounts[trait].size
            const traitDef = TacticsScene.Traits[trait]
            if (!traitDef) return

            // Find highest active level
            let activeLevel: any = null
            traitDef.levels.forEach(level => {
                if (count >= level.count) {
                    activeLevel = level
                }
            })

            if (activeLevel) {
                this.activeSynergies[trait] = activeLevel.value
                console.log(`Active Synergy: ${trait} (${count}) - ${activeLevel.bonus}`)

                // Apply Range Bonus immediately for Snipers
                if (trait === 'Sniper') {
                    playerUnits.forEach((u: any) => {
                        const type = u.getData('type')
                        const traits = TacticsScene.UnitTypes[type]?.traits || []

                        if (traits.includes('Sniper')) {
                            const baseRange = TacticsScene.UnitTypes[type].range
                            u.setData('range', baseRange + activeLevel.value)
                        }
                    })
                }
            }
        })

        this.updateSynergyUI(traitCounts)
    }

    createSynergyUI() {
        this.synergyUI = this.add.container(20, 100)
        this.synergyUI.setDepth(1000)
        this.uiGroup.add(this.synergyUI)
    }

    updateSynergyUI(traitCounts: Record<string, Set<string>>) {
        if (!this.synergyUI) return
        this.synergyUI.removeAll(true)

        let yPos = 0
        Object.keys(TacticsScene.Traits).forEach(trait => {
            const count = traitCounts[trait] ? traitCounts[trait].size : 0
            if (count === 0) return

            const def = TacticsScene.Traits[trait]
            // Check if active
            let isActive = false
            let nextBreak = def.levels[0].count
            let currentBonus = ""

            for (const level of def.levels) {
                if (count >= level.count) {
                    isActive = true
                    currentBonus = level.bonus
                } else {
                    nextBreak = level.count
                    break
                }
            }

            const color = isActive ? '#00ff00' : '#888888'
            const text = `${def.name}: ${count}/${nextBreak} ${isActive ? `(${currentBonus})` : ''}`

            const t = this.add.text(0, yPos, text, {
                fontSize: '14px',
                color: color,
                stroke: '#000000',
                strokeThickness: 2
            })

            this.synergyUI.add(t)
            yPos += 20
        })
    }

    showTutorial() {
        const w = this.scale.width
        const h = this.scale.height

        const tutorialBg = this.add.rectangle(w / 2, h / 2, w * 0.9, h * 0.8, 0x000000, 0.95)
        tutorialBg.setDepth(9000)
        tutorialBg.setStrokeStyle(3, 0x00ffff)

        const tutorialText = this.add.text(w / 2, h / 2, `
🎮 VOID TACTICS TUTORIAL

1️⃣ BUY UNITS - Click "BUY UNITS" to open armory
2️⃣ DEPLOY - Drag units from bench to bottom half of board
3️⃣ START COMBAT - Press "START COMBAT" when ready
4️⃣ SURVIVE - Units have PERMANENT HP!
   Dead units stay dead - buy replacements!
5️⃣ UPGRADE - Earn credits and buy stronger units

💡 TIP: Try Fortress (tank) + Sniper (backline DPS)!
💡 Hover over units in shop to see abilities!

Click anywhere to start...
        `, {
            fontSize: '16px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5).setDepth(9001)

        tutorialBg.setInteractive()
        tutorialBg.once('pointerdown', () => {
            tutorialBg.destroy()
            tutorialText.destroy()
            localStorage.setItem('void_tutorial_seen', 'true')
        })
    }

    showHint(text: string, duration: number = 3000) {
        const hint = this.add.text(
            this.scale.width / 2,
            this.scale.height * 0.15,
            text,
            {
                fontSize: '20px',
                color: '#ffff00',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setDepth(8000)

        this.tweens.add({
            targets: hint,
            alpha: 0,
            y: this.scale.height * 0.1,
            duration: duration,
            onComplete: () => hint.destroy()
        })
    }

    checkForMerge(type: string, level: number) {
        if (level >= 3) return // Max level

        const candidates = this.units.getChildren().filter((u: any) =>
            u.active &&
            u.getData('type') === type &&
            u.getData('starLevel') === level
        )

        if (candidates.length >= 3) {
            console.log(`MERGE TRIGGERED: ${type} Level ${level} -> ${level + 1}`)
            const unitsToMerge = candidates.slice(0, 3)

            // Prioritize unit on board as anchor
            const anchor = unitsToMerge.find((u: any) => !u.getData('onBench')) || unitsToMerge[0]

            const anchorContainer = anchor as Phaser.GameObjects.Container
            const newX = anchorContainer.x
            const newY = anchorContainer.y
            const wasOnBench = anchor.getData('onBench')
            const slotIndex = anchor.getData('slotIndex')
            const gridX = anchor.getData('gridX')
            const gridY = anchor.getData('gridY')
            const skin = anchor.getData('skin')

            // Collect items from all 3 units
            let accumulatedItems: string[] = []
            unitsToMerge.forEach((u: any) => {
                const items = u.getData('items') || []
                accumulatedItems = accumulatedItems.concat(items)
            })

            // Keep first 3 items, return excess to inventory
            const keptItems = accumulatedItems.slice(0, 3)
            const returnedItems = accumulatedItems.slice(3)

            if (returnedItems.length > 0) {
                this.inventory = this.inventory.concat(returnedItems)
                this.updateInventoryUI()
                this.showHint(`${returnedItems.length} items returned to inventory`)
            }

            // Visual merge effect
            this.spawnMergeEffect(newX, newY)

            // Remove old units
            unitsToMerge.forEach((u: any) => {
                if (u.getData('onBench')) {
                    const idx = u.getData('slotIndex')
                    if (idx !== undefined && this.benchSlots[idx] === u) {
                        this.benchSlots[idx] = null
                    }
                }
                u.destroy()
            })

            // Create upgraded unit
            this.spawnMergedUnit(type, level + 1, newX, newY, wasOnBench, slotIndex, gridX, gridY, skin, keptItems)

            // Check for next level merge
            this.time.delayedCall(500, () => this.checkForMerge(type, level + 1))
        }
    }

    spawnMergedUnit(type: string, level: number, x: number, y: number, onBench: boolean, slotIndex: number, gridX: number, gridY: number, skin: string, items: string[] = []) {
        const data = TacticsScene.UnitTypes[type]
        const unit = this.add.container(x, y)

        this.drawUnitShape(unit, type, data.color, skin, level)

        // HP Bar
        const hpBg = this.add.graphics()
        hpBg.fillStyle(0x000000, 0.7)
        hpBg.fillRoundedRect(-20, -34, 40, 5, 2)
        hpBg.lineStyle(1, 0x555555, 0.8)
        hpBg.strokeRoundedRect(-20, -34, 40, 5, 2)

        const hpFill = this.add.graphics()
        hpFill.fillGradientStyle(0x00ff00, 0x00ff00, 0x00dd00, 0x00dd00, 1, 1, 0.8, 0.8)
        hpFill.fillRoundedRect(-20, -34, 40, 5, 2)

        unit.add([hpBg, hpFill])
        unit.setData('hpBar', hpFill)

        unit.setSize(48, 48)
        unit.setInteractive({ draggable: true })
        unit.setDepth(500) // Ensure unit is above board/bench but below items/UI

        // STATS SCALING FOR STAR LEVEL
        const starMult = Math.pow(1.8, level - 1) // 1.8x stats per star
        const maxHp = Math.floor(data.hp * starMult)
        const dmg = Math.floor(data.dmg * starMult)

        unit.setData('type', type)
        unit.setData('hp', maxHp)
        unit.setData('maxHp', maxHp)
        unit.setData('dmg', dmg)
        unit.setData('range', data.range)
        unit.setData('starLevel', level)
        unit.setData('skin', skin)
        unit.setData('attackDelay', 1000)

        // Re-equip items to apply stats
        unit.setData('items', []) // Reset first
        items.forEach(itemKey => {
            const itemDef = TacticsScene.ItemTypes[itemKey]
            const currentItems = unit.getData('items')
            currentItems.push(itemKey)
            unit.setData('items', currentItems)

            // Apply stats
            this.applyItemStats(unit, itemDef)
        })
        this.updateUnitItemVisuals(unit)

        unit.setScale(this.tileSize / 64)

        if (onBench) {
            unit.setData('onBench', true)
            unit.setData('slotIndex', slotIndex)
            if (slotIndex !== undefined) this.benchSlots[slotIndex] = unit
        } else {
            unit.setData('onBench', false)
            unit.setData('gridX', gridX)
            unit.setData('gridY', gridY)
            // Re-snap to ensure correct positioning
            this.snapToGrid(unit)
        }

        this.units.add(unit)
        this.updateStatsPanel()
        this.calculateSynergies()

        // Sound/Visual
        this.cameras.main.shake(100, 0.005)
        const txt = this.add.text(x, y - 60, 'UPGRADE!', {
            fontSize: '24px',
            color: '#ffd700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5)

        this.tweens.add({
            targets: txt,
            y: y - 100,
            alpha: 0,
            duration: 1500,
            onComplete: () => txt.destroy()
        })
    }

    spawnMergeEffect(x: number, y: number) {
        const burst = this.add.circle(x, y, 10, 0xffffff, 1)
        this.tweens.add({
            targets: burst,
            scale: 5,
            alpha: 0,
            duration: 300,
            onComplete: () => burst.destroy()
        })
    }

    spawnItemDrop(x: number, y: number) {
        // Random item
        const keys = Object.keys(TacticsScene.ItemTypes)
        const itemType = keys[Math.floor(Math.random() * keys.length)]

        const orb = this.add.container(x, y)
        const bg = this.add.circle(0, 0, 16, 0xffd700)
        bg.setStrokeStyle(2, 0xffffff)

        const icon = this.add.text(0, 0, '🎁', { fontSize: '20px' }).setOrigin(0.5)

        orb.add([bg, icon])
        orb.setSize(40, 40) // Add hit area for interaction
        orb.setInteractive({ useHandCursor: true })
        orb.setDepth(1500) // High depth to ensure it stays above board/units

        // Float animation
        this.tweens.add({
            targets: orb,
            y: y - 10,
            yoyo: true,
            repeat: -1,
            duration: 1000
        })

        orb.on('pointerdown', () => {
            this.inventory.push(itemType)
            this.updateInventoryUI()

            // Collect Effect
            this.tweens.add({
                targets: orb,
                y: y - 50,
                alpha: 0,
                duration: 500,
                onComplete: () => orb.destroy()
            })

            this.showHint(`Picked up: ${TacticsScene.ItemTypes[itemType].name}!`)
        })

        this.children.bringToTop(orb)
    }

    createInventoryUI() {
        // Inventory panel on right side
        const x = this.scale.width - 50
        const startY = 150

        // Panel background
        const panelBg = this.add.rectangle(x, startY - 10, 56, 30, 0x1a1a2e, 0.9)
        panelBg.setStrokeStyle(1, 0x8b5cf6, 0.5)
        panelBg.setDepth(1999)
        this.inventoryUI.add(panelBg)

        const label = this.add.text(x, startY - 10, '🎒 ITEMS', { fontSize: '10px', color: '#c4b5fd', fontStyle: 'bold' }).setOrigin(0.5).setDepth(2000)
        this.inventoryUI.add(label)

        // Initial Draw
        this.updateInventoryUI()
    }

    updateInventoryUI() {
        // Clear old items (except label and panel bg)
        this.inventoryUI.getChildren().forEach((child: any) => {
            if (child.type === 'Container') child.destroy()
        })

        const x = this.scale.width - 55
        const startY = 175
        const size = 52
        const gap = 12

        this.inventory.forEach((itemKey, index) => {
            const y = startY + (index * (size + gap))
            const itemDef = TacticsScene.ItemTypes[itemKey]
            if (!itemDef) return

            const itemSlot = this.add.container(x, y)
            itemSlot.setDepth(2000)

            // Glassmorphism background
            const bg = this.add.rectangle(0, 0, size, size, 0x1a1a2e, 0.8)
            bg.setStrokeStyle(2, 0x8b5cf6, 0.8)
            
            // Add a subtle glow behind icon
            const glow = this.add.circle(0, 0, size/2.5, 0x8b5cf6, 0.15)

            // Item icon - now larger
            const icon = this.add.text(0, -6, itemDef.icon, { fontSize: '26px' }).setOrigin(0.5)

            // Bonus label below icon - now more readable
            const bonusLabel = this.add.text(0, 18, itemDef.bonus, {
                fontSize: '10px',
                color: itemDef.type === 'dmg' ? '#fbbf24' : itemDef.type === 'hp' ? '#4ade80' : '#60a5fa',
                fontStyle: 'bold',
                backgroundColor: 'rgba(0,0,0,0.4)',
                padding: { x: 4, y: 1 }
            }).setOrigin(0.5)

            // Drag hint
            const dragHint = this.add.text(0, size / 2 + 8, 'DRAG→UNIT', {
                fontSize: '7px',
                color: '#666',
            }).setOrigin(0.5)

            itemSlot.add([bg, icon, bonusLabel, dragHint])
            itemSlot.setSize(size, size)
            itemSlot.setInteractive({ draggable: true, useHandCursor: true })
            this.inventoryUI.add(itemSlot)

            itemSlot.setData('itemKey', itemKey)
            itemSlot.setData('originalX', x)
            itemSlot.setData('originalY', y)

            // Drag logic for equipping
            this.input.setDraggable(itemSlot)

            itemSlot.on('dragstart', () => {
                this.children.bringToTop(itemSlot)
                bg.setStrokeStyle(2, 0xffd700, 1)
                dragHint.setVisible(false)
            })

            itemSlot.on('drag', (_pointer: any, dragX: number, dragY: number) => {
                itemSlot.x = dragX
                itemSlot.y = dragY
                
                // Ensure stay above
                itemSlot.setDepth(3000)

                // Highlight and Magnetic Snap Logic
                let nearestUnit: any = null
                let minDist = 80 // Increased magnet range

                const units = this.units.getChildren().filter((u: any) => u.active)
                units.forEach((u: any) => {
                    const dist = Phaser.Math.Distance.Between(itemSlot.x, itemSlot.y, u.x, u.y)
                    const glows = u.getData('glows')
                    
                    if (dist < minDist) {
                        nearestUnit = u
                        minDist = dist
                    }

                    if (glows && glows[0]) {
                        if (dist < 80) {
                            glows[0].setStrokeStyle(4, 0xffffff, 0.9)
                            glows[0].setScale(1.1)
                        } else {
                            const unitData = TacticsScene.UnitTypes[u.getData('type')]
                            glows[0].setStrokeStyle(2, unitData?.color || 0x666666, 0.6)
                            glows[0].setScale(1.0)
                        }
                    }
                })

                // Visual snap hint
                if (nearestUnit) {
                    bg.setStrokeStyle(3, 0x00ffff, 1)
                } else {
                    bg.setStrokeStyle(2, 0xffd700, 1)
                }
            })

            itemSlot.on('dragend', () => {
                // Reset unit highlights
                this.units.getChildren().forEach((u: any) => {
                    const glows = u.getData('glows')
                    if (glows && glows[0]) {
                        const unitData = TacticsScene.UnitTypes[u.getData('type')]
                        glows[0].setStrokeStyle(2, unitData?.color || 0x666666, 0.6)
                        glows[0].setScale(1.0)
                    }
                })

                // Check overlap with units
                let equipped = false
                const units = this.units.getChildren().filter((u: any) => u.active)

                for (const unit of units) {
                    const u = unit as Phaser.GameObjects.Container
                    // INCREASED RANGE TO 80 for much better UX
                    if (Phaser.Math.Distance.Between(itemSlot.x, itemSlot.y, u.x, u.y) < 80) {
                        this.equipItem(unit, itemKey, index)
                        
                        // "Wow" Equip Effect
                        ParticleEffects.createSparkles(this, u.x, u.y, 0x8b5cf6)
                        this.cameras.main.shake(100, 0.005)
                        
                        equipped = true
                        break
                    }
                }

                if (equipped) {
                    itemSlot.destroy()
                } else {
                    // Return to slot with smooth animation
                    this.tweens.add({
                        targets: itemSlot,
                        x: itemSlot.getData('originalX'),
                        y: itemSlot.getData('originalY'),
                        duration: 200,
                        ease: 'Back.easeOut'
                    })
                    bg.setStrokeStyle(2, 0x8b5cf6, 0.7)
                    dragHint.setVisible(true)
                }
            })
        })
    }

    applyItemStats(unit: any, itemDef: any) {
        if (itemDef.type === 'hp') {
            const maxHp = unit.getData('maxHp') + itemDef.value
            unit.setData('maxHp', maxHp)
            unit.setData('hp', unit.getData('hp') + itemDef.value)
        } else if (itemDef.type === 'dmg') {
            const dmg = unit.getData('dmg') + itemDef.value
            unit.setData('dmg', dmg)
        } else if (itemDef.type === 'as') {
            const currentDelay = unit.getData('attackDelay') || 1000
            unit.setData('attackDelay', currentDelay * (1 - itemDef.value))
        }
    }

    equipItem(unit: any, itemKey: string, inventoryIndex: number) {
        // Remove from inventory
        this.inventory.splice(inventoryIndex, 1)
        this.updateInventoryUI()

        // Add to unit
        const items = unit.getData('items') || []
        if (items.length >= 3) {
            this.showHint('Unit inventory full!')
            this.inventory.push(itemKey) // Return item
            this.updateInventoryUI()
            return
        }

        items.push(itemKey)
        unit.setData('items', items)

        // Apply stats immediately
        const itemDef = TacticsScene.ItemTypes[itemKey]
        this.applyItemStats(unit, itemDef)

        this.showHint(`Equipped ${itemDef.name}!`)

        // Visual indicator on unit
        this.updateUnitItemVisuals(unit)
    }

    updateUnitItemVisuals(unit: any) {
        // Tiny icons above unit
        const items = unit.getData('items') || []

        // Clear old visuals
        unit.each((child: any) => {
            if (child.name === 'itemIcon') child.destroy()
        })

        items.forEach((key: string, idx: number) => {
            const def = TacticsScene.ItemTypes[key]
            const icon = this.add.text((idx - 1) * 15, -45, def.icon, { fontSize: '12px' }).setOrigin(0.5)
            icon.setName('itemIcon')
            unit.add(icon)
        })
    }
}

