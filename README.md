# PolyGradient — Decentralized AI Marketplace on Polygon Amoy

A sleek, modern marketplace to discover, list, and purchase AI models and datasets—powered by smart contracts and decentralized storage. Built with a robust React + Vite frontend, wagmi/viem for Web3 interactions, and IPFS for content addressing.

[![Polygon](https://img.shields.io/badge/Network-Polygon%20Amoy-8247e5?logo=polygon)](https://polygon.technology/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-Fast-646cff?logo=vite)](https://vitejs.dev/)
[![IPFS](https://img.shields.io/badge/Storage-IPFS-65c2cb?logo=ipfs)](https://ipfs.tech/)

---

## ✨ Highlights

- Beautiful UI with Tailwind + Radix UI components
- Fully on-chain marketplace listings (price, seller, type, timestamp)
- Native POL (Amoy) purchases with automatic platform fee handling
- Decentralized metadata via IPFS CIDs (supports multi-gateway resolution)
- Clean separation of concerns: contracts, scripts, frontend pages, components
- Marketplace updates in real-time after purchases with success/error toasts

---

## 🔗 Smart Contract

- DataHiveMarket (Polygon Amoy): `0xd764E07bbbf3863060aCca9622e2c81ef1Eafa77`
- Events:
  - `ItemListed(listingId, seller, contentCID, price, itemType, timestamp)`
  - `ItemPurchased(listingId, buyer, seller, price, timestamp)`
  - `ListingDeactivated(listingId, seller, timestamp)`
- Core functions:
  - `listItem(contentCID, price, itemType)`
  - `buyItem(listingId)` (payable in native POL)
  - `getListing(listingId)` → returns CID, price, seller, type, active, timestamp

Explore on [Polygon Amoy Polygonscan](https://amoy.polygonscan.com/address/0xd764E07bbbf3863060aCca9622e2c81ef1Eafa77).

---

## 🖼️ Screens & UX

- Marketplace Grid
  - Browse AI assets with rich cards (type badges, price, seller)
  - Search and filter by type (Models/Datasets)
  - Instant refresh button and animated loading states

- Purchase Flow
  - Buy with native POL via connected wallet
  - Transaction toast notifications (pending, success, error)
  - Purchased items visually marked with “Purchased” badge and buyer address overlay

- IPFS Metadata
  - Resolve metadata via gateways (e.g. ipfs.io)
  - Display name, description, and asset CID or image from metadata JSON

---

## 🧩 Tech Stack

- Frontend: React 18, Vite 5, TypeScript, Tailwind CSS, Radix UI
- Web3: wagmi v2, viem, ethers (runtime minimized)
- Storage: IPFS (helia / ipfs-http-client)
- Tooling: Hardhat, OpenZeppelin, dotenv, Chai/Mocha

---

## ⚙️ Setup & Development

1. Clone the repository
   ```
   git clone https://github.com/prjktcode/poly-grid-ai.git
   cd poly-grid-ai
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Environment variables
   - Create `.env` in root with:
     - `PRIVATE_KEY=...` (for deployments; never expose client-side)
     - `AMOY_RPC_URL=https://rpc-amoy.polygon.technology/` (or your provider)
     - `VITE_CONTRACT_ADDRESS=0xd764E07bbbf3863060aCca9622e2c81ef1Eafa77`
   - Ensure `.env` is gitignored.

4. Develop the app
   ```
   npm run dev
   ```

5. Compile/test smart contracts
   ```
   npm run compile
   npm run test:contracts
   ```

6. Deploy to Polygon Amoy
   ```
   npm run deploy:amoy
   ```
   After deployment, update `VITE_CONTRACT_ADDRESS` if needed.

---

## 🛒 Listing & Purchase Basics

- Listing:
  - Pin asset to IPFS → get asset CID
  - Create metadata JSON with fields (name, description, image/fileCid)
  - Pin metadata → get metadata CID
  - Call `listItem(metadataCID, priceInWei, itemType)` (itemType: 0=model, 1=dataset)

- Buying:
  - Ensure the wallet is connected to Amoy
  - Click “Buy Now” on a listing
  - Confirm transaction; purchase uses native POL
  - Marketplace reflects purchased state and displays the buyer address (shortened)

---

## 🛡️ Security & Decentralization Notes

- Use `ipfs://<CID>` in on-chain references; resolve via multiple gateways in the UI.
- Do not include secrets in the frontend bundle.
- Consider using nft.storage/web3.storage for more resilient content pinning.
- The marketplace contract uses non-reentrancy, seller-only deactivation, and explicit event logging for transparency.

---

## 🗺️ Roadmap

- ERC20 token payments (approve + buy) option
- “My Assets” page with owner discovery via `ownerOf` / Transfer events
- Enhanced metadata validation and image preview caching

---

## 🧑‍💻 Contributing

- Fork the repo and create feature branches
- Keep commits focused
- Open PRs with clear descriptions, screenshots, and steps to reproduce

---

## 📜 License

MIT © PolyGradient AI Contributors
