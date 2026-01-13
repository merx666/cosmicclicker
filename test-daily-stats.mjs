// Test daily-stats API locally
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wrruwhauyttrbgjrkcje.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndycnV3aGF1eXR0cmJnanJrY2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNzcyODMsImV4cCI6MjA4MjY1MzI4M30.aacH8UmW3JNoWUDBBjfxOi0JUMjpBR-IiVnZ3jFI5zM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('🔍 Testing daily_conversions table access...\n')

const today = new Date().toISOString().split('T')[0]
console.log('Today:', today)

const { data, error } = await supabase
    .from('daily_conversions')
    .select('*')
    .eq('conversion_date', today)
    .single()

if (error && error.code !== 'PGRST116') {
    console.log('❌ Error:', error)
} else {
    console.log('✅ Success!')
    console.log('Data:', {
        date: today,
        totalClaimed: Number(data?.total_wld_claimed || 0),
        conversions: data?.conversion_count || 0,
        limitReached: (data?.total_wld_claimed || 0) >= 100,
        remaining: Math.max(0, 100 - Number(data?.total_wld_claimed || 0)),
        maxDaily: 100
    })
}
