import { NextResponse } from 'next/server'

export async function GET() {
    const maintenanceMode = process.env.MAINTENANCE_MODE === 'true'

    return NextResponse.json({
        maintenance: maintenanceMode,
        message: maintenanceMode
            ? "We're preparing Season 2 with exciting new features. Come back in a few hours!"
            : null,
        bypassKey: undefined, // Never expose the key
    })
}
