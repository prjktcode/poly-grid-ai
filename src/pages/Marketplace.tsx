import { useEffect, useMemo, useState } from 'react'
import { ListingCard, type Listing } from '@/components/ListingCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, RefreshCw } from 'lucide-react'
import { usePublicClient } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/contract'
import { ethers } from 'ethers' // used for formatEther
import { buildGatewayUrlFromCid } from '@/utils/ipfs'

export default function Marketplace() {
    const publicClient = usePublicClient()

    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState<'all' | 'model' | 'dataset'>('all')

    const [listings, setListings] = useState<Listing[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)

    // helper: make an IPFS gateway url for a CID or path
    const getIpfsUrl = (cid: string) => {
        if (!cid) return null
        // Common textual CIDs start with Qm... or bafy...
        if (cid.startsWith('Qm') || cid.startsWith('bafy')) {
            return buildGatewayUrlFromCid(cid)
        }
        // If it's already a http/https url
        if (cid.startsWith('http://') || cid.startsWith('https://')) return cid
        // if it's hex or something else, just return null — handle in UI
        return buildGatewayUrlFromCid(cid)
    }

    // optional helper: if you store JSON metadata at IPFS (e.g. name/description/image)
    // this will try to fetch it and merge into the listing object.
    async function fetchMetadataFromIpfs(cid: string) {
        try {
            const url = getIpfsUrl(cid)
            if (!url) return null
            const res = await fetch(url)
            if (!res.ok) return null
            const json = await res.json()
            // Expect typical metadata keys: name, description, image
            return {
                name: typeof json.name === 'string' ? json.name : undefined,
                description: typeof json.description === 'string' ? json.description : undefined,
                image: typeof json.image === 'string' ? json.image : undefined,
                fileCid: typeof json.fileCid === 'string' ? json.fileCid : undefined,
            }
        } catch (err) {
            // don't fail entire load if metadata fetch fails
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

            // Create an array of IDs to fetch: 1..listingCount
            const ids = Array.from({ length: listingCount }, (_, i) => i + 1)

            // Fetch all getListing calls in parallel (Promise.all)
            const calls = ids.map((id) =>
                publicClient.readContract({
                    address: CONTRACT_ADDRESS as `0x${string}`,
                    abi: CONTRACT_ABI,
                    functionName: 'getListing',
                    args: [BigInt(id)],
                }).then(
                    (res) => ({ id, res }),
                    (err) => ({ id, err }), // capture per-item error
                ),
            )

            const results = await Promise.all(calls)

            const nextListings: Listing[] = []

            await Promise.all(
                results.map(async (entry) => {
                    const { id } = entry as any
                    if ((entry as any).err) {
                        // skip failed individual reads (log)
                        console.warn(`Failed to read listing ${id}`, (entry as any).err)
                        return
                    }

                    // the returned tuple from getListing
                    const tuple = (entry as any).res as [
                        string, // contentCID
                        bigint, // price
                        string, // seller
                        bigint, // itemType (could be bigint)
                        boolean, // active
                        bigint // timestamp
                    ]

                    const contentCID = tuple[0] as string
                    console.log('Listing contentCID', id, contentCID)
                    const priceWei = tuple[1] as bigint
                    const seller = tuple[2] as string
                    const itemTypeRaw = tuple[3] as any
                    const active = tuple[4] as boolean
                    const timestamp = tuple[5] as bigint

                    if (!active) return

                    // normalize itemType to Number
                    const itemTypeNum = typeof itemTypeRaw === 'bigint' ? Number(itemTypeRaw) : Number(itemTypeRaw)

                    const type: 'model' | 'dataset' = itemTypeNum === 0 ? 'model' : 'dataset'

                    // format price safely using ethers
                    const priceEth = ethers.formatEther(priceWei).toString()

                    // Try to fetch optional JSON metadata from IPFS (if you store metadata)
                    const meta = await fetchMetadataFromIpfs(contentCID)

                    const name = meta?.name ?? `Listing #${id}`
                    const description =
                        meta?.description ??
                        `On-chain listing created at ${new Date(Number(timestamp) * 1000).toLocaleString()}`

                    // push listing
                    nextListings.push({
                        id,
                        name,
                        description,
                        type,
                        seller,
                        price: priceEth,
                        cid: meta?.fileCid ?? contentCID,
                        previewUrl: meta?.image ? getIpfsUrl(meta.image) : getIpfsUrl(meta?.fileCid ?? contentCID),
                    })
                }),
            )

            // optional: sort by newest
            nextListings.sort((a, b) => b.id - a.id)

            setListings(nextListings)
        } catch (err: any) {
            console.error('Error loading listings', err)
            setLoadError(err?.message ?? 'Failed to load marketplace listings')
        } finally {
            setIsLoading(false)
        }
    }

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
                            <ListingCard key={listing.id} listing={listing} />
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