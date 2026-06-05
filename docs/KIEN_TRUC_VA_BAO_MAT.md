# Kiến Trúc Và Bảo Mật AgriTrace

Tài liệu này giải thích kiến trúc blockchain, mô hình relayer, phân quyền và ranh giới bảo mật của AgriTrace. Mục tiêu là trình bày đúng phạm vi product demo/testnet, không phóng đại thành hệ thống thương mại hoàn chỉnh.

## 1. Vì Sao Dùng Backend Relayer?

Có hai cách phổ biến để người dùng ghi dữ liệu lên blockchain.

### Cách 1: Người dùng tự kết nối ví

Người dùng cài MetaMask, giữ private key, nạp token testnet/mainnet và tự ký từng transaction.

Ưu điểm:

- Mỗi actor có ví riêng.
- Dấu vết on-chain thể hiện rõ ví nào ký.

Nhược điểm với bài toán nông nghiệp:

- UX khó cho producer/warehouse/distributor.
- Người dùng phải hiểu gas, ví, seed phrase.
- Dễ làm demo/triển khai thực tế bị ngắt quãng vì thiếu token hoặc lỗi ví.

### Cách 2: Backend relayer

Người dùng thao tác như một web app bình thường. Backend kiểm tra quyền, sau đó dùng service wallet để ký transaction.

AgriTrace chọn mô hình này vì:

- Phù hợp người dùng nghiệp vụ không quen crypto.
- Dễ demo multi-role bằng email/password/JWT.
- Doanh nghiệp vận hành có thể chịu gas và quản lý hạ tầng tập trung.
- Smart contract vẫn có whitelist để chặn ví không được cấp quyền.

Giới hạn cần nói rõ:

- On-chain signer chủ yếu là service wallet, không phải ví riêng từng actor.
- Actor role/name được lưu ở metadata backend và transaction records.
- Hướng phát triển là tách ví actor hoặc dùng account abstraction.

## 2. Whitelist Smart Contract Có Vai Trò Gì?

Backend RBAC không thay thế whitelist on-chain. Hai lớp này phục vụ hai mục đích khác nhau:

| Lớp | Kiểm soát | Ví dụ |
| --- | --- | --- |
| Backend RBAC | User/role nào được gọi API nào | Producer không được gọi inspection API; warehouse staff không được tạo batch nếu không có quyền. |
| Contract whitelist | Ví nào được ghi vào smart contract | Nếu private key không nằm trong whitelist, transaction bị contract reject. |

Whitelist là lớp kiểm soát cuối ở cấp smart contract. Nếu một ví không được cấp quyền, dù gọi RPC trực tiếp cũng không ghi được dữ liệu.

Rủi ro còn lại:

- Nếu service wallet bị lộ và vẫn còn whitelist, attacker có thể gửi transaction hợp lệ.
- Vì vậy production thật cần quản lý secret bằng vault, rotate key, giới hạn quyền và có quy trình revoke.

## 3. RBAC Multi-role

Các role hiện tại:

| Role | Quyền chính |
| --- | --- |
| `ADMIN` | Quản lý users, producers, warehouses, ledger, compliance và override thao tác khi cần. |
| `PRODUCER` | Tạo batch cho producer được gắn với tài khoản, cập nhật stage sản xuất. |
| `QUALITY_INSPECTOR` | Kiểm định batch đã harvest, nhập PASS/FAIL và evidence. |
| `WAREHOUSE_STAFF` | Nhập kho batch đã PASS, quản lý receipt và inventory movement. |
| `DISTRIBUTOR` | Cập nhật Packaging, Shipping, Completed. |

Frontend ẩn menu/action không phù hợp để UX rõ ràng. Backend vẫn phải enforce quyền, vì ẩn UI không đủ bảo mật.

## 4. Lưu Trữ Hybrid

AgriTrace dùng ba lớp dữ liệu:

1. Smart contract:
   - Batch ID, name, origin.
   - Current stage và stage history.
   - IPFS URL, `evidenceHash`, `ipfsCid`.
   - Timestamp, updatedBy, event log.

2. PostgreSQL:
   - User, role, producer/warehouse link.
   - Producer profile, status, contact.
   - Quality inspection metadata.
   - Warehouse receipt và stock movement.
   - Transaction metadata để UI mở explorer nhanh.

3. Pinata/IPFS:
   - File ảnh/PDF minh chứng.
   - CID giúp xác định nội dung file.

Không lưu byte ảnh trực tiếp trên blockchain vì tốn gas và không phù hợp dung lượng lớn. Blockchain chỉ neo bằng chứng bằng URL/hash/CID.

## 5. Evidence Hash Và IPFS CID

Flow upload:

```text
File gốc
→ backend tính SHA-256 evidenceHash
→ backend upload Pinata/IPFS
→ nhận ipfsCid
→ build ipfsUrl
→ ghi ipfsUrl/evidenceHash/ipfsCid vào contract v2
→ lưu metadata ở PostgreSQL
```

Nếu file bị thay đổi, SHA-256 và CID sẽ khác. Nhờ đó hệ thống có thể phát hiện file minh chứng không còn khớp với bằng chứng đã ghi.

## 6. Những Gì Hệ Thống Không Tự Đảm Bảo

Blockchain không giải quyết mọi thứ:

- Không tự biết nông sản ngoài đời có thật hay không.
- Không ngăn được việc copy QR giấy và dán lên sản phẩm khác.
- Không thay thế đơn vị kiểm định pháp lý.
- Không bảo vệ được nếu người vận hành nhập sai dữ liệu ban đầu.

Các vấn đề này cần quy trình nghiệp vụ, kiểm định, tem chống giả, IoT hoặc audit ngoài hệ thống. AgriTrace cung cấp lớp bằng chứng để dữ liệu đã ghi không bị sửa âm thầm.

## 7. Câu Trả Lời Phản Biện Ngắn

> Dự án dùng backend relayer để UX giống Web2, phù hợp người dùng nông nghiệp. Backend kiểm tra role, smart contract kiểm tra whitelist. Blockchain lưu lifecycle, evidence hash/CID và transaction proof; PostgreSQL lưu metadata vận hành. Đây là mô hình hybrid thực tế, không tuyên bố hệ thống phân tán tuyệt đối.

## 8. Hướng Phát Triển Bảo Mật

- Verify source contract trên Polygonscan/Sourcify.
- Tách ví actor hoặc dùng account abstraction.
- Dùng vault/KMS cho private key.
- Thêm audit log đầy đủ cho mọi thay đổi off-chain.
- Neo `producerProfileHash` vào transaction.
- Dùng queue/retry cho transaction để tránh lỗi DB sau khi tx đã success.
