# Kịch Bản Demo Bảo Vệ AgriTrace

Tài liệu này là script thao tác và lời nói cho buổi bảo vệ. Trạng thái cập nhật: production demo đang chạy contract schema v2 trên Polygon Amoy, dùng Pinata/IPFS cho evidence và đã dọn producer mock không liên quan.

Không đưa email/password admin production vào tài liệu public. Khi demo, dùng tài khoản đã cấu hình trong ENV.

## 1. Checklist Trước Khi Demo

Mở sẵn các tab:

| Mục | Link |
| --- | --- |
| Production app | [https://agri.hailamdev.space/](https://agri.hailamdev.space/) |
| API health | [https://agritrace-api.onrender.com/api/health](https://agritrace-api.onrender.com/api/health) |
| Ledger | [https://agri.hailamdev.space/batches](https://agri.hailamdev.space/batches) |
| Batch demo read-only | [https://agri.hailamdev.space/batches/1](https://agri.hailamdev.space/batches/1) |
| Producer/partner network | [https://agri.hailamdev.space/producers](https://agri.hailamdev.space/producers) |
| Compliance | [https://agri.hailamdev.space/compliance](https://agri.hailamdev.space/compliance) |
| Contract Polygonscan | [https://amoy.polygonscan.com/address/0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8](https://amoy.polygonscan.com/address/0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8) |

Trước giờ demo 5-10 phút:

1. Mở API health để warm backend Render.
2. Mở Dashboard, Ledger, Batch Detail, Producers và Compliance để cache route.
3. Đăng nhập sẵn admin hoặc role cần demo trong một tab riêng nếu hội đồng cho thao tác live.
4. Chuẩn bị một ảnh nông sản nếu muốn demo upload IPFS.
5. Không revoke whitelist/service wallet trên production.

## 2. Script Demo 5 Phút

### 0:00 - 0:30: Mở Đầu

Mở [production app](https://agri.hailamdev.space/).

Nói:

> Em xin demo AgriTrace, hệ thống truy xuất nguồn gốc nông sản bằng blockchain. Hệ thống dùng mô hình hybrid: smart contract trên Polygon Amoy lưu lifecycle và transaction proof, PostgreSQL lưu metadata vận hành, còn Pinata/IPFS lưu file minh chứng theo CID/hash.

Chỉ vào top bar:

- Backend connected.
- Service wallet / Polygon Amoy.
- Contract/network status nếu có.

Nói tiếp:

> Service wallet là ví backend dùng để ký giao dịch testnet thay người dùng nghiệp vụ. Nhờ vậy producer, inspector hay nhân viên kho không cần cài ví crypto hoặc trả gas trực tiếp.

### 0:30 - 1:10: Dashboard Live Evidence

Ở Dashboard, chỉ vào:

- Tổng batch.
- Recent activity.
- API/DB/network/contract status.
- Service wallet.

Nói:

> Dashboard không dùng số liệu thị trường giả. Số batch và trạng thái hệ thống được tổng hợp từ backend, database và smart contract. Nếu backend, DB hoặc RPC lỗi, UI phải báo trạng thái thay vì giả vờ dữ liệu vẫn hợp lệ.

### 1:10 - 1:45: Producer/Partner Network

Mở [Producer/Partner Network](https://agri.hailamdev.space/producers).

Thao tác:

1. Chỉ vào `Nhà Sản Xuất Hải Làm Dev`.
2. Chỉ vào linked batch count.
3. Mở detail producer nếu cần.

Nói:

> Phần này là hồ sơ đối tác chuỗi cung ứng. Production hiện đã dọn các producer mock không liên quan; chỉ giữ hồ sơ testnet phục vụ demo. Linked batch count không phải số ảo, mà lấy từ quan hệ batch-producer trong PostgreSQL.

Nếu bị hỏi vì sao producer không nằm trực tiếp trên contract:

> Smart contract tập trung vào lifecycle của batch. Hồ sơ producer có số điện thoại, email, trạng thái xác thực và audit testnet nên được lưu off-chain để cập nhật linh hoạt. Hướng phát triển là neo thêm `producerProfileHash` vào transaction.

### 1:45 - 2:30: Ledger Và Batch Detail

Mở [Ledger](https://agri.hailamdev.space/batches), sau đó mở [batch 1](https://agri.hailamdev.space/batches/1).

Thao tác:

1. Chỉ batch `BTC-0001`.
2. Chỉ producer linked.
3. Chỉ timeline 9 stage: Seeding tới Completed.
4. Chỉ evidence hash, IPFS CID/URL.
5. Chỉ transaction hash/block number.

Nói:

> Ledger là sổ cái truy xuất. Batch/stage được đọc từ smart contract, còn producer link, actor role, tx metadata và IPFS evidence được gắn thêm từ PostgreSQL. Batch detail cho thấy toàn bộ hành trình của lô hàng và bằng chứng transaction.

Với batch hiện tại:

- Contract: `0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8`.
- Create tx mẫu: `0x4db047cc1921b372b6960cb0b31790f818053214a41cae6c043a2598bd210fcb`.
- Block mẫu: `39596735`.
- Evidence CID mẫu: `QmXWzMbQQAnQSAwFrd7PrZkPV7wACc6XdpZVxFUP8hNw1L`.

Không cần đọc hết các hash khi demo; chỉ dùng nếu thầy/cô yêu cầu bằng chứng cụ thể.

### 2:30 - 3:10: QR Và Public Verification

Ở Batch Detail:

1. Chỉ vào QR.
2. Bấm copy verification link hoặc quét bằng điện thoại.
3. Mở URL public `/batches/1`.

Nói:

> QR là cổng để người tiêu dùng mở trang public. Người tiêu dùng không cần đăng nhập vẫn xem được timeline, producer, quality inspection, warehouse receipt, evidence hash/CID và link explorer.

Nếu bị hỏi QR bị copy thì sao:

> Copy QR là rủi ro vật lý. Bản demo tập trung vào truy xuất dữ liệu lô hàng. Khi triển khai thật cần tem vỡ, serial theo đơn vị đóng gói hoặc NFC/RFID để chống sao chép tem.

### 3:10 - 3:50: Compliance

Mở [Compliance](https://agri.hailamdev.space/compliance).

Thao tác:

1. Chỉ API health.
2. Chỉ DB available.
3. Chỉ Polygon Amoy.
4. Mở contract trên Polygonscan.
5. Chỉ batch summary và recent evidence.

Nói:

> Compliance gom bằng chứng để phản biện nhanh: API đang chạy, database available, network là Polygon Amoy, contract address public, batch count đọc được và transaction có thể mở trên explorer. Đây là phần giúp chứng minh demo không chỉ là UI tĩnh.

Lưu ý hiện tại:

> Contract tồn tại trên Polygon Amoy và có bytecode thật, nhưng chưa verify source trên Sourcify. Vì vậy khi demo chỉ mở Polygonscan/transaction; phần Sourcify là hướng hoàn thiện thêm, không nói là đã verified.

Nếu Polygonscan load chậm:

> Polygonscan chỉ là công cụ xem. Có thể kiểm transaction bằng JSON-RPC `eth_getTransactionReceipt` với tx hash.

### 3:50 - 4:50: Optional Live Role Flow

Chỉ làm nếu mạng ổn và còn thời gian. Nếu thời lượng ngắn, dùng batch đã có transaction sẵn.

Flow live nên nói theo vai trò:

```text
Producer tạo batch
→ Producer cập nhật Growing/Fertilizing/Harvesting
→ Inspector kiểm định PASS
→ Warehouse Staff nhập kho
→ Distributor Shipping/Completed
→ Consumer quét QR
```

Khi thao tác live:

1. Đăng nhập role phù hợp.
2. Dùng tên batch chuyên nghiệp, không dùng `test`, `abc`.
3. Upload ảnh evidence để tạo hash/CID.
4. Chờ transaction success rồi mở Batch Detail.
5. Nếu transaction chậm, chuyển về batch đã chuẩn bị.

Nói:

> Giao dịch blockchain cần thời gian xác nhận, nên em chuẩn bị sẵn batch có đủ stage và tx hash. Khi thao tác live thành công, hệ thống sẽ invalidate cache để batch mới xuất hiện trên Ledger/Compliance.

### 4:50 - 5:00: Kết Luận

Nói:

> AgriTrace không cố đưa toàn bộ dữ liệu lên blockchain. Blockchain lưu phần cần bất biến: lifecycle, stage history, hash/CID và transaction proof. Database lưu metadata để hệ thống dùng được trong vận hành thật. Đây là cách tiếp cận hybrid phù hợp bài toán truy xuất nguồn gốc nông sản.

## 3. Script Nói Ngắn 3 Phút

1. Dashboard:
   > Đây là dashboard production, tổng hợp backend, database, service wallet và smart contract.

2. Producers:
   > Đây là hồ sơ đối tác chuỗi cung ứng đã dọn mock; linked batch count lấy từ database thật.

3. Ledger:
   > Đây là sổ cái batch. Dữ liệu lifecycle đọc từ contract, metadata nghiệp vụ gắn từ PostgreSQL.

4. Batch Detail:
   > Đây là QR verification. Timeline có stage, evidence hash/CID, tx hash và block number.

5. Compliance:
   > Đây là trang bằng chứng để mở contract, network, API health và explorer.

6. Kết luận:
   > Dự án dùng hybrid on-chain/off-chain: blockchain cho tính bất biến, database cho vận hành và UX.

## 4. Câu Trả Lời Nhanh

### Vì sao dùng database nếu đã có blockchain?

> Blockchain không phù hợp lưu ảnh lớn, số điện thoại, email, chứng nhận hoặc dữ liệu cần cập nhật. AgriTrace dùng blockchain để lưu lifecycle bất biến, còn database lưu metadata vận hành. Nếu bỏ database thì sản phẩm khó dùng; nếu bỏ blockchain thì mất bằng chứng độc lập.

### Dữ liệu nào nằm trên blockchain?

> Batch ID, tên lô, nguồn gốc, service wallet/owner, current stage, stage history, timestamp, updatedBy, IPFS URL, evidence hash, IPFS CID và event/transaction proof.

### Ảnh minh chứng có nằm trên blockchain không?

> Không lưu byte ảnh trên-chain. File được pin lên Pinata/IPFS, backend tính SHA-256, contract v2 lưu IPFS URL/hash/CID trong stage record và database lưu metadata để UI truy vấn nhanh.

### Production hiện còn mock không?

> Production đã dọn các producer mock không liên quan. Các hồ sơ còn lại là testnet profile phục vụ demo và được mô tả rõ là testnet record, không phải chứng nhận pháp lý thật.

### Vì sao dùng service wallet?

> Để người dùng nghiệp vụ không cần cài ví, giữ private key hoặc trả gas. Backend relayer ký transaction, còn smart contract whitelist service wallet để kiểm soát quyền ghi.

### Hệ thống đã là production thương mại chưa?

> Đây là production demo/testnet phục vụ khóa luận: có deploy thật, database thật, smart contract thật và transaction testnet thật. Nếu thương mại hóa cần audit bảo mật, quản trị khóa, SLA, mainnet hoặc hạ tầng blockchain phù hợp hơn.

## 5. Phương Án Dự Phòng

| Tình huống | Cách xử lý |
| --- | --- |
| Render cold start | Mở API health, chờ 10-30 giây rồi reload app. |
| Explorer load chậm | Dùng tx hash/block number và nói có thể kiểm bằng JSON-RPC. |
| Sourcify contract not found | Nói rõ source chưa verify trên Sourcify; contract vẫn tồn tại on-chain và có thể kiểm bằng Polygonscan/RPC. |
| Live transaction lâu | Chuyển về batch 1 đã có đủ stage và transaction. |
| QR quét không kịp | Copy verification link và mở URL public trên browser. |
| Gateway IPFS riêng trả lỗi | Dùng fallback public IPFS gateway theo CID nếu UI có hiển thị. |
| Bị hỏi dữ liệu demo | Nói rõ đây là testnet record, không phải chứng nhận pháp lý thật. |

## 6. Không Nên Làm Khi Demo

- Không revoke whitelist/service wallet.
- Không tạo batch tên tùy tiện như `abc`, `test`.
- Không nói hệ thống "phi tập trung tuyệt đối"; nên nói "có lớp bằng chứng blockchain độc lập".
- Không khẳng định ảnh gốc nằm trên blockchain.
- Không mở secrets, ENV hoặc dashboard deploy trước hội đồng.
