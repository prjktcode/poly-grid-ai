import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload as UploadIcon, FileText, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import {
    useAccount,
    usePublicClient,
    useWalletClient,
    useWaitForTransactionReceipt,
} from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/contract'
import { uploadFileToPinata, uploadJsonToPinata } from '@/utils/ipfs'
import { parseEther } from 'viem'


export default function Upload() {
    const navigate = useNavigate()
    const { address, isConnected } = useAccount()
    const publicClient = usePublicClient()
    const { data: walletClient } = useWalletClient()

    const [isUploading, setIsUploading] = useState(false)
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined)

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'model' as 'model' | 'dataset',
        price: '',
        license: '',
    })
    const [file, setFile] = useState<File | null>(null)

    const {
        isLoading: isConfirming,
        isSuccess: isConfirmed,
        error: txError,
    } = useWaitForTransactionReceipt({ hash: txHash })

    const isBusy = isUploading || isConfirming

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!isConnected || !address || !walletClient || !publicClient) {
            toast({
                title: 'Wallet Not Connected',
                description: 'Please connect your wallet to upload assets',
                variant: 'destructive',
            })
            return
        }

        if (!file) {
            toast({
                title: 'No File Selected',
                description: 'Please select a file to upload',
                variant: 'destructive',
            })
            return
        }

        if (!formData.price || Number(formData.price) <= 0) {
            toast({
                title: 'Invalid Price',
                description: 'Please enter a valid price in ETH',
                variant: 'destructive',
            })
            return
        }

        try {
            setIsUploading(true)
            setTxHash(undefined)

            // 1) Upload raw file to Pinata
            const fileCid = await uploadFileToPinata(file)

            // 2) Build metadata object including form fields + fileCid
            const metadata = {
                name: formData.name,
                description: formData.description,
                type: formData.type,
                price: formData.price,
                license: formData.license,
                fileCid,
                createdAt: new Date().toISOString(),
            }

            // 3) Upload metadata JSON to Pinata and get metadataCid
            const metadataCid = await uploadJsonToPinata(metadata)

            // 4) Convert price to wei
            const priceWei = parseEther(formData.price)

            // 5) Map type
            const itemType = formData.type === 'model' ? 0 : 1

            // 6) Call listItem with metadataCid
            const tx = await walletClient.writeContract({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: CONTRACT_ABI,
                functionName: 'listItem',
                args: [metadataCid, priceWei, itemType],
                account: address,
            })

            setTxHash(tx)

            toast({
                title: 'Transaction Submitted',
                description: 'Please wait for confirmation on-chain…',
            })
        } catch (error: any) {
            console.error('Upload/listItem error', error)
            toast({
                title: 'Upload Failed',
                description: error?.shortMessage || error?.message || 'Failed to upload asset or list on-chain',
                variant: 'destructive',
            })
            setIsUploading(false)
        }
    }

    useEffect(() => {
        if (txError) {
            console.error('Transaction error', txError)
            toast({
                title: 'Transaction Failed',
                description: txError.message ?? 'The transaction was reverted or failed',
                variant: 'destructive',
            })
            setIsUploading(false)
        }
    }, [txError])

    useEffect(() => {
        if (isConfirmed && txHash) {
            toast({
                title: 'Upload Successful 🎉',
                description: 'Your asset has been listed on the marketplace',
            })

            setFormData({
                name: '',
                description: '',
                type: 'model',
                price: '',
                license: '',
            })
            setFile(null)
            setIsUploading(false)
            navigate('/marketplace')
        }
    }, [isConfirmed, txHash, navigate])

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
                                        onValueChange={(value: 'model' | 'dataset') =>
                                            setFormData({ ...formData, type: value })
                                        }
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
                                    <Label htmlFor="price">Price (POL) *</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.0000001"
                                        min="0"
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
                                    disabled={isBusy || !isConnected}
                                >
                                    {isBusy ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            {isUploading ? 'Uploading to Pinata...' : 'Confirming transaction...'}
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