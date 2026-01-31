
import { queryOne, query } from '../lib/db';
import * as readline from 'readline';

const PARTICLES_TO_ADD = 150000;
const VIP_TIER_TARGET = 2; // Silver

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query: string): Promise<string> => {
    return new Promise((resolve) => rl.question(query, resolve));
};

async function main() {
    try {
        // GET WALLET ADDRESS FROM ARGS OR PROMPT
        let walletAddress = process.argv[2];

        if (!walletAddress) {
            walletAddress = await askQuestion('Enter user wallet address: ');
        }

        if (!walletAddress) {
            console.error('❌ Error: Wallet address is required.');
            process.exit(1);
        }

        walletAddress = walletAddress.trim();
        console.log(`\n🔍 Searching for user with wallet: ${walletAddress}...`);

        // 1. FIND USER
        const user = await queryOne<{ id: string, particles: string, vip_tier: number, username: string | null }>(
            `SELECT id, particles, vip_tier, username FROM users WHERE wallet_address = $1 OR world_id_nullifier = $1`,
            [walletAddress]
        );

        if (!user) {
            console.error('❌ Error: User not found with this wallet address.');
            process.exit(1);
        }

        console.log(`✅ User found!`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Username: ${user.username || 'N/A'}`);
        console.log(`   Current VIP Tier: ${user.vip_tier}`);
        console.log(`   Current Particles: ${user.particles}`);

        // 2. CONFIRM ACTION
        console.log(`\n----------------------------------------------`);
        console.log(`⚡ ACTION: Grant VIP Tier ${VIP_TIER_TARGET} (Silver)`);
        console.log(`⚡ ACTION: Add +${PARTICLES_TO_ADD.toLocaleString()} particles`);
        console.log(`----------------------------------------------`);

        const confirm = await askQuestion('❓ Are you sure? (Type "yes" to proceed): ');
        if (confirm.toLowerCase() !== 'yes') {
            console.log('🚫 Operation cancelled.');
            process.exit(0);
        }

        // 3. UPDATE USER
        await query(
            `UPDATE users 
             SET vip_tier = $1, 
                 particles = particles + $2,
                 updated_at = NOW()
             WHERE id = $3`,
            [VIP_TIER_TARGET, PARTICLES_TO_ADD, user.id]
        );

        // 4. VERIFY
        const updatedUser = await queryOne<{ particles: string, vip_tier: number }>(
            `SELECT particles, vip_tier FROM users WHERE id = $1`,
            [user.id]
        );

        console.log(`\n✅ Update SUCCESSFUL!`);
        console.log(`   New VIP Tier: ${updatedUser?.vip_tier}`);
        console.log(`   New Particles: ${updatedUser?.particles} (was ${user.particles})`);

    } catch (error) {
        console.error('\n❌ Unexpected Error:', error);
    } finally {
        rl.close();
        process.exit(0);
    }
}

main();
