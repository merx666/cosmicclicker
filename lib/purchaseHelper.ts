import { query, queryOne, transaction } from './db'
import { SHOP_CATALOG } from './gameEconomy'

export const PREMIUM_ITEMS = [
    { id: 'particle_skin_rainbow', name: 'Rainbow Particle', price: 0.13, type: 'skin', permanent: true },
    { id: 'particle_skin_gold', name: 'Golden Particle', price: 0.19, type: 'skin', permanent: true },
    { id: 'background_nebula', name: 'Nebula Theme', price: 0.15, type: 'skin', permanent: true },
    { id: 'background_galaxy', name: 'Galaxy Theme', price: 0.23, type: 'skin', permanent: true },
    { id: 'lucky_particle', name: 'Lucky Particle', price: 0.19, type: 'boost', permanent: true },
    { id: 'offline_earnings', name: 'Offline Earnings', price: 0.25, type: 'boost', permanent: true },
    { id: 'daily_bonus', name: 'Daily Bonus', price: 0.35, type: 'boost', permanent: true },
    { id: 'vip', name: 'VIP Status', price: 5.00, type: 'boost', permanent: true },
    { id: 'vip_tier_1', name: 'Bronze VIP', price: 1.75, type: 'boost', permanent: true },
    { id: 'vip_tier_2', name: 'Silver VIP', price: 2.75, type: 'boost', permanent: true },
    { id: 'vip_tier_3', name: 'Gold VIP', price: 3.75, type: 'boost', permanent: true },
    { id: 'vip_tier_4', name: 'Platinum VIP', price: 5.00, type: 'boost', permanent: true },
    { id: 'prediction_bet', name: 'Prediction Bet', price: 0.15, type: 'minigame', permanent: false },
    { id: 'wheel_spin_small', name: 'Wheel Small Spin', price: 0.45, type: 'minigame', permanent: false },
    { id: 'wheel_spin_big', name: 'Wheel Big Spin', price: 1.50, type: 'minigame', permanent: false },
    { id: 'void_core_multiplier', name: 'Void Core Multiplier', price: 5.00, type: 'premium_upgrade', permanent: true },
    { id: 'overclocked_drone', name: 'Overclocked Drone', price: 10.00, type: 'premium_upgrade', permanent: true }
]

interface GrantPurchaseResult {
    success: boolean
    alreadyProcessed?: boolean
    error?: string
    item?: {
        id: string
        name: string
        type: string
    }
}

export async function grantPurchase(
    userId: string,
    itemId: string,
    priceInCurrency: number,
    currency: string,
    transactionHash: string | null
): Promise<GrantPurchaseResult> {
    try {
        // 1. Check if transaction has already been processed (if transactionHash is provided)
        if (transactionHash) {
            const existingPurchase = await queryOne(
                'SELECT id FROM purchases WHERE transaction_hash = $1',
                [transactionHash]
            )
            if (existingPurchase) {
                console.log(`[Purchase Helper] Transaction ${transactionHash} already processed. Skipping.`)
                return { success: true, alreadyProcessed: true }
            }
        }

        // 2. Find item in catalog
        const item = (SHOP_CATALOG.find(i => i.id === itemId) || PREMIUM_ITEMS.find(i => i.id === itemId)) as any
        if (!item) {
            return { success: false, error: 'Item not found in catalog' }
        }

        // 3. Process inside a single database transaction
        return await transaction(async (client) => {
            // Get user current total spent WLD
            const userRes = await client.query(
                'SELECT total_spent_wld FROM users WHERE id = $1',
                [userId]
            )
            if (userRes.rows.length === 0) {
                throw new Error('User not found')
            }
            const user = userRes.rows[0]
            const currentTotalSpent = parseFloat(user.total_spent_wld || '0')
            const itemPriceWld = item.price // price in WLD equivalent from catalog

            // Record purchase
            await client.query(
                `INSERT INTO purchases (user_id, item_id, item_type, price_wld, transaction_hash, currency, price_in_currency)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [userId, itemId, item.type, itemPriceWld, transactionHash, currency, priceInCurrency]
            )

            // Update user total spent equivalent
            const newTotalSpent = currentTotalSpent + itemPriceWld
            await client.query(
                'UPDATE users SET total_spent_wld = $1 WHERE id = $2',
                [newTotalSpent, userId]
            )

            // Special handling based on item type / item ID
            if (itemId === 'vip') {
                await client.query(
                    `UPDATE users 
                     SET premium_vip = true,
                         premium_auto_save = true,
                         premium_statistics = true,
                         premium_notifications = true,
                         premium_lucky_particle = true,
                         premium_offline_earnings = true,
                         premium_daily_bonus = true,
                         bp_premium = true,
                         unlocked_skins = COALESCE(unlocked_skins, '[]'::jsonb) || '["rainbow", "gold"]'::jsonb,
                         unlocked_themes = COALESCE(unlocked_themes, '[]'::jsonb) || '["nebula", "galaxy"]'::jsonb
                     WHERE id = $1`,
                    [userId]
                )
            } else if (itemId.startsWith('vip_tier_')) {
                const tier = parseInt(itemId.replace('vip_tier_', ''), 10)
                await client.query(
                    `UPDATE users 
                     SET vip_tier = $1, 
                         premium_vip = true,
                         premium_lucky_particle = true,
                         premium_offline_earnings = true,
                         premium_daily_bonus = true,
                         unlocked_skins = COALESCE(unlocked_skins, '[]'::jsonb) || '["rainbow", "gold"]'::jsonb,
                         unlocked_themes = COALESCE(unlocked_themes, '[]'::jsonb) || '["nebula", "galaxy"]'::jsonb
                     WHERE id = $2`,
                    [tier, userId]
                )
            } else if (itemId === 'lucky_particle') {
                await client.query('UPDATE users SET premium_lucky_particle = true WHERE id = $1', [userId])
            } else if (itemId === 'offline_earnings') {
                await client.query('UPDATE users SET premium_offline_earnings = true WHERE id = $1', [userId])
            } else if (itemId === 'daily_bonus') {
                await client.query('UPDATE users SET premium_daily_bonus = true WHERE id = $1', [userId])
            } else if (itemId === 'particle_skin_rainbow') {
                await client.query(
                    `UPDATE users 
                     SET unlocked_skins = COALESCE(unlocked_skins, '[]'::jsonb) || '["rainbow"]'::jsonb
                     WHERE id = $1`,
                    [userId]
                )
            } else if (itemId === 'particle_skin_gold') {
                await client.query(
                    `UPDATE users 
                     SET unlocked_skins = COALESCE(unlocked_skins, '[]'::jsonb) || '["gold"]'::jsonb
                     WHERE id = $1`,
                    [userId]
                )
            } else if (itemId === 'background_nebula') {
                await client.query(
                    `UPDATE users 
                     SET unlocked_themes = COALESCE(unlocked_themes, '[]'::jsonb) || '["nebula"]'::jsonb
                     WHERE id = $1`,
                    [userId]
                )
            } else if (itemId === 'background_galaxy') {
                await client.query(
                    `UPDATE users 
                     SET unlocked_themes = COALESCE(unlocked_themes, '[]'::jsonb) || '["galaxy"]'::jsonb
                     WHERE id = $1`,
                    [userId]
                )
            } else if (itemId === 'energy_refill') {
                await client.query(
                    'UPDATE user_energy SET current_energy = max_energy, last_refill = NOW() WHERE user_id = $1',
                    [userId]
                )
            } else if (itemId === 'energy_max') {
                await client.query(
                    'UPDATE user_energy SET max_energy = max_energy + 5, current_energy = current_energy + 5 WHERE user_id = $1',
                    [userId]
                )
            } else if (itemId === 'void_core_multiplier') {
                await client.query(
                    `UPDATE users 
                     SET unlocked_premium_upgrades = COALESCE(unlocked_premium_upgrades, '[]'::jsonb) || '["void_core_multiplier"]'::jsonb
                     WHERE id = $1`,
                    [userId]
                )
            } else if (itemId === 'overclocked_drone') {
                await client.query(
                    `UPDATE users 
                     SET unlocked_premium_upgrades = COALESCE(unlocked_premium_upgrades, '[]'::jsonb) || '["overclocked_drone"]'::jsonb
                     WHERE id = $1`,
                    [userId]
                )
            } else if (itemId === 'click_multiplier_500') {
                const expiryTime = Date.now() + 180000
                await client.query(
                    `UPDATE users 
                     SET achievements = COALESCE(achievements, '{}'::jsonb) || jsonb_build_object('booster_click_multiplier_until', $1::bigint)
                     WHERE id = $2`,
                    [expiryTime, userId]
                )
            } else if (item.type === 'bundle') {
                if (itemId === 'starter_pack') {
                    // Add 500 Credits
                    await client.query(
                        'UPDATE users SET total_credits_earned = total_credits_earned + 500 WHERE id = $1',
                        [userId]
                    )

                    const bundleItems = [
                        { id: 'sniper_turret', type: 'tower' },
                        { id: 'wave_skip', type: 'consumable' },
                        { id: 'credit_boost', type: 'boost' }
                    ]

                    for (const bItem of bundleItems) {
                        await client.query(
                            `INSERT INTO user_inventory (user_id, item_id, item_type, quantity)
                             VALUES ($1, $2, $3, 1)
                             ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = user_inventory.quantity + 1`,
                            [userId, bItem.id, bItem.type]
                        )
                    }
                } else if (itemId === 'premium_bundle') {
                    // Add 1000 Credits
                    await client.query(
                        'UPDATE users SET total_credits_earned = total_credits_earned + 1000 WHERE id = $1',
                        [userId]
                    )

                    // Get all towers and skins (except bundles themselves)
                    const allItems = SHOP_CATALOG.filter(
                        i => (i.type === 'tower' || i.type === 'skin') && !i.id.includes('bundle')
                    )

                    for (const bItem of allItems) {
                        await client.query(
                            `INSERT INTO user_inventory (user_id, item_id, item_type, quantity)
                             VALUES ($1, $2, $3, 1)
                             ON CONFLICT (user_id, item_id) DO NOTHING`,
                            [userId, bItem.id, bItem.type]
                        )
                    }
                }
            } else {
                // Standard items / upgrades
                if (item.permanent) {
                    await client.query(
                        `INSERT INTO user_inventory (user_id, item_id, item_type, quantity)
                         VALUES ($1, $2, $3, 1)
                         ON CONFLICT (user_id, item_id) DO NOTHING`,
                        [userId, itemId, item.type]
                    )
                } else {
                    const quantity = item.quantity || 1
                    await client.query(
                        `INSERT INTO user_inventory (user_id, item_id, item_type, quantity)
                         VALUES ($1, $2, $3, $4)
                         ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = user_inventory.quantity + $4`,
                        [userId, itemId, item.type, quantity]
                    )
                }
            }

            // Achievements processing
            if (currentTotalSpent === 0) {
                await client.query(
                    `INSERT INTO user_achievements (user_id, achievement_id)
                     VALUES ($1, 'first_purchase')
                     ON CONFLICT DO NOTHING`,
                    [userId]
                )
            }

            if (newTotalSpent >= 1.0 && currentTotalSpent < 1.0) {
                await client.query(
                    `INSERT INTO user_achievements (user_id, achievement_id)
                     VALUES ($1, 'whale')
                     ON CONFLICT DO NOTHING`,
                    [userId]
                )
            }

            console.log(`[Purchase Helper] Successfully granted ${itemId} to user ${userId} via ${currency}`)
            return {
                success: true,
                item: {
                    id: item.id,
                    name: item.name,
                    type: item.type
                }
            }
        })

    } catch (e: any) {
        console.error('[Purchase Helper] Error granting purchase:', e)
        return { success: false, error: e.message || 'Database error occurred' }
    }
}
