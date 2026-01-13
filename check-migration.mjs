// Quick verification script to check if daily_conversions table exists
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables!')
    console.error('Please ensure .env.local contains NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('🔍 Checking if daily_conversions table exists...\n')

const { data, error } = await supabase
    .from('daily_conversions')
    .select('*')
    .limit(1)

if (error) {
    console.log('❌ Table does NOT exist or is not accessible')
    console.log('Error:', error.message)
    console.log('\n📋 Action required:')
    console.log('1. Go to Supabase Dashboard SQL Editor')
    console.log('2. Copy the content from: supabase/RUN_THIS_DAILY_CAP.sql')
    console.log('3. Paste and click "Run"\n')
} else {
    console.log('✅ Table exists!')
    console.log('📊 Current data:', data)
    console.log('\n🎉 Convert tab should work now!')
}
