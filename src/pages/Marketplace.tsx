import { useEffect, useMemo, useState } from 'react'
import { ListingCard, type Listing } from '@/components/ListingCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { useAccount, usePublicClient, useWalletClient, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/contract'
import { ethers } from 'ethers'
import { buildGatewayUrlFromCid } from '@/utils/ipfs'
import { toast } from '@/hooks/use-toast'
import { parseEther } from 'viem'

interface ExtendedListing extends Listing {
    purchased?: boolean
    buyer?: string
}

const PURCHASE_EVENT_NAME = 'ItemPurchased'

function shortAddress(addr: string) {
    return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr
}

export default function Marketplace() {
    const publicClient = usePublicClient()
    const { address, isConnected } = useAccount()
    const { data: walletClient } = useWalletClient()

    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState<'all' | 'model' | 'dataset'>('all')
    const [showPurchased, setShowPurchased] = useState(true)

    const [listings, setListings] = useState<ExtendedListing[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)

    const [buyTxHash, setBuyTxHash] = useState<`0x${string}` | undefined>(undefined)

    const { isSuccess: isBuyConfirmed, error: buyTxError } = useWaitForTransactionReceipt({ hash: buyTxHash })

    const getIpfsUrl = (cid: string) => {
        if (!cid) return null
        if (cid.startsWith('http://') || cid.startsWith('https://')) return cid
        return buildGatewayUrlFromCid(cid)
    }

    async function fetchMetadataFromIpfs(cid: string) {
        try {
            const url = getIpfsUrl(cid)
            if (!url) return null
            const res = await fetch(url)
            if (!res.ok) return null
            const json = await res.json()
            return {
                name: typeof json.name === 'string' ? json.name : undefined,
                description: typeof json.description === 'string' ? json.description : undefined,
                image: typeof json.image === 'string' ? json.image : undefined,
                fileCid: typeof json.fileCid === 'string' ? json.fileCid : undefined,
            }
        } catch {
            return null
        }
    }

    const loadListings = async () => {
        if (!publicClient) return
        setIsLoading(true)
        setLoadError(null)

        try {
            const listingCountBig = (await publicClient.readContract({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: CONTRACT_ABI,
                functionName: 'listingCount',
            })) as bigint

            const listingCount = Number(listingCountBig)
            if (listingCount === 0) {
                setListings([])
                return
            }

            const purchaseMap: Record<number, string> = {}
            try {
                const purchaseLogs = await publicClient.getLogs({
                    address: CONTRACT_ADDRESS as `0x${string}`,
                    abi: CONTRACT_ABI,
                    eventName: PURCHASE_EVENT_NAME,
                    fromBlock: 0n,
                    toBlock: 'latest',
                })
                purchaseLogs.forEach((log: any) => {
                    const { args } = log
                    if (!args) return
                    // event ItemPurchased(uint256 listingId, address buyer, address seller, uint256 price, uint256 timestamp)
                    const listingId = Number(args.listingId ?? args[0])
                    const buyer = (args.buyer ?? args[1]) as string
                    if (listingId && buyer) purchaseMap[listingId] = buyer
                })
            } catch (e) {
                console.warn('Purchase logs not available:', e)
            }

            const ids = Array.from({ length: listingCount }, (_, i) => i + 1)
            const calls = ids.map((id) =>
                publicClient
                    .readContract({
                        address: CONTRACT_ADDRESS as `0x${string}`,
                        abi: CONTRACT_ABI,
                        functionName: 'getListing',
                        args: [BigInt(id)],
                    })
                    .then(
                        (res) => ({ id, res }),
                        (err) => ({ id, err }),
                    ),
            )

            const results = await Promise.all(calls)
            const nextListings: ExtendedListing[] = []

            await Promise.all(
                results.map(async (entry) => {
                    const { id } = entry as any
                    if ((entry as any).err) return

                    const tuple = (entry as any).res as [
                        string,
                        bigint,
                        string,
                        bigint,
                        boolean,
                        bigint,
                    ]

                    const contentCID = tuple[0]
                    const priceWei = tuple[1]
                    const seller = tuple[2]
                    const itemTypeRaw = tuple[3]
                    const active = tuple[4]
                    const timestamp = tuple[5]

                    const itemTypeNum = Number(itemTypeRaw)
                    const type: 'model' | 'dataset' = itemTypeNum === 0 ? 'model' : 'dataset'
                    const priceEth = ethers.formatEther(priceWei).toString()

                    const meta = await fetchMetadataFromIpfs(contentCID)
                    const name = meta?.name ?? `Listing #${id}`
                    const description =
                        meta?.description ?? `On-chain listing created at ${new Date(Number(timestamp) * 1000).toLocaleString()}`
                    const assetCid = meta?.fileCid ?? contentCID

                    const purchased = !active && purchaseMap[id] !== undefined
                    const buyer = purchaseMap[id]

                    if (active || purchased) {
                        nextListings.push({
                            id,
                            name,
                            description,
                            type,
                            seller,
                            price: priceEth,
                            cid: assetCid,
                            purchased,
                            buyer,
                        })
                    }
                }),
            )

            nextListings.sort((a, b) => {
                if (a.purchased === b.purchased) return b.id - a.id
                return a.purchased ? 1 : -1
            })

            setListings(nextListings)
        } catch (err: any) {
            setLoadError(err?.message ?? 'Failed to load marketplace listings')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (buyTxError) {
            toast({
                title: 'Purchase Failed',
                description: buyTxError.message ?? 'Transaction reverted',
                variant: 'destructive',
            })
        }
    }, [buyTxError])

    useEffect(() => {
        if (isBuyConfirmed && buyTxHash) {
            toast({ title: 'Purchase Successful 🎉', description: 'Asset purchased.' })
            setBuyTxHash(undefined)
            void loadListings()
        }
    }, [isBuyConfirmed, buyTxHash])

    useEffect(() => {
        void loadListings()
    }, [publicClient])

    const filteredListings = useMemo(() => {
        const q = searchQuery.toLowerCase()
        return listings.filter((l) => {
            if (!showPurchased && l.purchased) return false
            const matchesSearch =
                (l.name ?? '').toLowerCase().includes(q) ||
                (l.description ?? '').toLowerCase().includes(q) ||
                (l.cid ?? '').toLowerCase().includes(q)
            const matchesType = filterType === 'all' || l.type === filterType
            return matchesSearch && matchesType
        })
    }, [listings, searchQuery, filterType, showPurchased])

    const handleBuy = async (id: number) => {
        if (!isConnected || !address || !walletClient) {
            toast({ title: 'Wallet Not Connected', description: 'Connect your wallet to buy.', variant: 'destructive' })
            return
        }
        const listing = listings.find((l) => l.id === id)
        if (!listing) {
            toast({ title: 'Listing Not Found', description: 'Cannot locate listing.', variant: 'destructive' })
            return
        }
        if (listing.purchased) {
            toast({ title: 'Already Purchased', description: 'This item is no longer for sale.', variant: 'destructive' })
            return
        }
        if (listing.seller.toLowerCase() === address.toLowerCase()) {
            toast({ title: 'Own Listing', description: 'You cannot purchase your own listing.', variant: 'destructive' })
            return
        }
        try {
            const value = parseEther(listing.price)
            const txHash = await walletClient.writeContract({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: CONTRACT_ABI,
                functionName: 'buyItem',
                args: [BigInt(id)],
                account: address,
                value,
            })
            setBuyTxHash(txHash)
            toast({ title: 'Purchase Submitted', description: 'Waiting for confirmation…' })
        } catch (error: any) {
            toast({ title: 'Purchase Failed', description: error?.shortMessage || error?.message, variant: 'destructive' })
        }
    }

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-12">
                <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">AI Marketplace</h1>
                        <p className="text-muted-foreground text-lg">Discover and purchase AI models and datasets</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => void loadListings()}
                            disabled={isLoading}
                            className="inline-flex gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setShowPurchased((p) => !p)}
                            className="inline-flex gap-2"
                        >
                            {showPurchased ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            {showPurchased ? 'Hide Purchased' : 'Show Purchased'}
                        </Button>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-xl mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search models, datasets, or CIDs..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={filterType} onValueChange={(v: 'all' | 'model' | 'dataset') => setFilterType(v)}>
                            <SelectTrigger className="w-full md:w-48">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="model">Models Only</SelectItem>
                                <SelectItem value="dataset">Datasets Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {loadError && (
                    <div className="glass-card p-4 rounded-xl mb-6 text-sm text-red-500">{loadError}</div>
                )}

                {isLoading && listings.length === 0 ? (
                    <div className="glass-card p-12 rounded-xl text-center">
                        <p className="text-muted-foreground text-lg">Loading listings…</p>
                    </div>
                ) : filteredListings.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredListings.map((l) => (
                            <ListingCard key={l.id} listing={l} onBuy={handleBuy} />
                        ))}
                    </div>
                ) : (
                    <div className="glass-card p-12 rounded-xl text-center">
                        <p className="text-muted-foreground text-lg">No listings found.</p>
                    </div>
                )}
            </div>
        </div>
    )
}