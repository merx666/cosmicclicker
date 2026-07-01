#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../.env.production');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
} else {
    require('dotenv').config();
}

const { Pool } = require('pg');
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:VoidCollectorDB2024!@localhost:5432/void_collector';

// WLD Token details
const WLD_TOKEN_ADDRESS = '0x2cFc85d8E48F8EAB294be644d9E25C3030863003';
const ERC20_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    }
];

async function run() {
    console.log('Fetching hot wallet details...');
    
    // 1. Get private key to derive address
    const privateKey = process.env.HOT_WALLET_PRIVATE_KEY;
    if (!privateKey) {
        console.error('ERROR: HOT_WALLET_PRIVATE_KEY not configured');
        process.exit(1);
    }
    
    const pool = new Pool({ connectionString: DATABASE_URL });
    
    try {
        // Import viem dynamically
        const { createPublicClient, http, formatUnits } = await import('viem');
        const { privateKeyToAccount } = await import('viem/accounts');
        const { worldchain } = await import('viem/chains');
        
        const account = privateKeyToAccount(privateKey);
        const rpcUrl = process.env.WORLD_CHAIN_RPC_URL || 'https://worldchain-mainnet.rpc.com';
        
        const publicClient = createPublicClient({
            chain: worldchain,
            transport: http(rpcUrl)
        });
        
        const balanceWei = await publicClient.readContract({
            address: WLD_TOKEN_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [account.address]
        });
        
        const balance = parseFloat(formatUnits(balanceWei, 18));
        
        console.log('\n========================================');
        console.log('          HOT WALLET STATUS             ');
        console.log('========================================');
        console.log(`Adres:   ${account.address}`);
        console.log(`Balans:  ${balance.toFixed(4)} WLD`);
        
        // 2. Query DB for withdrawals summary
        const stats = await pool.query(`
            SELECT status, COUNT(*)::int as count, COALESCE(SUM(wld_amount), 0)::float as total_amount 
            FROM withdrawal_requests 
            GROUP BY status
            ORDER BY status
        `);
        
        console.log('\n========================================');
        console.log('      PODSUMOWANIE ZLECEŃ WYPŁAT        ');
        console.log('========================================');
        console.table(stats.rows);
        
        // 3. Query DB for pending withdrawals
        const pending = await pool.query(`
            SELECT wr.id, u.username, wr.wld_amount as amount, wr.status, wr.created_at
            FROM withdrawal_requests wr
            LEFT JOIN users u ON wr.user_id = u.id
            WHERE wr.status = 'pending'
            ORDER BY wr.created_at DESC
            LIMIT 5
        `);
        
        if (pending.rows.length > 0) {
            console.log('\n========================================');
            console.log('      OSTATNIE OCZEKUJĄCE WYPŁATY        ');
            console.log('========================================');
            console.table(pending.rows);
        } else {
            console.log('\nBrak oczekujących wypłat (status pending).');
        }
        console.log('========================================\n');
        
    } catch (error) {
        console.error('Błąd podczas pobierania statusu:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

run();
