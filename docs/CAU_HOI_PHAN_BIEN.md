# Bộ Câu Hỏi Phản Biện AgriTrace

Tài liệu này dùng để luyện trả lời phản biện. Mỗi câu nên trả lời trong 30-60 giây, tập trung vào phạm vi thật của dự án: production demo/testnet, hybrid on-chain/off-chain, IPFS evidence và multi-role workflow.

## 1. Vì sao dùng blockchain thay vì chỉ dùng database?

Database dễ quản trị nhưng admin có thể sửa dữ liệu. Blockchain giúp tạo bằng chứng khó sửa cho lifecycle lô hàng: batch, stage, timestamp, evidence hash/CID và transaction proof. Database vẫn cần để lưu metadata và phục vụ UX.

Nói ngắn:

> Database phục vụ vận hành; blockchain phục vụ bằng chứng bất biến.

## 2. Dự án có phụ thuộc database quá không?

Không. Phần cần bất biến được ghi on-chain. Database lưu hồ sơ producer, contact, linked count, inventory, audit log và search. Đây là mô hình hybrid phù hợp sản phẩm thực tế vì không thể đưa toàn bộ dữ liệu hồ sơ và ảnh lớn lên blockchain.

## 3. Dữ liệu nào thật sự nằm trên blockchain?

Contract lưu:

- Batch ID, name, origin.
- Owner/service wallet, current stage, createdAt, isActive.
- Stage history: stage, description, IPFS URL, evidence hash, IPFS CID, timestamp, updatedBy.
- Event log và transaction proof.

Transaction hash/block number là bằng chứng cấp blockchain cho mỗi lần ghi.

## 4. PostgreSQL đang lưu gì?

PostgreSQL lưu:

- User, role, producer/warehouse link.
- Producer profile và trạng thái xác thực.
- Batch-producer link.
- Quality inspection metadata.
- Warehouse receipt và inventory movement.
- Transaction metadata như tx hash, block number, actor role, IPFS CID/hash.

Dữ liệu này cần cập nhật/tìm kiếm nên không phù hợp ghi hết lên chain.

## 5. Ảnh minh chứng có nằm trên blockchain không?

Không lưu byte ảnh trên-chain. Backend tính SHA-256 của file gốc, upload lên Pinata/IPFS, nhận CID và URL. Contract v2 lưu IPFS URL, `evidenceHash`, `ipfsCid`; database lưu thêm metadata để UI load nhanh.

Nếu ảnh bị sửa, hash/CID sẽ khác với bằng chứng đã ghi.

## 6. Blockchain có đảm bảo nông sản ngoài đời là thật không?

Không hoàn toàn. Blockchain chỉ đảm bảo dữ liệu đã ghi không bị sửa âm thầm. Việc nông sản ngoài đời có đúng hay không là bài toán oracle, cần quy trình kiểm định, trách nhiệm actor, chứng nhận, IoT hoặc audit bên ngoài.

AgriTrace bổ sung Quality Inspection để giảm rủi ro dữ liệu rác đầu vào, nhưng không tự biến dữ liệu sai thành đúng.

## 7. Nếu người dùng nhập sai dữ liệu thì sao?

Blockchain sẽ giữ bản ghi đó như audit trail. Hệ thống xử lý bằng cách phân quyền, kiểm định, ghi actor role, và tạo stage sửa/ghi chú sau đó nếu cần. Không nên xóa hoặc sửa stage cũ.

## 8. Có thể sửa hoặc xóa stage cũ không?

Không theo thiết kế traceability. Stage mới được append vào timeline. Đây là lý do blockchain phù hợp: lịch sử không bị sửa âm thầm.

## 9. Có thể thêm stage lùi lại không?

Không. Contract/backend enforce stage progression. Nếu batch đã `Completed`, không được thêm stage nữa.

## 10. Vì sao producer không nằm trực tiếp trên smart contract?

Producer profile có contact, website, trạng thái kiểm định và audit testnet, các dữ liệu này có thể thay đổi. Vì vậy hiện lưu off-chain. Contract tập trung vào lifecycle batch. Hướng phát triển là lưu `producerProfileHash` hoặc `metadataHash` trong transaction để neo quan hệ producer-batch.

## 11. QR code có tác dụng gì?

QR trỏ tới public URL `/batches/:id`. Người tiêu dùng quét QR để xem timeline, producer, kiểm định, nhập kho, evidence hash/CID và transaction proof. QR là cổng truy cập; bằng chứng nằm ở contract/API.

## 12. Nếu ai đó copy QR dán lên hàng giả?

Đó là rủi ro vật lý. Blockchain không tự chống copy tem giấy. Triển khai thật cần tem vỡ, serial theo đơn vị đóng gói, QR một lần hoặc NFC/RFID. Đồ án tập trung vào sổ cái truy xuất và bằng chứng dữ liệu.

## 13. Frontend có thể hiển thị sai dữ liệu không?

Về lý thuyết có thể nếu frontend/backend bị sửa. Vì vậy UI cung cấp contract address, tx hash, block number và explorer link để kiểm tra độc lập. Web là giao diện đọc; blockchain là lớp bằng chứng.

## 14. Service wallet là gì?

Service wallet là ví backend dùng để ký transaction thay user. Người dùng thao tác bằng email/password, còn backend relayer trả gas và ghi contract. Cách này phù hợp demo B2B vì producer/warehouse không cần cài ví crypto.

## 15. Vì sao không bắt mỗi role dùng ví riêng?

Dùng ví riêng tăng tính phân tán nhưng UX khó hơn. Dự án chọn relayer để phù hợp người dùng nghiệp vụ. Hướng phát triển là hỗ trợ nhiều ví actor hoặc account abstraction để giữ UX tốt nhưng dấu vết on-chain rõ hơn.

## 16. Nếu service wallet bị lộ private key thì sao?

Đây là rủi ro nghiêm trọng. Cần bảo vệ ENV, dùng vault/KMS, rotate key, revoke whitelist và audit log. Bản demo có whitelist contract và không commit private key, nhưng production thương mại cần quản trị khóa nghiêm ngặt hơn.

## 17. Whitelist trong contract có ý nghĩa gì nếu backend đã có RBAC?

RBAC chặn theo user/role ở backend. Whitelist chặn theo ví ở smart contract. Nếu ví không nằm trong whitelist, gọi RPC trực tiếp cũng không ghi được. Đây là lớp bảo vệ cấp contract.

## 18. Vì sao chọn Polygon Amoy?

Polygon Amoy là testnet EVM phù hợp demo: có explorer, tương thích Solidity/ethers.js và không phát sinh phí mainnet. Nó chứng minh transaction thật mà vẫn phù hợp phạm vi học thuật.

## 19. Testnet có phải production thật không?

Không. Đây là production demo chạy trên testnet: app thật, backend thật, database thật, contract và transaction testnet thật. Nếu thương mại hóa cần mainnet hoặc hạ tầng blockchain phù hợp, audit bảo mật và SLA.

## 20. Làm sao chứng minh transaction thật?

Mở Batch Detail để xem tx hash/block number, sau đó mở Polygonscan hoặc gọi JSON-RPC `eth_getTransactionReceipt`. Ví dụ batch 1:

- Contract: `0xA94D8877f8d85Aa1c6f3280989172600EACb7ed8`.
- Create tx: `0x4db047cc1921b372b6960cb0b31790f818053214a41cae6c043a2598bd210fcb`.
- Block: `39596735`.

## 21. Compliance page để làm gì?

Compliance gom bằng chứng demo: API health, DB status, network, contract address, service wallet, batch summary, tx hash/block number và link explorer. Đây là trang dùng để phản biện nhanh thay vì phải mở từng API riêng.

## 22. Có còn mock data không?

Production đã dọn producer mock không liên quan. Hiện còn các hồ sơ testnet phục vụ demo như `Nhà Sản Xuất Hải Làm Dev` và `Nhà Phân Phối Hải Làm Dev`. Các chứng nhận/audit được ghi rõ là testnet record, không phải chứng nhận pháp lý thật.

## 23. Vì sao có batch tên chưa thật sự đẹp?

Một số batch được tạo trong quá trình test production. Khi bảo vệ nên chọn batch có đủ evidence để chứng minh kỹ thuật, hoặc tạo trước một batch mới có tên nghiêm túc. Không nên tạo batch tùy tiện trong lúc demo.

## 24. Điểm mạnh nhất của đề tài là gì?

Điểm mạnh là flow hoàn chỉnh:

```text
Producer tạo lô
→ Inspector kiểm định
→ Warehouse nhập kho
→ Distributor vận chuyển
→ Consumer quét QR
→ mở transaction blockchain để kiểm chứng
```

Hệ thống có contract, transaction hash, QR, evidence hash/CID, RBAC và dashboard compliance.

## 25. Giới hạn lớn nhất hiện tại là gì?

- Đang chạy testnet, chưa phải mainnet thương mại.
- Service wallet ký thay nhiều actor.
- Producer metadata chưa được hash trực tiếp lên contract.
- Source contract nên verify thêm trên explorer/Sourcify để demo thuyết phục hơn.
- Cần audit trail/monitoring mạnh hơn nếu triển khai thật.

## Câu Kết Luận

> AgriTrace dùng blockchain đúng phần cần bất biến: lifecycle, stage history, evidence hash/CID và transaction proof. Database đảm nhiệm metadata và vận hành. Đây là mô hình hybrid thực tế cho truy xuất nguồn gốc nông sản, không tuyên bố hệ thống phân tán tuyệt đối.
