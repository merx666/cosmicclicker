
import { createPublicClient, http, formatUnits, parseAbiItem } from 'viem'
import { worldchain } from 'viem/chains'

// VOID Token Contract
export const VOID_TOKEN_ADDRESS = '0xc591cA8f2F6cFf32ec49f7F4657de25a1117D201' as const
const VOID_DECIMALS = 18

// VIP Thresholds
export const VIP_LEVELS = {
    NONE: 0,
    SILVER: 1, // Holds 1,000 VOID
    GOLD: 2    // Holds 10,000 VOID
}

export const VIP_THRESHOLDS = {
    [VIP_LEVELS.SILVER]: 1650, // Was 1000 (+65%)
    [VIP_LEVELS.GOLD]: 16500  // Was 10000 (+65%)
}

const RPC_URL = process.env.NEXT_PUBLIC_WORLD_CHAIN_RPC || 'https://worldchain-mainnet.g.alchemy.com/v2/demo'

// ERC20 Balance ABI
const BALANCE_ABI = [
    {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    }
] as const

export async function getVoidBalance(address: string): Promise<number> {
    if (!address || !address.startsWith('0x')) return 0

    try {
        const publicClient = createPublicClient({
            chain: worldchain,
            transport: http(RPC_URL)
        })

        const balance = await publicClient.readContract({
            address: VOID_TOKEN_ADDRESS,
            abi: BALANCE_ABI,
            functionName: 'balanceOf',
            args: [address as `0x${string}`]
        })

        return parseFloat(formatUnits(balance, VOID_DECIMALS))
    } catch (error) {
        console.error('Error fetching VOID balance:', error)
        return 0
    }
}

export function getVipLevelFromBalance(balance: number): number {
    if (balance >= VIP_THRESHOLDS[VIP_LEVELS.GOLD]) return VIP_LEVELS.GOLD
    if (balance >= VIP_THRESHOLDS[VIP_LEVELS.SILVER]) return VIP_LEVELS.SILVER
    return VIP_LEVELS.NONE
}
