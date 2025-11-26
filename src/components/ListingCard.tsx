import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, Database as DatabaseIcon, ShoppingCart, ExternalLink, CheckCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export interface Listing {
    id: number
    name: string
    description: string
    type: 'model' | 'dataset'
    seller: string
    price: string
    cid: string
    purchased?: boolean
    buyer?: string
}

interface ListingCardProps {
    listing: Listing
    onBuy?: (id: number) => void
}

function shortAddress(addr: string) {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr
}

export function ListingCard({ listing, onBuy }: ListingCardProps) {
    const handleBuy = () => {
        if (listing.purchased) {
            toast({ title: 'Already Purchased', description: 'This item is no longer for sale.' })
            return
        }
        if (onBuy) {
            onBuy(listing.id)
        } else {
            toast({ title: 'Connect Wallet', description: 'Please connect your wallet to buy this asset.' })
        }
    }

    return (
        <Card className="glass-card hover:border-primary/50 transition-all duration-300 group">
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
                        {listing.purchased && (
                            <Badge variant="outline" className="flex items-center gap-1 border-green-600 text-green-700">
                                <CheckCircle className="h-3 w-3" /> Purchased
                            </Badge>
                        )}
                    </div>
                </div>
                <CardTitle className="mt-2">{listing.name}</CardTitle>
                <CardDescription className="line-clamp-2">{listing.description}</CardDescription>
            </CardHeader>

            <CardContent>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Seller</span>
                        <span className="font-mono text-primary">{shortAddress(listing.seller)}</span>
                    </div>
                    {listing.purchased && listing.buyer && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Buyer</span>
                            <span className="font-mono text-green-600">{shortAddress(listing.buyer)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Price</span>
                        <span className="text-lg font-bold text-primary">{listing.price} POL</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex gap-2">
                <Button
                    variant="hero"
                    className="flex-1"
                    onClick={handleBuy}
                    disabled={listing.purchased === true}
                >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {listing.purchased ? 'Purchased' : 'Buy Now'}
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