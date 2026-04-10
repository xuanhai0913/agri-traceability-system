# 🌾 AgriTrace — Tổng Quan Dự Án

## Giới thiệu

**AgriTrace** (Agri Traceability System) là hệ thống **truy xuất nguồn gốc nông sản trên Blockchain**, cho phép theo dõi toàn bộ vòng đời lô hàng nông sản — **từ gieo trồng đến kệ hàng** (seed to shelf). Dữ liệu text được lưu bất biến trên blockchain, ảnh minh chứng được lưu trên Cloudinary với URL ghi lại on-chain. Mỗi lô hàng sinh ra mã QR để người tiêu dùng quét xác minh.

---

## Kiến trúc hệ thống (3-Tier)

Hệ thống chia 3 tầng rõ ràng:

| Tầng | Thành phần | Công nghệ |
|------|-----------|-----------|
| **1. Client Tier** | ReactJS Web Admin + Mobile App quét QR | React (Vite), Expo React Native |
| **2. Server Tier** | Express API Router + Private Key System | Node.js, Express, ethers.js v6 |
| **3. Infrastructure** | Cloudinary Server + Polygon/Ethereum Testnet | Cloudinary SDK, Solidity 0.8.24 |

---

## Cấu trúc dự án

```
agri-traceability-system/
├── smart-contracts/          ← Hardhat + Solidity contract
│   ├── contracts/
│   │   └── Traceability.sol  ← Smart contract chính (375 dòng)
│   ├── scripts/deploy.js     ← Deploy script (Sepolia/Amoy/localhost)
│   ├── test/Traceability.test.js  ← 16 test cases (Chai + Hardhat)
│   └── hardhat.config.js     ← Solidity 0.8.24, optimizer 200 runs, viaIR
│
├── backend/                  ← Node.js Express API
│   ├── server.js             ← Entry (port 3000)
│   └── src/
│       ├── app.js            ← Express setup (CORS, routes, error handler)
│       ├── config/
│       │   ├── blockchain.js ← ethers.js provider/signer/contract helpers
│       │   └── cloudinary.js ← Cloudinary v2 config
│       ├── controllers/
│       │   ├── batch.controller.js  ← CRUD lô hàng (5 endpoints)
│       │   └── upload.controller.js ← Upload ảnh lên Cloudinary
│       ├── routes/
│       │   ├── batch.routes.js
│       │   └── upload.routes.js
│       └── middleware/
│           └── errorHandler.js
│
├── frontend-web/             ← React (Vite) + Tailwind CSS v4
│   └── src/App.jsx           ← ⚠️ CÒN TEMPLATE MẶC ĐỊNH (Vite starter)
│
├── mobile-app/               ← Expo React Native
│   ├── App.js                ← Navigation: Home → Scanner → BatchDetail
│   └── src/
│       ├── screens/
│       │   ├── HomeScreen.js        ← Trang chủ + nút "Quét mã QR"
│       │   ├── ScannerScreen.js     ← Camera + QR decode → batchId
│       │   └── BatchDetailScreen.js ← Hiển thị timeline lô hàng
│       └── services/
│           └── api.js               ← Axios client → Backend API
│
└── package.json              ← npm workspaces mono-repo
```

---

## Smart Contract — `Traceability.sol`

> [!IMPORTANT]
> Đây là core logic của toàn bộ hệ thống. Mọi dữ liệu lô hàng được lưu bất biến on-chain.

### Enum giai đoạn sinh trưởng

| Index | Stage | Ý nghĩa |
|-------|-------|---------|
| 0 | `Seeding` | Gieo trồng |
| 1 | `Growing` | Đang phát triển |
| 2 | `Fertilizing` | Bón phân / Chăm sóc |
| 3 | `Harvesting` | Thu hoạch |
| 4 | `Packaging` | Đóng gói |
| 5 | `Shipping` | Vận chuyển |
| 6 | `Completed` | Hoàn thành chuỗi |

### Cấu trúc dữ liệu

- **`Batch`**: id, name, origin, owner, currentStage, createdAt, isActive
- **`StageRecord`**: stage, description, imageUrl, timestamp, updatedBy

### Functions

| Function | Loại | Mô tả |
|----------|------|-------|
| `createBatch(name, origin, imageUrl)` | Write | Tạo lô hàng, tự tạo StageRecord Seeding |
| `addStage(batchId, stage, description, imageUrl)` | Write | Thêm giai đoạn (chỉ owner, phải tiến về trước) |
| `getBatch(batchId)` | View | Lấy thông tin lô hàng |
| `getStageHistory(batchId)` | View | Lấy toàn bộ timeline |
| `getStageAt(batchId, index)` | View | Lấy 1 giai đoạn theo index |
| `getTotalBatches()` | View | Tổng số lô hàng |

### Tối ưu Gas
- **Enum** thay string cho tên giai đoạn (~80% tiết kiệm storage)
- **Custom errors** thay require strings (~50 gas/lần)
- **Indexed events** cho filter hiệu quả
- **Optimizer 200 runs + viaIR** trong hardhat config

### Business Rules
- Giai đoạn chỉ tiến lên, **không thể lùi lại**
- Chỉ **owner** (người tạo) mới cập nhật được lô hàng
- Khi đạt `Completed` → batch tự `isActive = false`, không sửa được nữa
- Tên batch **không được rỗng**

---

## API Endpoints (Backend)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/batches` | Tạo lô hàng mới |
| `GET` | `/api/batches/total` | Tổng số lô hàng |
| `GET` | `/api/batches/:id` | Thông tin lô hàng |
| `GET` | `/api/batches/:id/history` | Timeline giai đoạn |
| `POST` | `/api/batches/:id/stages` | Thêm giai đoạn |
| `POST` | `/api/upload` | Upload ảnh → Cloudinary |

---

## Sơ đồ Use Case — Web Admin Portal

**Actor: Nông dân / Quản trị** có thể:
1. **Đăng nhập / Kết nối Ví** (Metamask tùy chọn)
2. **Thêm mới Lô** → `<<include>>` Tải ảnh lên đám mây
3. **Cập nhật Giai đoạn sinh trưởng** → `<<include>>` Tải ảnh lên đám mây
4. **Xem danh sách & Chi tiết lô hàng**
5. **In tem QR Code**

Tất cả đều tương tác với **Smart Contract (Blockchain)** và **Hệ thống** (Cloudinary).

---

## Sơ đồ Use Case — Mobile App

**Actor: Người tiêu dùng** có thể:
1. **Mở trình quét** → `<<extend>>` Giải mã QR thành ID lô hàng
2. **Xem thông tin sản phẩm**
3. **Xem dòng thời gian / Hành trình**

Tương tác với: **Camera Thiết bị** + **Node.js Backend / Blockchain**

---

## Sơ đồ Tuần Tự — Web (Tạo Lô Hàng)

**Luồng 14 bước:**
1. Nông Dân nhập thông tin lô hàng & chọn ảnh
2. Bấm "Khởi tạo Lô hàng"
3. Bật trạng thái Loading...
4. `POST /api/batches` (Dữ liệu + File ảnh) → Backend
5. Backend Upload file ảnh → Cloudinary
6. Cloudinary trả về `[image_url]`
7. Backend ký giao dịch bằng Ethers.js
8. `createBatch(name, seed, image_url, ...)` → Smart Contract
9. Blockchain xử lý & xác nhận → trả Transaction Receipt (chứa `batchId`)
10. Backend trả trạng thái Thành công + `batchId`
11. Tắt Loading
12. Truyền `batchId` vào component QR Code
13. Hiển thị thông báo Thành công & Mã QR
14. Nông Dân bấm "In Tem" để dán lên sản phẩm

---

## Sơ đồ Tuần Tự — Mobile App (Quét QR)

**Luồng 14 bước:**
1. Người Tiêu Dùng mở App & nhấn "Quét mã QR"
2. Hiển thị khung Camera
3. Đưa camera vào tem QR trên bao bì
4. Quét & Giải mã QR → Lấy được `[batchId]`
5. Chuyển sang màn hình Loading...
6. `GET /api/batches/{batchId}` → Backend
7. Backend gọi `getBatchDetails(batchId)` → Smart Contract
8. Smart Contract trả về thông tin (Tên, Các giai đoạn, `image_url`)
9. Backend trả về dữ liệu JSON
10. **[Song song]** Tải hình ảnh từ `[image_url]` → Cloudinary
11. Cloudinary trả về hình ảnh (JPEG/PNG)
12. Tắt Loading
13. Render đồ thị **Timeline Hành trình**
14. Hiển thị chi tiết **Hành trình Nông sản minh bạch**

---

## Trạng thái hiện tại & Nhận xét

| Component | Trạng thái | Ghi chú |
|-----------|-----------|---------|
| **Smart Contract** | ✅ Hoàn chỉnh | 375 dòng, 16 test cases, tối ưu gas |
| **Backend API** | ✅ Hoàn chỉnh | 7 endpoints, error handling, CORS |
| **Mobile App** | ✅ Hoàn chỉnh | 3 screens, QR scan, timeline view |
| **Frontend Web** | ⚠️ Chưa phát triển | Còn là Vite template mặc định |

> [!WARNING]
> **Frontend Web (`frontend-web/src/App.jsx`) vẫn là template mặc định của Vite** — chưa có bất kỳ tính năng nào của AgriTrace. Đây là phần cần phát triển chính tiếp theo: tạo lô hàng, cập nhật giai đoạn, xem danh sách, xuất QR Code, v.v.

---

## Tech Stack tổng hợp

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity 0.8.24, Hardhat 2.22 |
| Backend | Node.js, Express 4.21, ethers.js v6 |
| Image Storage | Cloudinary (SDK v2) |
| Frontend Web | React (Vite), Tailwind CSS v4 |
| Mobile App | Expo, React Native, React Navigation |
| Networks | Polygon Amoy, Ethereum Sepolia, Hardhat local |
| Mono-repo | npm workspaces |
