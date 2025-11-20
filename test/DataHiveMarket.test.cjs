const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DataHiveMarket", function () {
  let dataHiveMarket;
  let owner;
  let seller;
  let buyer;
  let feeRecipient;

  const ITEM_PRICE = ethers.parseEther("0.5");
  const CONTENT_CID = ethers.id("QmTestCID123");
  const MODEL_TYPE = 0;
  const DATASET_TYPE = 1;

  beforeEach(async function () {
    // Get signers
    [owner, seller, buyer, feeRecipient] = await ethers.getSigners();

    // Deploy the contract
    const DataHiveMarket = await ethers.getContractFactory("DataHiveMarket");
    dataHiveMarket = await DataHiveMarket.deploy();
    await dataHiveMarket.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await dataHiveMarket.owner()).to.equal(owner.address);
    });

    it("Should set the initial platform fee", async function () {
      expect(await dataHiveMarket.platformFee()).to.equal(250); // 2.5%
    });

    it("Should set the fee recipient to the owner", async function () {
      expect(await dataHiveMarket.feeRecipient()).to.equal(owner.address);
    });

    it("Should initialize listing count to 0", async function () {
      expect(await dataHiveMarket.listingCount()).to.equal(0);
    });
  });

  describe("Listing Items", function () {
    it("Should list an item successfully", async function () {
      const tx = await dataHiveMarket.connect(seller).listItem(CONTENT_CID, ITEM_PRICE, MODEL_TYPE);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      await expect(tx)
        .to.emit(dataHiveMarket, "ItemListed")
        .withArgs(1, seller.address, CONTENT_CID, ITEM_PRICE, MODEL_TYPE, block.timestamp);

      expect(await dataHiveMarket.listingCount()).to.equal(1);
    });

    it("Should revert if price is 0", async function () {
      await expect(
        dataHiveMarket.connect(seller).listItem(CONTENT_CID, 0, MODEL_TYPE)
      ).to.be.revertedWith("Price must be greater than 0");
    });

    it("Should revert if item type is invalid", async function () {
      await expect(
        dataHiveMarket.connect(seller).listItem(CONTENT_CID, ITEM_PRICE, 2)
      ).to.be.revertedWith("Invalid item type");
    });

    it("Should create multiple listings", async function () {
      await dataHiveMarket.connect(seller).listItem(CONTENT_CID, ITEM_PRICE, MODEL_TYPE);
      await dataHiveMarket.connect(seller).listItem(CONTENT_CID, ITEM_PRICE, DATASET_TYPE);
      
      expect(await dataHiveMarket.listingCount()).to.equal(2);
    });
  });

  describe("Getting Listing Details", function () {
    beforeEach(async function () {
      await dataHiveMarket.connect(seller).listItem(CONTENT_CID, ITEM_PRICE, MODEL_TYPE);
    });

    it("Should return correct listing details", async function () {
      const listing = await dataHiveMarket.getListing(1);
      
      expect(listing.contentCID).to.equal(CONTENT_CID);
      expect(listing.price).to.equal(ITEM_PRICE);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.itemType).to.equal(MODEL_TYPE);
      expect(listing.active).to.equal(true);
    });

    it("Should revert for invalid listing ID", async function () {
      await expect(
        dataHiveMarket.getListing(0)
      ).to.be.revertedWith("Invalid listing ID");

      await expect(
        dataHiveMarket.getListing(2)
      ).to.be.revertedWith("Invalid listing ID");
    });
  });

  describe("Buying Items", function () {
    beforeEach(async function () {
      await dataHiveMarket.connect(seller).listItem(CONTENT_CID, ITEM_PRICE, MODEL_TYPE);
    });

    it("Should purchase an item successfully", async function () {
      const platformFee = (ITEM_PRICE * 250n) / 10000n;
      const sellerAmount = ITEM_PRICE - platformFee;

      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      const feeRecipientBalanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await dataHiveMarket.connect(buyer).buyItem(1, { value: ITEM_PRICE });
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(dataHiveMarket, "ItemPurchased")
        .withArgs(1, buyer.address, seller.address, ITEM_PRICE, block.timestamp);

      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      const feeRecipientBalanceAfter = await ethers.provider.getBalance(owner.address);

      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(sellerAmount);
      expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.be.closeTo(
        platformFee,
        ethers.parseEther("0.0001") // Allow small gas fee variance
      );

      // Check listing is now inactive
      const listing = await dataHiveMarket.getListing(1);
      expect(listing.active).to.equal(false);
    });

    it("Should refund excess payment", async function () {
      const excessAmount = ethers.parseEther("0.1");
      const totalPayment = ITEM_PRICE + excessAmount;

      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);
      
      const tx = await dataHiveMarket.connect(buyer).buyItem(1, { value: totalPayment });
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);

      // Buyer should only pay ITEM_PRICE plus gas
      expect(buyerBalanceBefore - buyerBalanceAfter).to.equal(ITEM_PRICE + gasCost);
    });

    it("Should revert if payment is insufficient", async function () {
      const insufficientPayment = ethers.parseEther("0.3");
      
      await expect(
        dataHiveMarket.connect(buyer).buyItem(1, { value: insufficientPayment })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should revert if listing is not active", async function () {
      await dataHiveMarket.connect(buyer).buyItem(1, { value: ITEM_PRICE });
      
      await expect(
        dataHiveMarket.connect(buyer).buyItem(1, { value: ITEM_PRICE })
      ).to.be.revertedWith("Listing not active");
    });

    it("Should revert if buyer is the seller", async function () {
      await expect(
        dataHiveMarket.connect(seller).buyItem(1, { value: ITEM_PRICE })
      ).to.be.revertedWith("Cannot buy your own listing");
    });

    it("Should revert for invalid listing ID", async function () {
      await expect(
        dataHiveMarket.connect(buyer).buyItem(0, { value: ITEM_PRICE })
      ).to.be.revertedWith("Invalid listing ID");

      await expect(
        dataHiveMarket.connect(buyer).buyItem(999, { value: ITEM_PRICE })
      ).to.be.revertedWith("Invalid listing ID");
    });
  });

  describe("Deactivating Listings", function () {
    beforeEach(async function () {
      await dataHiveMarket.connect(seller).listItem(CONTENT_CID, ITEM_PRICE, MODEL_TYPE);
    });

    it("Should allow seller to deactivate their listing", async function () {
      const tx = await dataHiveMarket.connect(seller).deactivateListing(1);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(dataHiveMarket, "ListingDeactivated")
        .withArgs(1, seller.address, block.timestamp);

      const listing = await dataHiveMarket.getListing(1);
      expect(listing.active).to.equal(false);
    });

    it("Should allow owner to deactivate any listing", async function () {
      const tx = await dataHiveMarket.connect(owner).deactivateListing(1);
      await expect(tx)
        .to.emit(dataHiveMarket, "ListingDeactivated");

      const listing = await dataHiveMarket.getListing(1);
      expect(listing.active).to.equal(false);
    });

    it("Should revert if not seller or owner", async function () {
      await expect(
        dataHiveMarket.connect(buyer).deactivateListing(1)
      ).to.be.revertedWith("Only seller or owner can deactivate");
    });

    it("Should revert if listing is already inactive", async function () {
      await dataHiveMarket.connect(seller).deactivateListing(1);
      
      await expect(
        dataHiveMarket.connect(seller).deactivateListing(1)
      ).to.be.revertedWith("Listing already inactive");
    });
  });

  describe("Platform Fee Management", function () {
    it("Should allow owner to update platform fee", async function () {
      const newFee = 500; // 5%
      const tx = await dataHiveMarket.connect(owner).updatePlatformFee(newFee);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      await expect(tx)
        .to.emit(dataHiveMarket, "PlatformFeeUpdated")
        .withArgs(250, newFee, block.timestamp);

      expect(await dataHiveMarket.platformFee()).to.equal(newFee);
    });

    it("Should revert if fee exceeds maximum", async function () {
      await expect(
        dataHiveMarket.connect(owner).updatePlatformFee(1001) // > 10%
      ).to.be.revertedWith("Fee cannot exceed 10%");
    });

    it("Should revert if non-owner tries to update fee", async function () {
      await expect(
        dataHiveMarket.connect(seller).updatePlatformFee(500)
      ).to.be.revertedWithCustomError(dataHiveMarket, "OwnableUnauthorizedAccount");
    });
  });

  describe("Fee Recipient Management", function () {
    it("Should allow owner to update fee recipient", async function () {
      await dataHiveMarket.connect(owner).updateFeeRecipient(feeRecipient.address);
      
      expect(await dataHiveMarket.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("Should revert if new recipient is zero address", async function () {
      await expect(
        dataHiveMarket.connect(owner).updateFeeRecipient(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });

    it("Should revert if non-owner tries to update recipient", async function () {
      await expect(
        dataHiveMarket.connect(seller).updateFeeRecipient(feeRecipient.address)
      ).to.be.revertedWithCustomError(dataHiveMarket, "OwnableUnauthorizedAccount");
    });
  });

  describe("Active Listings Count", function () {
    it("Should return correct count of active listings", async function () {
      expect(await dataHiveMarket.getActiveListingsCount()).to.equal(0);

      await dataHiveMarket.connect(seller).listItem(CONTENT_CID, ITEM_PRICE, MODEL_TYPE);
      await dataHiveMarket.connect(seller).listItem(CONTENT_CID, ITEM_PRICE, DATASET_TYPE);
      expect(await dataHiveMarket.getActiveListingsCount()).to.equal(2);

      await dataHiveMarket.connect(buyer).buyItem(1, { value: ITEM_PRICE });
      expect(await dataHiveMarket.getActiveListingsCount()).to.equal(1);

      await dataHiveMarket.connect(seller).deactivateListing(2);
      expect(await dataHiveMarket.getActiveListingsCount()).to.equal(0);
    });
  });

});