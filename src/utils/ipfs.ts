import { create } from 'ipfs-http-client'
import { stringToHex, pad } from 'viem'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ipfsClient: any = null

export const initIPFS = (url?: string) => {
    try {
        const ipfsUrl = url || 'https://ipfs.infura.io:5001/api/v0'
        ipfsClient = create({ url: ipfsUrl })
        return ipfsClient
    } catch (error) {
        console.error('Failed to initialize IPFS client:', error)
        throw error
    }
}

export const uploadToIPFS = async (file: File): Promise<string> => {
    try {
        if (!ipfsClient) initIPFS()
        const buffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(buffer)
        const result = await ipfsClient.add(uint8Array, {
            progress: (prog: number) => console.log(`Upload progress: ${prog}`),
        })
        return result.cid.toString()
    } catch (error) {
        console.error('Error uploading to IPFS:', error)
        throw new Error('Failed to upload file to IPFS')
    }
}

export const uploadMetadataToIPFS = async (metadata: object): Promise<string> => {
    try {
        if (!ipfsClient) initIPFS()
        const metadataString = JSON.stringify(metadata)
        const result = await ipfsClient.add(metadataString)
        return result.cid.toString()
    } catch (error) {
        console.error('Error uploading metadata to IPFS:', error)
        throw new Error('Failed to upload metadata to IPFS')
    }
}

export const getFromIPFS = async (cid: string): Promise<Uint8Array> => {
    try {
        if (!ipfsClient) initIPFS()
        const chunks: Uint8Array[] = []
        for await (const chunk of ipfsClient.cat(cid)) {
            chunks.push(chunk)
        }
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
        const result = new Uint8Array(totalLength)
        let offset = 0
        for (const chunk of chunks) {
            result.set(chunk, offset)
            offset += chunk.length
        }
        return result
    } catch (error) {
        console.error('Error getting file from IPFS:', error)
        throw new Error('Failed to retrieve file from IPFS')
    }
}

export const getIPFSGatewayURL = (cid: string, gateway?: string): string => {
    const defaultGateway = gateway || 'https://ipfs.io/ipfs/'
    return `${defaultGateway}${cid}`
}

export const pinToIPFS = async (cid: string): Promise<void> => {
    try {
        if (!ipfsClient) initIPFS()
        await ipfsClient.pin.add(cid)
        console.log(`Successfully pinned ${cid}`)
    } catch (error) {
        console.error('Error pinning to IPFS:', error)
        throw new Error('Failed to pin file to IPFS')
    }
}

/**
 * Upload a File to Pinata's uploads API.
 * Returns the CID string from Pinata.
 */
export const uploadFileToPinata = async (file: File): Promise<string> => {
    const jwt = import.meta.env.VITE_PINATA_JWT
    if (!jwt) {
        console.error('VITE_PINATA_JWT is not set')
        throw new Error('Pinata JWT is not configured')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('network', 'public')

    const request = await fetch('https://uploads.pinata.cloud/v3/files', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
        body: formData,
    })

    if (!request.ok) {
        const text = await request.text()
        console.error('Pinata upload failed:', request.status, text)
        throw new Error(`Pinata upload failed: ${request.status}`)
    }

    const json = await request.json()
    const cid = json?.data?.cid as string | undefined

    if (!cid) {
        console.error('Pinata response missing cid:', json)
        throw new Error('Pinata upload did not return a cid')
    }

    return cid
}

export const uploadJsonToPinata = async (metadata: any): Promise<string> => {
    const jwt = import.meta.env.VITE_PINATA_JWT
    if (!jwt) {
        console.error('VITE_PINATA_JWT is not set')
        throw new Error('Pinata JWT is not configured')
    }

    const blob = new Blob([JSON.stringify(metadata)], {
        type: 'application/json',
    })
    const file = new File([blob], 'metadata.json', { type: 'application/json' })

    return uploadFileToPinata(file)
}

/**
 * Build a gateway URL for a CID using Pinata gateway or a default ipfs.io
 */
export const buildGatewayUrlFromCid = (cid: string): string => {
    const gateway = import.meta.env.VITE_PINATA_GATEWAY_DOMAIN
    if (gateway) {
        return `https://${gateway}/ipfs/${cid}`
    }
    return `https://ipfs.io/ipfs/${cid}`
}

/**
 * Convert a CID string into a bytes32 that Solidity accepts.
 * We:
 *  - encode the CID as UTF-8 to hex
 *  - left-pad/truncate to 32 bytes
 *
 * NOTE: This is NOT reversible for arbitrary long CIDs. It is a handle, not a full CID.
 */
export const cidToBytes32 = (cid: string): `0x${string}` => {
    // stringToHex yields 0x + hex for the UTF-8 string
    const hex = stringToHex(cid) // e.g. 0x616263...
    // pad to 32 bytes (64 hex chars) and truncate if longer
    const padded = pad(hex, { size: 32 }) // returns 0x + 64 hex chars
    return padded as `0x${string}`
}

export default {
    initIPFS,
    uploadToIPFS,
    uploadMetadataToIPFS,
    getFromIPFS,
    getIPFSGatewayURL,
    pinToIPFS,
    uploadFileToPinata,
    uploadJsonToPinata,
    buildGatewayUrlFromCid,
    cidToBytes32,
    
}