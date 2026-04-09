# 🌾 Hệ thống Truy xuất Nguồn gốc Nông sản (Blockchain-based Agricultural Traceability System)

Quản lý hành trình lô hàng nông sản từ gieo trồng đến thu hoạch, dữ liệu được lưu bất biến trên Blockchain.

## 📁 Cấu trúc dự án

```
/agri-traceability-system
├── /smart-contracts    # Hardhat project - Solidity contracts & deploy scripts
├── /backend            # Node.js Express server - API & Cloudinary integration
└── /frontend-web       # ReactJS (Vite) - Admin Portal cho Nông dân/Kiểm định
```

## 🛠️ Tech Stack

| Thành phần | Công nghệ |
|-----------|-----------|
| Smart Contract | Solidity, Hardhat, Polygon Amoy / Ethereum Sepolia |
| Backend | Node.js, Express.js, ethers.js v6, Cloudinary SDK |
| Frontend | React (Vite), Tailwind CSS v4, qrcode.react |

## 🚀 Bắt đầu nhanh

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Chạy Smart Contract

```bash
# Compile
npm run contracts:compile

# Test
npm run contracts:test

# Deploy (local)
npm run contracts:deploy
```

### 3. Chạy Backend

```bash
npm run backend:dev
```

### 4. Chạy Frontend

```bash
npm run frontend:dev
```

## 📄 License

MIT
