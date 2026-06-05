# Bộ ảnh demo quy trình lúa

Folder này chứa ảnh evidence đã chuẩn bị sẵn để upload khi demo AgriTrace. Tất cả ảnh được tải từ Wikimedia Commons; thông tin nguồn, license, artist và SHA-256 nằm trong `manifest.json`.

## Cách dùng nhanh

| Stage | File nên upload | Ghi chú demo |
| --- | --- | --- |
| Create Batch | `01-create-batch-rice-seedlings.jpg` | Ảnh mạ giống/lô ban đầu. |
| Seeding | `02-seeding-transplanting-rice.jpg` | Cấy mạ/gieo trồng. |
| Growing | `03-growing-rice-field.jpg` | Ruộng lúa đang sinh trưởng. |
| Fertilizing | `04-fertilizing-rice-care.jpg` | Chăm sóc/bón phân/xử lý ruộng. |
| Harvesting | `05-harvesting-rice.jpg` | Thu hoạch lúa. |
| QualityInspection | `06-quality-inspection-rice-lab.jpg` | Kiểm nghiệm mẫu gạo trong phòng lab. |
| WarehouseReceived | `07-warehouse-receiving-rice-bags.jpg` | Nhập kho/bao gạo vào kho. |
| Packaging | `08-packaging-rice-bag.jpg` | Bao bì/đóng gói gạo. |
| Shipping | `09-shipping-rice-truck.jpg` | Xe tải vận chuyển bao gạo. |
| Completed | `10-completed-rice-grains.jpg` | Hạt gạo thành phẩm, dùng khi cần ảnh hoàn tất. |

## Lưu ý khi phản biện

- Đây là ảnh demo minh họa quy trình, không phải bằng chứng pháp lý thật.
- Khi upload, backend sẽ tính `evidenceHash` từ file và pin IPFS qua Pinata nếu cấu hình đang hoạt động.
- Nếu bị hỏi nguồn ảnh, mở `manifest.json` để chỉ source page và license.

## Kịch bản demo đầy đủ

Kịch bản nên đi đúng một mạch: Producer tạo lô -> Inspector kiểm định -> Warehouse nhập kho -> Distributor vận chuyển -> Consumer quét QR -> xem blockchain/IPFS proof.

### 1. Chuẩn bị trước

Mở sẵn các tab:

- Product: `https://agri.hailamdev.space`
- Login: `https://agri.hailamdev.space/login`
- Contract Polygonscan: `https://amoy.polygonscan.com/address/0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8`
- Sourcify verified source: `https://repo.sourcify.dev/80002/0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8`
- Folder ảnh: `docs/demo/rice-evidence`

Tài khoản demo dùng các role đã seed/cấu hình:

- Admin
- Producer
- Quality Inspector
- Warehouse Staff
- Distributor

Nếu cần nói nhanh:

> Dự án dùng multi-role account. Mỗi role chỉ được thao tác đúng phần nghiệp vụ của mình, backend cũng kiểm tra quyền chứ không chỉ ẩn nút ở frontend.

### 2. Mở đầu

Nói:

> Em xin demo hệ thống AgriTrace, một hệ thống truy xuất nguồn gốc nông sản ứng dụng blockchain. Dự án sử dụng mô hình hybrid on-chain/off-chain: blockchain lưu vòng đời lô hàng, transaction proof, evidence hash và IPFS CID; PostgreSQL lưu metadata nghiệp vụ như hồ sơ producer, kiểm định, nhập kho, vận chuyển. File minh chứng được lưu trên IPFS thông qua Pinata.

### 3. Login Producer và tạo lô hàng

Vào `/login`, đăng nhập Producer, sau đó vào:

`Producer Workspace -> Tạo lô mới`

Tạo batch:

- Tên lô: `Gạo ST25 Demo`
- Xuất xứ: `Sóc Trăng, Việt Nam`
- Ảnh: `01-create-batch-rice-seedlings.jpg`

Nói:

> Ở bước này producer tạo lô nông sản. Producer account đã được gắn với một nhà sản xuất cụ thể, nên producer không thể tự chọn tùy ý nhà sản xuất khác. Backend sẽ ghi batch mới và stage đầu tiên lên blockchain bằng service wallet.

Sau khi tạo xong, chỉ:

- Batch ID
- Producer linked
- Current stage
- Transaction hash nếu có

### 4. Producer cập nhật stage sản xuất

Trong Batch Detail, thêm lần lượt:

| Stage | Mô tả gợi ý | Ảnh upload |
| --- | --- | --- |
| Seeding | `Cấy mạ giống ST25 trên ruộng đã chuẩn bị` | `02-seeding-transplanting-rice.jpg` |
| Growing | `Cây lúa sinh trưởng ổn định, theo dõi sâu bệnh định kỳ` | `03-growing-rice-field.jpg` |
| Fertilizing | `Bón phân và chăm sóc theo quy trình canh tác an toàn` | `04-fertilizing-rice-care.jpg` |
| Harvesting | `Thu hoạch lúa khi đạt độ chín phù hợp` | `05-harvesting-rice.jpg` |

Nói:

> Producer chỉ được cập nhật các stage sản xuất gồm Seeding, Growing, Fertilizing và Harvesting. Mỗi lần cập nhật, hệ thống upload evidence lên IPFS, tính SHA-256 hash, sau đó ghi stage, hash, CID và timestamp lên blockchain.

Chỉ trên màn hình:

- Timeline tăng dần
- Evidence image
- Evidence hash
- IPFS CID
- Tx hash/block number

### 5. Login Quality Inspector và kiểm định

Logout Producer, login Quality Inspector, vào:

`Inspector Workspace -> Queue kiểm định`

Chọn batch vừa thu hoạch.

Nhập kiểm định:

- Result: `PASS`
- Score: `92`
- Grade: `A`
- Certificate No: `QC-ST25-2026-001`
- Note: `Mẫu đạt tiêu chuẩn kiểm định demo`
- Ảnh: `06-quality-inspection-rice-lab.jpg`

Nói:

> Sau khi producer thu hoạch, lô hàng phải qua bước kiểm định chất lượng. Chỉ role Quality Inspector hoặc Admin mới được tạo stage QualityInspection. Nếu kết quả FAIL thì hệ thống sẽ chặn nhập kho và vận chuyển.

Sau submit, chỉ:

- PASS badge
- Certificate No
- Score/Grade
- Transaction hash
- Evidence hash/IPFS CID

### 6. Login Warehouse Staff và nhập kho

Logout Inspector, login Warehouse Staff, vào:

`Warehouse Workspace -> Receiving`

Chọn batch đã kiểm định PASS.

Nhập kho:

- Warehouse: `Kho Nông sản TP.HCM`
- Location: `Quận 12, TP.HCM`
- Quantity: `500`
- Unit: `kg`
- Condition note: `Bao gạo nguyên vẹn, đủ số lượng, đạt điều kiện nhập kho`
- Ảnh: `07-warehouse-receiving-rice-bags.jpg`

Nói:

> Warehouse Staff chỉ thấy các batch đã kiểm định PASS và chưa nhập kho. Metadata chi tiết như kho, địa chỉ, số lượng, tình trạng hàng được lưu ở PostgreSQL. Còn stage WarehouseReceived, evidenceHash, IPFS CID và transaction proof được neo vào blockchain.

Chỉ:

- WarehouseReceived trong timeline
- Quantity/unit
- Warehouse name/location
- Tx hash/block number

### 7. Login Distributor và vận chuyển

Logout Warehouse, login Distributor, vào:

`Distributor Workspace -> Queue`

Chọn batch đã nhập kho.

Thêm stage `Packaging`:

- Mô tả: `Đóng gói gạo ST25 theo bao 5kg, niêm phong trước vận chuyển`
- Ảnh: `08-packaging-rice-bag.jpg`

Thêm stage `Shipping`:

- Destination: `Cửa hàng phân phối TP.HCM`
- Transporter: `Nhà phân phối Hải Làm Dev`
- Vehicle info: `Xe tải demo 51C-2026`
- Note: `Vận chuyển trong ngày, bao bì nguyên vẹn`
- Ảnh: `09-shipping-rice-truck.jpg`

Nếu còn thời gian, thêm `Completed`:

- Mô tả: `Lô hàng hoàn tất hành trình truy xuất`
- Ảnh: `10-completed-rice-grains.jpg`

Nói:

> Distributor chỉ được cập nhật đóng gói, vận chuyển và hoàn tất. Đây là phân quyền backend. Nếu dùng token sai role để gọi API thì backend vẫn chặn.

### 8. Demo Consumer QR/Public Page

Mở public batch page hoặc QR code của batch.

Nói:

> Đây là giao diện người tiêu dùng. Người tiêu dùng không cần đăng nhập, chỉ cần quét QR hoặc mở link public để xem toàn bộ hành trình.

Chỉ các phần:

- Tên sản phẩm
- Batch ID
- Producer
- Timeline đủ stage
- QualityInspection PASS
- WarehouseReceived
- Packaging/Shipping
- Evidence image
- Evidence hash
- IPFS CID
- Transaction hash
- Block number
- Explorer link

Nói:

> Nếu file evidence bị thay đổi, SHA-256 hash và IPFS CID sẽ khác với dữ liệu đã ghi trên blockchain. Vì vậy hệ thống không cần lưu ảnh trực tiếp on-chain nhưng vẫn kiểm chứng được tính toàn vẹn của bằng chứng.

### 9. Demo blockchain proof

Mở transaction hash trên Polygonscan.

Nói:

> Đây là transaction thật trên Polygon Amoy testnet. Có block number, transaction hash, contract address và thời điểm ghi nhận.

Sau đó mở Sourcify contract source:

> Sourcify cho thấy source contract đã được verify. Polygonscan dùng để xem transaction và block; Sourcify dùng để xem source code verified.

### 10. Demo Compliance Page

Vào `Compliance`.

Chỉ:

- API health
- DB status
- Network Polygon Amoy
- Contract address
- Source verified
- Total batches
- Recent transaction links
- Sourcify/Polygonscan links

Nói:

> Trang Compliance dùng để gom bằng chứng kỹ thuật: backend đang hoạt động, database kết nối, contract address, network, batch summary và các link kiểm chứng blockchain.

### 11. Kết luận demo

Nói:

> Qua demo, hệ thống đã thể hiện đầy đủ luồng Producer tạo lô, Inspector kiểm định, Warehouse nhập kho, Distributor vận chuyển và Consumer quét QR. Blockchain đảm bảo lịch sử stage và bằng chứng hash/CID không bị sửa âm thầm; IPFS lưu file minh chứng; PostgreSQL lưu metadata nghiệp vụ. Đây là mô hình hybrid phù hợp vì không đưa toàn bộ dữ liệu lên blockchain, tránh tốn gas nhưng vẫn đảm bảo tính minh bạch và kiểm chứng được.

## Câu trả lời nhanh khi thầy hỏi

**Blockchain lưu gì?**

Blockchain lưu batch lifecycle, stage, timestamp, ví cập nhật, evidenceHash, ipfsCid và transaction proof.

**Database lưu gì?**

Database lưu metadata nghiệp vụ: producer, user role, warehouse, quantity, inspection score, certificate, inventory, audit log.

**Ảnh có bị sửa được không?**

Ảnh nằm off-chain, nhưng hash/CID đã ghi on-chain. Sửa ảnh thì hash/CID đổi, không khớp bằng chứng blockchain.

**Vì sao không đưa role hết lên smart contract?**

Dự án dùng backend relayer để UX dễ hơn cho người dùng không rành ví crypto. RBAC xử lý ở backend, contract kiểm soát service wallet/whitelist. Đây là hướng phù hợp cho demo học thuật và hệ thống Web2-Web3 hybrid.

**Polygonscan chưa hiện source verified thì sao?**

Source đã verify trên Sourcify. Polygonscan dùng xem tx/block, Sourcify dùng xem source contract verified.

## Kịch bản dự phòng nếu không kịp tạo batch mới

Mở batch demo có sẵn đã Completed.

Nói:

> Do blockchain transaction phụ thuộc mạng testnet nên em mở batch đã chạy trước để tránh mất thời gian chờ xác nhận. Dữ liệu này vẫn là transaction thật, có tx hash, block number, IPFS CID và Sourcify verified contract.

Sau đó đi thẳng:

Batch Detail -> QR/Public Page -> Polygonscan tx -> Sourcify -> Compliance.
