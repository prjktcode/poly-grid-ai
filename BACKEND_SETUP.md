# Backend Components - Decentralized AI Marketplace

This document provides comprehensive setup and deployment instructions for the backend components of the PolyGrid AI decentralized marketplace.

## 📋 Overview

The backend consists of:
- **Smart Contract**: `DataHiveMarket.sol` - Solidity contract for marketplace operations
- **Deployment Scripts**: Automated deployment to Polygon Amoy and Sepolia testnets
- **Test Suite**: Comprehensive tests for contract functionality
- **IPFS Integration**: Utilities for decentralized file storage
- **Configuration**: Network setup and contract ABIs for frontend integration

## 🏗️ Architecture

### Smart Contract Features
- **List Items**: Sellers can list AI models and datasets with IPFS CIDs
- **Purchase Items**: Secure buying with platform fee management
- **Ownership Transfer**: Automatic payment distribution to sellers
- **Platform Fees**: Configurable marketplace fees (default 2.5%)
- **Security**: ReentrancyGuard and access control mechanisms

### Networks Supported
- **Polygon Amoy Testnet** (Recommended): Chain ID 80002
- **Ethereum Sepolia Testnet** (Backup): Chain ID 11155111
- **Local Hardhat Network**: For development and testing

## 📦 Installation

### Prerequisites
```bash
Node.js >= 18.0.0
npm or yarn
MetaMask or compatible Web3 wallet
```

### Install Dependencies
```bash
npm install

# Or with legacy peer deps if needed
npm install --legacy-peer-deps
```

### Key Dependencies Installed
- `hardhat@^2.22.0` - Ethereum development environment
- `@nomicfoundation/hardhat-toolbox` - Hardhat plugin suite
- `@openzeppelin/contracts` - Secure smart contract library
- `ethers@^6.4.0` - Ethereum library for JavaScript
- `ipfs-http-client` - IPFS JavaScript client
- `helia` & `@helia/unixfs` - Modern IPFS implementation

## ⚙️ Configuration

### 1. Environment Variables

Create a `.env` file in the project root:

```env
# Private key for deployment (NEVER commit this!)
PRIVATE_KEY=your_private_key_here

# Network RPC URLs
AMOY_RPC_URL=https://rpc-amoy.polygon.technology/
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Block Explorer API Keys (for contract verification)
POLYGONSCAN_API_KEY=your_polygonscan_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key

# Frontend Configuration
VITE_CONTRACT_ADDRESS=deployed_contract_address_here

# IPFS Configuration (Optional)
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_KEY=your_pinata_secret_key
```

**Security Note**: Never commit your `.env` file. It's already in `.gitignore`.

### 2. Get Testnet Tokens

#### Polygon Amoy (MATIC)
- [Polygon Faucet](https://faucet.polygon.technology/)
- [Alchemy Polygon Faucet](https://www.alchemy.com/faucets/polygon-amoy)

#### Ethereum Sepolia (ETH)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)

## 🚀 Deployment

### Local Testing

#### 1. Start Local Hardhat Network
```bash
npm run node
```

This starts a local Ethereum network at `http://localhost:8545`.

#### 2. Deploy to Local Network
```bash
npm run deploy:local
```

### Testnet Deployment

#### Deploy to Polygon Amoy (Recommended)
```bash
npm run deploy:amoy
```

#### Deploy to Ethereum Sepolia
```bash
npm run deploy:sepolia
```

### After Deployment

1. **Save the Contract Address**: Copy the deployed contract address from the console output.

2. **Update Frontend Configuration**: 
   - Add the address to your `.env` file as `VITE_CONTRACT_ADDRESS`
   - Or directly update `src/config/contract.ts`

3. **Verify Contract** (Optional but recommended):
```bash
npm run verify:amoy DEPLOYED_CONTRACT_ADDRESS

# Or for Sepolia
npm run verify:sepolia DEPLOYED_CONTRACT_ADDRESS
```

## 🧪 Testing

### Run All Tests
```bash
npm run test:contracts
```

### Test Coverage
The test suite includes comprehensive coverage for:
- ✅ Contract deployment
- ✅ Listing creation and validation  
- ✅ Item purchases and payment distribution
- ✅ Platform fee calculations
- ✅ Access control and permissions
- ✅ Edge cases and error handling

### Example Test Output
```
DataHiveMarket
  Deployment
    ✔ Should set the right owner
    ✔ Should set the initial platform fee
  Listing Items
    ✔ Should list an item successfully
    ✔ Should revert if price is 0
  Buying Items
    ✔ Should purchase an item successfully
    ✔ Should refund excess payment
```

## 📝 Smart Contract API

### Core Functions

#### `listItem(bytes32 _contentCID, uint256 _price, uint8 _itemType)`
Lists a new item on the marketplace.
- `_contentCID`: IPFS content identifier (bytes32)
- `_price`: Price in wei
- `_itemType`: 0 = model, 1 = dataset

#### `buyItem(uint256 _listingId) payable`
Purchases an item from the marketplace.
- `_listingId`: ID of the listing to purchase
- Requires `msg.value >= listing.price`

#### `getListing(uint256 _listingId)`
Returns listing details.
- Returns: (contentCID, price, seller, itemType, active, timestamp)

#### `deactivateListing(uint256 _listingId)`
Deactivates a listing (seller or owner only).

#### `getActiveListingsCount()`
Returns the count of currently active listings.

### Admin Functions (Owner Only)

#### `updatePlatformFee(uint256 _newFee)`
Updates the platform fee (max 10%).

#### `updateFeeRecipient(address payable _newRecipient)`
Updates the fee recipient address.

## 🌐 IPFS Integration

### Upload File to IPFS

```typescript
import { uploadToIPFS, stringToBytes32 } from '@/utils/ipfs';

const file = // File object from input
const cid = await uploadToIPFS(file);
const bytes32CID = stringToBytes32(cid);

// Use bytes32CID in smart contract
await contract.listItem(bytes32CID, price, itemType);
```

### Upload Metadata

```typescript
import { uploadMetadataToIPFS } from '@/utils/ipfs';

const metadata = {
  name: "GPT Model",
  description: "...",
  type: "model",
  // ... other metadata
};

const metadataCID = await uploadMetadataToIPFS(metadata);
```

### Retrieve from IPFS

```typescript
import { getFromIPFS, getIPFSGatewayURL } from '@/utils/ipfs';

// Direct download
const data = await getFromIPFS(cid);

// Or use gateway URL
const url = getIPFSGatewayURL(cid);
// e.g., https://ipfs.io/ipfs/QmXXX...
```

## 🔗 Frontend Integration

### Configure Wagmi with Polygon Amoy

The `src/config/wagmi.ts` has been updated to include Polygon Amoy:

```typescript
import { POLYGON_AMOY } from './contract'

export const config = createConfig({
  chains: [POLYGON_AMOY, sepolia],
  // ... connectors
})
```

### Interact with Contract

```typescript
import { useContractWrite, useContractRead } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/contract';
import { parseEther } from 'viem';

// List an item
const { write: listItem } = useContractWrite({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'listItem',
});

await listItem({
  args: [contentCID, parseEther('0.5'), 0], // 0.5 ETH, type: model
});

// Buy an item
const { write: buyItem } = useContractWrite({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'buyItem',
});

await buyItem({
  args: [listingId],
  value: parseEther('0.5'),
});

// Read listing
const { data: listing } = useContractRead({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'getListing',
  args: [listingId],
});
```

## 🔒 Security Considerations

### Smart Contract Security
- ✅ Uses OpenZeppelin's battle-tested contracts
- ✅ ReentrancyGuard prevents reentrancy attacks
- ✅ Access control with Ownable pattern
- ✅ Input validation on all functions
- ✅ Safe payment handling with low-level calls

### Best Practices
1. **Never commit private keys** - Use environment variables
2. **Audit before mainnet** - Get professional security audit
3. **Test thoroughly** - Run comprehensive test suite
4. **Use multisig** - For contract ownership on mainnet
5. **Monitor transactions** - Set up alerts for unusual activity

## 📊 Gas Optimization

The contract is optimized for gas efficiency:
- Optimizer enabled (200 runs)
- Efficient storage patterns
- Minimal external calls
- Batch operations where possible

Estimated gas costs (Polygon Amoy):
- List Item: ~80,000 gas
- Buy Item: ~100,000 gas  
- Get Listing: <30,000 gas (read-only)

## 🛠️ Troubleshooting

### Issue: Compiler Download Failed
**Solution**: The Solidity compiler needs to download from `binaries.soliditylang.org`. If blocked:
1. Check network connectivity
2. Use a VPN if domain is blocked
3. Pre-download compilers manually

### Issue: Transaction Fails
**Solution**:
1. Check you have enough testnet tokens
2. Verify the correct network is selected in MetaMask
3. Increase gas limit if needed
4. Check contract state (listing active, sufficient payment, etc.)

### Issue: IPFS Upload Fails
**Solution**:
1. Verify IPFS gateway is accessible
2. Check file size limits
3. Use Pinata or NFT.Storage for production
4. Implement retry logic for network issues

## 📚 Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Polygon Documentation](https://docs.polygon.technology/)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [Wagmi Documentation](https://wagmi.sh/)

## 🤝 Contributing

When contributing to the backend:
1. Write tests for new features
2. Follow Solidity style guide
3. Update documentation
4. Test on testnets before mainnet
5. Get code review for security-critical changes

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check this documentation first
2. Review existing GitHub issues
3. Create a new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node version, network, etc.)

---

**Built with ❤️ for decentralized AI marketplace**
