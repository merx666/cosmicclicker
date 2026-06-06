const { createPublicClient, http } = require('viem');
const { worldchain } = require('viem/chains');

const client = createPublicClient({
    chain: worldchain,
    transport: http()
});

const HOT_WALLET_ADDRESS = '0x68b4aa6fB4f00dD1A8F8d9AfD6401e4baF67C817';

async function checkRecent() {
    console.log('Checking for recent transactions/events for:', HOT_WALLET_ADDRESS);
    try {
        // Fetch current block
        const blockNumber = await client.getBlockNumber();
        console.log('Current block:', blockNumber.toString());

        // Get balance
        const balance = await client.getBalance({ address: HOT_WALLET_ADDRESS });
        console.log('ETH Balance:', Number(balance) / 1e18, 'ETH');
    } catch (e) {
        console.error(e);
    }
}

checkRecent();
