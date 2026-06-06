const { createPublicClient, http, formatUnits } = require('viem');
const { worldchain } = require('viem/chains');

const client = createPublicClient({
    chain: worldchain,
    transport: http()
});

const HOT_WALLET_ADDRESS = '0x68b4aa6fB4f00dD1A8F8d9AfD6401e4baF67C817';
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';

const ERC20_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    }
];

async function checkWeth() {
    try {
        const balance = await client.readContract({
            address: WETH_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [HOT_WALLET_ADDRESS]
        });
        console.log(`WETH Balance of Hot Wallet: ${formatUnits(balance, 18)} WETH`);
    } catch (e) {
        console.error('Error:', e);
    }
}

checkWeth();
