#!/usr/bin/env node

/**
 * Script to unwrap WETH to native ETH on World Chain
 */

const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../.env.production');
if (fs.existsSync(envPath)) {
    console.log('[Unwrap] Loading .env.production...');
    require('dotenv').config({ path: envPath });
} else {
    require('dotenv').config();
}

const { createWalletClient, createPublicClient, http, formatUnits } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { worldchain } = require('viem/chains');

const PRIVATE_KEY = process.env.HOT_WALLET_PRIVATE_KEY;
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';

if (!PRIVATE_KEY) {
    console.error('[Unwrap] ERROR: HOT_WALLET_PRIVATE_KEY environment variable is required');
    process.exit(1);
}

const WETH_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    },
    {
        name: 'withdraw',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'wad', type: 'uint256' }],
        outputs: []
    }
];

async function runUnwrap() {
    console.log('[Unwrap] Starting WETH unwrap...');
    const account = privateKeyToAccount(PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`);
    console.log('[Unwrap] Wallet address:', account.address);

    const publicClient = createPublicClient({
        chain: worldchain,
        transport: http()
    });

    const walletClient = createWalletClient({
        account,
        chain: worldchain,
        transport: http()
    });

    try {
        // 1. Check current WETH balance
        const wethBalance = await publicClient.readContract({
            address: WETH_ADDRESS,
            abi: WETH_ABI,
            functionName: 'balanceOf',
            args: [account.address]
        });

        console.log(`[Unwrap] Current WETH balance: ${formatUnits(wethBalance, 18)} WETH`);

        if (wethBalance === 0n) {
            console.log('[Unwrap] No WETH to unwrap.');
            return;
        }

        // 2. Execute WETH withdraw
        console.log('[Unwrap] Sending withdraw transaction...');
        const { request } = await publicClient.simulateContract({
            address: WETH_ADDRESS,
            abi: WETH_ABI,
            functionName: 'withdraw',
            args: [wethBalance],
            account
        });

        const hash = await walletClient.writeContract(request);
        console.log('[Unwrap] Transaction hash sent:', hash);

        console.log('[Unwrap] Waiting for transaction confirmation...');
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log('[Unwrap] Transaction confirmed in block:', receipt.blockNumber.toString());
        console.log('[Unwrap] Success! WETH unwrapped to native ETH.');

    } catch (error) {
        console.error('[Unwrap] Error during unwrapping:', error);
    }
}

runUnwrap();
