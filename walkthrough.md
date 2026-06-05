# AgriTrace - Tổng Quan Dự Án Hiện Tại

Tài liệu này là bản walkthrough ngắn của repo tại trạng thái hiện tại. Các thông tin cũ về storage legacy, frontend scaffolding hoặc contract schema cũ không còn là flow chính của dự án.

## 1. Giới Thiệu

AgriTrace là hệ thống truy xuất nguồn gốc nông sản dùng mô hình hybrid on-chain/off-chain:

- Blockchain Polygon Amoy lưu vòng đời lô hàng, stage history, timestamp, service wallet và transaction proof.
- PostgreSQL lưu metadata vận hành như user role, producer profile, warehouse receipt, inventory movement và liên kết batch-producer.
- Pinata/IPFS lưu file minh chứng. Backend tính SHA-256 `evidenceHash`, pin file lên IPFS và trả `ipfsCid/ipfsUrl`.
- Web app React/Vite phục vụ admin, producer, quality inspector, warehouse staff, distributor và trang public QR cho consumer.
- Mobile app Expo tập trung vào luồng consumer scan QR và xem timeline truy xuất.

Thông điệp chính khi trình bày: AgriTrace không dùng database để thay blockchain; database hỗ trợ quản trị và UX, còn blockchain giữ bằng chứng bất biến.

## 2. Kiến Trúc 3 Tầng

| Tầng | Thành phần | Công nghệ |
| --- | --- | --- |
| Client | Web portal, public QR page, mobile QR scanner | React Vite, Tailwind CSS, Expo React Native |
| Backend | API, auth/RBAC, relayer, evidence service | Node.js, Express, ethers.js v6, bcrypt/JWT |
| Infrastructure | Blockchain, database, evidence storage | Polygon Amoy, PostgreSQL/Railway, Pinata/IPFS |

## 3. Cấu Trúc Repo

```text
agri-traceability-system/
├── smart-contracts/     Hardhat, Solidity contract, deploy metadata
├── backend/             Express API, RBAC, PostgreSQL services, IPFS evidence
├── frontend-web/        React Vite operations portal và public verification
├── mobile-app/          Expo QR scanner/consumer timeline
└── docs/                Tài liệu demo, on-chain/off-chain, phản biện
```

## 4. Smart Contract

Contract chính: `smart-contracts/contracts/Traceability.sol`.

Lifecycle hiện tại:

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

`StageRecord` hiện lưu stage, mô tả, IPFS URL, `evidenceHash`, `ipfsCid`, timestamp và ví cập nhật. Transaction hash/block number được lấy từ receipt và lưu thêm ở PostgreSQL để UI mở explorer nhanh.

Contract v2 production demo trên Polygon Amoy:

```text
0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8
```

## 5. Backend API Chính

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Đăng nhập theo role. |
| `GET` | `/api/auth/me` | Lấy user/role hiện tại. |
| `GET` | `/api/auth/me/audit-log` | Mini audit log cho producer profile/user link. |
| `POST` | `/api/batches` | Tạo batch và ghi transaction. |
| `GET` | `/api/batches` | Danh sách batch đọc từ contract, gắn metadata DB. |
| `GET` | `/api/batches/:id` | Chi tiết batch. |
| `GET` | `/api/batches/:id/history` | Timeline stage on-chain kèm transaction metadata. |
| `POST` | `/api/batches/:id/stages` | Thêm stage theo role hợp lệ. |
| `POST` | `/api/upload` | Upload evidence lên Pinata/IPFS và trả hash/CID. |
| `GET` | `/api/inspections/queue` | Batch chờ kiểm định. |
| `POST` | `/api/batches/:id/quality-inspections` | Ghi kết quả kiểm định và stage `QualityInspection`. |
| `GET` | `/api/warehouse/receiving-queue` | Batch đã PASS chờ nhập kho. |
| `POST` | `/api/batches/:id/warehouse-receipts` | Ghi biên nhận nhập kho và stage `WarehouseReceived`. |
| `GET` | `/api/warehouse/inventory` | Tồn kho theo warehouse, inbound/outbound/reserved. |
| `POST` | `/api/warehouse/inventory/movements` | Ghi xuất kho/giữ hàng/đã vận chuyển off-chain. |
| `GET` | `/api/compliance/evidence` | Evidence dashboard: API, DB, contract, network, batch summary. |

## 6. Role Và Quyền

| Role | Quyền chính |
| --- | --- |
| `ADMIN` | Quản lý users, producers, warehouses, batches, ledger, compliance và override thao tác khi cần. |
| `PRODUCER` | Tạo batch gắn với producer của tài khoản, cập nhật Seeding/Growing/Fertilizing/Harvesting. |
| `QUALITY_INSPECTOR` | Xem queue kiểm định, nhập PASS/FAIL, certificate, note và evidence. |
| `WAREHOUSE_STAFF` | Nhập kho batch đã PASS, xem receipt history, quản lý inventory movement. |
| `DISTRIBUTOR` | Cập nhật Packaging, Shipping, Completed cho batch đã nhập kho. |
| `CONSUMER` | Không cần login, quét QR/xem public batch detail và transaction proof. |

Backend bắt buộc kiểm tra RBAC, frontend chỉ ẩn hoặc điều hướng UI để UX rõ hơn.

## 7. Luồng Demo Chính

```text
Producer tạo batch
→ cập nhật sản xuất tới Harvesting
→ Inspector kiểm định PASS
→ Warehouse Staff nhập kho
→ Distributor đóng gói/vận chuyển/hoàn tất
→ Consumer quét QR
→ mở Polygonscan để xem transaction thật
```

Batch production nên dùng để demo read-only hiện tại:

```text
BTC-0001 / https://agri.hailamdev.space/batches/1
```

Batch này có đủ 9 stage, IPFS CID/hash và transaction records trên contract v2. Nếu cần dữ liệu tên nghiêm túc hơn, tạo batch mới bằng role Producer/Admin trước buổi bảo vệ.

## 8. Dữ Liệu Producer Hiện Tại

Sau khi dọn mock data, production chỉ giữ các hồ sơ liên quan tới demo:

- `Nhà Sản Xuất Hải Làm Dev`: producer testnet chính, đang linked với batch on-chain.
- `Nhà Phân Phối Hải Làm Dev`: đối tác phân phối testnet cho luồng handoff/QR.

Các chứng nhận/audit trong hai hồ sơ này là testnet record, không trình bày như chứng nhận pháp lý thật.

## 9. Câu Kết Luận Khi Demo

> AgriTrace dùng blockchain đúng phần cần bất biến: lifecycle, stage history, evidence hash/CID và transaction proof. Database lưu metadata để sản phẩm vận hành được. Đây là mô hình hybrid thực tế cho truy xuất nguồn gốc nông sản, không phải cố đưa toàn bộ dữ liệu lên blockchain.
