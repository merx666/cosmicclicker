
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env.production') });
dotenv.config({ path: path.join(__dirname, '.env.local') });

// Helper to wait for dynamic imports
async function loadModules() {
    const payout = await import('./lib/payout.ts');
    return {
        transferWLD: payout.transferWLD,
        getHotWalletBalance: payout.getHotWalletBalance,
        PAYOUT_LIMITS: payout.PAYOUT_LIMITS
    };
}

const BANNED_WALLETS = [
    '0xbfab37c6703e853944696dc9400be77f3878df7b',
    '0x6109446d72bc62e2fda20bc04aa799cd6cff763c',
    '0x947fdf4a44d0440b6d67de370193875deac10ba0',
    '0x53670ca56dd6d0a0d991ff0be2b4af24643d1532'
];

async function processPayouts() {
    console.log('🚀 Starting manual payout processing (Supabase SDK)...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Missing Supabase credentials');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { transferWLD, getHotWalletBalance, PAYOUT_LIMITS } = await loadModules();

    const MAX_SINGLE_PAYOUT = PAYOUT_LIMITS.maxSinglePayout;
    const MAX_DAILY_TOTAL = PAYOUT_LIMITS.maxDailyTotal;
    const MIN_HOT_WALLET_BALANCE = 0.1;

    try {
        console.log('Fetching pending withdrawals...');

        // 1. Fetch pending withdrawals
        const { data: withdrawals, error: fetchError } = await supabase
            .from('withdrawal_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(5);

        if (fetchError) {
            throw new Error(`Supabase fetch error: ${fetchError.message}`);
        }

        if (!withdrawals || withdrawals.length === 0) {
            console.log('✅ No pending withdrawals.');
            process.exit(0);
        }

        // 2. Fetch user wallets manually to avoid join issues
        const userIds = [...new Set(withdrawals.map(w => w.user_id).filter(Boolean))];
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, wallet_address')
            .in('id', userIds);

        if (userError) {
            throw new Error(`Supabase user fetch error: ${userError.message}`);
        }

        const userMap = new Map((users || []).map(u => [u.id, u.wallet_address]));

        console.log(`📝 Found ${withdrawals.length} pending withdrawals.`);

        // 3. Check hot wallet balance
        const balance = await getHotWalletBalance();
        console.log(`💰 Hot Wallet Balance: ${balance} WLD`);

        if (balance < MIN_HOT_WALLET_BALANCE) {
            console.error(`❌ Balance too low (Min: ${MIN_HOT_WALLET_BALANCE} WLD)`);
            process.exit(1);
        }

        // 4. Calculate today's total paid
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: paidToday, error: paidError } = await supabase
            .from('withdrawal_requests')
            .select('wld_amount')
            .eq('status', 'paid')
            .gte('processed_at', todayStart.toISOString());

        if (paidError) {
            throw new Error(`Supabase paid fetch error: ${paidError.message}`);
        }

        const todayPaidTotal = (paidToday || []).reduce((sum, row) => sum + Number(row.wld_amount || 0), 0);
        console.log(`📊 Today's Total Paid: ${todayPaidTotal} WLD`);

        if (todayPaidTotal >= MAX_DAILY_TOTAL) {
            console.error(`❌ Daily limit reached (${MAX_DAILY_TOTAL} WLD)`);
            process.exit(1);
        }

        let remainingDailyBudget = MAX_DAILY_TOTAL - todayPaidTotal;

        // Process each withdrawal
        for (const withdrawal of withdrawals) {
            const amount = Number(withdrawal.wld_amount);
            // Prioritize wallet_address from withdrawal request (if any), fallback to user wallet
            const userWallet = withdrawal.user_id ? userMap.get(withdrawal.user_id) : null;
            const walletAddress = withdrawal.wallet_address || userWallet;

            console.log(`🔹 Processing ID ${withdrawal.id}: ${amount} WLD to ${walletAddress}`);

            if (!walletAddress) {
                console.error(`❌ No wallet address found for ID ${withdrawal.id}`);
                await supabase.from('withdrawal_requests').update({
                    status: 'failed',
                    admin_note: 'No wallet address found'
                }).eq('id', withdrawal.id);
                continue;
            }

            // SECURITY: Reject payouts to banned wallets
            if (BANNED_WALLETS.includes(walletAddress.toLowerCase())) {
                console.warn(`🛑 Banned wallet detected: ${walletAddress}`);
                await supabase.from('withdrawal_requests').update({
                    status: 'rejected',
                    admin_note: 'Account banned for exploitation'
                }).eq('id', withdrawal.id);
                continue;
            }

            // Skip if exceeds single payout limit or remaining budget
            if (amount > MAX_SINGLE_PAYOUT || amount > remainingDailyBudget) {
                console.warn(`⚠️ Amount exceeds limit (Single: ${MAX_SINGLE_PAYOUT}, Budget: ${remainingDailyBudget})`);
                continue;
            }

            try {
                // Process the payout using transferWLD
                const txResult = await transferWLD(walletAddress, amount);

                if (txResult.success && txResult.hash) {
                    console.log(`✅ Success! Tx: ${txResult.hash}`);
                    // Update withdrawal status
                    const { error: updateError } = await supabase.from('withdrawal_requests').update({
                        status: 'paid',
                        transaction_hash: txResult.hash,
                        processed_at: new Date().toISOString()
                    }).eq('id', withdrawal.id);

                    if (updateError) {
                        console.error('❌ Failed to update DB status:', updateError);
                    }

                    remainingDailyBudget -= amount;
                } else {
                    console.error(`❌ Failed: ${txResult.error}`);
                    // Mark as failed
                    await supabase.from('withdrawal_requests').update({
                        admin_note: `Payout failed: ${txResult.error || 'Unknown error'}`
                    }).eq('id', withdrawal.id);
                }
            } catch (err: any) {
                console.error(`❌ Exception: ${err.message}`);
            }
        }
        console.log('🎉 Processing complete.');
        process.exit(0);

    } catch (error: any) {
        console.error('❌ Critical Error:', error);
        process.exit(1);
    }
}

processPayouts();
