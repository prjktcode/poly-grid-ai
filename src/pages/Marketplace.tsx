import { ListingCard, type Listing } from '@/components/ListingCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter } from 'lucide-react'
import { useState } from 'react'

// Mock data - will be replaced with smart contract data
const mockListings: Listing[] = [
  {
    id: 1,
    name: "GPT-Style Language Model",
    description: "A transformer-based language model trained on 50B tokens. Excellent for text generation and completion tasks.",
    type: "model",
    seller: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    price: "0.5",
    cid: "QmX3fKj7YaWWCj2YPdQMk1LfYHQHqfZfVtqVaHzPxH6Cz7"
  },
  {
    id: 2,
    name: "Medical Imaging Dataset",
    description: "10,000+ labeled medical images for disease classification. Includes X-rays and MRI scans.",
    type: "dataset",
    seller: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    price: "0.3",
    cid: "QmY4gHj8ZbWXDk3QMk2LfYIRHrfZfVtqWbIaPxI7Dz8"
  },
  {
    id: 3,
    name: "Computer Vision Model",
    description: "ResNet-based image classifier trained on ImageNet. 95% accuracy on validation set.",
    type: "model",
    seller: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    price: "0.4",
    cid: "QmZ5hHk9acWXEl4RNk3LgZJSIsfZgWurXcJbQyJ8Ez9"
  },
  {
    id: 4,
    name: "Sentiment Analysis Dataset",
    description: "1M+ tweets with sentiment labels. Perfect for NLP training and research.",
    type: "dataset",
    seller: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    price: "0.25",
    cid: "QmW6iIm0cdXYFm5SNl4MgAJTJyfZhWvsYdKbRzK0Fa10"
  },
  {
    id: 5,
    name: "Speech Recognition Model",
    description: "State-of-the-art ASR model with 98% accuracy. Supports multiple languages.",
    type: "model",
    seller: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    price: "0.6",
    cid: "QmX7jJn1deYZGn6TQm5NgBKUKygZiWyKaRzL1Gb11"
  },
  {
    id: 6,
    name: "Financial Time Series Data",
    description: "Historical stock data for 5000+ companies spanning 20 years. Perfect for ML training.",
    type: "dataset",
    seller: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    price: "0.35",
    cid: "QmY8kKo2efaZHo7URm6OhCLWnZjXbSzMaRzM2Hc12"
  }
]

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'model' | 'dataset'>('all')

  const filteredListings = mockListings.filter(listing => {
    const matchesSearch = listing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || listing.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">AI Marketplace</h1>
          <p className="text-muted-foreground text-lg">
            Discover and purchase AI models and datasets from creators worldwide
          </p>
        </div>

        {/* Search and Filters */}
        <div className="glass-card p-6 rounded-xl mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search models and datasets..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
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

        {/* Listings Grid */}
        {filteredListings.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 rounded-xl text-center">
            <p className="text-muted-foreground text-lg">No listings found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}
