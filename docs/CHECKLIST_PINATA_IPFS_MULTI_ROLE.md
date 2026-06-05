# Checklist Nang Cap AgriTrace: Pinata/IPFS, Evidence Hash, Multi-role

Tai lieu nay tong hop tu 2 file prompt:

- `PINATA_DOCS_UPDATE_PROMPT.md`
- `promt.md`

Muc tieu: dung nhu checklist ra soat truoc khi demo, deploy, nop bao cao hoac tra loi phan bien. Moi muc nen duoc tick bang chung cu the: file code, endpoint, UI screen, transaction, log deploy, screenshot hoac ket qua test.

## Trang thai cap nhat 2026-06-05

- [x] Da test production read/RBAC: admin login thanh cong, 5 role demo dang nhap duoc, public routes load khong console error.
- [x] Da deploy contract Traceability schema v2 tren Polygon Amoy: `0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8`.
- [x] Deployment tx: `0x466c89d78d6209eca775c66f695d6f42c9f69143197fbfb055896b193e8e4323`, block `39596189`.
- [x] Da luu deployment metadata tai `smart-contracts/deployments/amoy-traceability-v2.json`.
- [x] Da compile `Traceability.sol` bang `solc 0.8.26`, ABI co 23 entries, bytecode khoang 5.5KB.
- [x] Da test production sau deploy: health DB available, admin login OK, write flow het bi 409 sau khi Render env bat schema v2.
- [x] Render production env da duoc bat boi user: `CONTRACT_ADDRESS=0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8` va `CONTRACT_STAGE_SCHEMA=v2`.
- [x] Da tao batch demo moi tren production va test flow ghi that: Producer -> Inspector PASS -> WarehouseReceived -> Distributor Shipping -> Completed -> Public QR.
- [x] Da xac nhan Pinata upload `pinned`, CID/hash duoc ghi du 9 stage. Gateway custom `mypinata.cloud` tra 401 tren browser, frontend da them fallback public gateway theo CID.
- [x] Da tach `/warehouse/inventory` thanh ton kho van hanh: filter theo kho, inbound/outbound/reserved/available, status `LOW_STOCK`, `RESERVED`, `SHIPPED`, `IN_STOCK`.
- [x] Da them `warehouse_stock_movements` de ghi xuat kho/giu hang/da van chuyen off-chain, khong lam sai scope blockchain.
- [x] Da them tra nhanh QR trong Warehouse Inventory: quet camera neu Chrome ho tro `BarcodeDetector`, fallback dan QR URL/BTC code.
- [x] Da them mini audit log trong `/producer/profile` de thay lich su gan `producer_id` cho user.
- [x] Da test production sau deploy moi: inventory filter hien kho, QR lookup fallback, movement modal mo dung, movement API validate 400, producer profile audit log hien dung.
- [x] Da don production producer mock: chi con `Nha San Xuat Hai Lam Dev` va `Nha Phan Phoi Hai Lam Dev` lien quan demo.
- [x] Da chan production auto seed/fallback producer mock bang `SEED_DEMO_PRODUCERS=false` mac dinh.
- [x] Da cap nhat wording UI tu "producer network" sang huong "doi tac chuoi cung ung" de tranh bi hieu la mang luoi NSX ao.
- [x] Da verify contract source tren Sourcify ngay 2026-06-05: `creationMatch=match`, `runtimeMatch=match`, `matchId=31071211`.
- [x] Sourcify verified source: `https://repo.sourcify.dev/80002/0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8`.
- [x] Da xac nhan contract v2 ton tai on-chain qua RPC `eth_getCode`, bytecode khoang 5439 bytes.
- [x] Da cau hinh backend hien Sourcify link mac dinh sau khi source verified; co the tat bang `SOURCIFY_VERIFIED=false` neu doi sang contract moi chua verify.
- [ ] Checklist chua hoan thien 100%: con can test mobile scan cuoi va neu can thi verify them tren Polygonscan khi co API key/het daily limit.

## 1. Nguyen Tac Kien Truc Can Giu

- [x] Du an dung mo hinh hybrid on-chain/off-chain, khong co gang dua toan bo du lieu len blockchain.
- [x] Blockchain luu vong doi batch, stage history, timestamp, actor/service wallet va transaction proof.
- [x] PostgreSQL luu metadata nghiep vu: producer, user role, warehouse, inspection, receipt, dashboard, search, transaction metadata.
- [x] Pinata/IPFS luu file evidence: anh san xuat, chung nhan, bien nhan nhap kho, dong goi, van chuyen.
- [x] Frontend/mobile chi goi backend API, khong giu secret va khong upload truc tiep len Pinata bang JWT.
- [x] Backend van la relayer ky transaction bang service wallet.
- [x] Smart contract chi can whitelist service wallet/producer theo kien truc hien tai; RBAC nghiep vu xu ly o backend.
- [x] Khong xoa hoac lam hong cac luong cu: Batch, Producer, QR, Ledger, Compliance, Public Verification, Mobile Scan.
- [x] Neu contract schema moi duoc deploy, chap nhan tao batch demo moi; khong bat buoc migrate old on-chain data.

## 2. Pinata/IPFS Thay Cloudinary

- [x] Khong dung Cloudinary lam storage chinh trong flow evidence moi.
- [x] Khong upload evidence len Cloudinary trong API tao batch, add stage, inspection, warehouse, packaging, shipping.
- [x] Neu code cu con Cloudinary, phai danh dau legacy/deprecated va khong goi trong flow moi.
- [x] README va docs khong mo ta Cloudinary la storage hien tai.
- [x] UI wording khong dung "Cloudinary Image", "Cloudinary URL", "Uploaded to Cloudinary".
- [x] UI wording dung "IPFS Evidence", "IPFS CID", "Evidence Hash", "View on IPFS", "Blockchain Proof".
- [x] Chay grep sau khi sua va xac nhan khong con Cloudinary trong docs/code chinh, hoac co chu thich legacy ro rang.
- [x] Khong commit `PINATA_JWT`, database URL, private key, admin password that, Unsplash secret key.

Lenh ra soat de dung truoc khi commit:

```bash
rg -n "cloudinary|Cloudinary|CLOUDINARY" README.md docs backend/src frontend-web/src mobile-app/src smart-contracts/contracts smart-contracts/scripts smart-contracts/test
rg -n "PINATA_JWT|postgresql://postgres|PRIVATE_KEY|ADMIN_PASSWORD" -g '!node_modules/**' -g '!smart-contracts/artifacts/**' .
```

## 3. Env Can Cau Hinh

### Backend Render

- [ ] `DATABASE_URL` tro toi PostgreSQL dang hoat dong.
- [ ] `DATABASE_SSL` dung voi provider DB hien tai.
- [ ] `JWT_SECRET` co gia tri manh va khong commit.
- [ ] `ADMIN_EMAIL` duoc cau hinh cho admin production/demo.
- [ ] `ADMIN_PASSWORD` duoc cau hinh va khong commit.
- [ ] `ADMIN_NAME` duoc cau hinh neu can.
- [ ] `SEED_DEMO_USERS=true` chi bat cho demo server khi can seed role demo.
- [x] `SEED_DEMO_PRODUCERS=false` tren production hoac khong bat explicit, de khong tu seed lai producer mock cu.
- [ ] `RPC_URL` tro toi Polygon Amoy RPC hoat dong.
- [ ] `PRIVATE_KEY` la service wallet, chi nam tren backend.
- [ ] `CONTRACT_ADDRESS` la contract dang deploy dung schema.
- [ ] `CONTRACT_STAGE_SCHEMA=v2` neu contract moi co `evidenceHash` va `ipfsCid`.
- [ ] `CHAIN_ID=80002` cho Polygon Amoy.
- [ ] `NETWORK_NAME=Polygon Amoy`.
- [ ] `EXPLORER_BASE_URL=https://amoy.polygonscan.com`.
- [x] `SOURCIFY_BASE_URL=https://repo.sourcify.dev` neu can verify source.
- [x] `SOURCIFY_VERIFIED=true` sau khi contract `0xA94D...b7ed8` da duoc verify tren Sourcify.
- [ ] `IPFS_PROVIDER=pinata`.
- [ ] `IPFS_ENABLED=true`.
- [ ] `IPFS_REQUIRED=false` cho demo on dinh neu Pinata tam loi.
- [ ] `PINATA_JWT` chi dat o Render backend.
- [ ] `IPFS_GATEWAY` chap nhan dang co hoac khong co `https://`, co hoac khong co `/ipfs/`.
- [x] Sau khi sua env tren Render, backend duoc redeploy/test production read va write flow.

### Vercel Frontend

- [ ] `VITE_API_URL` tro toi Render backend `/api`.
- [ ] Khong co `PINATA_JWT` tren Vercel.
- [ ] Khong co private key/service wallet tren Vercel.
- [ ] `VITE_IPFS_GATEWAY` chi dung neu can public gateway optional.
- [x] Sau khi sua env tren Vercel, frontend duoc rebuild/redeploy qua commit/push production.

## 4. Evidence Service Backend

- [x] API nhan file bang `multipart/form-data`.
- [x] Backend nhan file tu multer memory buffer.
- [x] Backend tinh SHA-256 tu file goc, tra ve `evidenceHash`.
- [x] Backend upload file len Pinata bang `PINATA_JWT`.
- [x] Backend nhan CID tu Pinata va tra ve `ipfsCid`.
- [x] Backend build `ipfsUrl` theo dang `https://<gateway>/ipfs/<cid>`.
- [x] File evidence ho tro `image/jpeg`.
- [x] File evidence ho tro `image/png`.
- [x] File evidence ho tro `image/webp`.
- [x] File evidence ho tro `application/pdf` neu can upload certificate.
- [x] File upload co gioi han size.
- [x] File upload co validate MIME/type.
- [x] Neu `IPFS_ENABLED=false`, API tra loi ro rang IPFS chua bat va khong fallback Cloudinary.
- [x] Neu thieu `PINATA_JWT`, API/log bao loi cau hinh backend.
- [x] Neu Pinata loi va `IPFS_REQUIRED=true`, request fail.
- [x] Neu Pinata loi va `IPFS_REQUIRED=false`, van co the luu `evidenceHash`, de `ipfsCid=""`, `ipfsUrl=""`, co warning ro.
- [ ] UI hien thi warning neu IPFS upload fail nhung hash van duoc tao.
- [x] Khong co fallback upload sang Cloudinary.

## 5. Smart Contract

- [x] `Traceability.sol` doc code da duoc doc va nang cap co kiem soat.
- [x] Stage enum moi co dung thu tu:
  - [x] `0: Seeding`
  - [x] `1: Growing`
  - [x] `2: Fertilizing`
  - [x] `3: Harvesting`
  - [x] `4: QualityInspection`
  - [x] `5: WarehouseReceived`
  - [x] `6: Packaging`
  - [x] `7: Shipping`
  - [x] `8: Completed`
- [x] `StageRecord` co `stage`.
- [x] `StageRecord` co `description`.
- [x] `StageRecord` co `ipfsUrl` hoac `imageUrl` dung nhu IPFS URL.
- [x] `StageRecord` co `evidenceHash`.
- [x] `StageRecord` co `ipfsCid`.
- [x] `StageRecord` co `timestamp`.
- [x] `StageRecord` co `updatedBy`.
- [x] `createBatch` nhan metadata evidence can thiet.
- [x] `addStage` nhan `ipfsUrl`, `evidenceHash`, `ipfsCid`.
- [x] Event `BatchCreated` emit evidence metadata neu can.
- [x] Event `StageAdded` emit `evidenceHash` va `ipfsCid`.
- [x] Non-whitelisted wallet khong duoc ghi neu contract co rule nay.
- [x] Khong cho add stage sau `Completed`.
- [x] Khong cho stage di lui hoac sai thu tu neu contract/backend enforce.
- [x] Hardhat tests cap nhat cho schema moi.
- [x] ABI moi duoc cap nhat cho backend/frontend.
- [x] Contract moi duoc deploy local/testnet.
- [x] `CONTRACT_ADDRESS` production/testnet duoc cap nhat sau deploy.
- [x] `CONTRACT_STAGE_SCHEMA=v2` duoc cau hinh khi dung contract moi.
- [x] Source contract duoc verify tren Sourcify cho demo source verification.
- [ ] Polygonscan source verification chua hoan tat do API external verify dang bi daily limit; dung Polygonscan de xem address/tx/block, dung Sourcify de xem source verified.

## 6. Database Va Migration

- [x] Kiem tra schema PostgreSQL hien tai truoc khi sua.
- [x] Migration/auto-init an toan, khong lam mat du lieu cu.
- [x] Neu chua co migration system, co SQL/init logic ro trong backend hoac docs setup.

### users

- [x] Bang `users` co `id UUID primary key`.
- [x] `email` unique not null.
- [x] `password_hash` not null.
- [x] `name` not null.
- [x] `role` not null.
- [x] `status` default `ACTIVE`.
- [x] `producer_id` nullable.
- [x] `warehouse_id` nullable.
- [x] `created_at`.
- [x] `updated_at`.
- [x] Role values gom `ADMIN`, `PRODUCER`, `QUALITY_INSPECTOR`, `WAREHOUSE_STAFF`, `DISTRIBUTOR`.
- [x] Password duoc hash bang bcrypt.
- [x] Khong luu plain password.

### warehouses

- [x] Bang `warehouses` co `id UUID primary key`.
- [x] Co `name`.
- [x] Co `location`.
- [x] Co `manager_user_id` nullable neu can.
- [x] Co `status ACTIVE/DISABLED`.
- [x] Co `created_at`, `updated_at`.

### quality_inspections

- [x] Bang `quality_inspections` co `id UUID primary key`.
- [x] Co `batch_id`.
- [x] Co `inspector_user_id`.
- [x] Co `result PASS/FAIL`.
- [x] Co `score` nullable.
- [x] Co `grade` nullable.
- [x] Co `certificate_no` nullable.
- [x] Co `certificate_url` nullable neu can.
- [x] Co `note`.
- [x] Co `evidence_image_url` hoac `ipfs_url`.
- [x] Co `evidence_hash`.
- [x] Co `ipfs_cid`.
- [x] Co `tx_hash`.
- [x] Co `block_number`.
- [x] Co `created_at`.

### warehouse_receipts

- [x] Bang `warehouse_receipts` co `id UUID primary key`.
- [x] Co `batch_id`.
- [x] Co `warehouse_id` nullable.
- [x] Co `warehouse_name`.
- [x] Co `warehouse_location`.
- [x] Co `quantity numeric`.
- [x] Co `unit`.
- [x] Co `received_by_user_id`.
- [x] Co `received_at`.
- [x] Co `condition_note`.
- [x] Co `evidence_image_url` hoac `ipfs_url`.
- [x] Co `evidence_hash`.
- [x] Co `ipfs_cid`.
- [x] Co `tx_hash`.
- [x] Co `block_number`.
- [x] Co `created_at`.

### warehouse_stock_movements

- [x] Bang `warehouse_stock_movements` co `id UUID primary key`.
- [x] Co `batch_id`.
- [x] Co `warehouse_id`, `warehouse_name`, `warehouse_location`.
- [x] Co `movement_type INBOUND/OUTBOUND/RESERVED/SHIPPED`.
- [x] Co `quantity`, `unit`, `note`.
- [x] Co `created_by_user_id`, `created_at`.
- [x] Inventory aggregate tinh inbound/outbound/reserved/on hand/available.
- [x] Inventory status co `LOW_STOCK`, `RESERVED`, `SHIPPED`, `IN_STOCK`.

### Optional tables

- [ ] Can nhac `shipments` neu tach rieng Shipping metadata.
- [ ] Can nhac `packaging_records` neu tach rieng Packaging metadata.
- [ ] Can nhac `stage_transactions` neu can luu tat ca tx/stage metadata mot cach thong nhat.

## 7. Seed Account Va Auth

- [x] Admin production/demo duoc seed tu `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`.
- [x] Khong hard-code admin password production.
- [x] Demo account local/dev duoc seed khi khong production hoac `SEED_DEMO_USERS=true`.
- [x] Demo Producer: `producer@agritrace.local / Producer@123`.
- [x] Demo Quality Inspector: `inspector@agritrace.local / Inspector@123`.
- [x] Demo Warehouse Staff: `warehouse@agritrace.local / Warehouse@123`.
- [x] Demo Distributor: `distributor@agritrace.local / Distributor@123`.
- [x] Neu dung admin demo local: `admin@agritrace.local / Admin@123` chi duoc dung local/dev, khong production.
- [x] Login doc tu bang `users`.
- [x] Login co fallback env admin neu DB chua san sang neu du an can giu compatibility.
- [x] JWT payload co `userId`.
- [x] JWT payload co `email`.
- [x] JWT payload co `name`.
- [x] JWT payload co `role`.
- [x] JWT payload co `producerId`.
- [x] JWT payload co `warehouseId`.
- [x] `POST /api/auth/login` hoat dong.
- [x] `GET /api/auth/me` hoat dong cho moi role da login.
- [ ] `POST /api/auth/logout` optional neu frontend can.

## 8. RBAC Backend

- [x] Co middleware `requireAuth`.
- [x] Co middleware `requireRole([...roles])`.
- [x] Co helper/middleware admin.
- [x] Co helper/middleware producer neu can.
- [x] Co helper/middleware inspector neu can.
- [x] Co helper/middleware warehouse staff neu can.
- [x] Co helper/middleware distributor neu can.
- [x] Role check nam o backend, khong chi an button frontend.
- [x] Public endpoint chi read-only.
- [x] User chua login goi POST protected tra `401`.
- [x] User khong du quyen tra `403`.

## 9. Business Rules Bat Buoc

- [ ] Producer chi tao/cap nhat batch thuoc producer cua minh neu co lien ket producer.
- [ ] Producer chi duoc them stage san xuat: Seeding, Growing, Fertilizing, Harvesting.
- [x] `QualityInspection` chi duoc tao boi `QUALITY_INSPECTOR` hoac `ADMIN`.
- [x] `WarehouseReceived` chi duoc tao boi `WAREHOUSE_STAFF` hoac `ADMIN`.
- [x] `Packaging`, `Shipping`, `Completed` chi duoc tao boi `DISTRIBUTOR` hoac `ADMIN`.
- [x] Khong cho nhap kho neu batch chua co `QualityInspection PASS`.
- [x] Neu inspection `FAIL`, khong cho `WarehouseReceived`, `Packaging`, `Shipping`.
- [x] Khong cho `Shipping` neu chua co `WarehouseReceived`.
- [x] Khong cho them stage sau `Completed`.
- [x] Khong cho stage di lui.
- [x] Khong cho bo qua stage neu lifecycle yeu cau tuan tu.
- [ ] Admin override neu co thi phai ghi `actorRole` va `note`.

## 10. Backend API

### Auth/User management

- [x] `GET /api/users` cho ADMIN.
- [x] `POST /api/users` cho ADMIN.
- [x] `GET /api/users/:id` cho ADMIN.
- [x] `PATCH /api/users/:id` cho ADMIN.
- [x] `PATCH /api/users/:id/disable` cho ADMIN.
- [x] `PATCH /api/users/:id/password` cho ADMIN.
- [x] `GET /api/auth/me/audit-log` cho user dang login.

### Warehouses

- [x] `GET /api/warehouses`.
- [x] `POST /api/warehouses` cho ADMIN.
- [x] `PATCH /api/warehouses/:id` cho ADMIN.
- [x] `GET /api/warehouses/:id`.
- [x] `GET /api/warehouses/:id/inventory`.

### Quality Inspection

- [x] `GET /api/inspections/queue` tra batch current stage `Harvesting` va chua inspect.
- [x] `POST /api/batches/:id/quality-inspections` chi ADMIN/QUALITY_INSPECTOR.
- [x] `GET /api/batches/:id/quality-inspections` public/read-only hoac auth tuy chinh.
- [x] Inspection body nhan `result PASS/FAIL`.
- [x] Inspection body nhan `score`.
- [x] Inspection body nhan `grade`.
- [x] Inspection body nhan `certificateNo`.
- [x] Inspection body nhan `note`.
- [x] Inspection body nhan evidence file/upload metadata.
- [x] PASS ghi stage `QualityInspection` len blockchain.
- [x] FAIL van ghi stage `QualityInspection` voi description/trang thai FAIL.
- [x] PASS/FAIL luu tx hash va block number.
- [ ] FAIL danh dau blocked/failed trong DB metadata neu schema ho tro.

### Warehouse Receiving

- [x] `GET /api/warehouse/receiving-queue` tra batch da `QualityInspection PASS` va chua `WarehouseReceived`.
- [x] `POST /api/batches/:id/warehouse-receipts` chi ADMIN/WAREHOUSE_STAFF.
- [x] `GET /api/batches/:id/warehouse-receipts`.
- [x] `GET /api/warehouse/receipts`.
- [x] `GET /api/warehouse/inventory`.
- [x] `POST /api/warehouse/inventory/movements` ghi xuat kho/giu hang/da van chuyen.
- [x] Receipt body nhan `warehouseId`.
- [x] Receipt body nhan `warehouseName`.
- [x] Receipt body nhan `warehouseLocation`.
- [x] Receipt body nhan `quantity`.
- [x] Receipt body nhan `unit`.
- [x] Receipt body nhan `receivedAt`.
- [x] Receipt body nhan `receivedBy`.
- [x] Receipt body nhan `conditionNote`.
- [x] Receipt body nhan evidence file/upload metadata.
- [x] Reject neu chua co `QualityInspection PASS`.
- [x] Reject neu da co `WarehouseReceived`.
- [x] Ghi stage `WarehouseReceived` len blockchain.
- [x] Luu receipt metadata vao PostgreSQL voi tx hash/block number.

### Distributor

- [x] Generic `POST /api/batches/:id/stages` enforce Packaging/Shipping/Completed cho ADMIN/DISTRIBUTOR.
- [x] Optional `GET /api/distributor/queue`.
- [ ] Optional `POST /api/batches/:id/packaging`.
- [ ] Optional `POST /api/batches/:id/shipping`.
- [ ] Shipping metadata co transporter name.
- [ ] Shipping metadata co vehicle info.
- [ ] Shipping metadata co destination.
- [ ] Shipping metadata co note.
- [ ] Shipping metadata co evidence image/hash/CID.

### Public API

- [ ] Public batch detail tra batch info.
- [ ] Public batch detail tra producer info.
- [ ] Public batch detail tra stage history tu blockchain.
- [ ] Public batch detail tra quality inspection metadata.
- [ ] Public batch detail tra warehouse receipt metadata.
- [ ] Public batch detail tra tx hash/block number.
- [ ] Public batch detail tra `evidenceHash`.
- [ ] Public batch detail tra `ipfsCid`.
- [ ] Public batch detail tra `ipfsUrl`.
- [ ] Public batch detail tra role/actorRole neu co.
- [ ] Public batch detail tra explorer link.

## 11. Frontend Web Tong The

- [ ] Login page ho tro multi-role.
- [ ] Sau login redirect theo role.
- [ ] Sidebar/menu thay doi theo role.
- [ ] Action button chi hien khi co quyen.
- [ ] Route protection co trang 403 dep.
- [ ] Route 404/batch not found hien thi ro.
- [ ] Form upload evidence co preview.
- [ ] Submit flow hien progress: Uploading evidence.
- [ ] Submit flow hien progress: Writing blockchain transaction.
- [ ] Submit flow hien progress: Saving metadata.
- [ ] Submit flow hien success.
- [ ] Sau action thanh cong hien tx hash.
- [ ] Sau action thanh cong hien block number.
- [ ] Sau action thanh cong co explorer link.
- [ ] Timeline hien stage name.
- [ ] Timeline hien timestamp.
- [ ] Timeline hien description.
- [ ] Timeline hien actor role/name neu co.
- [ ] Timeline hien evidence image.
- [ ] Timeline hien evidence hash.
- [ ] Timeline hien IPFS CID.
- [ ] Timeline hien transaction hash.
- [ ] QR code van tro den public batch page.

## 12. Frontend Routes Theo Role

### Public/Consumer

- [ ] `/batches/:id` hien consumer portal.
- [ ] `/verify/:id` duoc giu neu da co.
- [ ] Public page mobile responsive tot.
- [ ] Header co ten san pham.
- [ ] Header co batch ID.
- [ ] Header co current stage.
- [ ] Co producer card.
- [ ] Timeline co Seeding.
- [ ] Timeline co Growing.
- [ ] Timeline co Fertilizing.
- [ ] Timeline co Harvesting.
- [ ] Timeline co QualityInspection.
- [ ] Timeline co WarehouseReceived.
- [ ] Timeline co Packaging.
- [ ] Timeline co Shipping.
- [ ] Timeline co Completed neu co.
- [ ] Quality card co PASS/FAIL.
- [ ] Quality card co certificate no.
- [ ] Quality card co score/grade.
- [ ] Warehouse card co warehouse name.
- [ ] Warehouse card co quantity/unit.
- [ ] Warehouse card co condition.
- [ ] Evidence section co image.
- [ ] Evidence section co SHA-256 hash.
- [ ] Evidence section co IPFS CID.
- [ ] Blockchain proof co tx hash.
- [ ] Blockchain proof co block number.
- [ ] Blockchain proof co explorer link.

### Admin

- [ ] `/admin/dashboard`.
- [ ] `/admin/users`.
- [ ] `/admin/producers`.
- [ ] `/admin/warehouses`.
- [ ] `/admin/batches`.
- [ ] `/admin/batches/:id`.
- [ ] `/admin/ledger`.
- [ ] `/admin/compliance`.
- [ ] Admin xem dashboard tong hop: total batches.
- [ ] Admin xem pending inspections.
- [ ] Admin xem pending warehouse receipts.
- [ ] Admin xem completed batches.
- [ ] Admin xem failed inspections.
- [ ] Admin user table co name/email/role/status.
- [ ] Admin user table co linked producer/warehouse.
- [ ] Admin co create/edit/disable user.
- [ ] Admin warehouse management co name/location/status.
- [ ] Admin batch detail co timeline/inspection/warehouse/transaction proof.

### Producer

- [ ] `/producer/dashboard`.
- [ ] `/producer/batches`.
- [ ] `/producer/batches/new`.
- [ ] `/producer/batches/:id`.
- [ ] `/producer/batches/:id/add-stage`.
- [ ] Producer co nut "Tao lo moi".
- [ ] Create batch form co batch name.
- [ ] Create batch form co origin.
- [ ] Create batch form co producer.
- [ ] Create batch form co image evidence.
- [ ] Batch detail show next allowed stage.
- [ ] Producer chi thay action Seeding/Growing/Fertilizing/Harvesting.
- [ ] Sau Harvesting hien thong bao "Lo hang dang cho kiem dinh chat luong".

### Quality Inspector

- [ ] `/inspector/dashboard`.
- [ ] `/inspector/queue`.
- [ ] `/inspector/batches/:id`.
- [ ] `/inspector/batches/:id/inspect`.
- [ ] `/inspector/history`.
- [ ] Queue hien batch da Harvesting va cho kiem dinh.
- [ ] Form inspection co result PASS/FAIL.
- [ ] Form inspection co score/grade.
- [ ] Form inspection co certificateNo.
- [ ] Form inspection co note.
- [ ] Form inspection co evidence image.
- [ ] Sau submit show transaction proof.
- [ ] Neu FAIL, batch detail hien badge `Inspection Failed`.

### Warehouse Staff

- [ ] `/warehouse/dashboard`.
- [ ] `/warehouse/receiving`.
- [ ] `/warehouse/receiving/:batchId`.
- [x] `/warehouse/inventory`.
- [x] `/warehouse/receipts`.
- [x] Receiving queue hien batch da inspection PASS.
- [x] Co o tim Batch ID.
- [x] Optional co scan QR trong web.
- [ ] Form nhap kho co warehouse.
- [ ] Form nhap kho co location.
- [ ] Form nhap kho co quantity.
- [ ] Form nhap kho co unit.
- [ ] Form nhap kho co condition note.
- [ ] Form nhap kho co evidence image.
- [ ] Sau submit show success.
- [ ] Sau submit show tx hash.
- [ ] Sau submit show QR code.
- [ ] Sau submit co button xem trang consumer.
- [x] Inventory hien batch da nhap kho.
- [x] Inventory hien quantity/unit.
- [x] Inventory hien warehouse.
- [x] Inventory hien status.
- [x] Inventory co filter theo kho.
- [x] Inventory co inbound/outbound/reserved/available.
- [x] Inventory co action xuat kho/giu hang/da van chuyen.

### Distributor

- [ ] `/distributor/dashboard`.
- [ ] `/distributor/queue`.
- [ ] `/distributor/batches/:id`.
- [ ] `/distributor/shipments`.
- [ ] Queue hien batch da `WarehouseReceived`.
- [ ] Cho cap nhat `Packaging`.
- [ ] Cho cap nhat `Shipping`.
- [ ] Form shipping co destination.
- [ ] Form shipping co transporter.
- [ ] Form shipping co vehicle info.
- [ ] Form shipping co note.
- [ ] Form shipping co evidence image.
- [ ] Sau Shipping co the Completed.

## 13. Mobile App

- [ ] Mobile tap trung consumer, khong bat buoc multi-role trong phase nay.
- [ ] Quet QR duoc.
- [ ] Mo batch public detail duoc.
- [ ] Timeline khong crash voi field moi.
- [ ] Timeline hien `QualityInspection`.
- [ ] Timeline hien `WarehouseReceived`.
- [ ] Hien `evidenceHash` neu co.
- [ ] Hien `ipfsCid` neu co.
- [ ] UI timeline de xem tren dien thoai.
- [ ] Optional mobile role login de sau.

## 14. Stage Mapping Va Hien Thi

- [ ] Backend dung mapping 9 stage moi.
- [ ] Frontend dung mapping 9 stage moi.
- [ ] Mobile dung mapping 9 stage moi.
- [ ] Khong hard-code lung tung nhieu noi; uu tien constant/helper dung chung neu kha thi.
- [ ] Badge mau Seeding: green.
- [ ] Badge mau Growing: emerald.
- [ ] Badge mau Fertilizing: amber.
- [ ] Badge mau Harvesting: orange.
- [ ] Badge mau QualityInspection: blue.
- [ ] Badge mau WarehouseReceived: indigo.
- [ ] Badge mau Packaging: purple.
- [ ] Badge mau Shipping: cyan.
- [ ] Badge mau Completed: gray/green.

## 15. Validation, Error State, UX

- [ ] User chua login bi redirect login khi vao route/action protected.
- [ ] Khong co quyen hien 403 ro rang.
- [ ] Batch khong ton tai hien 404 ro rang.
- [ ] Stage khong hop le bao "Khong the cap nhat stage nay o trang thai hien tai".
- [ ] Chua inspection PASS ma nhap kho bao "Lo hang can kiem dinh dat truoc khi nhap kho".
- [ ] Da nhap kho roi bao "Lo hang da duoc nhap kho".
- [ ] Upload anh loi bao ro.
- [ ] IPFS loi hien warning, khong fail neu policy cho phep va da co evidenceHash.
- [ ] Blockchain transaction loi hien reason.
- [ ] Neu blockchain transaction loi, khong luu metadata sai.
- [ ] DB save loi sau tx success duoc log critical.
- [ ] DB save loi sau tx success hien tx hash de admin xu ly.
- [ ] Loading state khong gay nham lan cho nguoi demo.
- [ ] Retry state co the dung duoc o man hinh quan trong.

## 16. Security

- [ ] Password hash bang bcrypt.
- [ ] JWT secret lay tu env.
- [ ] Khong expose private key/service wallet ra frontend.
- [ ] Khong expose Pinata JWT ra frontend.
- [ ] Khong expose admin seed password o production.
- [ ] Validate input backend.
- [ ] Validate file size/type backend.
- [ ] Public endpoint read-only.
- [ ] Admin co the disable user.
- [ ] Secret scan truoc commit/push.

## 17. Docs Can Cap Nhat

- [x] README co multi-role.
- [x] README co QualityInspection.
- [x] README co WarehouseReceived.
- [x] README co EvidenceHash/IPFS.
- [x] README tech stack dung Pinata/IPFS.
- [x] README co production demo link.
- [x] README co screenshot neu can thuyet phuc repo.
- [x] README co gioi han hien tai va huong phat trien.
- [x] `docs/ONCHAIN_OFFCHAIN.md` giai thich on-chain stage history, evidenceHash/ipfsCid, tx proof.
- [x] `docs/ONCHAIN_OFFCHAIN.md` giai thich off-chain producer, inspection, warehouse, metadata.
- [x] `docs/ONCHAIN_OFFCHAIN.md` giai thich vi sao khong luu anh truc tiep on-chain.
- [x] `docs/HUONG_DAN_DEMO.md` co flow Producer -> Inspector -> Warehouse -> Distributor -> Consumer QR.
- [x] `docs/HUONG_DAN_DEMO.md` co buoc upload evidence len Pinata/IPFS.
- [ ] `docs/HUONG_DAN_DEMO.md` co buoc mo IPFS Gateway.
- [x] `docs/HUONG_DAN_DEMO.md` co buoc mo Polygonscan va Sourcify verified source.
- [ ] `docs/CAU_HOI_PHAN_BIEN.md` co cau "Blockchain co dam bao anh khong bi sua khong?".
- [ ] `docs/CAU_HOI_PHAN_BIEN.md` co cau "Nhap kho duoc ghi o dau?".
- [ ] `docs/CAU_HOI_PHAN_BIEN.md` co cau "Ai duoc cap nhat kiem dinh?".
- [ ] `docs/CAU_HOI_PHAN_BIEN.md` co cau "Ai duoc nhap kho?".
- [ ] `docs/CAU_HOI_PHAN_BIEN.md` co cau "Vi sao role khong dua het len smart contract?".
- [ ] `docs/CAU_HOI_PHAN_BIEN.md` co cau "Vi sao dung IPFS?".
- [ ] `docs/CAU_HOI_PHAN_BIEN.md` co cau "Neu Pinata bi loi thi sao?".
- [ ] `docs/CAU_HOI_PHAN_BIEN.md` co cau "IPFS co dam bao du lieu khong bi xoa khong?".
- [ ] `docs/CAU_HOI_PHAN_BIEN.md` co cau "Blockchain luu anh hay luu gi?".
- [x] `.env.example`/`backend/.env.example` co `JWT_SECRET`.
- [x] `.env.example`/`backend/.env.example` co `IPFS_PROVIDER`.
- [x] `.env.example`/`backend/.env.example` co `PINATA_JWT`.
- [x] `.env.example`/`backend/.env.example` co `IPFS_GATEWAY`.
- [x] `.env.example`/`backend/.env.example` co seed account variables neu can.
- [x] Deployment docs ghi Pinata JWT chi nam o Render backend.
- [x] Deployment docs ghi khong dua Pinata JWT len Vercel.

## 18. API Docs Evidence Fields

- [x] Docs response stage/evidence co `imageUrl` hoac `ipfsUrl`.
- [x] Docs response co `ipfsCid`.
- [x] Docs response co `evidenceHash`.
- [x] Upload endpoint docs ghi `Content-Type: multipart/form-data`.
- [x] Upload endpoint docs ghi file co the la image/certificate/evidence.
- [x] Upload endpoint docs co response `ipfsCid`, `ipfsUrl`, `evidenceHash`.

## 19. Testing Checklist

### Commands

- [ ] `npm install`.
- [ ] `npm run contracts:compile`.
- [ ] `npm run contracts:test`.
- [ ] `npm run backend:dev`.
- [ ] `npm run frontend:dev`.
- [ ] `npm run mobile:start`.
- [ ] `npm run dev`.
- [ ] `npm run build --workspace=frontend-web`.

### Smart contract tests

- [ ] `createBatch` thanh cong.
- [ ] `addStage QualityInspection` thanh cong.
- [ ] `addStage WarehouseReceived` thanh cong.
- [ ] Khong cho add stage sau `Completed`.
- [ ] Khong cho non-whitelisted wallet ghi neu co rule.
- [ ] Event emit du `evidenceHash`.
- [ ] Event emit du `ipfsCid`.

### Backend/manual tests

- [ ] Login ADMIN thanh cong.
- [ ] Login PRODUCER thanh cong.
- [ ] Login QUALITY_INSPECTOR thanh cong.
- [ ] Login WAREHOUSE_STAFF thanh cong.
- [ ] Login DISTRIBUTOR thanh cong.
- [ ] Producer khong goi duoc inspection endpoint.
- [ ] Inspector khong goi duoc warehouse endpoint.
- [ ] Warehouse staff khong goi duoc producer create batch neu khong co quyen.
- [ ] Distributor khong nhap kho duoc.
- [ ] Public endpoint khong can login.
- [ ] Evidence hash duoc tao dung.
- [ ] IPFS khong config van co response policy ro va khong fallback Cloudinary.
- [ ] Inspection FAIL chan warehouse receiving.
- [ ] Inspection PASS cho warehouse receiving.
- [ ] Warehouse receiving co tx hash/block number.

### Frontend/manual tests

- [ ] Sidebar dung theo ADMIN.
- [ ] Sidebar dung theo PRODUCER.
- [ ] Sidebar dung theo QUALITY_INSPECTOR.
- [ ] Sidebar dung theo WAREHOUSE_STAFF.
- [ ] Sidebar dung theo DISTRIBUTOR.
- [ ] Route protection dung.
- [ ] Batch timeline hien du stage.
- [ ] QR/public page mobile responsive.
- [ ] Transaction proof hien dung.
- [ ] 403 state dep.
- [ ] 404 state dep.
- [ ] Error upload/IPFS/blockchain de hieu.

## 20. Acceptance Criteria Cuoi

- [ ] Co the login day du cac role: Admin, Producer, Quality Inspector, Warehouse Staff, Distributor.
- [ ] Producer tao batch duoc.
- [ ] Producer cap nhat production stages duoc.
- [ ] Quality Inspector thay queue cho kiem dinh.
- [ ] Quality Inspector them `QualityInspection` duoc.
- [ ] Warehouse Staff thay queue da PASS.
- [ ] Warehouse Staff nhap kho duoc.
- [ ] Distributor cap nhat `Packaging` duoc.
- [ ] Distributor cap nhat `Shipping` duoc.
- [ ] Consumer quet QR thay `QualityInspection`.
- [ ] Consumer quet QR thay `WarehouseReceived`.
- [ ] Consumer quet QR thay `evidenceHash`.
- [ ] Consumer quet QR thay `ipfsCid` neu co.
- [ ] Consumer quet QR thay evidence image.
- [ ] Consumer quet QR thay tx hash/block number.
- [ ] Blockchain co stage history moi.
- [ ] PostgreSQL co inspection metadata.
- [ ] PostgreSQL co warehouse receipt metadata.
- [ ] Backend chan role sai.
- [ ] UI an/disable action khong co quyen.
- [ ] Dashboard khong hong.
- [ ] Producer management khong hong.
- [ ] Batch detail khong hong.
- [ ] Ledger khong hong.
- [ ] Compliance khong hong.
- [ ] QR verification khong hong.
- [ ] Mobile scan khong hong.
- [ ] Docs demo du de bao ve.

## 21. Demo Script De Verify

- [ ] Login ADMIN.
- [ ] Tao/kiem tra users demo.
- [ ] Login PRODUCER.
- [ ] Tao batch "Ca chua VietGAP Demo".
- [ ] Them stage Seeding.
- [ ] Them stage Growing.
- [ ] Them stage Fertilizing.
- [ ] Them stage Harvesting.
- [ ] Login QUALITY_INSPECTOR.
- [ ] Vao queue kiem dinh.
- [ ] Chon batch vua tao.
- [ ] Nhap inspection PASS, certificateNo, note, upload anh.
- [ ] Kiem tra tx hash/block number.
- [ ] Login WAREHOUSE_STAFF.
- [ ] Vao receiving queue.
- [ ] Chon batch da PASS.
- [ ] Nhap kho 500 kg, kho TP.HCM, condition note, upload anh.
- [ ] Kiem tra tx hash/block number.
- [ ] Login DISTRIBUTOR.
- [ ] Cap nhat Packaging.
- [ ] Cap nhat Shipping.
- [ ] Mo QR/public page.
- [ ] Kiem tra consumer thay Seeding, Growing, Fertilizing, Harvesting.
- [ ] Kiem tra consumer thay QualityInspection.
- [ ] Kiem tra consumer thay WarehouseReceived.
- [ ] Kiem tra consumer thay Packaging.
- [ ] Kiem tra consumer thay Shipping.
- [ ] Kiem tra co evidenceHash.
- [ ] Kiem tra co image evidence.
- [ ] Kiem tra co IPFS CID neu Pinata thanh cong.
- [ ] Kiem tra co tx hash.
- [ ] Kiem tra co block number.
- [ ] Mo explorer link xem giao dich that.
- [ ] Mo IPFS gateway xem file evidence.

## 22. Muc Uu Tien Neu Thieu Thoi Gian

### Bat buoc

- [x] QualityInspection stage.
- [x] WarehouseReceived stage.
- [x] imageHash/evidenceHash.
- [x] Backend RBAC.
- [x] Login multi-role.
- [x] UI queue kiem dinh.
- [x] UI nhap kho.
- [x] Public QR hien timeline moi.

### Nen co

- [ ] Distributor UI.
- [ ] Admin user management.
- [x] Warehouse inventory.
- [ ] Docs phan bien.

### Diem cong

- [x] IPFS that bang Pinata.
- [x] Web scan QR trong man hinh warehouse.
- [ ] On-chain role nang cao.
- [ ] Mobile role login.

## 23. Bao Cao Sau Khi Hoan Thanh

- [ ] Liet ke file da thay doi.
- [ ] Huong dan chay local.
- [ ] Huong dan seed users demo.
- [ ] Huong dan deploy contract moi.
- [ ] Huong dan cap nhat env Render/Vercel.
- [ ] Kich ban demo tung role.
- [ ] Diem can chu y khi deploy production/testnet.
- [ ] Test da chay va ket qua.
- [ ] Phan chua lam duoc hoac can cau hinh them.
- [x] Ket qua grep Cloudinary.
- [x] Ket qua secret scan.
