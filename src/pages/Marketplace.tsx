import { useEffect, useMemo, useState } from 'react'
import { ListingCard, type Listing } from '@/components/ListingCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, RefreshCw } from 'lucide-react'
import { useAccount, usePublicClient, useWalletClient, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/contract'
import { ethers } from 'ethers' // used for formatEther
import { buildGatewayUrlFromCid } from '@/utils/ipfs'
import { toast } from '@/hooks/use-toast'
import { parseEther } from 'viem'

export default function Marketplace() {
    const publicClient = usePublicClient()
    const { address, isConnected } = useAccount()
    const { data: walletClient } = useWalletClient()

    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState<'all' | 'model' | 'dataset'>('all')

    const [listings, setListings] = useState<Listing[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)

    const [buyTxHash, setBuyTxHash] = useState<`0x${string}` | undefined>(undefined)

    const {
        isLoading: isBuyConfirming,
        isSuccess: isBuyConfirmed,
        error: buyTxError,
    } = useWaitForTransactionReceipt({
        hash: buyTxHash,
    })

    // helper: make an IPFS/Pinata gateway url for a CID or path
    const getIpfsUrl = (cid: string) => {
        if (!cid) return null
        // If it's already a http/https url
        if (cid.startsWith('http://') || cid.startsWith('https://')) return cid
        // Use Pinata gateway if configured, else ipfs.io
        return buildGatewayUrlFromCid(cid)
    }

    async function fetchMetadataFromIpfs(cid: string) {
        try {
            const url = getIpfsUrl(cid)
            if (!url) {
                console.warn('No URL for CID', cid)
                return null
            }

            console.log('Fetching metadata from', url)
            const res = await fetch(url)
            if (!res.ok) {
                console.warn('Metadata fetch failed', cid, res.status)
                return null
            }

            const json = await res.json()
            console.log('Metadata JSON for CID', cid, json)

            return {
                name: typeof json.name === 'string' ? json.name : undefined,
                description: typeof json.description === 'string' ? json.description : undefined,
                image: typeof json.image === 'string' ? json.image : undefined,
                fileCid: typeof json.fileCid === 'string' ? json.fileCid : undefined,
            }
        } catch (err) {
            console.warn('Metadata fetch error', cid, err)
            return null
        }
    }
    const loadListings = async () => {
        if (!publicClient) return
        setIsLoading(true)
        setLoadError(null)

        try {
            // 1) Read total listing count (returns bigint)
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

            const nextListings: Listing[] = []

            await Promise.all(
                results.map(async (entry) => {
                    const { id } = entry as any
                    if ((entry as any).err) {
                        console.warn(`Failed to read listing ${id}`, (entry as any).err)
                        return
                    }

                    const tuple = (entry as any).res as [
                        string, // contentCID (metadata CID)
                        bigint, // price
                        string, // seller
                        bigint, // itemType
                        boolean, // active
                        bigint, // timestamp
                    ]

                    const contentCID = tuple[0] as string
                    const priceWei = tuple[1] as bigint
                    const seller = tuple[2] as string
                    const itemTypeRaw = tuple[3] as any
                    const active = tuple[4] as boolean
                    const timestamp = tuple[5] as bigint

                    if (!active) return

                    const itemTypeNum = typeof itemTypeRaw === 'bigint' ? Number(itemTypeRaw) : Number(itemTypeRaw)
                    const type: 'model' | 'dataset' = itemTypeNum === 0 ? 'model' : 'dataset'
                    const priceEth = ethers.formatEther(priceWei).toString()

                    const meta = await fetchMetadataFromIpfs(contentCID)

                    const name = meta?.name ?? `Listing #${id}`
                    const description =
                        meta?.description ??
                        `On-chain listing created at ${new Date(Number(timestamp) * 1000).toLocaleString()}`

                    const assetCid = meta?.fileCid ?? contentCID

                    nextListings.push({
                        id,
                        name,
                        description,
                        type,
                        seller,
                        price: priceEth,
                        cid: assetCid,
                    })
                }),
            )

            nextListings.sort((a, b) => b.id - a.id)
            setListings(nextListings)
        } catch (err: any) {
            console.error('Error loading listings', err)
            setLoadError(err?.message ?? 'Failed to load marketplace listings')
        } finally {
            setIsLoading(false)
        }
    }

    // Handle buy transaction error
    useEffect(() => {
        if (buyTxError) {
            console.error('Buy transaction error', buyTxError)
            toast({
                title: 'Purchase Failed',
                description: buyTxError.message ?? 'The purchase transaction failed or was reverted',
                variant: 'destructive',
            })
        }
    }, [buyTxError])

    // Handle buy transaction success
    useEffect(() => {
        if (isBuyConfirmed && buyTxHash) {
            toast({
                title: 'Purchase Successful 🎉',
                description: 'You have successfully purchased this asset.',
            })
            setBuyTxHash(undefined)
            void loadListings() // refresh to hide inactive listing
        }
    }, [isBuyConfirmed, buyTxHash])

    // Initial load
    useEffect(() => {
        void loadListings()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [publicClient])

    const filteredListings = useMemo(() => {
        const q = searchQuery.toLowerCase()
        return listings.filter((listing) => {
            const matchesSearch =
                (listing.name ?? '').toLowerCase().includes(q) ||
                (listing.description ?? '').toLowerCase().includes(q) ||
                (listing.cid ?? '').toLowerCase().includes(q)

            const matchesType = filterType === 'all' || listing.type === filterType
            return matchesSearch && matchesType
        })
    }, [listings, searchQuery, filterType])

    const handleBuy = async (id: number) => {
        if (!isConnected || !address || !walletClient) {
            toast({
                title: 'Wallet Not Connected',
                description: 'Please connect your wallet to buy assets',
                variant: 'destructive',
            })
            return
        }

        const listing = listings.find((l) => l.id === id)
        if (!listing) {
            toast({
                title: 'Listing Not Found',
                description: 'Unable to find this listing in the current view.',
                variant: 'destructive',
            })
            return
        }

        try {
            // Parse price (ETH string) to wei
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

            toast({
                title: 'Purchase Submitted',
                description: 'Please wait for confirmation on-chain…',
            })
        } catch (error: any) {
            console.error('buyItem error', error)
            toast({
                title: 'Purchase Failed',
                description: error?.shortMessage || error?.message || 'Failed to purchase this asset',
                variant: 'destructive',
            })
        }
    }

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-12">
                {/* Header */}
                <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">AI Marketplace</h1>
                        <p className="text-muted-foreground text-lg">
                            Discover and purchase AI models and datasets from creators worldwide
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="inline-flex items-center gap-2"
                        onClick={() => void loadListings()}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Search and Filters */}
                <div className="glass-card p-6 rounded-xl mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search models, datasets, or CIDs..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select
                            value={filterType}
                            onValueChange={(value: 'all' | 'model' | 'dataset') => setFilterType(value)}
                        >
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

                {/* Error / Empty / Listings */}
                {loadError && (
                    <div className="glass-card p-4 rounded-xl mb-6 text-sm text-red-500">
                        {loadError}
                    </div>
                )}

                {isLoading && listings.length === 0 ? (
                    <div className="glass-card p-12 rounded-xl text-center">
                        <p className="text-muted-foreground text-lg">Loading listings from the blockchain…</p>
                    </div>
                ) : filteredListings.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredListings.map((listing) => (
                            <ListingCard key={listing.id} listing={listing} onBuy={handleBuy} />
                        ))}
                    </div>
                ) : (
                    <div className="glass-card p-12 rounded-xl text-center">
                        <p className="text-muted-foreground text-lg">
                            No listings found. Try adjusting your search or filters, or upload a new asset.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}