# Câu Hỏi Phản Biện Ngắn Gọn - AgriTrace

Tài liệu này dùng để ôn nhanh trước buổi demo/bảo vệ. Mỗi câu trả lời nên nói gọn trong 15-30 giây, tránh vòng vo và tránh khẳng định quá mức.

## 1. Câu hỏi về blockchain và database

### 1. Vì sao phải dùng blockchain, không chỉ dùng database?

Database dễ quản trị nhưng người quản trị có thể sửa dữ liệu. Blockchain giúp ghi lại lifecycle lô hàng dưới dạng bằng chứng khó sửa, có transaction hash và block number để đối chiếu độc lập. Database vẫn cần cho metadata và UX.

### 2. Dự án có phụ thuộc database quá không?

Không. Blockchain lưu phần cần bất biến như batch, stage, timestamp và transaction proof. Database lưu phần vận hành như producer profile, contact, linked count và search. Đây là mô hình hybrid phù hợp sản phẩm thực tế.

### 3. Dữ liệu nào thật sự nằm trên blockchain?

Batch ID, tên lô, nguồn gốc, owner/service wallet, current stage, createdAt, isActive và stage history. Stage history gồm stage, description, imageUrl, timestamp, updatedBy. Với flow IPFS, `imageUrl` là IPFS gateway URL. Ngoài ra còn có event và transaction hash trên mạng Polygon Amoy.

### 4. Database đang lưu những gì?

Database lưu producer profile, contact, trạng thái kiểm định, quan hệ batch-producer, role của actor, transaction hash, block number, evidenceHash, IPFS CID/URL và dữ liệu phục vụ dashboard/search. Đây là dữ liệu nghiệp vụ cần cập nhật linh hoạt.

### 5. Vì sao không đưa toàn bộ dữ liệu lên blockchain?

Vì tốn gas, khó cập nhật và không phù hợp với hồ sơ như số điện thoại, email, chứng nhận, ảnh lớn. Blockchain nên lưu bằng chứng cốt lõi; metadata vận hành để database xử lý.

### 6. Nếu database bị lỗi thì còn kiểm chứng được không?

Còn kiểm chứng được phần batch/stage on-chain nếu RPC và contract vẫn hoạt động. Tuy nhiên producer profile, contact và linked count có thể thiếu. Vì vậy hệ thống có health status để biết lớp nào đang available.

### 7. Nếu blockchain/RPC bị lỗi thì sao?

Frontend vẫn có thể xem một số metadata từ database, nhưng không thể xác minh lifecycle on-chain. Khi đó hệ thống phải báo rõ trạng thái unavailable/cache, không giả vờ rằng dữ liệu vừa được xác minh.

## 2. Câu hỏi về dữ liệu và tính đúng đắn

### 8. Blockchain có đảm bảo nông sản ngoài đời là thật không?

Không hoàn toàn. Blockchain đảm bảo dữ liệu đã ghi không bị sửa âm thầm, nhưng không tự kiểm định sự thật ngoài đời. Bài toán này gọi là oracle problem; thực tế cần thêm kiểm định, IoT, quy trình nhập liệu và trách nhiệm của producer.

### 9. Nếu người dùng nhập sai dữ liệu ban đầu thì sao?

Blockchain sẽ giữ lại bản ghi sai đó như một bằng chứng. Hệ thống không tự biến dữ liệu sai thành đúng. Cách xử lý là kiểm soát quyền ghi, xác thực producer và thêm audit/inspection workflow.

### 10. Có thể sửa hoặc xóa stage cũ không?

Không theo thiết kế hiện tại. Stage mới được append vào lịch sử; stage cũ không bị update/delete. Đây là điểm dùng blockchain để tạo audit trail.

### 11. Có thể tạo stage lùi lại không?

Không. Smart contract kiểm tra stage mới phải tiến về phía trước. Nếu gửi stage không hợp lệ, contract sẽ reject transaction.

### 12. Producer có nằm trực tiếp trên smart contract không?

Hiện tại producer profile và quan hệ producer-batch nằm trong PostgreSQL metadata. Smart contract tập trung vào lifecycle của batch. Hướng phát triển là lưu thêm producerProfileHash hoặc metadataHash để neo quan hệ này lên blockchain.

### 13. Vì sao chứng nhận/audit lại ghi testnet record?

Vì đây là product demo/testnet, không phải chứng nhận pháp lý thật. UI và docs ghi rõ để tránh hiểu nhầm. Khi production thật cần tích hợp đơn vị kiểm định hoặc giấy chứng nhận hợp lệ.

## 3. Câu hỏi về ảnh, QR và truy xuất

### 14. Ảnh minh chứng có lưu trên blockchain không?

Không lưu byte ảnh trên blockchain. File upload được pin lên Pinata/IPFS, backend tính SHA-256 hash và trả CID. Contract v2 production lưu IPFS URL, `evidenceHash` và `ipfsCid`; database lưu thêm metadata để UI truy vấn nhanh.

### 15. Nếu URL ảnh bị đổi nội dung thì sao?

Với file upload IPFS, nếu đổi nội dung thì CID/hash sẽ thay đổi. Contract schema v2 khóa IPFS URL, `evidenceHash` và `ipfsCid` trực tiếp trong stage record on-chain.

### 16. QR code có tác dụng gì?

QR trỏ tới trang public `/batches/:id`. Người dùng quét QR để xem nguồn gốc, timeline, producer metadata và bằng chứng transaction. QR là cổng truy cập, còn dữ liệu xác minh dựa trên contract/API.

### 17. Nếu ai đó copy QR dán lên sản phẩm giả thì sao?

Đây là vấn đề vật lý, blockchain không tự ngăn việc copy tem giấy. Cách triển khai thực tế là dùng tem vỡ, QR một lần, serial theo đơn vị đóng gói hoặc NFC/RFID. Đồ án tập trung vào truy xuất dữ liệu lô hàng.

### 18. Giao diện web có thể hiển thị sai dữ liệu không?

Về lý thuyết có thể nếu frontend/backend bị sửa. Vì vậy hệ thống cung cấp transaction hash, block number, contract address, Polygonscan/Sourcify để đối chiếu độc lập. Web là giao diện đọc, blockchain là lớp bằng chứng.

## 4. Câu hỏi về smart contract và bảo mật

### 19. Smart contract dùng để làm gì?

Smart contract quản lý batch, stage history, trạng thái active/completed và quyền ghi qua whitelist. Nó đảm bảo quy tắc ghi dữ liệu được thực thi ở cấp blockchain.

### 20. Whitelist trong contract có ý nghĩa gì?

Whitelist giới hạn ví nào được tạo batch hoặc thêm stage. Trong demo, backend service wallet là ví được cấp quyền. Nếu ví không được whitelist, contract sẽ từ chối giao dịch.

### 21. Service wallet là gì?

Service wallet là ví backend dùng để ký transaction thay người dùng. Cách này giúp người dùng nghiệp vụ không cần cài MetaMask hay trả gas trực tiếp. Đây là mô hình relayer phù hợp demo B2B.

### 22. Nếu service wallet bị lộ private key thì sao?

Đó là rủi ro bảo mật nghiêm trọng. Cách giảm rủi ro là bảo vệ ENV, rotate key, dùng vault, giới hạn quyền whitelist và có khả năng revoke ví. Ở bản demo, đây là giới hạn cần nêu trung thực.

### 23. Vì sao không bắt từng producer tự ký ví riêng?

Vì đối tượng nông nghiệp/chuỗi cung ứng không nhất thiết quen thao tác ví, seed phrase và gas. Relayer giúp UX dễ dùng hơn. Hướng phát triển là hỗ trợ nhiều actor ký riêng hoặc account abstraction.

### 24. Contract đã verify source chưa?

Contract address có trên Polygonscan và source nằm trong repo. Nếu chưa verify source đầy đủ trên Polygonscan/Sourcify, nói rõ đây là hướng hoàn thiện trước phản biện để tăng độ tin cậy.

## 5. Câu hỏi về mạng blockchain và chi phí

### 25. Vì sao chọn Polygon Amoy?

Polygon Amoy là testnet phù hợp demo, có block explorer, phí testnet thấp và tương thích EVM/Solidity. Nó giúp kiểm chứng transaction thật mà không phát sinh chi phí mainnet.

### 26. Testnet có phải production thật không?

Không. Đây là production demo chạy trên testnet, dùng để chứng minh luồng kỹ thuật. Nếu thương mại hóa cần chuyển sang mainnet hoặc hạ tầng blockchain phù hợp, kèm bảo mật và vận hành nghiêm ngặt hơn.

### 27. Gas fee xử lý như thế nào?

Backend service wallet trả gas cho transaction. Người dùng thao tác như web bình thường. Nếu lên production thật, doanh nghiệp vận hành hệ thống sẽ chịu chi phí hạ tầng/gas.

### 28. Có thể chuyển sang mạng khác không?

Có thể nếu mạng đó tương thích EVM. Contract viết bằng Solidity và backend dùng ethers.js nên có thể đổi RPC, chainId và contract address. Tuy nhiên cần deploy/verify lại contract trên mạng mới.

## 6. Câu hỏi về demo và triển khai

### 29. Làm sao chứng minh transaction thật?

Mở Batch Detail để xem tx hash/block number, sau đó mở Polygonscan hoặc dùng JSON-RPC `eth_getTransactionReceipt`. File `ONCHAIN_OFFCHAIN.md` có ví dụ receipt mẫu cho batch `BTC-0001`.

### 30. Nếu Polygonscan bị Cloudflare hoặc không mở được thì sao?

Có thể kiểm bằng RPC trực tiếp với tx hash. Polygonscan là công cụ xem, không phải nguồn duy nhất. Nguồn dữ liệu cuối cùng vẫn là blockchain node/RPC.

### 31. Dashboard có phải số liệu ảo không?

Dashboard lấy dữ liệu từ backend summary, smart contract và database. Nếu backend/database/RPC lỗi, UI phải báo trạng thái rõ. Không nên nói đây là số liệu thống kê thị trường thật.

### 32. Vì sao có batch tên hơi test?

Một số batch được tạo trong quá trình kiểm thử production. Khi demo chính thức nên chọn batch có đủ evidence để chứng minh kỹ thuật, hoặc tạo trước batch mới có tên nghiêm túc và dữ liệu sạch.

### 33. Hệ thống đã hoàn thiện production chưa?

Hệ thống đã deploy được và có đầy đủ demo flow: dashboard, ledger, QR, producer, compliance, transaction evidence. Tuy nhiên đây vẫn là product demo/testnet, chưa phải hệ thống thương mại hoàn chỉnh.

### 34. Điểm mạnh nhất của đề tài là gì?

Điểm mạnh là mô hình hybrid rõ ràng: blockchain lưu bằng chứng bất biến của lifecycle, database xử lý metadata và UX. Demo có contract, transaction hash, QR verification và compliance evidence để đối chiếu.

### 35. Giới hạn lớn nhất hiện tại là gì?

Repo và production demo đã hỗ trợ contract schema v2, Quality Inspection/Warehouse, hash/CID và multi-role JWT. Giới hạn còn lại là verify source contract, neo thêm producer metadata hash, bổ sung multi-role signing bằng ví riêng, audit trail database và hạ tầng production tốt hơn.

## 7. Câu kết luận nên nói

> AgriTrace không dùng blockchain để thay thế toàn bộ database. Dự án dùng blockchain đúng phần cần bất biến: vòng đời lô hàng, stage history và transaction proof. Database đảm nhiệm metadata và vận hành, giúp hệ thống vừa có khả năng kiểm chứng, vừa đủ thực tế để sử dụng.
