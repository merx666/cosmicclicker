import { getHotWalletAddress } from '../lib/payout'
import { createPublicClient, http, formatEther } from 'viem'
import { worldchain } from 'viem/chains'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

async function check() {
    try {
        const address = getHotWalletAddress()
        
        // Use verified custom RPC from env or fallback
        const rpcUrl = process.env.NEXT_PUBLIC_WORLD_CHAIN_RPC || 'https://worldchain-mainnet.g.alchemy.com/public'
        
        const publicClient = createPublicClient({
            chain: worldchain,
            transport: http(rpcUrl)
        })

        // Read WLD balance of the hot wallet
        // WLD Token on World Chain Mainnet
        const WLD_TOKEN_ADDRESS = '0x2cFc85d8E48F8EAB294be644d9E25C3030863003' as const
        const ERC20_ABI = [
            {
                name: 'balanceOf',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'account', type: 'address' }],
                outputs: [{ name: '', type: 'uint256' }]
            }
        ] as const

        const balanceWei = await publicClient.readContract({
            address: WLD_TOKEN_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address as `0x${string}`]
        })
        const wldBalance = parseFloat(formatEther(balanceWei))

        // Get native gas (ETH) balance
        const ethBalanceWei = await publicClient.getBalance({ address: address as `0x${string}` })
        const ethBalance = formatEther(ethBalanceWei)

        console.log(JSON.stringify({
            address,
            wld: wldBalance.toFixed(4),
            eth: parseFloat(ethBalance).toFixed(6)
        }, null, 2))
    } catch (error: any) {
        console.error('Error checking hotwallet:', error?.message || error)
    }
}

check()
