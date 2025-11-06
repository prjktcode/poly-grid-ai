import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload as UploadIcon, FileText, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useAccount } from 'wagmi'

export default function Upload() {
  const { isConnected } = useAccount()
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'model' as 'model' | 'dataset',
    price: '',
    license: '',
  })
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to upload assets",
        variant: "destructive",
      })
      return
    }

    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    // Simulate IPFS upload and smart contract interaction
    setTimeout(() => {
      toast({
        title: "Upload Successful! 🎉",
        description: "Your asset has been listed on the marketplace",
      })
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        type: 'model',
        price: '',
        license: '',
      })
      setFile(null)
      setIsUploading(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Upload Your Asset</h1>
            <p className="text-muted-foreground text-lg">
              Share your AI models or datasets with the community
            </p>
          </div>

          {/* Upload Form */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Asset Details</CardTitle>
              <CardDescription>
                Fill in the information about your AI model or dataset
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., GPT-Style Language Model"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your model or dataset..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: 'model' | 'dataset') => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="model">AI Model</SelectItem>
                      <SelectItem value="dataset">Dataset</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price">Price (ETH) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.5"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                {/* License */}
                <div className="space-y-2">
                  <Label htmlFor="license">License</Label>
                  <Input
                    id="license"
                    placeholder="e.g., MIT, Apache 2.0, Creative Commons"
                    value={formData.license}
                    onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="file">Upload File *</Label>
                  <div className="glass-card p-8 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors">
                    <input
                      id="file"
                      type="file"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      accept=".pkl,.h5,.pt,.pth,.onnx,.csv,.json,.parquet"
                    />
                    <label htmlFor="file" className="cursor-pointer flex flex-col items-center gap-2">
                      {file ? (
                        <>
                          <FileText className="h-12 w-12 text-primary" />
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </>
                      ) : (
                        <>
                          <UploadIcon className="h-12 w-12 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Supported formats: .pkl, .h5, .pt, .pth, .onnx, .csv, .json, .parquet
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="hero"
                  className="w-full"
                  disabled={isUploading || !isConnected}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading to IPFS...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="h-4 w-4 mr-2" />
                      List on Marketplace
                    </>
                  )}
                </Button>

                {!isConnected && (
                  <p className="text-sm text-center text-muted-foreground">
                    Connect your wallet to list assets
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
