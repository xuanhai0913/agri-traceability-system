const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("Traceability", function () {
  let traceability;
  let owner;
  let otherUser;

  const Stage = {
    Seeding: 0,
    Growing: 1,
    Fertilizing: 2,
    Harvesting: 3,
    QualityInspection: 4,
    WarehouseReceived: 5,
    Packaging: 6,
    Shipping: 7,
    Completed: 8,
  };

  const IMAGE_URL = "https://gateway.pinata.cloud/ipfs/bafy-demo-image";
  const EVIDENCE_HASH =
    "0x9df2f23ce9340b2b2f750a3ab4c1f04fe6f7d928a423f561ed21f30f1f324a90";
  const IPFS_CID = "bafybeigdyrzt-demo-cid";

  function createBatch(contract = traceability, overrides = {}) {
    return contract.createBatch(
      overrides.name || "Gạo ST25 - Lô 001",
      overrides.origin || "Sóc Trăng, Việt Nam",
      overrides.imageUrl || IMAGE_URL,
      overrides.evidenceHash || EVIDENCE_HASH,
      overrides.ipfsCid || IPFS_CID
    );
  }

  function addStage(contract, stage, overrides = {}) {
    return contract.addStage(
      overrides.batchId || 1,
      stage,
      overrides.description || "Evidence recorded",
      overrides.imageUrl || IMAGE_URL,
      overrides.evidenceHash || EVIDENCE_HASH,
      overrides.ipfsCid || IPFS_CID
    );
  }

  beforeEach(async function () {
    [owner, otherUser] = await ethers.getSigners();

    const Traceability = await ethers.getContractFactory("Traceability");
    traceability = await Traceability.deploy();
    await traceability.waitForDeployment();
  });

  describe("Role management", function () {
    it("whitelists the deployer by default", async function () {
      expect(await traceability.systemAdmin()).to.equal(owner.address);
      expect(await traceability.isWhitelistedProducer(owner.address)).to.equal(true);
    });

    it("rejects createBatch from non-whitelisted wallets", async function () {
      await expect(createBatch(traceability.connect(otherUser))).to.be.revertedWithCustomError(
        traceability,
        "NotWhitelistedProducer"
      );
    });

    it("lets the system admin add and remove producers", async function () {
      await expect(traceability.addWhitelistedProducer(otherUser.address))
        .to.emit(traceability, "ProducerAdded")
        .withArgs(otherUser.address);

      expect(await traceability.isWhitelistedProducer(otherUser.address)).to.equal(true);
      await expect(createBatch(traceability.connect(otherUser))).to.not.be.reverted;

      await expect(traceability.removeWhitelistedProducer(otherUser.address))
        .to.emit(traceability, "ProducerRemoved")
        .withArgs(otherUser.address);
      expect(await traceability.isWhitelistedProducer(otherUser.address)).to.equal(false);
    });
  });

  describe("createBatch", function () {
    it("creates a batch with initial IPFS evidence metadata", async function () {
      await expect(createBatch())
        .to.emit(traceability, "BatchCreated")
        .withArgs(
          1,
          "Gạo ST25 - Lô 001",
          "Sóc Trăng, Việt Nam",
          owner.address,
          EVIDENCE_HASH,
          IPFS_CID,
          anyValue
        );

      const batch = await traceability.getBatch(1);
      expect(batch.currentStage).to.equal(Stage.Seeding);
      expect(batch.isActive).to.equal(true);
      expect(batch.totalStages).to.equal(1);

      const history = await traceability.getStageHistory(1);
      expect(history[0].stage).to.equal(Stage.Seeding);
      expect(history[0].imageUrl).to.equal(IMAGE_URL);
      expect(history[0].evidenceHash).to.equal(EVIDENCE_HASH);
      expect(history[0].ipfsCid).to.equal(IPFS_CID);
    });

    it("increments batch ids", async function () {
      await createBatch();
      await createBatch(traceability, { name: "Lô 2", origin: "Đà Lạt" });

      expect(await traceability.getTotalBatches()).to.equal(2);
    });

    it("rejects an empty batch name", async function () {
      await expect(createBatch(traceability, { name: "" })).to.be.revertedWithCustomError(
        traceability,
        "EmptyBatchName"
      );
    });
  });

  describe("addStage", function () {
    beforeEach(async function () {
      await createBatch();
    });

    it("records QualityInspection and WarehouseReceived stages with hash and CID", async function () {
      await addStage(traceability, Stage.Growing, { description: "Sinh trưởng tốt" });
      await addStage(traceability, Stage.Fertilizing, { description: "Bón phân hữu cơ" });
      await addStage(traceability, Stage.Harvesting, { description: "Thu hoạch" });

      await expect(
        addStage(traceability, Stage.QualityInspection, {
          description: "QualityInspection PASS",
          evidenceHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          ipfsCid: "bafy-quality-pass",
        })
      )
        .to.emit(traceability, "StageAdded")
        .withArgs(
          1,
          Stage.QualityInspection,
          "QualityInspection PASS",
          IMAGE_URL,
          "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "bafy-quality-pass",
          anyValue
        );

      await addStage(traceability, Stage.WarehouseReceived, {
        description: "WarehouseReceived | Kho TP.HCM | Quantity: 500 kg",
        evidenceHash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        ipfsCid: "bafy-warehouse-receipt",
      });

      const batch = await traceability.getBatch(1);
      expect(batch.currentStage).to.equal(Stage.WarehouseReceived);

      const history = await traceability.getStageHistory(1);
      expect(history.length).to.equal(6);
      expect(history[4].stage).to.equal(Stage.QualityInspection);
      expect(history[4].ipfsCid).to.equal("bafy-quality-pass");
      expect(history[5].stage).to.equal(Stage.WarehouseReceived);
      expect(history[5].evidenceHash).to.equal(
        "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
      );
    });

    it("rejects non-owner stage updates", async function () {
      await expect(
        addStage(traceability.connect(otherUser), Stage.Growing, {
          description: "Hack attempt",
        })
      ).to.be.revertedWithCustomError(traceability, "NotBatchOwner");
    });

    it("rejects backward or duplicate progression", async function () {
      await addStage(traceability, Stage.Growing, { description: "Growing" });

      await expect(
        addStage(traceability, Stage.Seeding, { description: "Go back" })
      ).to.be.revertedWithCustomError(traceability, "InvalidStageProgression");

      await expect(
        addStage(traceability, Stage.Growing, { description: "Duplicate" })
      ).to.be.revertedWithCustomError(traceability, "InvalidStageProgression");
    });

    it("marks the batch inactive when completed and rejects later updates", async function () {
      await addStage(traceability, Stage.Growing);
      await addStage(traceability, Stage.Fertilizing);
      await addStage(traceability, Stage.Harvesting);
      await addStage(traceability, Stage.QualityInspection);
      await addStage(traceability, Stage.WarehouseReceived);
      await addStage(traceability, Stage.Packaging);
      await addStage(traceability, Stage.Shipping);

      await expect(addStage(traceability, Stage.Completed))
        .to.emit(traceability, "BatchCompleted")
        .withArgs(1, anyValue);

      const batch = await traceability.getBatch(1);
      expect(batch.currentStage).to.equal(Stage.Completed);
      expect(batch.isActive).to.equal(false);

      await expect(addStage(traceability, Stage.Shipping)).to.be.revertedWithCustomError(
        traceability,
        "BatchNotActive"
      );
    });
  });

  describe("Read functions", function () {
    it("returns stage records by index", async function () {
      await createBatch();
      await addStage(traceability, Stage.Growing, { description: "Cây phát triển" });

      const first = await traceability.getStageAt(1, 0);
      expect(first.stage).to.equal(Stage.Seeding);

      const second = await traceability.getStageAt(1, 1);
      expect(second.stage).to.equal(Stage.Growing);
      expect(second.description).to.equal("Cây phát triển");

      await expect(traceability.getStageAt(1, 99)).to.be.revertedWith(
        "Index out of bounds"
      );
    });
  });
});
