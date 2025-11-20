import { create } from 'ipfs-http-client';

// IPFS client configuration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ipfsClient: any = null;

/**
 * Initialize IPFS client
 * @param url Optional custom IPFS gateway URL
 */
export const initIPFS = (url?: string) => {
  try {
    // Use local IPFS node or public gateway
    const ipfsUrl = url || 'https://ipfs.infura.io:5001/api/v0';
    
    ipfsClient = create({
      url: ipfsUrl,
    });
    
    return ipfsClient;
  } catch (error) {
    console.error('Failed to initialize IPFS client:', error);
    throw error;
  }
};

/**
 * Upload file to IPFS
 * @param file File to upload
 * @returns IPFS CID (Content Identifier)
 */
export const uploadToIPFS = async (file: File): Promise<string> => {
  try {
    if (!ipfsClient) {
      initIPFS();
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Upload to IPFS
    const result = await ipfsClient.add(uint8Array, {
      progress: (prog: number) => console.log(`Upload progress: ${prog}`),
    });

    return result.cid.toString();
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error('Failed to upload file to IPFS');
  }
};

/**
 * Upload JSON metadata to IPFS
 * @param metadata JSON object to upload
 * @returns IPFS CID
 */
export const uploadMetadataToIPFS = async (metadata: object): Promise<string> => {
  try {
    if (!ipfsClient) {
      initIPFS();
    }

    const metadataString = JSON.stringify(metadata);
    const result = await ipfsClient.add(metadataString);

    return result.cid.toString();
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error);
    throw new Error('Failed to upload metadata to IPFS');
  }
};

/**
 * Get file from IPFS
 * @param cid IPFS Content Identifier
 * @returns File content as Uint8Array
 */
export const getFromIPFS = async (cid: string): Promise<Uint8Array> => {
  try {
    if (!ipfsClient) {
      initIPFS();
    }

    const chunks: Uint8Array[] = [];
    
    for await (const chunk of ipfsClient.cat(cid)) {
      chunks.push(chunk);
    }

    // Concatenate chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  } catch (error) {
    console.error('Error getting file from IPFS:', error);
    throw new Error('Failed to retrieve file from IPFS');
  }
};

/**
 * Get IPFS gateway URL for a CID
 * @param cid IPFS Content Identifier
 * @param gateway Optional custom gateway URL
 * @returns Full gateway URL
 */
export const getIPFSGatewayURL = (cid: string, gateway?: string): string => {
  const defaultGateway = gateway || 'https://ipfs.io/ipfs/';
  return `${defaultGateway}${cid}`;
};

/**
 * Pin file to IPFS (for persistence)
 * @param cid Content Identifier to pin
 */
export const pinToIPFS = async (cid: string): Promise<void> => {
  try {
    if (!ipfsClient) {
      initIPFS();
    }

    await ipfsClient.pin.add(cid);
    console.log(`Successfully pinned ${cid}`);
  } catch (error) {
    console.error('Error pinning to IPFS:', error);
    throw new Error('Failed to pin file to IPFS');
  }
};

/**
 * Convert string to bytes32 for smart contract
 * @param str String to convert (IPFS CID)
 * @returns Bytes32 hex string
 */
export const stringToBytes32 = (str: string): string => {
  // For IPFS CIDs, we can use the hash directly
  // This is a simplified version - in production, properly decode the CID
  const hex = Buffer.from(str).toString('hex').padEnd(64, '0').slice(0, 64);
  return '0x' + hex;
};

/**
 * Convert bytes32 from smart contract to string
 * @param bytes32 Hex string from contract
 * @returns Original string
 */
export const bytes32ToString = (bytes32: string): string => {
  // Remove 0x prefix and trailing zeros
  const hex = bytes32.replace('0x', '').replace(/0+$/, '');
  return Buffer.from(hex, 'hex').toString();
};

export default {
  initIPFS,
  uploadToIPFS,
  uploadMetadataToIPFS,
  getFromIPFS,
  getIPFSGatewayURL,
  pinToIPFS,
  stringToBytes32,
  bytes32ToString,
};
