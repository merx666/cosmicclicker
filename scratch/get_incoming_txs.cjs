const url = 'https://worldchain-mainnet.explorer.alchemy.com/api?module=account&action=txlist&address=0x68b4aa6fB4f00dD1A8F8d9AfD6401e4baF67C817&sort=desc';

fetch(url)
  .then(res => res.json())
  .then(data => {
    if (data.status === '1' || data.message === 'OK') {
      const txs = data.result || [];
      const incoming = txs.filter(tx => tx.to.toLowerCase() === '0x68b4aa6fb4f00dd1a8f8d9afd6401e4baf67c817'.toLowerCase());
      console.log('Total incoming txs found:', incoming.length);
      incoming.slice(0, 5).forEach((tx, i) => {
        console.log(`[Incoming Tx ${i+1}]`);
        console.log(`  Hash: ${tx.hash}`);
        console.log(`  From: ${tx.from}`);
        console.log(`  Value: ${Number(tx.value) / 1e18} ETH`);
        console.log(`  Time: ${new Date(Number(tx.timeStamp) * 1000).toLocaleString()}`);
        console.log(`  IsError: ${tx.isError}`);
      });
    } else {
      console.log('Error/No data from API:', data);
    }
  })
  .catch(err => console.error('Fetch error:', err));
