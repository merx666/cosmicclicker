const { createPublicClient, http, formatEther } = require('viem');
const { mainnet, optimism } = require('viem/chains');

const HOT_WALLET_ADDRESS = '0x68b4aa6fB4f00dD1A8F8d9AfD6401e4baF67C817';

async function checkOtherChains() {
  console.log('Checking balances on other networks for:', HOT_WALLET_ADDRESS);
  
  // 1. Ethereum Mainnet (Cloudflare RPC)
  try {
    const mainnetClient = createPublicClient({ 
      chain: mainnet, 
      transport: http('https://cloudflare-eth.com') 
    });
    const balance = await mainnetClient.getBalance({ address: HOT_WALLET_ADDRESS });
    console.log(`Ethereum Mainnet: ${formatEther(balance)} ETH`);
  } catch (e) {
    console.log('Mainnet check error:', e.message);
  }

  // 2. Optimism
  try {
    const optimismClient = createPublicClient({ chain: optimism, transport: http() });
    const balance = await optimismClient.getBalance({ address: HOT_WALLET_ADDRESS });
    console.log(`Optimism: ${formatEther(balance)} ETH`);
  } catch (e) {
    console.log('Optimism check error:', e.message);
  }
}

checkOtherChains();
