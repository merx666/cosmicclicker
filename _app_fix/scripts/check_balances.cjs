
const { createPublicClient, http, formatEther, formatUnits } = require('viem');
const { worldchain } = require('viem/chains');

const client = createPublicClient({
    chain: worldchain,
    transport: http()
});

const WLD_TOKEN_ADDRESS = '0x2cFc85d8E48F8EAB294be644d9E25C3030863003';
const HOT_WALLET_ADDRESS = '0x68b4aa6fB4f00dD1A8F8d9AfD6401e4baF67C817';

const ERC20_ABI = [
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    }
];

async function checkBalances() {
    console.log(`Checking balances for: ${HOT_WALLET_ADDRESS}`);

    // Check ETH Balance
    const balanceEth = await client.getBalance({ address: HOT_WALLET_ADDRESS });
    console.log(`ETH Balance: ${formatEther(balanceEth)} ETH`);

    // Check WLD Balance
    try {
        const balanceWld = await client.readContract({
            address: WLD_TOKEN_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [HOT_WALLET_ADDRESS]
        });
        console.log(`WLD Balance: ${formatUnits(balanceWld, 18)} WLD`);
    } catch (error) {
        console.error('Error checking WLD balance:', error);
    }
}

checkBalances();
