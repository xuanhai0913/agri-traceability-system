<p align="center">
  <img src="docs/banner.png" alt="AgriTrace Banner" width="800" />
</p>

<h1 align="center">Agri Traceability System</h1>

<p align="center">
  Blockchain-based agricultural product traceability — from seed to shelf.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity&logoColor=white" alt="Solidity" />
  <img src="https://img.shields.io/badge/Hardhat-2.22-FFF100?logo=hardhat&logoColor=black" alt="Hardhat" />
  <img src="https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/ethers.js-v6-7B3FE4?logo=ethereum&logoColor=white" alt="ethers.js" />
  <img src="https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Expo-React_Native-000020?logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## About

Manages the lifecycle of agricultural product batches from seeding to delivery. Core batch and stage records are written to the smart contract for immutable verification; producer profiles, batch-producer links, dashboard metrics and search metadata are stored off-chain in PostgreSQL. Evidence images are hosted externally, and their URLs can be recorded on-chain as part of each batch/stage transaction. A QR code is generated per batch for public verification.

### Production Features (Latest Updates)
- **Hybrid on-chain/off-chain data model**: Smart contract stores immutable batch lifecycle data; PostgreSQL stores operational metadata.
- **Admin relayer workflow**: Backend service wallet signs Polygon Amoy transactions so users do not need to manage wallets or gas.
- **Producer management**: Admin can create, edit and verify producer profiles before linking them to batches.
- **Compliance evidence dashboard**: Surfaces API health, DB status, contract address, transaction records and explorer links.
- **CSV data export**: Exports ledger data with producer and transaction metadata where available.
- **Vercel SPA routing**: Supports direct access to React Router pages in production.

## Project Structure

```
agri-traceability-system/
├── smart-contracts/    Hardhat project, Solidity contracts, deploy scripts
├── backend/            Node.js Express API, Cloudinary integration
├── frontend-web/       React (Vite) admin portal for farmers & inspectors
├── mobile-app/         Expo React Native consumer app (QR scanning)
└── docs/               Architecture, demo, defense and data model documents
```

## Tech Stack

<table>
  <tr>
    <td><b>Layer</b></td>
    <td><b>Technology</b></td>
  </tr>
  <tr>
    <td>Smart Contract</td>
    <td><img src="https://img.shields.io/badge/-Solidity-363636?logo=solidity&logoColor=white&style=flat-square" /> <img src="https://img.shields.io/badge/-Hardhat-FFF100?logo=hardhat&logoColor=black&style=flat-square" /></td>
  </tr>
  <tr>
    <td>Backend</td>
    <td><img src="https://img.shields.io/badge/-Node.js-339933?logo=nodedotjs&logoColor=white&style=flat-square" /> <img src="https://img.shields.io/badge/-Express-000000?logo=express&logoColor=white&style=flat-square" /> <img src="https://img.shields.io/badge/-ethers.js-7B3FE4?logo=ethereum&logoColor=white&style=flat-square" /></td>
  </tr>
  <tr>
    <td>Database</td>
    <td><img src="https://img.shields.io/badge/-PostgreSQL-4169E1?logo=postgresql&logoColor=white&style=flat-square" /></td>
  </tr>
  <tr>
    <td>Image Storage</td>
    <td><img src="https://img.shields.io/badge/-Cloudinary-3448C5?logo=cloudinary&logoColor=white&style=flat-square" /></td>
  </tr>
  <tr>
    <td>Frontend Web</td>
    <td><img src="https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=black&style=flat-square" /> <img src="https://img.shields.io/badge/-Vite-646CFF?logo=vite&logoColor=white&style=flat-square" /> <img src="https://img.shields.io/badge/-Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square" /></td>
  </tr>
  <tr>
    <td>Mobile App</td>
    <td><img src="https://img.shields.io/badge/-Expo-000020?logo=expo&logoColor=white&style=flat-square" /> <img src="https://img.shields.io/badge/-React_Native-61DAFB?logo=react&logoColor=black&style=flat-square" /></td>
  </tr>
  <tr>
    <td>Networks</td>
    <td><img src="https://img.shields.io/badge/-Polygon_Amoy-7B3FE4?logo=polygon&logoColor=white&style=flat-square" /> <img src="https://img.shields.io/badge/-Ethereum_Sepolia-3C3C3D?logo=ethereum&logoColor=white&style=flat-square" /></td>
  </tr>
</table>

## Architecture

```mermaid
flowchart LR
    A[Farmer / Inspector] -->|Web Portal| B[Frontend Web]
    C[Consumer] -->|QR Scan| D[Mobile App]
    B --> E[Backend API]
    D --> E
    E -->|ethers.js transactions| F[Smart Contract]
    F -->|batch + stage lifecycle| H[(Polygon Amoy)]
    E -->|producer profiles + links| I[(PostgreSQL)]
    E -->|upload evidence image| G[Cloudinary]
    G -->|image URL| E
    E -->|imageUrl string| F
```

## Data Model: On-chain vs Off-chain

AgriTrace uses a hybrid model to keep the traceability proof immutable without turning the blockchain into a file store or admin database.

| Layer | Stored data | Purpose |
|-------|-------------|---------|
| Smart contract | Batch ID, name, origin, owner/service wallet, current stage, creation time, active status, stage history, image URL strings, whitelist state and events | Immutable lifecycle evidence for each agricultural batch. |
| PostgreSQL | Producer profiles, contact fields, verification status, producer-batch links, actor roles, transaction hashes, block numbers and dashboard/search metadata | Operational management, UI enrichment and fast lookup. |
| Cloudinary / image library | Image files selected or uploaded by admins | Stores media assets; the smart contract only stores the URL string when submitted. |

See [docs/ONCHAIN_OFFCHAIN.md](docs/ONCHAIN_OFFCHAIN.md) for the detailed data boundary, defense talking points and future improvements.

## Quick Start

```bash
# Install all dependencies (npm workspaces)
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

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/batches` | Create a new batch |
| `GET` | `/api/batches/:id` | Get batch info |
| `POST` | `/api/batches/:id/stages` | Add a growth stage |
| `GET` | `/api/batches/:id/history` | Get stage timeline |
| `GET` | `/api/batches/total` | Total batch count |
| `GET` | `/api/producers` | List producer profiles |
| `POST` | `/api/producers` | Create a producer profile |
| `PATCH` | `/api/producers/:id` | Update a producer profile |
| `GET` | `/api/dashboard/summary` | Live dashboard summary |
| `GET` | `/api/compliance/evidence` | Compliance evidence summary |
| `POST` | `/api/upload` | Upload image to Cloudinary |
| `POST` | `/api/auth/login` | Admin login |
| `GET` | `/api/health` | Health check |

## Environment Setup

Copy `.env.example` in each sub-directory and fill in your values:

| Directory | Variables |
|-----------|----------|
| `smart-contracts/` | Private key, RPC URLs (Sepolia, Amoy) |
| `backend/` | `DATABASE_URL`, blockchain RPC, contract address, service wallet private key, Cloudinary credentials, admin auth variables |
| `frontend-web/` | `VITE_API_URL` for the deployed backend API |

## Core Workflow

```mermaid
sequenceDiagram
    participant F as Farmer
    participant W as Web Frontend
    participant B as Backend
    participant C as Cloudinary
    participant S as Smart Contract
    participant D as PostgreSQL

    F->>W: Fill form (name, origin, image)
    W->>B: POST /api/upload (image)
    B->>C: Upload image
    C-->>B: image_url
    W->>B: POST /api/batches (producerId, image_url)
    B->>D: Validate verified producer
    B->>S: createBatch(name, origin, imageUrl)
    S-->>B: batchId, txHash, blockNumber
    B->>D: Store producer link + transaction metadata
    B-->>W: { batchId, txHash, producerLink }
    W->>W: Generate QR code with batchId
```

## License

MIT
