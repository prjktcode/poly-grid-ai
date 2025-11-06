import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from '@/hooks/use-toast'

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, error } = useConnect()
  const { disconnect } = useDisconnect()

  useEffect(() => {
    if (error) {
      toast({
        title: "Connection Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }, [error])

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="glass-card px-4 py-2 rounded-lg">
          <p className="text-sm font-mono text-primary">{formatAddress(address)}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => disconnect()}
          className="hover:bg-destructive/20"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="hero"
      onClick={() => connect({ connector: connectors[0] })}
      className="gap-2"
    >
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  )
}
