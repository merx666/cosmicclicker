/**
 * WLD Token Payout Library
 * Automated transfers from hot wallet on World Chain
 */

import { createWalletClient, createPublicClient, http, parseUnits, formatUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { worldchain } from 'viem/chains'

// WLD Token on World Chain Mainnet
const WLD_TOKEN_ADDRESS = '0x2cFc85d8E48F8EAB294be644d9E25C3030863003' as const
const WLD_DECIMALS = 18

// Security limits
export const PAYOUT_LIMITS = {
    maxSinglePayout: 0.05,    // Max 0.05 WLD per transaction
    maxDailyTotal: 7.0,       // Max 7 WLD total per day
    minBalance: 0.1           // Min balance to keep in hot wallet
}

// ERC-20 ABI subset for transfer and balance
const ERC20_ABI = [
    {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' }
        ],
        outputs: [{ name: '', type: 'bool' }]
    },
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }]
    }
] as const

/**
 * Get the hot wallet account from private key
 */
function getHotWalletAccount() {
    const privateKey = process.env.HOT_WALLET_PRIVATE_KEY
    if (!privateKey) {
        throw new Error('HOT_WALLET_PRIVATE_KEY not configured')
    }
    return privateKeyToAccount(privateKey as `0x${string}`)
}

/**
 * Create viem clients for World Chain
 * Uses custom RPC URL from env or fallback to avoid rate limiting
 */
function createClients() {
    const account = getHotWalletAccount()

    // Use custom RPC to avoid Alchemy public rate limits
    const rpcUrl = process.env.WORLD_CHAIN_RPC_URL || 'https://worldchain-mainnet.g.alchemy.com/v2/demo' || 'https://worldchain-mainnet.rpc.com'

    const walletClient = createWalletClient({
        account,
        chain: worldchain,
        transport: http(rpcUrl)
    })

    const publicClient = createPublicClient({
        chain: worldchain,
        transport: http(rpcUrl)
    })

    return { walletClient, publicClient, account }
}

/**
 * Get WLD balance of hot wallet
 */
export async function getHotWalletBalance(): Promise<number> {
    const { publicClient, account } = createClients()

    const balance = await publicClient.readContract({
        address: WLD_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [account.address]
    })

    return parseFloat(formatUnits(balance, WLD_DECIMALS))
}

/**
 * Get hot wallet address
 */
export function getHotWalletAddress(): string {
    return getHotWalletAccount().address
}

/**
 * Transfer WLD tokens to a recipient
 * @param toAddress Recipient wallet address (0x...)
 * @param amount Amount in WLD (e.g., 0.01)
 * @returns Transaction hash
 */
export async function transferWLD(
    toAddress: string,
    amount: number
): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
        // Validate amount
        if (amount <= 0) {
            return { success: false, error: 'Amount must be positive' }
        }
        if (amount > PAYOUT_LIMITS.maxSinglePayout) {
            return { success: false, error: `Amount exceeds max single payout of ${PAYOUT_LIMITS.maxSinglePayout} WLD` }
        }

        // Validate address
        if (!toAddress || !toAddress.startsWith('0x') || toAddress.length !== 42) {
            return { success: false, error: 'Invalid wallet address' }
        }

        // Check balance
        const balance = await getHotWalletBalance()
        if (balance < amount + PAYOUT_LIMITS.minBalance) {
            return { success: false, error: `Insufficient hot wallet balance. Available: ${balance} WLD` }
        }

        const { walletClient } = createClients()
        const amountInWei = parseUnits(amount.toString(), WLD_DECIMALS)

        // Execute transfer
        const hash = await walletClient.writeContract({
            address: WLD_TOKEN_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'transfer',
            args: [toAddress as `0x${string}`, amountInWei]
        })

        console.log(`[Payout] Transferred ${amount} WLD to ${toAddress}. Tx: ${hash}`)
        return { success: true, hash }

    } catch (error: any) {
        console.error('[Payout] Transfer failed:', error)
        return { success: false, error: error?.message || 'Transfer failed' }
    }
}

/**
 * Batch transfer WLD to multiple recipients
 * @param transfers Array of { address, amount } objects
 * @returns Array of results
 */
export async function batchTransferWLD(
    transfers: Array<{ address: string; amount: number; withdrawalId: string }>
): Promise<Array<{ withdrawalId: string; success: boolean; hash?: string; error?: string }>> {
    const results = []

    // Check total doesn't exceed daily limit
    const totalAmount = transfers.reduce((sum, t) => sum + t.amount, 0)
    if (totalAmount > PAYOUT_LIMITS.maxDailyTotal) {
        return transfers.map(t => ({
            withdrawalId: t.withdrawalId,
            success: false,
            error: `Batch total ${totalAmount} exceeds daily limit of ${PAYOUT_LIMITS.maxDailyTotal} WLD`
        }))
    }

    // Process sequentially to avoid nonce issues
    for (const transfer of transfers) {
        const result = await transferWLD(transfer.address, transfer.amount)
        results.push({
            withdrawalId: transfer.withdrawalId,
            ...result
        })

        // Delay between transactions to avoid RPC rate limits
        await new Promise(resolve => setTimeout(resolve, 5000))
    }

    return results
}
