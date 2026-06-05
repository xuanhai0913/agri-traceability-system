# On-chain và Off-chain trong AgriTrace

Tài liệu này giải thích ranh giới dữ liệu của AgriTrace tại trạng thái production demo hiện tại: contract schema v2 đang chạy trên Polygon Amoy, backend dùng service wallet relayer, PostgreSQL lưu metadata nghiệp vụ và Pinata/IPFS lưu file minh chứng.

## 1. Định Hướng Thiết Kế

AgriTrace không đưa toàn bộ dữ liệu lên blockchain. Đây là quyết định thiết kế có chủ đích:

- Blockchain phù hợp cho dữ liệu cần bất biến: batch lifecycle, stage history, timestamp, actor/service wallet, evidence hash/CID và transaction proof.
- Database phù hợp cho dữ liệu cần quản trị: hồ sơ producer, số điện thoại, email, trạng thái xác thực, linked batch count, inventory, search, audit log.
- IPFS phù hợp cho file minh chứng: ảnh sản xuất, chứng nhận kiểm định, biên nhận kho, ảnh đóng gói/vận chuyển.

Vì vậy, nên gọi mô hình này là **hybrid on-chain/off-chain traceability**. Blockchain là lớp bằng chứng độc lập, database là lớp vận hành để sản phẩm dùng được.

## 2. Dữ Liệu Lưu On-chain

Contract chính: `smart-contracts/contracts/Traceability.sol`.

Production contract v2:

```text
0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8
```

Polygonscan:

```text
https://amoy.polygonscan.com/address/0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8
```

Lifecycle stage:

| Index | Stage | Ý nghĩa |
| --- | --- | --- |
| 0 | `Seeding` | Gieo trồng |
| 1 | `Growing` | Sinh trưởng |
| 2 | `Fertilizing` | Bón phân |
| 3 | `Harvesting` | Thu hoạch |
| 4 | `QualityInspection` | Kiểm định chất lượng |
| 5 | `WarehouseReceived` | Nhập kho |
| 6 | `Packaging` | Đóng gói |
| 7 | `Shipping` | Vận chuyển |
| 8 | `Completed` | Hoàn tất |

| Nhóm dữ liệu | Trường / bằng chứng | Vai trò |
| --- | --- | --- |
| Batch core | `id`, `name`, `origin`, `owner`, `currentStage`, `createdAt`, `isActive` | Ghi nhận lô hàng tồn tại trên contract và đang ở stage nào. |
| Stage history | `stage`, `description`, `imageUrl/ipfsUrl`, `evidenceHash`, `ipfsCid`, `timestamp`, `updatedBy` | Ghi nhận từng mốc trong hành trình. Stage cũ không bị sửa/xóa. |
| Access control | `systemAdmin`, whitelist writer/service wallet | Chặn ví không được cấp quyền ghi dữ liệu. |
| Events | `BatchCreated`, `StageAdded`, `BatchCompleted`, `ProducerAdded`, `ProducerRemoved` | Tạo log để explorer/RPC kiểm tra. |
| Transaction proof | `txHash`, `blockNumber`, `blockTimestamp` | Bằng chứng cấp blockchain cho mỗi thao tác ghi. |

Lưu ý:

- `imageUrl` không phải byte ảnh. Với flow hiện tại, đây là IPFS gateway URL.
- `evidenceHash` là SHA-256 của file gốc do backend tính trước khi upload.
- `ipfsCid` là CID từ Pinata/IPFS.
- Vì dùng relayer, `owner` và `updatedBy` thường là service wallet: `0xCBe061edb5159ac5E61Ff3C87e2402e5a4CAac5f`.

## 3. Dữ Liệu Lưu Off-chain

### PostgreSQL

PostgreSQL là lớp metadata nghiệp vụ, không phải nguồn thay thế blockchain.

| Bảng / nhóm dữ liệu | Nội dung | Lý do lưu off-chain |
| --- | --- | --- |
| `users` | Email, password hash, role, status, producer/warehouse link | Phục vụ đăng nhập và phân quyền, cần disable/update được. |
| `producers` | Name, contact, website, status, certifications, audits, profile data | Hồ sơ có thể thay đổi và có dữ liệu cá nhân/liên hệ. |
| `batch_producer_links` | `batch_id`, `producer_id`, role, notes | Gắn batch on-chain với producer profile để UI hiển thị. |
| `batch_transaction_records` | Tx hash, block number, action, actor role, evidence hash/CID/URL | Index giao dịch để Batch Detail/Compliance load nhanh. |
| `quality_inspections` | PASS/FAIL, score, grade, certificate, note, tx metadata | Dữ liệu kiểm định cần hiển thị chi tiết và tìm kiếm. |
| `warehouse_receipts` | Kho nhận, số lượng, đơn vị, tình trạng, người nhận, tx metadata | Metadata nhập kho phục vụ vận hành. |
| `warehouse_stock_movements` | INBOUND/OUTBOUND/RESERVED/SHIPPED, quantity, note | Quản lý tồn kho off-chain, không làm phình contract. |

Production hiện đã dọn producer mock không liên quan. `/api/producers` chỉ giữ các hồ sơ testnet phục vụ demo:

- `Nhà Sản Xuất Hải Làm Dev`
- `Nhà Phân Phối Hải Làm Dev`

Các chứng nhận/audit trong hai hồ sơ này là testnet record, không phải chứng nhận pháp lý thật.

### Pinata/IPFS

Flow evidence:

1. Frontend gửi file tới backend.
2. Backend nhận file bằng multer memory buffer.
3. Backend tính SHA-256 từ file gốc để tạo `evidenceHash`.
4. Backend upload file lên Pinata bằng `PINATA_JWT` phía server.
5. Pinata trả về CID.
6. Backend build `ipfsUrl` từ `IPFS_GATEWAY`.
7. Backend gửi `ipfsUrl`, `evidenceHash`, `ipfsCid` vào contract v2 và lưu metadata ở PostgreSQL.

Frontend không giữ `PINATA_JWT`, private key hay database URL.

## 4. Luồng Ghi Dữ Liệu

### Tạo Batch

```text
User role hợp lệ
→ nhập batch + producer/account link
→ upload evidence lên backend
→ backend hash file + pin IPFS
→ backend gọi createBatch trên contract
→ contract tạo stage Seeding
→ backend lưu tx metadata + producer link
→ UI hiển thị Batch Detail + QR + explorer link
```

### Thêm Stage

```text
Role phù hợp
→ chọn stage kế tiếp
→ upload evidence nếu có
→ backend validate stage/RBAC/business rule
→ backend gọi addStage trên contract
→ backend lưu tx record, block number, actor role, hash/CID
→ public QR timeline cập nhật sau cache refresh
```

Business rules chính:

- Producer chỉ cập nhật stage sản xuất: Seeding/Growing/Fertilizing/Harvesting.
- Inspector cập nhật `QualityInspection`.
- Warehouse staff cập nhật `WarehouseReceived`.
- Distributor cập nhật Packaging/Shipping/Completed.
- Không nhập kho nếu chưa có `QualityInspection PASS`.
- Không shipping nếu chưa nhập kho.
- Không thêm stage sau `Completed`.

## 5. Luồng Đọc Và Xác Minh

Khi mở `/batches/:id` hoặc quét QR:

1. Backend đọc batch và stage history từ smart contract.
2. Backend đọc producer link, inspection, warehouse receipt, inventory/tx metadata từ PostgreSQL.
3. Frontend ghép dữ liệu thành timeline dễ đọc.
4. Người dùng có thể mở tx hash trên Polygonscan hoặc kiểm bằng JSON-RPC.

Nếu PostgreSQL lỗi, dữ liệu on-chain vẫn có thể đọc từ contract nhưng thiếu metadata producer/inventory. Nếu RPC/blockchain lỗi, hệ thống không thể xác minh lifecycle và phải báo unavailable.

## 6. Bằng Chứng Transaction Mẫu

Batch production read-only hiện tại:

| Trường | Giá trị |
| --- | --- |
| Batch detail | [https://agri.hailamdev.space/batches/1](https://agri.hailamdev.space/batches/1) |
| Batch code | `BTC-0001` |
| Contract | `0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8` |
| Service wallet | `0xCBe061edb5159ac5E61Ff3C87e2402e5a4CAac5f` |
| Create tx | [0x4db047cc1921b372b6960cb0b31790f818053214a41cae6c043a2598bd210fcb](https://amoy.polygonscan.com/tx/0x4db047cc1921b372b6960cb0b31790f818053214a41cae6c043a2598bd210fcb) |
| Block | `39596735` |
| Producer metadata | `Nhà Sản Xuất Hải Làm Dev`, lưu ở PostgreSQL và linked theo `batchId=1`. |
| Evidence hash | `sha256:4b5c5c92cec3b23e6a294fc0eea43234ef5126c5a64f4c6c531ac8430ab0b844` |
| IPFS CID | `QmXWzMbQQAnQSAwFrd7PrZkPV7wACc6XdpZVxFUP8hNw1L` |

Câu nói ngắn khi phản biện:

> Batch Detail hiển thị dữ liệu gộp: lifecycle đọc từ smart contract, producer/warehouse metadata đọc từ PostgreSQL. Transaction hash, block number, evidence hash và IPFS CID là các bằng chứng có thể kiểm tra độc lập.

## 7. Vì Sao Không Đưa Toàn Bộ Dữ Liệu Lên Blockchain?

| Dữ liệu | Nên on-chain? | Lý do |
| --- | --- | --- |
| Batch ID, tên, origin, stage, timestamp | Có | Đây là lõi truy xuất cần bất biến. |
| IPFS URL, evidence hash, IPFS CID | Có | Neo bằng chứng file minh chứng vào stage. |
| Ảnh/video/file gốc | Không | Dung lượng lớn, tốn gas, không phù hợp on-chain. |
| Phone/email/website producer | Không | Dữ liệu hồ sơ có thể thay đổi và có yếu tố riêng tư. |
| Inventory movement chi tiết | Off-chain | Cần tính toán vận hành linh hoạt, không phải toàn bộ đều cần đưa lên contract. |
| Dashboard/search/cache | Không | Dữ liệu tổng hợp phục vụ UX, có thể tính lại. |

## 8. Điểm Trung Thực Khi Trình Bày

Nên nói rõ:

- Dự án đang là production demo/testnet, không phải hệ thống thương mại mainnet.
- Blockchain không tự xác minh sự thật ngoài đời; vẫn cần kiểm định, quy trình nhập liệu và trách nhiệm actor.
- Database vẫn cần thiết để sản phẩm dùng được.
- Producer-batch link hiện là metadata off-chain; hướng phát triển là neo thêm `producerProfileHash`.
- Pinata/IPFS lưu file, blockchain lưu URL/hash/CID chứ không lưu byte ảnh.

Trả lời nhanh câu "dùng DB có sai đề tài blockchain không?":

> Không sai. Blockchain đảm bảo phần cần bất biến của truy xuất nguồn gốc: batch lifecycle, stage history, evidence hash/CID và transaction proof. Database chỉ lưu metadata vận hành như producer profile, contact, inventory và search. Đây là mô hình hybrid thường dùng khi đưa blockchain vào sản phẩm thực tế.

## 9. Hướng Phát Triển Tiếp Theo

- Verify source contract trên Polygonscan/Sourcify nếu cần tăng độ thuyết phục khi demo.
- Neo thêm `producerIdHash` hoặc `producerProfileHash` vào transaction.
- Tách nhiều ví actor hoặc dùng account abstraction thay vì toàn bộ transaction do service wallet ký.
- Dùng Redis/shared cache và queue transaction nếu chạy nhiều backend instance.
- Bổ sung audit trail đầy đủ cho thay đổi off-chain.
- Hoàn thiện mobile consumer scan với timeline Quality/Warehouse/IPFS proof.
