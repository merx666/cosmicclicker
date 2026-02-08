#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load secrets from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required');
    console.error('Example: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=xxx node export_pending_withdrawals.cjs');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function exportWithdrawals() {
    console.log('Fetching withdrawals from Supabase...');
    const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('status', 'pending'); // Only get pending ones

    if (error) {
        console.error('Error fetching:', error);
        process.exit(1);
    }

    console.log(`Found ${data.length} pending withdrawals.`);
    fs.writeFileSync('supabase_withdrawals.json', JSON.stringify(data, null, 2));
    console.log('Saved to supabase_withdrawals.json');
}

exportWithdrawals();
