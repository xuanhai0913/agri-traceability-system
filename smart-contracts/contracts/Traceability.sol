// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Traceability
 * @author AgriTrace Team
 * @notice Hệ thống truy xuất nguồn gốc nông sản trên Blockchain
 * @dev Quản lý lô hàng (Batch) và lịch sử giai đoạn sinh trưởng
 *
 * Tối ưu Gas:
 * - Enum thay string cho tên giai đoạn (~80% tiết kiệm storage)
 * - Mapping thay array cho lookup O(1)
 * - Custom errors thay require strings (~50 gas/lần)
 * - Events có indexed params cho filter hiệu quả
 * - Optimizer 200 runs + viaIR trong hardhat config
 */
contract Traceability {
    // ================================================================
    // │                        ENUMS                                  │
    // ================================================================

    /**
     * @notice Các giai đoạn sinh trưởng của nông sản
     * @dev Sử dụng enum thay vì string để tiết kiệm gas đáng kể
     *      Enum được lưu dưới dạng uint8 (1 byte) thay vì dynamic string
     */
    enum Stage {
        Seeding,     // 0 - Gieo trồng
        Growing,     // 1 - Đang phát triển
        Fertilizing, // 2 - Bón phân / Chăm sóc
        Harvesting,  // 3 - Thu hoạch
        Packaging,   // 4 - Đóng gói
        Shipping,    // 5 - Vận chuyển
        Completed    // 6 - Hoàn thành chuỗi
    }

    // ================================================================
    // │                    DATA STRUCTURES                            │
    // ================================================================

    /**
     * @notice Bản ghi cho mỗi giai đoạn sinh trưởng
     * @dev Mỗi lần cập nhật giai đoạn tạo ra một StageRecord mới
     * @param stage Giai đoạn (enum)
     * @param description Mô tả chi tiết hoạt động
     * @param imageUrl URL ảnh minh chứng (từ Cloudinary)
     * @param timestamp Thời điểm ghi nhận (block.timestamp)
     * @param updatedBy Địa chỉ người cập nhật
     */
    struct StageRecord {
        Stage stage;
        string description;
        string imageUrl;
        uint256 timestamp;
        address updatedBy;
    }

    /**
     * @notice Thông tin lô hàng nông sản
     * @dev Lưu metadata cơ bản, lịch sử giai đoạn lưu riêng trong mapping
     * @param id ID duy nhất của lô hàng
     * @param name Tên lô hàng (VD: "Gạo ST25 - Lô 001")
     * @param origin Nguồn gốc / vùng trồng (VD: "Sóc Trăng, Việt Nam")
     * @param owner Địa chỉ ví của nông dân tạo lô hàng
     * @param currentStage Giai đoạn hiện tại
     * @param createdAt Thời điểm tạo lô hàng
     * @param isActive Trạng thái hoạt động (false = đã hoàn thành/hủy)
     */
    struct Batch {
        uint256 id;
        string name;
        string origin;
        address owner;
        Stage currentStage;
        uint256 createdAt;
        bool isActive;
    }

    // ================================================================
    // │                    STATE VARIABLES                            │
    // ================================================================

    /// @notice Bộ đếm ID lô hàng, tăng dần từ 1
    uint256 private _batchCounter;

    /// @notice Mapping: batchId => Batch (thông tin lô hàng)
    mapping(uint256 => Batch) private _batches;

    /// @notice Mapping: batchId => StageRecord[] (lịch sử giai đoạn)
    mapping(uint256 => StageRecord[]) private _stageHistory;

    // ================================================================
    // │                        ROLES                                 │
    // ================================================================

    /// @notice Chủ sở hữu hệ thống (có quyền cấp phép tài khoản nông trại)
    address public systemAdmin;

    /// @notice Mapping kiểm tra xem địa chỉ ví có phải là nông trại được phép (whitelisted) không
    mapping(address => bool) public isWhitelistedProducer;
    // ================================================================
    // │                      CUSTOM ERRORS                           │
    // ================================================================

    /// @dev Người gọi không phải owner của lô hàng
    error NotBatchOwner(uint256 batchId, address caller);

    /// @dev Lô hàng không tồn tại (chưa được tạo)
    error BatchNotFound(uint256 batchId);

    /// @dev Lô hàng đã hoàn thành, không thể cập nhật
    error BatchNotActive(uint256 batchId);

    /// @dev Tên lô hàng không được rỗng
    error EmptyBatchName();

    /// @dev Giai đoạn mới phải >= giai đoạn hiện tại (không lùi lại)
    error InvalidStageProgression(Stage currentStage, Stage newStage);

    /// @dev Người gọi không phải là System Admin
    error NotSystemAdmin(address caller);

    /// @dev Người gọi chưa được cấp phép (whitelist) làm nông trại
    error NotWhitelistedProducer(address caller);

    // ================================================================
    // │                        EVENTS                                │
    // ================================================================

    /**
     * @notice Phát ra khi lô hàng mới được tạo
     * @param batchId ID của lô hàng (indexed cho filter)
     * @param name Tên lô hàng
     * @param owner Địa chỉ nông dân tạo (indexed cho filter)
     * @param timestamp Thời điểm tạo
     */
    event BatchCreated(
        uint256 indexed batchId,
        string name,
        string origin,
        address indexed owner,
        uint256 timestamp
    );

    /**
     * @notice Phát ra khi giai đoạn mới được thêm vào lô hàng
     * @param batchId ID lô hàng (indexed cho filter)
     * @param stage Giai đoạn mới
     * @param description Mô tả chi tiết
     * @param imageUrl URL ảnh minh chứng
     * @param timestamp Thời điểm cập nhật
     */
    event StageAdded(
        uint256 indexed batchId,
        Stage stage,
        string description,
        string imageUrl,
        uint256 timestamp
    );

    /**
     * @notice Phát ra khi lô hàng hoàn thành chuỗi truy xuất
     * @param batchId ID lô hàng (indexed)
     * @param timestamp Thời điểm hoàn thành
     */
    event BatchCompleted(uint256 indexed batchId, uint256 timestamp);

    /**
     * @notice Phát ra khi một nông trại được cấp quyền (whitelist)
     */
    event ProducerAdded(address indexed producer);

    /**
     * @notice Phát ra khi một nông trại bị thu hồi quyền
     */
    event ProducerRemoved(address indexed producer);

    // ================================================================
    // │                       MODIFIERS                              │
    // ================================================================

    /**
     * @dev Kiểm tra lô hàng tồn tại (createdAt > 0 nghĩa là đã được tạo)
     */
    modifier batchExists(uint256 _batchId) {
        if (_batches[_batchId].createdAt == 0) {
            revert BatchNotFound(_batchId);
        }
        _;
    }

    /**
     * @dev Chỉ owner (người tạo) mới được phép thao tác
     */
    modifier onlyBatchOwner(uint256 _batchId) {
        if (_batches[_batchId].owner != msg.sender) {
            revert NotBatchOwner(_batchId, msg.sender);
        }
        _;
    }

    /**
     * @dev Lô hàng phải đang active (chưa Completed/hủy)
     */
    modifier batchActive(uint256 _batchId) {
        if (!_batches[_batchId].isActive) {
            revert BatchNotActive(_batchId);
        }
        _;
    }

    /**
     * @dev Chỉ SystemAdmin mới được gọi
     */
    modifier onlySystemAdmin() {
        if (msg.sender != systemAdmin) revert NotSystemAdmin(msg.sender);
        _;
    }

    /**
     * @dev Chỉ Nông trại đã duyệt mới được gọi
     */
    modifier onlyProducer() {
        if (!isWhitelistedProducer[msg.sender]) revert NotWhitelistedProducer(msg.sender);
        _;
    }

    // ================================================================
    // │                        CONSTRUCTOR                           │
    // ================================================================

    constructor() {
        systemAdmin = msg.sender;
        isWhitelistedProducer[msg.sender] = true;
        emit ProducerAdded(msg.sender);
    }

    // ================================================================
    // │                   WRITE FUNCTIONS                            │
    // ================================================================

    /**
     * @notice Cấp quyền tạo lô hàng cho một địa chỉ ví
     * @param producer Địa chỉ ví nông trại
     */
    function addWhitelistedProducer(address producer) external onlySystemAdmin {
        isWhitelistedProducer[producer] = true;
        emit ProducerAdded(producer);
    }

    /**
     * @notice Thu hồi quyền tạo lô hàng của một địa chỉ ví
     * @param producer Địa chỉ ví nông trại
     */
    function removeWhitelistedProducer(address producer) external onlySystemAdmin {
        isWhitelistedProducer[producer] = false;
        emit ProducerRemoved(producer);
    }

    /**
     * @notice Tạo một lô hàng nông sản mới
     * @dev Bất kỳ ai cũng có thể tạo lô hàng. ID tự động tăng.
     *      Giai đoạn khởi tạo mặc định là Seeding.
     *      Tạo StageRecord đầu tiên luôn (giai đoạn gieo trồng).
     * @param _name Tên lô hàng (VD: "Gạo ST25 - Lô 001")
     * @param _origin Nguồn gốc / vùng trồng (VD: "Sóc Trăng")
     * @param _imageUrl URL ảnh mô tả ban đầu (từ Cloudinary)
     * @return batchId ID của lô hàng vừa tạo
     */
    function createBatch(
        string calldata _name,
        string calldata _origin,
        string calldata _imageUrl
    ) external onlyProducer returns (uint256 batchId) {
        // Validate: tên không được rỗng
        if (bytes(_name).length == 0) {
            revert EmptyBatchName();
        }

        // Tăng counter và gán ID
        _batchCounter++;
        batchId = _batchCounter;

        // Tạo batch mới
        _batches[batchId] = Batch({
            id: batchId,
            name: _name,
            origin: _origin,
            owner: msg.sender,
            currentStage: Stage.Seeding,
            createdAt: block.timestamp,
            isActive: true
        });

        // Tạo StageRecord đầu tiên (Seeding)
        _stageHistory[batchId].push(
            StageRecord({
                stage: Stage.Seeding,
                description: "Batch created - Seeding stage",
                imageUrl: _imageUrl,
                timestamp: block.timestamp,
                updatedBy: msg.sender
            })
        );

        emit BatchCreated(batchId, _name, _origin, msg.sender, block.timestamp);

        return batchId;
    }

    /**
     * @notice Thêm giai đoạn sinh trưởng mới cho lô hàng
     * @dev Chỉ owner mới được cập nhật. Giai đoạn phải tiến về phía trước
     *      (không thể lùi lại). Nếu stage = Completed, batch sẽ tự đóng.
     * @param _batchId ID lô hàng cần cập nhật
     * @param _stage Giai đoạn mới (phải > currentStage)
     * @param _description Mô tả hoạt động (VD: "Bón phân NPK lần 2")
     * @param _imageUrl URL ảnh minh chứng từ Cloudinary
     */
    function addStage(
        uint256 _batchId,
        Stage _stage,
        string calldata _description,
        string calldata _imageUrl
    )
        external
        batchExists(_batchId)
        onlyBatchOwner(_batchId)
        batchActive(_batchId)
    {
        Batch storage batch = _batches[_batchId];

        // Validate: giai đoạn mới phải tiến về phía trước
        if (uint8(_stage) <= uint8(batch.currentStage)) {
            revert InvalidStageProgression(batch.currentStage, _stage);
        }

        // Cập nhật giai đoạn hiện tại
        batch.currentStage = _stage;

        // Lưu bản ghi lịch sử
        _stageHistory[_batchId].push(
            StageRecord({
                stage: _stage,
                description: _description,
                imageUrl: _imageUrl,
                timestamp: block.timestamp,
                updatedBy: msg.sender
            })
        );

        emit StageAdded(_batchId, _stage, _description, _imageUrl, block.timestamp);

        // Nếu hoàn thành → đánh dấu batch inactive
        if (_stage == Stage.Completed) {
            batch.isActive = false;
            emit BatchCompleted(_batchId, block.timestamp);
        }
    }

    // ================================================================
    // │                    READ FUNCTIONS (VIEW)                     │
    // ================================================================

    /**
     * @notice Lấy toàn bộ thông tin lô hàng
     * @param _batchId ID lô hàng
     * @return id ID lô hàng
     * @return name Tên lô hàng
     * @return origin Nguồn gốc
     * @return owner Địa chỉ chủ sở hữu
     * @return currentStage Giai đoạn hiện tại
     * @return createdAt Thời điểm tạo
     * @return isActive Trạng thái hoạt động
     * @return totalStages Tổng số giai đoạn đã ghi nhận
     */
    function getBatch(uint256 _batchId)
        external
        view
        batchExists(_batchId)
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
        Batch storage batch = _batches[_batchId];
        return (
            batch.id,
            batch.name,
            batch.origin,
            batch.owner,
            batch.currentStage,
            batch.createdAt,
            batch.isActive,
            _stageHistory[_batchId].length
        );
    }

    /**
     * @notice Lấy toàn bộ lịch sử giai đoạn của lô hàng
     * @dev Trả về mảng StageRecord[] cho timeline hiển thị
     * @param _batchId ID lô hàng
     * @return records Mảng các bản ghi giai đoạn
     */
    function getStageHistory(uint256 _batchId)
        external
        view
        batchExists(_batchId)
        returns (StageRecord[] memory records)
    {
        return _stageHistory[_batchId];
    }

    /**
     * @notice Lấy thông tin một giai đoạn cụ thể theo index
     * @param _batchId ID lô hàng
     * @param _index Index trong mảng lịch sử (0-based)
     * @return record Bản ghi giai đoạn
     */
    function getStageAt(uint256 _batchId, uint256 _index)
        external
        view
        batchExists(_batchId)
        returns (StageRecord memory record)
    {
        require(_index < _stageHistory[_batchId].length, "Index out of bounds");
        return _stageHistory[_batchId][_index];
    }

    /**
     * @notice Lấy tổng số lô hàng đã tạo
     * @return Tổng số lô hàng (counter hiện tại)
     */
    function getTotalBatches() external view returns (uint256) {
        return _batchCounter;
    }
}
