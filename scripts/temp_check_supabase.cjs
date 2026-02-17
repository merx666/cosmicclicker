
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPending() {
    const { count, error } = await supabase
        .from('withdrawal_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    if (error) {
        console.error('Error fetching pending withdrawals:', error);
        return;
    }

    console.log('PENDING_WITHDRAWALS:', count);

    if (count > 0) {
        const { data, error: listError } = await supabase
            .from('withdrawal_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(5);

        if (listError) {
            console.error(listError);
        } else {
            console.log('OLDEST_PENDING:', JSON.stringify(data, null, 2));
        }
    }
}

checkPending();
