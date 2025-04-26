import { ethers } from 'ethers'
import SubscriptionManagerABI from './SubscriptionManagerABI.json'

// Sepolia testnet contract address - This would be your deployed contract address
export const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000' // Replace with actual deployed contract

// Network configuration for Sepolia testnet
export const NETWORK_CONFIG = {
  chainId: '0xaa36a7', // Sepolia chain ID in hex
  chainName: 'Sepolia Testnet',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://rpc.sepolia.org'],
  blockExplorerUrls: ['https://sepolia.etherscan.io']
}

/**
 * Connect to Ethereum provider
 */
export async function connectWallet(): Promise<ethers.BrowserProvider | null> {
  if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
    console.error('MetaMask not installed!')
    return null
  }

  try {
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' })

    // Check if we're on the correct network
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })

    if (chainId !== NETWORK_CONFIG.chainId) {
      // Request network switch
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: NETWORK_CONFIG.chainId }]
        })
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [NETWORK_CONFIG]
            })
          } catch (addError) {
            console.error('Failed to add network to MetaMask:', addError)
            return null
          }
        } else {
          console.error('Failed to switch network in MetaMask:', switchError)
          return null
        }
      }
    }

    // Create and return BrowserProvider
    return new ethers.BrowserProvider(window.ethereum)
  } catch (error) {
    console.error('Failed to connect wallet:', error)
    return null
  }
}

/**
 * Get Subscription Manager contract instance
 */
export function getSubscriptionContract(
  provider: ethers.BrowserProvider
): ethers.Contract {
  return new ethers.Contract(CONTRACT_ADDRESS, SubscriptionManagerABI, provider)
}

/**
 * Purchase subscription
 */
export async function purchaseSubscription(
  provider: ethers.BrowserProvider
): Promise<{ txHash: string } | null> {
  try {
    const contract = getSubscriptionContract(provider)
    const signer = await provider.getSigner()
    const contractWithSigner = contract.connect(signer)

    // Get subscription price
    const price = await contract.monthlySubscriptionPrice()

    // Call the purchaseSubscription method, casting to any to bypass type checking
    const tx = await (contractWithSigner as any).purchaseSubscription({
      value: price
    })
    const receipt = await tx.wait()

    if (!receipt || !receipt.hash) {
      throw new Error('Transaction failed')
    }

    return { txHash: receipt.hash }
  } catch (error) {
    console.error('Failed to purchase subscription:', error)
    return null
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  provider: ethers.BrowserProvider
): Promise<boolean> {
  try {
    const contract = getSubscriptionContract(provider)
    const signer = await provider.getSigner()
    const contractWithSigner = contract.connect(signer)

    // Use bracket notation to call the method
    const tx = await (contractWithSigner as any)['cancelSubscription']()
    const receipt = await tx.wait()

    return !!receipt
  } catch (error) {
    console.error('Failed to cancel subscription:', error)
    return false
  }
}

/**
 * Check if user has active subscription
 */
export async function checkSubscription(
  address: string,
  provider: ethers.BrowserProvider
): Promise<boolean> {
  try {
    const contract = getSubscriptionContract(provider)

    // Use bracket notation for TypeScript compatibility
    return await contract['hasActiveSubscription'](address)
  } catch (error) {
    console.error('Failed to check subscription:', error)
    return false
  }
}

/**
 * Get Sepolia test ETH from a faucet (not actually implemented, just a link)
 */
export function getSepoliaFaucetLink(): string {
  return 'https://sepoliafaucet.com/'
}

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}
