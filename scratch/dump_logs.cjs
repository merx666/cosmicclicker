const { createPublicClient, http } = require('viem');
const { worldchain } = require('viem/chains');

const client = createPublicClient({
    chain: worldchain,
    transport: http()
});

const TX_HASH = '0x59137d14f699ef9ac1d9036d7303a35cf3a825682855702786ac52badf036477';

async function dumpLogs() {
    try {
        const receipt = await client.getTransactionReceipt({ hash: TX_HASH });
        console.log('Logs count:', receipt.logs.length);
        receipt.logs.forEach((log, i) => {
            console.log(`Log ${i}: address=${log.address}, topics=${JSON.stringify(log.topics)}, data=${log.data}`);
        });
    } catch (e) {
        console.error(e);
    }
}

dumpLogs();
