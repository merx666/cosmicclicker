// Test API route locally using production keys
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wrruwhauyttrbgjrkcje.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndycnV3aGF1eXR0cmJnanJrY2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNzcyODMsImV4cCI6MjA4MjY1MzI4M30.aacH8UmW3JNoWUDBBjfxOi0JUMjpBR-IiVnZ3jFI5zM'

console.log('🔍 Testing /api/daily-stats logic locally...\n')
console.log('URL:', supabaseUrl)
console.log('Key (first 50 chars):', supabaseKey.substring(0, 50) + '...')

try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const today = new Date().toISOString().split('T')[0]
    console.log('\nToday:', today)

    console.log('\nFetching data...')
    const { data, error } = await supabase
        .from('daily_conversions')
        .select('*')
        .eq('conversion_date', today)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error('❌ Error:', error)
        throw error
    }

    const totalClaimed = data?.total_wld_claimed || 0
    const MAX_DAILY_WLD = 100

    const result = {
        date: today,
        totalClaimed: Number(totalClaimed),
        conversions: data?.conversion_count || 0,
        limitReached: totalClaimed >= MAX_DAILY_WLD,
        remaining: Math.max(0, MAX_DAILY_WLD - Number(totalClaimed)),
        maxDaily: MAX_DAILY_WLD
    }

    console.log('\n✅ Success!')
    console.log('Result:', JSON.stringify(result, null, 2))
} catch (error) {
    console.error('\n❌ Error:', error)
}
