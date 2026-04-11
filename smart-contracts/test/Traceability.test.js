const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Traceability", function () {
  let traceability;
  let owner;
  let otherUser;

  // Stage enum values (matching Solidity enum)
  const Stage = {
    Seeding: 0,
    Growing: 1,
    Fertilizing: 2,
    Harvesting: 3,
    Packaging: 4,
    Shipping: 5,
    Completed: 6,
  };

  beforeEach(async function () {
    [owner, otherUser] = await ethers.getSigners();

    const Traceability = await ethers.getContractFactory("Traceability");
    traceability = await Traceability.deploy();
    await traceability.waitForDeployment();
  });

  // ================================================================
  // │                    ROLE MANAGEMENT TESTS                       │
  // ================================================================

  describe("Role Management (Whitelist)", function () {
    it("Deployer (System Admin) should be whitelisted by default", async function () {
      expect(await traceability.systemAdmin()).to.equal(owner.address);
      expect(await traceability.isWhitelistedProducer(owner.address)).to.equal(true);
    });

    it("Cannot create batch if not whitelisted", async function () {
      await expect(
        traceability.connect(otherUser).createBatch("Gạo", "Sóc Trăng", "img.jpg")
      ).to.be.revertedWithCustomError(traceability, "NotWhitelistedProducer");
    });

    it("Admin can add and remove a whitelisted producer", async function () {
      // Add
      await expect(traceability.addWhitelistedProducer(otherUser.address))
        .to.emit(traceability, "ProducerAdded")
        .withArgs(otherUser.address);
      
      expect(await traceability.isWhitelistedProducer(otherUser.address)).to.equal(true);

      // Now otherUser can create batch
      await expect(
        traceability.connect(otherUser).createBatch("Trái cây", "Đà Lạt", "img.jpg")
      ).to.not.be.reverted;

      // Remove
      await expect(traceability.removeWhitelistedProducer(otherUser.address))
        .to.emit(traceability, "ProducerRemoved")
        .withArgs(otherUser.address);

      expect(await traceability.isWhitelistedProducer(otherUser.address)).to.equal(false);
    });

    it("Only admin can add producers", async function () {
      await expect(
        traceability.connect(otherUser).addWhitelistedProducer(otherUser.address)
      ).to.be.revertedWithCustomError(traceability, "NotSystemAdmin");
    });
  });

  // ================================================================
  // │                    CREATE BATCH TESTS                         │
  // ================================================================

  describe("createBatch", function () {
    it("Nên tạo batch mới thành công với đầy đủ thông tin", async function () {
      const tx = await traceability.createBatch(
        "Gạo ST25 - Lô 001",
        "Sóc Trăng, Việt Nam",
        "https://res.cloudinary.com/demo/image/upload/rice.jpg"
      );

      const receipt = await tx.wait();

      // Kiểm tra event BatchCreated
      const event = receipt.logs.find(
        (log) => traceability.interface.parseLog(log)?.name === "BatchCreated"
      );
      const parsedEvent = traceability.interface.parseLog(event);

      expect(parsedEvent.args.batchId).to.equal(1);
      expect(parsedEvent.args.name).to.equal("Gạo ST25 - Lô 001");
      expect(parsedEvent.args.origin).to.equal("Sóc Trăng, Việt Nam");
      expect(parsedEvent.args.owner).to.equal(owner.address);
    });

    it("Nên trả về batchId tăng dần", async function () {
      await traceability.createBatch("Lô 1", "HCM", "https://img1.jpg");
      await traceability.createBatch("Lô 2", "HN", "https://img2.jpg");

      const totalBatches = await traceability.getTotalBatches();
      expect(totalBatches).to.equal(2);
    });

    it("Nên khởi tạo với giai đoạn Seeding và trạng thái active", async function () {
      await traceability.createBatch("Test Batch", "Origin", "https://img.jpg");

      const batch = await traceability.getBatch(1);
      expect(batch.currentStage).to.equal(Stage.Seeding);
      expect(batch.isActive).to.equal(true);
      expect(batch.owner).to.equal(owner.address);
    });

    it("Nên tạo StageRecord đầu tiên (Seeding) tự động", async function () {
      await traceability.createBatch("Test Batch", "Origin", "https://img.jpg");

      const history = await traceability.getStageHistory(1);
      expect(history.length).to.equal(1);
      expect(history[0].stage).to.equal(Stage.Seeding);
      expect(history[0].imageUrl).to.equal("https://img.jpg");
    });

    it("Nên revert nếu tên batch rỗng", async function () {
      await expect(
        traceability.createBatch("", "Origin", "https://img.jpg")
      ).to.be.revertedWithCustomError(traceability, "EmptyBatchName");
    });
  });

  // ================================================================
  // │                    ADD STAGE TESTS                            │
  // ================================================================

  describe("addStage", function () {
    beforeEach(async function () {
      // Tạo batch trước mỗi test
      await traceability.createBatch(
        "Gạo ST25",
        "Sóc Trăng",
        "https://img.jpg"
      );
    });

    it("Nên thêm giai đoạn Growing thành công", async function () {
      await traceability.addStage(
        1,
        Stage.Growing,
        "Cây lúa đã nảy mầm, phát triển tốt",
        "https://res.cloudinary.com/demo/growing.jpg"
      );

      const batch = await traceability.getBatch(1);
      expect(batch.currentStage).to.equal(Stage.Growing);

      const history = await traceability.getStageHistory(1);
      expect(history.length).to.equal(2); // Seeding + Growing
    });

    it("Nên thêm nhiều giai đoạn liên tục", async function () {
      await traceability.addStage(1, Stage.Growing, "Nảy mầm", "");
      await traceability.addStage(1, Stage.Fertilizing, "Bón phân NPK", "");
      await traceability.addStage(1, Stage.Harvesting, "Thu hoạch", "");

      const history = await traceability.getStageHistory(1);
      expect(history.length).to.equal(4); // Seeding + 3 stages

      const batch = await traceability.getBatch(1);
      expect(batch.currentStage).to.equal(Stage.Harvesting);
      expect(batch.isActive).to.equal(true);
    });

    it("Nên phát ra event StageAdded", async function () {
      await expect(
        traceability.addStage(1, Stage.Growing, "Phát triển tốt", "https://growing.jpg")
      )
        .to.emit(traceability, "StageAdded")
        .withArgs(
          1,
          Stage.Growing,
          "Phát triển tốt",
          "https://growing.jpg",
          (timestamp) => timestamp > 0 // any valid timestamp
        );
    });

    it("Nên revert nếu không phải batch owner", async function () {
      await expect(
        traceability
          .connect(otherUser)
          .addStage(1, Stage.Growing, "Hack attempt", "")
      ).to.be.revertedWithCustomError(traceability, "NotBatchOwner");
    });

    it("Nên revert nếu batch không tồn tại", async function () {
      await expect(
        traceability.addStage(999, Stage.Growing, "Nope", "")
      ).to.be.revertedWithCustomError(traceability, "BatchNotFound");
    });

    it("Nên revert nếu giai đoạn lùi lại (Growing -> Seeding)", async function () {
      await traceability.addStage(1, Stage.Growing, "Growing", "");

      await expect(
        traceability.addStage(1, Stage.Seeding, "Lùi lại?", "")
      ).to.be.revertedWithCustomError(traceability, "InvalidStageProgression");
    });

    it("Nên revert nếu giai đoạn trùng hiện tại", async function () {
      // Seeding -> Seeding nên bị revert
      await expect(
        traceability.addStage(1, Stage.Seeding, "Same stage", "")
      ).to.be.revertedWithCustomError(traceability, "InvalidStageProgression");
    });
  });

  // ================================================================
  // │                BATCH COMPLETION TESTS                        │
  // ================================================================

  describe("Batch Completion", function () {
    beforeEach(async function () {
      await traceability.createBatch(
        "Gạo ST25",
        "Sóc Trăng",
        "https://img.jpg"
      );
    });

    it("Nên đánh dấu batch inactive khi stage = Completed", async function () {
      // Fast-forward to Completed
      await traceability.addStage(1, Stage.Growing, "Growing", "");
      await traceability.addStage(1, Stage.Fertilizing, "Fertilizing", "");
      await traceability.addStage(1, Stage.Harvesting, "Harvesting", "");
      await traceability.addStage(1, Stage.Packaging, "Packaging", "");
      await traceability.addStage(1, Stage.Shipping, "Shipping", "");
      await traceability.addStage(1, Stage.Completed, "Completed", "");

      const batch = await traceability.getBatch(1);
      expect(batch.isActive).to.equal(false);
      expect(batch.currentStage).to.equal(Stage.Completed);
    });

    it("Nên phát ra event BatchCompleted khi hoàn thành", async function () {
      await traceability.addStage(1, Stage.Growing, "", "");
      await traceability.addStage(1, Stage.Fertilizing, "", "");
      await traceability.addStage(1, Stage.Harvesting, "", "");
      await traceability.addStage(1, Stage.Packaging, "", "");
      await traceability.addStage(1, Stage.Shipping, "", "");

      await expect(traceability.addStage(1, Stage.Completed, "Done", ""))
        .to.emit(traceability, "BatchCompleted")
        .withArgs(1, (timestamp) => timestamp > 0);
    });

    it("Nên revert nếu cập nhật batch đã completed", async function () {
      await traceability.addStage(1, Stage.Growing, "", "");
      await traceability.addStage(1, Stage.Fertilizing, "", "");
      await traceability.addStage(1, Stage.Harvesting, "", "");
      await traceability.addStage(1, Stage.Packaging, "", "");
      await traceability.addStage(1, Stage.Shipping, "", "");
      await traceability.addStage(1, Stage.Completed, "Done", "");

      // Thử cập nhật lại → revert
      await expect(
        traceability.addStage(1, Stage.Growing, "Nope", "")
      ).to.be.revertedWithCustomError(traceability, "BatchNotActive");
    });
  });

  // ================================================================
  // │                   READ FUNCTION TESTS                        │
  // ================================================================

  describe("Read Functions", function () {
    beforeEach(async function () {
      await traceability.createBatch(
        "Gạo ST25 - Lô 001",
        "Sóc Trăng, Việt Nam",
        "https://img.jpg"
      );
      await traceability.addStage(
        1,
        Stage.Growing,
        "Cây phát triển",
        "https://growing.jpg"
      );
    });

    it("getBatch nên trả về đầy đủ thông tin", async function () {
      const batch = await traceability.getBatch(1);
      expect(batch.id).to.equal(1);
      expect(batch.name).to.equal("Gạo ST25 - Lô 001");
      expect(batch.origin).to.equal("Sóc Trăng, Việt Nam");
      expect(batch.owner).to.equal(owner.address);
      expect(batch.currentStage).to.equal(Stage.Growing);
      expect(batch.isActive).to.equal(true);
      expect(batch.totalStages).to.equal(2);
    });

    it("getStageHistory nên trả về mảng đầy đủ", async function () {
      const history = await traceability.getStageHistory(1);
      expect(history.length).to.equal(2);

      // Stage 1: Seeding (tự động khi createBatch)
      expect(history[0].stage).to.equal(Stage.Seeding);
      expect(history[0].updatedBy).to.equal(owner.address);

      // Stage 2: Growing
      expect(history[1].stage).to.equal(Stage.Growing);
      expect(history[1].description).to.equal("Cây phát triển");
      expect(history[1].imageUrl).to.equal("https://growing.jpg");
    });

    it("getStageAt nên trả về đúng record theo index", async function () {
      const record = await traceability.getStageAt(1, 0);
      expect(record.stage).to.equal(Stage.Seeding);

      const record2 = await traceability.getStageAt(1, 1);
      expect(record2.stage).to.equal(Stage.Growing);
    });

    it("getStageAt nên revert nếu index vượt quá", async function () {
      await expect(
        traceability.getStageAt(1, 99)
      ).to.be.revertedWith("Index out of bounds");
    });

    it("getTotalBatches nên trả về counter chính xác", async function () {
      expect(await traceability.getTotalBatches()).to.equal(1);

      await traceability.createBatch("Lô 2", "HN", "");
      expect(await traceability.getTotalBatches()).to.equal(2);
    });

    it("getBatch nên revert nếu batch không tồn tại", async function () {
      await expect(traceability.getBatch(999)).to.be.revertedWithCustomError(
        traceability,
        "BatchNotFound"
      );
    });
  });
});
