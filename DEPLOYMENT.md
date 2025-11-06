# 🚀 PolyGradient Deployment Guide

## Smart Contract Setup

To fully enable the marketplace functionality, you'll need to deploy the `DataHiveMarket.sol` smart contract to Ethereum Sepolia testnet.

### Prerequisites

1. **Hardhat Environment**
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   ```

2. **Smart Contract Example** (`contracts/DataHiveMarket.sol`)
   ```solidity
   // SPDX-License-Identifier: MIT
   pragma solidity ^0.8.20;

   contract DataHiveMarket {
       struct Listing {
           bytes32 contentCID;
           uint256 price;
           address seller;
           uint8 itemType; // 0 = model, 1 = dataset
           bool active;
       }

       mapping(uint256 => Listing) public listings;
       uint256 public listingCount;

       event ItemListed(uint256 indexed id, address seller, uint256 price, uint8 itemType);
       event ItemPurchased(uint256 indexed id, address buyer, address seller, uint256 price);

       function listItem(bytes32 _contentCID, uint256 _price, uint8 _itemType) public {
           listingCount++;
           listings[listingCount] = Listing({
               contentCID: _contentCID,
               price: _price,
               seller: msg.sender,
               itemType: _itemType,
               active: true
           });
           emit ItemListed(listingCount, msg.sender, _price, _itemType);
       }

       function buyItem(uint256 _id) public payable {
           Listing storage listing = listings[_id];
           require(listing.active, "Listing not active");
           require(msg.value >= listing.price, "Insufficient payment");

           listing.active = false;
           payable(listing.seller).transfer(msg.value);

           emit ItemPurchased(_id, msg.sender, listing.seller, listing.price);
       }
   }
   ```

3. **Deploy to Sepolia**
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

### Update Frontend Configuration

After deployment, update `src/config/contract.ts`:

```typescript
export const CONTRACT_ADDRESS = "0xYourDeployedContractAddress";

export const CONTRACT_ABI = [
  // Add your contract ABI here after compilation
];
```

### IPFS Setup

For production, consider using:
- **Pinata** (https://pinata.cloud) - Managed IPFS pinning service
- **NFT.Storage** (https://nft.storage) - Free IPFS storage for NFTs and metadata
- **Infura IPFS** (https://infura.io/product/ipfs) - Enterprise IPFS gateway

Update `src/utils/ipfs.ts` with your chosen provider's API credentials.

## Environment Variables

Create a `.env.local` file in your project root:

```env
VITE_CONTRACT_ADDRESS=0xYourContractAddress
VITE_INFURA_API_KEY=your_infura_key
VITE_PINATA_API_KEY=your_pinata_key
VITE_PINATA_SECRET_KEY=your_pinata_secret
```

## Testing

1. Get Sepolia ETH from faucets:
   - https://sepoliafaucet.com
   - https://www.alchemy.com/faucets/ethereum-sepolia

2. Connect MetaMask to Sepolia network
3. Test listing and purchasing flows

## Production Checklist

- [ ] Smart contract deployed and verified on Etherscan
- [ ] IPFS provider configured and tested
- [ ] Frontend environment variables set
- [ ] Wallet connection tested on Sepolia
- [ ] Transaction flows verified
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Security audit completed (for mainnet)

---

**Note:** This marketplace currently uses Sepolia testnet. For mainnet deployment, ensure thorough security audits and testing.
