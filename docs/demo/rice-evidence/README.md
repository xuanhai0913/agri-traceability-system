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

## Link mở nhanh khi demo

Các link được đặt ngay trong từng bước của kịch bản để khi demo không phải quay lên đầu trang tìm lại.

- **Link app**: mở đúng màn hình cần thao tác cho role đang demo.
- **Link tx mẫu**: dùng khi testnet chậm hoặc cần chỉ nhanh transaction thật của batch demo có sẵn.
- **Link contract/source**: dùng ở bước blockchain proof để chỉ contract address, service wallet và source code verified.
- **Link IPFS**: dùng ở bước consumer/public page để chứng minh evidence được lưu ngoài blockchain.

## Kịch bản demo đầy đủ

Kịch bản nên đi đúng một mạch: Producer tạo lô -> Inspector kiểm định -> Warehouse nhập kho -> Distributor vận chuyển -> Consumer quét QR -> xem blockchain/IPFS proof.

### 1. Chuẩn bị trước

Mở sẵn các tab:

- Product: [agri.hailamdev.space](https://agri.hailamdev.space/)
- Login: [https://agri.hailamdev.space/login](https://agri.hailamdev.space/login)
- Contract Polygonscan: [`0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8`](https://amoy.polygonscan.com/address/0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8)
- Sourcify verified source: [Sourcify `0xA94D...b7ed8`](https://repo.sourcify.dev/80002/0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8)
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

Link nhanh:

- [Login](https://agri.hailamdev.space/login)
- [Producer tạo lô mới](https://agri.hailamdev.space/producer/batches/new)
- [Producer profile linked producer](https://agri.hailamdev.space/producer/profile)
- Tx mẫu nếu cần chỉ proof nhanh: [Create Batch `0x4db047...10fcb`](https://amoy.polygonscan.com/tx/0x4db047cc1921b372b6960cb0b31790f818053214a41cae6c043a2598bd210fcb)

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

Link nhanh:

- Nếu demo bằng batch có sẵn: [Public Batch #1](https://agri.hailamdev.space/batches/1)
- Tx mẫu Growing: [0xc62054...94b2f](https://amoy.polygonscan.com/tx/0xc620547a8de316cf04ebb7b1f24502a015f29aa2cc6adb29d9bb4c61d2694b2f)
- Tx mẫu Fertilizing: [0x59fdea...f97b2](https://amoy.polygonscan.com/tx/0x59fdea85297f31c1f866eb0cee5d52b4ed9b3863e1d02c1bb20c5fb5d1ef97b2)
- Tx mẫu Harvesting: [0x21a1a9...09d6](https://amoy.polygonscan.com/tx/0x21a1a9a6f80663e3710f5612f381222dabb0a56fa2bcca3590245b3df70f09d6)

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

Link nhanh:

- [Login](https://agri.hailamdev.space/login)
- [Inspection Queue](https://agri.hailamdev.space/inspector/queue)
- Tx mẫu QualityInspection: [0x36aae8...9d7e](https://amoy.polygonscan.com/tx/0x36aae8f5fb35bf825ffbef3dc2915e788c4222f44d4e62393aecd474a0ed9d7e)

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

Link nhanh:

- [Login](https://agri.hailamdev.space/login)
- [Warehouse Receiving](https://agri.hailamdev.space/warehouse/receiving)
- [Warehouse Inventory](https://agri.hailamdev.space/warehouse/inventory)
- Tx mẫu WarehouseReceived: [0x94fb89...5849](https://amoy.polygonscan.com/tx/0x94fb898f5e0cd6c0dc5a36e44a21fb319bf19926d71db43e8d98184a32615849)

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

Link nhanh:

- [Login](https://agri.hailamdev.space/login)
- [Distributor Queue](https://agri.hailamdev.space/distributor/queue)
- Tx mẫu Packaging: [0x5719a0...36be](https://amoy.polygonscan.com/tx/0x5719a01ea9f374cdba1b72fe96e575ba4d6b4a933c77a094c9e00a0e671336be)
- Tx mẫu Shipping: [0x8ed588...322d](https://amoy.polygonscan.com/tx/0x8ed588c2f8019d1584d1c373ff3d80c977673088ebe2a2be27f7f7a03a57322d)
- Tx mẫu Completed: [0xf7b1df...fd6f](https://amoy.polygonscan.com/tx/0xf7b1dfdcbb24d08300307fe56d1ede3eaca9db224861048019bd4dc82b7cfd6f)

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

Link nhanh:

- Nếu dùng batch vừa tạo: mở public page từ nút QR/verification link trong Batch Detail.
- Nếu dùng batch mẫu: [Public Batch #1](https://agri.hailamdev.space/batches/1)
- IPFS evidence mẫu: [Pinata/IPFS CID `QmXWz...Nw1L`](https://scarlet-objective-narwhal-346.mypinata.cloud/ipfs/QmXWzMbQQAnQSAwFrd7PrZkPV7wACc6XdpZVxFUP8hNw1L)

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

Link nhanh:

- Contract address: [`0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8`](https://amoy.polygonscan.com/address/0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8)
- Service wallet/relayer: [`0xCBe061edb5159ac5E61Ff3C87e2402e5a4CAac5f`](https://amoy.polygonscan.com/address/0xCBe061edb5159ac5E61Ff3C87e2402e5a4CAac5f)
- Sourcify verified source: [Sourcify `0xA94D...b7ed8`](https://repo.sourcify.dev/80002/0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8)
- Tx mẫu Completed để mở nhanh: [0xf7b1df...fd6f](https://amoy.polygonscan.com/tx/0xf7b1dfdcbb24d08300307fe56d1ede3eaca9db224861048019bd4dc82b7cfd6f)

Nói:

> Đây là transaction thật trên Polygon Amoy testnet. Có block number, transaction hash, contract address và thời điểm ghi nhận.

Sau đó mở Sourcify contract source:

> Sourcify cho thấy source contract đã được verify. Polygonscan dùng để xem transaction và block; Sourcify dùng để xem source code verified.

### 10. Demo Compliance Page

Vào `Compliance`.

Link nhanh:

- [Compliance evidence](https://agri.hailamdev.space/compliance)
- Contract address trong Compliance: [`0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8`](https://amoy.polygonscan.com/address/0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8)
- Sourcify source verified: [Sourcify source](https://repo.sourcify.dev/80002/0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8)

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
