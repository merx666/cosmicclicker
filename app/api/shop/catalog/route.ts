import { NextResponse, NextRequest } from 'next/server'
import { SHOP_CATALOG } from '@/lib/gameEconomy'

export async function GET(req: NextRequest) {
    try {
        // Return full shop catalog
        return NextResponse.json({
            items: SHOP_CATALOG,
            categories: {
                towers: SHOP_CATALOG.filter(i => i.type === 'tower'),
                consumables: SHOP_CATALOG.filter(i => i.type === 'consumable'),
                skins: SHOP_CATALOG.filter(i => i.type === 'skin'),
                bundles: SHOP_CATALOG.filter(i => i.type === 'bundle'),
                boosts: SHOP_CATALOG.filter(i => i.type === 'boost')
            }
        })
    } catch (error: any) {
        console.error('Shop catalog error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
