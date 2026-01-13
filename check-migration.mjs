// Quick verification script to check if daily_conversions table exists
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wrruwhauyttrbgjrkcje.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndycnV3aGF1eXR0cmJnanJrY2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1NDk4MzUsImV4cCI6MjA1MTEyNTgzNX0.sb_publishable_1U4o_K96yZKq_sENjcCT8A_1MWdgppz'

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
    console.log('1. Go to: https://supabase.com/dashboard/project/wrruwhauyttrbgjrkcje/editor')
    console.log('2. Click "SQL Editor" in the left menu')
    console.log('3. Click "New Query"')
    console.log('4. Copy the content from: supabase/RUN_THIS_DAILY_CAP.sql')
    console.log('5. Paste and click "Run"\n')
} else {
    console.log('✅ Table exists!')
    console.log('📊 Current data:', data)
    console.log('\n🎉 Convert tab should work now!')
}
