// In-Game Power-Ups Configuration
export interface PowerUp {
    id: string
    name: string
    description: string
    price: number // WLD
    icon: string
    duration?: number // waves, if temporary
}

export const POWER_UPS: PowerUp[] = [
    {
        id: 'double_damage',
        name: '2x Damage',
        description: 'Double turret damage for 3 waves',
        price: 0.1,
        icon: '⚔️',
        duration: 3
    },
    {
        id: 'shield',
        name: 'Shield',
        description: 'Absorb next 5 hits',
        price: 0.15,
        icon: '🛡️'
    },
    {
        id: 'nuke',
        name: 'Nuke',
        description: 'Destroy all enemies instantly',
        price: 0.1,
        icon: '💣'
    },
    {
        id: 'premium_turret',
        name: 'Premium Turret',
        description: 'Unlock 2x damage turrets (permanent)',
        price: 0.3,
        icon: '🎯'
    },
    {
        id: 'revive',
        name: 'Revive',
        description: 'Continue from death with 50% HP',
        price: 0.2,
        icon: '❤️'
    }
]
