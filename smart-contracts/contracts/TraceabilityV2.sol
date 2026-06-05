// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TraceabilityV2
 * @notice Phiên bản contract cho flow kiểm định chất lượng, nhập kho và IPFS evidence.
 * @dev Bản tham chiếu cho schema v2; production demo hiện dùng schema tương đương trong Traceability.sol.
 */
contract TraceabilityV2 {
    enum Stage {
        Seeding,
        Growing,
        Fertilizing,
        Harvesting,
        QualityInspection,
        WarehouseReceived,
        Packaging,
        Shipping,
        Completed
    }

    struct StageRecord {
        Stage stage;
        string description;
        string imageUrl;
        string evidenceHash;
        string ipfsCid;
        uint256 timestamp;
        address updatedBy;
    }

    struct Batch {
        uint256 id;
        string name;
        string origin;
        address owner;
        Stage currentStage;
        uint256 createdAt;
        bool isActive;
    }

    uint256 private _batchCounter;
    mapping(uint256 => Batch) private _batches;
    mapping(uint256 => StageRecord[]) private _stageHistory;

    address public systemAdmin;
    mapping(address => bool) public isWhitelistedProducer;

    error NotBatchOwner(uint256 batchId, address caller);
    error BatchNotFound(uint256 batchId);
    error BatchNotActive(uint256 batchId);
    error EmptyBatchName();
    error InvalidStageProgression(Stage currentStage, Stage newStage);
    error NotSystemAdmin(address caller);
    error NotWhitelistedProducer(address caller);

    event BatchCreated(
        uint256 indexed batchId,
        string name,
        string origin,
        address indexed owner,
        string evidenceHash,
        string ipfsCid,
        uint256 timestamp
    );

    event StageAdded(
        uint256 indexed batchId,
        Stage stage,
        string description,
        string imageUrl,
        string evidenceHash,
        string ipfsCid,
        uint256 timestamp
    );

    event BatchCompleted(uint256 indexed batchId, uint256 timestamp);
    event ProducerAdded(address indexed producer);
    event ProducerRemoved(address indexed producer);

    modifier batchExists(uint256 batchId) {
        if (_batches[batchId].createdAt == 0) {
            revert BatchNotFound(batchId);
        }
        _;
    }

    modifier onlyBatchOwner(uint256 batchId) {
        if (_batches[batchId].owner != msg.sender) {
            revert NotBatchOwner(batchId, msg.sender);
        }
        _;
    }

    modifier batchActive(uint256 batchId) {
        if (!_batches[batchId].isActive) {
            revert BatchNotActive(batchId);
        }
        _;
    }

    modifier onlySystemAdmin() {
        if (msg.sender != systemAdmin) revert NotSystemAdmin(msg.sender);
        _;
    }

    modifier onlyProducer() {
        if (!isWhitelistedProducer[msg.sender]) revert NotWhitelistedProducer(msg.sender);
        _;
    }

    constructor() {
        systemAdmin = msg.sender;
        isWhitelistedProducer[msg.sender] = true;
        emit ProducerAdded(msg.sender);
    }

    function addWhitelistedProducer(address producer) external onlySystemAdmin {
        isWhitelistedProducer[producer] = true;
        emit ProducerAdded(producer);
    }

    function removeWhitelistedProducer(address producer) external onlySystemAdmin {
        isWhitelistedProducer[producer] = false;
        emit ProducerRemoved(producer);
    }

    function createBatch(
        string calldata name,
        string calldata origin,
        string calldata imageUrl,
        string calldata evidenceHash,
        string calldata ipfsCid
    ) external onlyProducer returns (uint256 batchId) {
        if (bytes(name).length == 0) revert EmptyBatchName();

        _batchCounter++;
        batchId = _batchCounter;

        _batches[batchId] = Batch({
            id: batchId,
            name: name,
            origin: origin,
            owner: msg.sender,
            currentStage: Stage.Seeding,
            createdAt: block.timestamp,
            isActive: true
        });

        _stageHistory[batchId].push(
            StageRecord({
                stage: Stage.Seeding,
                description: "Batch created - Seeding stage",
                imageUrl: imageUrl,
                evidenceHash: evidenceHash,
                ipfsCid: ipfsCid,
                timestamp: block.timestamp,
                updatedBy: msg.sender
            })
        );

        emit BatchCreated(batchId, name, origin, msg.sender, evidenceHash, ipfsCid, block.timestamp);
    }

    function addStage(
        uint256 batchId,
        Stage stage,
        string calldata description,
        string calldata imageUrl,
        string calldata evidenceHash,
        string calldata ipfsCid
    )
        external
        batchExists(batchId)
        onlyBatchOwner(batchId)
        batchActive(batchId)
    {
        Batch storage batch = _batches[batchId];

        if (uint8(stage) <= uint8(batch.currentStage)) {
            revert InvalidStageProgression(batch.currentStage, stage);
        }

        batch.currentStage = stage;
        _stageHistory[batchId].push(
            StageRecord({
                stage: stage,
                description: description,
                imageUrl: imageUrl,
                evidenceHash: evidenceHash,
                ipfsCid: ipfsCid,
                timestamp: block.timestamp,
                updatedBy: msg.sender
            })
        );

        emit StageAdded(batchId, stage, description, imageUrl, evidenceHash, ipfsCid, block.timestamp);

        if (stage == Stage.Completed) {
            batch.isActive = false;
            emit BatchCompleted(batchId, block.timestamp);
        }
    }

    function getBatch(uint256 batchId)
        external
        view
        batchExists(batchId)
        returns (
            uint256 id,
            string memory name,
            string memory origin,
            address owner,
            Stage currentStage,
            uint256 createdAt,
            bool isActive,
            uint256 totalStages
        )
    {
        Batch storage batch = _batches[batchId];
        return (
            batch.id,
            batch.name,
            batch.origin,
            batch.owner,
            batch.currentStage,
            batch.createdAt,
            batch.isActive,
            _stageHistory[batchId].length
        );
    }

    function getStageHistory(uint256 batchId)
        external
        view
        batchExists(batchId)
        returns (StageRecord[] memory records)
    {
        return _stageHistory[batchId];
    }

    function getTotalBatches() external view returns (uint256) {
        return _batchCounter;
    }
}
