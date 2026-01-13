import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for database tables
export interface User {
    id: string
    world_id_nullifier: string
    username?: string
    particles: number
    total_particles_collected: number
    total_clicks: number
    particles_per_click: number
    particles_per_second: number
    upgrade_click_power: number
    upgrade_auto_collector: number
    upgrade_multiplier: number
    upgrade_offline: number
    total_wld_claimed: number
    last_claim_time?: string
    login_streak: number
    last_login: string
    created_at: string
    updated_at: string
}

export interface Mission {
    id: string
    user_id: string
    mission_type: 'daily' | 'weekly'
    mission_id: string
    completed: boolean
    completed_at?: string
    reward_particles: number
    created_at: string
}
