
const { createPublicClient, http, formatEther } = require('viem');
const { worldchain } = require('viem/chains');

const client = createPublicClient({
    chain: worldchain,
    transport: http()
});

async function checkEth() {
    const address = '0x68b4aa6fB4f00dD1A8F8d9AfD6401e4baF67C817';
    const balance = await client.getBalance({ address });
    console.log(`ETH Balance: ${formatEther(balance)} ETH`);
}

checkEth();
