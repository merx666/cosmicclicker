#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { config } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local
config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!')
    console.error('Please ensure .env.local contains:')
    console.error('  - NEXT_PUBLIC_SUPABASE_URL')
    console.error('  - SUPABASE_SERVICE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Read SQL migration file
const sqlPath = join(__dirname, 'supabase', 'RUN_THIS_DAILY_CAP.sql')
const sqlContent = readFileSync(sqlPath, 'utf-8')

// Split SQL into individual statements (simple approach)
const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && !s.startsWith('//'))

console.log('🚀 Starting migration: Daily WLD Cap')
console.log(`📝 Found ${statements.length} SQL statements to execute\n`)

// Execute each statement
for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    if (!statement) continue

    console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`)

    try {
        const { data, error } = await supabase.rpc('exec_sql', { query: statement + ';' })

        if (error) {
            // Try direct query if RPC doesn't work
            const { error: directError } = await supabase.from('_').select('*').limit(0)

            // For PostgreSQL, we need to use the REST API directly
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseServiceKey,
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: statement + ';' })
            })

            if (!response.ok) {
                console.log(`⚠️  Could not execute via API. Statement: ${statement.substring(0, 100)}...`)
            } else {
                console.log(`✅ Statement ${i + 1} executed successfully`)
            }
        } else {
            console.log(`✅ Statement ${i + 1} executed successfully`)
        }
    } catch (err) {
        console.log(`⚠️  Error on statement ${i + 1}: ${err.message}`)
    }
}

console.log('\n✅ Migration completed!')
console.log('\n🔍 Verifying installation...')

// Verify the table exists
const { data, error } = await supabase
    .from('daily_conversions')
    .select('*')
    .order('conversion_date', { ascending: false })
    .limit(1)

if (error) {
    console.error('❌ Verification failed:', error.message)
    console.log('\n⚠️  The migration might not have completed successfully.')
    console.log('Please run the SQL manually in Supabase Dashboard.')
} else {
    console.log('✅ Table daily_conversions exists!')
    console.log('📊 Current data:', data)
    console.log('\n🎉 Migration successful! Convert tab should now work.')
}
