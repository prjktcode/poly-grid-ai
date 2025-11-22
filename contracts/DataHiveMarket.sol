// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DataHiveMarket
 * @dev Decentralized marketplace for AI models and datasets
 */
contract DataHiveMarket is Ownable, ReentrancyGuard {
    
    struct Listing {
        string contentCID;      // IPFS content identifier
        uint256 price;           // Price in wei
        address payable seller;  // Seller's address
        uint8 itemType;          // 0 = model, 1 = dataset
        bool active;             // Listing status
        uint256 timestamp;       // Creation timestamp
    }

    // Mapping from listing ID to Listing
    mapping(uint256 => Listing) public listings;
    
    // Counter for listing IDs
    uint256 public listingCount;
    
    // Platform fee percentage (basis points, e.g., 250 = 2.5%)
    uint256 public platformFee = 250;
    
    // Platform fee recipient
    address payable public feeRecipient;

    // Events
    event ItemListed(
        uint256 indexed listingId,
        address indexed seller,
        string contentCID,
        uint256 price,
        uint8 itemType,
        uint256 timestamp
    );
    
    event ItemPurchased(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price,
        uint256 timestamp
    );
    
    event ListingDeactivated(
        uint256 indexed listingId,
        address indexed seller,
        uint256 timestamp
    );
    
    event PlatformFeeUpdated(
        uint256 oldFee,
        uint256 newFee,
        uint256 timestamp
    );

    /**
     * @dev Constructor sets the fee recipient
     */
    constructor() Ownable(msg.sender) {
        feeRecipient = payable(msg.sender);
    }

    /**
     * @dev List a new item on the marketplace
     * @param contentCID IPFS content identifier
     * @param _price Price in wei
     * @param _itemType Type of item (0 = model, 1 = dataset)
     */
    function listItem(
        string calldata contentCID,
        uint256 _price,
        uint8 _itemType
    ) external {
        require(_price > 0, "Price must be greater than 0");
        require(_itemType == 0 || _itemType == 1, "Invalid item type");
        
        listingCount++;
        
        listings[listingCount] = Listing({
            contentCID: contentCID,
            price: _price,
            seller: payable(msg.sender),
            itemType: _itemType,
            active: true,
            timestamp: block.timestamp
        });
        
        emit ItemListed(
            listingCount,
            msg.sender,
            contentCID,
            _price,
            _itemType,
            block.timestamp
        );
    }

    /**
     * @dev Purchase an item from the marketplace
     * @param _listingId ID of the listing to purchase
     */
    function buyItem(uint256 _listingId) external payable nonReentrant {
        Listing storage listing = listings[_listingId];
        
        require(_listingId > 0 && _listingId <= listingCount, "Invalid listing ID");
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy your own listing");
        
        // Mark as inactive
        listing.active = false;
        
        // Calculate platform fee
        uint256 fee = (listing.price * platformFee) / 10000;
        uint256 sellerAmount = listing.price - fee;
        
        // Transfer funds
        (bool successSeller, ) = listing.seller.call{value: sellerAmount}("");
        require(successSeller, "Transfer to seller failed");
        
        if (fee > 0) {
            (bool successFee, ) = feeRecipient.call{value: fee}("");
            require(successFee, "Transfer to fee recipient failed");
        }
        
        // Refund excess payment
        if (msg.value > listing.price) {
            (bool successRefund, ) = payable(msg.sender).call{value: msg.value - listing.price}("");
            require(successRefund, "Refund failed");
        }
        
        emit ItemPurchased(
            _listingId,
            msg.sender,
            listing.seller,
            listing.price,
            block.timestamp
        );
    }

    /**
     * @dev Deactivate a listing (only by seller or owner)
     * @param _listingId ID of the listing to deactivate
     */
    function deactivateListing(uint256 _listingId) external {
        require(_listingId > 0 && _listingId <= listingCount, "Invalid listing ID");
        
        Listing storage listing = listings[_listingId];
        require(listing.active, "Listing already inactive");
        require(
            msg.sender == listing.seller || msg.sender == owner(),
            "Only seller or owner can deactivate"
        );
        
        listing.active = false;
        
        emit ListingDeactivated(_listingId, listing.seller, block.timestamp);
    }

    /**
     * @dev Update platform fee (only owner)
     * @param _newFee New fee in basis points (e.g., 250 = 2.5%)
     */
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee cannot exceed 10%");
        
        uint256 oldFee = platformFee;
        platformFee = _newFee;
        
        emit PlatformFeeUpdated(oldFee, _newFee, block.timestamp);
    }

    /**
     * @dev Update fee recipient (only owner)
     * @param _newRecipient New fee recipient address
     */
    function updateFeeRecipient(address payable _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid address");
        feeRecipient = _newRecipient;
    }

    /**
     * @dev Get listing details
     * @param _listingId ID of the listing
     */
    function getListing(uint256 _listingId) external view returns (
        string memory contentCID,
        uint256 price,
        address seller,
        uint8 itemType,
        bool active,
        uint256 timestamp
    ) {
        require(_listingId > 0 && _listingId <= listingCount, "Invalid listing ID");
        
        Listing memory listing = listings[_listingId];
        return (
            listing.contentCID,
            listing.price,
            listing.seller,
            listing.itemType,
            listing.active,
            listing.timestamp
        );
    }

    /**
     * @dev Get active listings count
     */
    function getActiveListingsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= listingCount; i++) {
            if (listings[i].active) {
                count++;
            }
        }
        return count;
    }
}
