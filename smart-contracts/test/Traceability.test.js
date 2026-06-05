const { expect } = require("chai");
const { ethers } = require("hardhat");

async function expectCustomError(promise, contract, errorName) {
  let thrownError;

  try {
    await promise;
  } catch (error) {
    thrownError = error;
  }

  expect(thrownError, `Expected custom error ${errorName}`).to.exist;

  const errorData =
    thrownError.data ||
    thrownError.error?.data ||
    thrownError.info?.error?.data;

  if (errorData) {
    const parsed = contract.interface.parseError(errorData);
    expect(parsed.name).to.equal(errorName);
    return;
  }

  expect(String(thrownError.message)).to.include(errorName);
}

async function expectRevertMessage(promise, message) {
  let thrownError;

  try {
    await promise;
  } catch (error) {
    thrownError = error;
  }

  expect(thrownError, `Expected revert message ${message}`).to.exist;
  expect(String(thrownError.message)).to.include(message);
}

async function expectEvent(txPromise, contract, eventName, validateArgs) {
  const tx = await txPromise;
  const receipt = await tx.wait();
  const events = receipt.logs
    .map((log) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .filter((event) => event?.name === eventName);

  expect(events.length, `Expected event ${eventName}`).to.be.greaterThan(0);
  validateArgs(events[0].args);
}

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
      await expectCustomError(
        createBatch(traceability.connect(otherUser)),
        traceability,
        "NotWhitelistedProducer"
      );
    });

    it("lets the system admin add and remove producers", async function () {
      await expectEvent(
        traceability.addWhitelistedProducer(otherUser.address),
        traceability,
        "ProducerAdded",
        (args) => {
          expect(args.producer).to.equal(otherUser.address);
        }
      );

      expect(await traceability.isWhitelistedProducer(otherUser.address)).to.equal(true);
      await createBatch(traceability.connect(otherUser));

      await expectEvent(
        traceability.removeWhitelistedProducer(otherUser.address),
        traceability,
        "ProducerRemoved",
        (args) => {
          expect(args.producer).to.equal(otherUser.address);
        }
      );
      expect(await traceability.isWhitelistedProducer(otherUser.address)).to.equal(false);
    });
  });

  describe("createBatch", function () {
    it("creates a batch with initial IPFS evidence metadata", async function () {
      await expectEvent(createBatch(), traceability, "BatchCreated", (args) => {
        expect(Number(args.batchId)).to.equal(1);
        expect(args.name).to.equal("Gạo ST25 - Lô 001");
        expect(args.origin).to.equal("Sóc Trăng, Việt Nam");
        expect(args.owner).to.equal(owner.address);
        expect(args.evidenceHash).to.equal(EVIDENCE_HASH);
        expect(args.ipfsCid).to.equal(IPFS_CID);
        expect(Number(args.timestamp)).to.be.greaterThan(0);
      });

      const batch = await traceability.getBatch(1);
      expect(Number(batch.currentStage)).to.equal(Stage.Seeding);
      expect(batch.isActive).to.equal(true);
      expect(Number(batch.totalStages)).to.equal(1);

      const history = await traceability.getStageHistory(1);
      expect(Number(history[0].stage)).to.equal(Stage.Seeding);
      expect(history[0].imageUrl).to.equal(IMAGE_URL);
      expect(history[0].evidenceHash).to.equal(EVIDENCE_HASH);
      expect(history[0].ipfsCid).to.equal(IPFS_CID);
    });

    it("increments batch ids", async function () {
      await createBatch();
      await createBatch(traceability, { name: "Lô 2", origin: "Đà Lạt" });

      expect(Number(await traceability.getTotalBatches())).to.equal(2);
    });

    it("rejects an empty batch name", async function () {
      await expectCustomError(
        createBatch(traceability, { name: "" }),
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

      await expectEvent(
        addStage(traceability, Stage.QualityInspection, {
          description: "QualityInspection PASS",
          evidenceHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          ipfsCid: "bafy-quality-pass",
        }),
        traceability,
        "StageAdded",
        (args) => {
          expect(Number(args.batchId)).to.equal(1);
          expect(Number(args.stage)).to.equal(Stage.QualityInspection);
          expect(args.description).to.equal("QualityInspection PASS");
          expect(args.imageUrl).to.equal(IMAGE_URL);
          expect(args.evidenceHash).to.equal(
            "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
          );
          expect(args.ipfsCid).to.equal("bafy-quality-pass");
          expect(Number(args.timestamp)).to.be.greaterThan(0);
        }
      );

      await addStage(traceability, Stage.WarehouseReceived, {
        description: "WarehouseReceived | Kho TP.HCM | Quantity: 500 kg",
        evidenceHash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        ipfsCid: "bafy-warehouse-receipt",
      });

      const batch = await traceability.getBatch(1);
      expect(Number(batch.currentStage)).to.equal(Stage.WarehouseReceived);

      const history = await traceability.getStageHistory(1);
      expect(history.length).to.equal(6);
      expect(Number(history[4].stage)).to.equal(Stage.QualityInspection);
      expect(history[4].ipfsCid).to.equal("bafy-quality-pass");
      expect(Number(history[5].stage)).to.equal(Stage.WarehouseReceived);
      expect(history[5].evidenceHash).to.equal(
        "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
      );
    });

    it("rejects non-owner stage updates", async function () {
      await expectCustomError(
        addStage(traceability.connect(otherUser), Stage.Growing, {
          description: "Hack attempt",
        }),
        traceability,
        "NotBatchOwner"
      );
    });

    it("rejects backward or duplicate progression", async function () {
      await addStage(traceability, Stage.Growing, { description: "Growing" });

      await expectCustomError(
        addStage(traceability, Stage.Seeding, { description: "Go back" }),
        traceability,
        "InvalidStageProgression"
      );

      await expectCustomError(
        addStage(traceability, Stage.Growing, { description: "Duplicate" }),
        traceability,
        "InvalidStageProgression"
      );
    });

    it("marks the batch inactive when completed and rejects later updates", async function () {
      await addStage(traceability, Stage.Growing);
      await addStage(traceability, Stage.Fertilizing);
      await addStage(traceability, Stage.Harvesting);
      await addStage(traceability, Stage.QualityInspection);
      await addStage(traceability, Stage.WarehouseReceived);
      await addStage(traceability, Stage.Packaging);
      await addStage(traceability, Stage.Shipping);

      await expectEvent(addStage(traceability, Stage.Completed), traceability, "BatchCompleted", (args) => {
        expect(Number(args.batchId)).to.equal(1);
        expect(Number(args.timestamp)).to.be.greaterThan(0);
      });

      const batch = await traceability.getBatch(1);
      expect(Number(batch.currentStage)).to.equal(Stage.Completed);
      expect(batch.isActive).to.equal(false);

      await expectCustomError(
        addStage(traceability, Stage.Shipping),
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
      expect(Number(first.stage)).to.equal(Stage.Seeding);

      const second = await traceability.getStageAt(1, 1);
      expect(Number(second.stage)).to.equal(Stage.Growing);
      expect(second.description).to.equal("Cây phát triển");

      await expectRevertMessage(traceability.getStageAt(1, 99), "Index out of bounds");
    });
  });
});
