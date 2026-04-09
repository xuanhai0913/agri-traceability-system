# Agri Traceability System

Blockchain-based agricultural product traceability. Manages batch lifecycle from seeding to harvest — data stored immutably on-chain, images on Cloudinary. Generates QR codes for mobile scanning.

## Project Structure

```
agri-traceability-system/
├── smart-contracts/    # Hardhat project, Solidity contracts, deploy scripts
├── backend/            # Node.js Express API, Cloudinary integration
├── frontend-web/       # React (Vite) admin portal
└── mobile-app/         # Expo React Native consumer app (QR scanning)
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Smart Contract | Solidity 0.8.24, Hardhat |
| Backend | Node.js, Express, ethers.js v6 |
| Image Storage | Cloudinary |
| Frontend | React (Vite), Tailwind CSS v4 |
| Mobile App | Expo, React Native, expo-camera |
| QR Code | qrcode.react |
| Networks | Polygon Amoy, Ethereum Sepolia |

## Quick Start

```bash
# Install all dependencies (workspaces)
npm install

# Compile smart contract
npm run contracts:compile

# Run contract tests
npm run contracts:test

# Start backend (port 3000)
npm run backend:dev

# Start frontend (port 5173)
npm run frontend:dev

# Start mobile app (Expo)
npm run mobile:start
```

## API Endpoints

```
POST   /api/batches             Create batch
GET    /api/batches/:id         Get batch info
POST   /api/batches/:id/stages  Add growth stage
GET    /api/batches/:id/history Stage timeline
GET    /api/batches/total       Total batch count
POST   /api/upload              Upload image
GET    /api/health              Health check
```

## Environment Variables

Copy `.env.example` in each sub-directory and fill in your values:

- `smart-contracts/.env.example` — Private key, RPC URLs
- `backend/.env.example` — Blockchain connection, Cloudinary credentials

## License

MIT
