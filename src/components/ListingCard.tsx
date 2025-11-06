import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, Database as DatabaseIcon, ShoppingCart, ExternalLink } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export interface Listing {
  id: number
  name: string
  description: string
  type: 'model' | 'dataset'
  seller: string
  price: string
  cid: string
}

interface ListingCardProps {
  listing: Listing
  onBuy?: (id: number) => void
}

export function ListingCard({ listing, onBuy }: ListingCardProps) {
  const handleBuy = () => {
    if (onBuy) {
      onBuy(listing.id)
    } else {
      toast({
        title: "Coming Soon",
        description: "Purchase functionality will be available once you connect your wallet and the smart contract is deployed.",
      })
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <Card className="glass-card hover:border-primary/50 transition-all duration-300 hover:scale-105 group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {listing.type === 'model' ? (
              <Brain className="h-5 w-5 text-primary" />
            ) : (
              <DatabaseIcon className="h-5 w-5 text-accent" />
            )}
            <Badge variant={listing.type === 'model' ? 'default' : 'secondary'} className="capitalize">
              {listing.type}
            </Badge>
          </div>
        </div>
        <CardTitle className="mt-2">{listing.name}</CardTitle>
        <CardDescription className="line-clamp-2">{listing.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Seller</span>
            <span className="font-mono text-primary">{formatAddress(listing.seller)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Price</span>
            <span className="text-lg font-bold text-primary">{listing.price} ETH</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <Button 
          variant="hero" 
          className="flex-1" 
          onClick={handleBuy}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Buy Now
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => window.open(`https://ipfs.io/ipfs/${listing.cid}`, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
