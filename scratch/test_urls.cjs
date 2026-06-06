const addr = '0x68b4aa6fB4f00dD1A8F8d9AfD6401e4baF67C817';
const urls = [
  `https://worldchain-mainnet.explorer.alchemy.com/api?module=account&action=txlist&address=${addr}&sort=desc`,
  `https://worldscan.org/api?module=account&action=txlist&address=${addr}&sort=desc`,
  `https://worldchain.blockscout.com/api?module=account&action=txlist&address=${addr}&sort=desc`
];

async function tryUrls() {
  for (const url of urls) {
    console.log('Trying:', url);
    try {
      const res = await fetch(url);
      const text = await res.text();
      console.log('Status:', res.status);
      console.log('Text (first 100 chars):', text.substring(0, 100));
    } catch (e) {
      console.log('Error:', e.message);
    }
  }
}

tryUrls();
