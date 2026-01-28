
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
    'https://wrruwhauyttrbgjrkcje.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndycnV3aGF1eXR0cmJnanJrY2plIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA3NzI4MywiZXhwIjoyMDgyNjUzMjgzfQ.7F9-zr3AbUw8HLdzkS8v4v_qmk5NL-n-dN9yzp_sDLM'
);

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
