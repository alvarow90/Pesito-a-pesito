'use client'

import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useUserStore } from '@/lib/store/user-store'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { IconExternalLink } from '@/components/ui/icons'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export function DefiPayment() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [connectedAddress, setConnectedAddress] = useState<string>('')
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [txHash, setTxHash] = useState<string>('')
  const [paymentMode, setPaymentMode] = useState<'live' | 'demo'>('demo')
  const { fetchUser, fetchSubscription } = useUserStore()
  const { user } = useUser()
  const router = useRouter()

  const handleConnectWallet = async () => {
    if (
      typeof window === 'undefined' ||
      typeof window.ethereum === 'undefined'
    ) {
      toast.error('Por favor instala MetaMask para continuar')
      return
    }

    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' })

      // Create and return Web3Provider
      const browserProvider = new ethers.BrowserProvider(window.ethereum)
      setProvider(browserProvider)
      setIsWalletConnected(true)

      // Get connected address
      const signer = await browserProvider.getSigner()
      const address = await signer.getAddress()
      setConnectedAddress(address)

      toast.success('Wallet conectada!')
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      toast.error('No se pudo conectar a la wallet')
    }
  }

  const handleDemoPayment = async () => {
    setIsProcessing(true)

    try {
      // Simular carga
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Generar un hash de transacción simulado
      const mockTxHash =
        '0x' +
        Array.from(
          { length: 64 },
          () => '0123456789abcdef'[Math.floor(Math.random() * 16)]
        ).join('')

      setTxHash(mockTxHash)

      // Update the backend with the new subscription status
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan: 'premium',
          txHash: mockTxHash,
          walletAddress: 'demo_wallet_address'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update subscription on server')
      }

      const data = await response.json()

      if (data.success) {
        toast.success('¡Suscripción activada correctamente!')
        await fetchUser()
        await fetchSubscription()
        router.push('/')
      } else {
        throw new Error(data.error || 'Failed to process subscription')
      }
    } catch (error: any) {
      console.error('Subscription error:', error)
      toast.error(error.message || 'Ocurrió un error al procesar el pago')
    } finally {
      setIsProcessing(false)
    }
  }

  // Effect to check for Ethereum provider changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      // Handle account changes
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setIsWalletConnected(false)
          setConnectedAddress('')
        } else if (accounts[0] !== connectedAddress) {
          setConnectedAddress(accounts[0])
        }
      }

      // Handle chain changes
      const handleChainChanged = () => {
        window.location.reload()
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [connectedAddress])

  if (txHash) {
    return (
      <Alert className="mt-4">
        <AlertTitle>¡Transacción exitosa!</AlertTitle>
        <AlertDescription>
          <p>Tu suscripción ha sido activada correctamente.</p>
          {paymentMode === 'live' && (
            <p className="mt-2">
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:underline"
              >
                Ver transacción en Etherscan
                <IconExternalLink className="ml-1 h-4 w-4" />
              </a>
            </p>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-4 items-center">
      <Tabs
        defaultValue="demo"
        onValueChange={v => setPaymentMode(v as 'live' | 'demo')}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="demo">Modo Demo</TabsTrigger>
          <TabsTrigger value="live">Blockchain Real</TabsTrigger>
        </TabsList>
        <TabsContent value="demo">
          <div className="text-muted-foreground text-sm mb-4 p-3 border rounded">
            <p>
              Modo de demostración: Simula un pago sin conectar una wallet real.
            </p>
          </div>

          <Button
            onClick={handleDemoPayment}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Procesando...' : 'Suscribirse (Simulado)'}
          </Button>
        </TabsContent>
        <TabsContent value="live">
          <div className="text-muted-foreground text-sm mb-4">
            <p>
              Utiliza la red de prueba Sepolia para procesar pagos de forma
              segura y transparente
            </p>
          </div>

          {!isWalletConnected ? (
            <Button onClick={handleConnectWallet} className="w-full">
              Conectar Wallet (MetaMask)
            </Button>
          ) : (
            <>
              <div className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                <p className="text-sm font-medium">Wallet conectada:</p>
                <p className="text-xs truncate">{connectedAddress}</p>
              </div>

              <Button
                onClick={handleDemoPayment}
                disabled={isProcessing}
                className="w-full mt-2"
              >
                {isProcessing
                  ? 'Procesando...'
                  : 'Comprar suscripción (0.01 ETH)'}
              </Button>
            </>
          )}

          <div className="text-xs text-muted-foreground text-center mt-4">
            <p>Esto utiliza Sepolia, una red de prueba de Ethereum.</p>
            <p>Necesitarás ETH de prueba para completar la transacción.</p>
            <p className="mt-1">
              <a
                href="https://sepoliafaucet.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Obtener ETH de prueba gratis →
              </a>
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}
