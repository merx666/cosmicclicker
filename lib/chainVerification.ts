import { createPublicClient, http, parseUnits } from 'viem'
import { worldchain } from 'viem/chains'

// WLD Contract Address on World Chain Mainnet
const WLD_CONTRACT_ADDRESS = '0x2cFc85d8E48F8EAB294be644d9E25C3030863003'

// ERC20 Transfer Event Topic
// Transfer(address indexed from, address indexed to, uint256 value)
// keccak256("Transfer(address,address,uint256)")
const TRANSFER_EVENT_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

const client = createPublicClient({
    chain: worldchain,
    transport: http() // Uses default public RPC or falls back to chain definition
})

/**
 * Verifies a World Chain transaction for WLD payment.
 *
 * @param txHash The transaction hash to verify
 * @param expectedAmountWld The expected amount in WLD (e.g., 0.02)
 * @param expectedRecipient The expected recipient address
 * @returns true if valid, false otherwise
 */
export async function verifyWorldChainTransaction(
    txHash: string,
    expectedAmountWld: number,
    expectedRecipient: string
): Promise<boolean> {
    try {
        if (!txHash || !txHash.startsWith('0x')) {
            console.error('Invalid transaction hash format:', txHash)
            return false
        }

        const receipt = await client.getTransactionReceipt({
            hash: txHash as `0x${string}`
        })

        if (receipt.status !== 'success') {
            console.error('Transaction status is not success:', receipt.status)
            return false
        }

        // Clean recipient address for comparison (lowercase, no 0x prefix logic handled by endsWith or direct comparison)
        const cleanRecipient = expectedRecipient.toLowerCase()

        // Calculate expected value in Wei (18 decimals)
        // Use parseUnits to avoid floating point errors
        // Ensure we handle potential string conversion issues
        const expectedWei = parseUnits(expectedAmountWld.toString(), 18)

        // Find the specific Transfer log for WLD
        const transferLog = receipt.logs.find(log => {
            // Check contract address
            if (log.address.toLowerCase() !== WLD_CONTRACT_ADDRESS.toLowerCase()) return false

            // Check topic 0 (Event signature)
            if (log.topics[0] !== TRANSFER_EVENT_TOPIC) return false

            // Check topic 2 (To address)
            // Topics are 32 bytes, so we need to check if it ends with our address
            const toTopic = log.topics[2]
            if (!toTopic) return false

            // Extract address from topic (last 20 bytes / 40 hex chars)
            // Topic: 0x000000000000000000000000[address]
            const extractedAddress = '0x' + toTopic.slice(-40)

            return extractedAddress.toLowerCase() === cleanRecipient
        })

        if (!transferLog) {
            console.error('No matching WLD Transfer event found in transaction')
            return false
        }

        // Verify Amount
        const actualWei = BigInt(transferLog.data)

        // Check exact match or valid overpayment?
        // Usually exact match is expected, but let's allow slight overpayment if ever needed?
        // For now, exact match is safest to prevent logic errors.
        if (actualWei < expectedWei) {
            console.error(`Insufficient payment. Expected ${expectedWei}, got ${actualWei}`)
            return false
        }

        // If they paid too much, we usually accept it in crypto shops,
        // but let's log it.
        if (actualWei > expectedWei) {
            console.warn(`Overpayment detected. Expected ${expectedWei}, got ${actualWei}`)
        }

        return true

    } catch (error) {
        console.error('Verification error:', error)
        return false
    }
}
