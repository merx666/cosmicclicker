// Shop catalog - all purchasable items
export interface ShopItem {
    id: string
    name: string
    description: string
    type: 'tower' | 'consumable' | 'skin' | 'boost' | 'bundle'
    price: number // in WLD
    priceParticles?: number // NEW: in Particles
    icon?: string
    permanent: boolean
    quantity?: number
    stats?: {
        damage?: number
        range?: number
        fireRate?: number
        special?: string
    }
}

export const SHOP_CATALOG: ShopItem[] = [
    // --- PREMIUM ITEMS ---
    {
        id: 'boss_killer_turret',
        name: 'Boss Destroyer',
        description: 'Deals 500% damage to bosses. Essential for Wave 15+.',
        type: 'tower',
        price: 1.50,
        permanent: true,
        stats: { damage: 150, range: 400, special: 'boss_killer' }
    },
    {
        id: 'auto_targeter',
        name: 'Smart AI Targeting',
        description: 'Turrets auto-target weakest enemies to clear waves faster.',
        type: 'tower',
        price: 0.80,
        permanent: true
    },
    {
        id: 'double_credits_permanent',
        name: '💰 Credit Doubler (LIFETIME)',
        description: 'Earn 2x credits forever. Best value.',
        type: 'boost',
        price: 5.00,
        permanent: true
    },

    // --- CONSUMABLES (High Margin) ---
    {
        id: 'revive_token',
        name: '❤️ Revive Token',
        description: 'Continue from where you died with 50% HP.',
        type: 'consumable',
        price: 0.25,
        permanent: false
    },
    {
        id: 'mega_nuke',
        name: '☢️ Mega Nuke (5 uses)',
        description: 'Clear screen 5 times. Save for emergencies.',
        type: 'consumable',
        price: 0.50,
        permanent: false,
        quantity: 5
    },
    {
        id: 'energy_refill',
        name: 'Instant Energy',
        description: 'Refill energy to MAX immediately.',
        type: 'consumable',
        price: 0.15,
        permanent: false
    },

    // --- TOWERS ---
    {
        id: 'sniper_turret',
        name: 'Sniper Turret',
        description: 'Long range, high damage, slow fire rate',
        type: 'tower',
        price: 0.60,
        permanent: true,
        stats: { damage: 50, range: 500, fireRate: 2000 }
    },
    {
        id: 'tesla_turret',
        name: 'Tesla Turret',
        description: 'Chain lightning damage to 3 enemies',
        type: 'tower',
        price: 0.80,
        permanent: true,
        stats: { damage: 30, range: 300, special: 'chain_3' }
    },
    {
        id: 'shield_generator',
        name: '🛡️ Shield Generator',
        description: 'Protects bastion, absorbs 5 hits',
        type: 'tower',
        price: 1.00,
        permanent: true,
        stats: { special: 'shield_5_hits' }
    },
    {
        id: 'flamethrower',
        name: '🔥 Flamethrower',
        description: 'Area damage, burns enemies',
        type: 'tower',
        price: 0.90,
        permanent: true,
        stats: { damage: 20, range: 200, special: 'area_damage' }
    },
    {
        id: 'nuke_wave',
        name: '💣 Nuke Wave',
        description: 'Instantly destroy all enemies on screen',
        type: 'consumable',
        price: 0.20,
        permanent: false
    },
    {
        id: 'wave_skip',
        name: '⏭️ Wave Skip',
        description: 'Skip current wave, gain 200 credits',
        type: 'consumable',
        price: 0.20,
        permanent: false
    },
    {
        id: 'emergency_shield',
        name: '🛡️ Emergency Shield',
        description: '+50% health instantly',
        type: 'consumable',
        price: 0.25,
        permanent: false
    },
    {
        id: 'credit_boost',
        name: '🔋 Credit Boost',
        description: '2x credits for 5 waves',
        type: 'boost',
        price: 0.40,
        permanent: false
    },
    {
        id: 'click_multiplier_500',
        name: '💥 Void Surge',
        description: '+500% siły kliknięć na 3 minuty',
        type: 'boost',
        price: 0.15,
        priceParticles: 120000,
        permanent: false
    },

    // Skins
    {
        id: 'bastion_crystal',
        name: '💎 Crystal Bastion',
        description: 'Shimmering crystal skin',
        type: 'skin',
        price: 2.00,
        permanent: true
    },
    {
        id: 'bastion_gold',
        name: '🏆 Golden Bastion',
        description: 'Luxurious gold plated',
        type: 'skin',
        price: 3.50,
        permanent: true
    },
    {
        id: 'bastion_dark',
        name: '🌑 Dark Matter Bastion',
        description: 'Mysterious dark energy',
        type: 'skin',
        price: 5.00,
        permanent: true
    },

    // Bundles
    {
        id: 'starter_pack',
        name: '🚀 First Time Offer',
        description: 'Sniper + Wave Skip + Credit Boost + 500 Credits. 75% OFF!',
        type: 'bundle',
        price: 1.50,
        permanent: true,
    },
    {
        id: 'premium_bundle',
        name: '🎁 Premium Bundle',
        description: 'All towers + all skins + 1000 credits',
        type: 'bundle',
        price: 12.00,
        permanent: true
    }
]

// Daily streak rewards - escalating
// milestone = special animation, shieldReward = grants 1 free skip, legendary = mega chest
export const STREAK_REWARDS = [
    { day: 1, credits: 10 },
    { day: 2, credits: 15 },
    { day: 3, credits: 20 },
    { day: 4, credits: 20 },
    { day: 5, credits: 25 },
    { day: 6, credits: 25 },
    { day: 7, credits: 50, special: true, milestone: true, shieldReward: true },
    { day: 8, credits: 30 },
    { day: 9, credits: 30 },
    { day: 10, credits: 35 },
    { day: 11, credits: 40 },
    { day: 12, credits: 45 },
    { day: 13, credits: 50 },
    { day: 14, credits: 100, special: true, milestone: true, legendary: true },
]

// Difficulty multipliers
// AGGRESSIVE MONETIZATION TWEAK: Harder start, lower rewards for Easy/Normal
export const DIFFICULTY_LEVELS = {
    easy: {
        name: 'Easy',
        startCredits: 150,
        health: 300,
        creditMultiplier: 0.3,
        enemyHealth: 1.2,
        enemySpeed: 0.8,
        spawnRate: 1.2,
        enemiesPerWave: 6
    },
    normal: {
        name: 'Normal',
        startCredits: 100,
        health: 100,
        creditMultiplier: 0.5,
        enemyHealth: 1.6,
        enemySpeed: 1.0,
        spawnRate: 1.0,
        enemiesPerWave: 10
    },
    hard: {
        name: 'Hard',
        startCredits: 50,
        health: 50,
        creditMultiplier: 0.8,
        enemyHealth: 2.5,
        enemySpeed: 1.2,
        spawnRate: 0.8,
        enemiesPerWave: 15
    },
    insane: {
        name: 'Insane (Premium)',
        startCredits: 30,
        health: 30,
        creditMultiplier: 1.2,
        enemyHealth: 3.5,
        enemySpeed: 1.5,
        spawnRate: 0.6,
        enemiesPerWave: 20,
        requiresPremium: true
    }
}
