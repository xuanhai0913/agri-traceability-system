# Kịch Bản Demo Bảo Vệ AgriTrace

Tài liệu này là script nói và thao tác demo AgriTrace trong buổi bảo vệ. Mục tiêu là trình bày rõ ba ý chính:

- AgriTrace là hệ thống truy xuất nguồn gốc nông sản bằng blockchain.
- Blockchain lưu lifecycle bất biến của lô hàng; database lưu metadata vận hành.
- Product đã deploy có thể kiểm chứng bằng QR, contract, transaction hash, Polygonscan/Sourcify và API evidence.

Không đưa tài khoản admin/password vào tài liệu public. Khi demo, dùng tài khoản admin đã cấu hình trong ENV/deploy.

## 1. Checklist trước khi vào phòng bảo vệ

Mở sẵn các tab sau:

| Mục | Link |
| --- | --- |
| Production app | [https://agri.hailamdev.space/](https://agri.hailamdev.space/) |
| API health | [https://agritrace-api.onrender.com/api/health](https://agritrace-api.onrender.com/api/health) |
| Ledger | [https://agri.hailamdev.space/batches](https://agri.hailamdev.space/batches) |
| Batch demo chính | [https://agri.hailamdev.space/batches/4](https://agri.hailamdev.space/batches/4) |
| Batch có producer metadata rõ | [https://agri.hailamdev.space/batches/9](https://agri.hailamdev.space/batches/9) |
| Compliance | [https://agri.hailamdev.space/compliance](https://agri.hailamdev.space/compliance) |
| Contract Polygonscan | [https://amoy.polygonscan.com/address/0x29569935f27d966DcA1C308B2b00f6A1BAF487b3](https://amoy.polygonscan.com/address/0x29569935f27d966DcA1C308B2b00f6A1BAF487b3) |
| Sourcify source | [https://repo.sourcify.dev/80002/0x29569935f27d966DcA1C308B2b00f6A1BAF487b3](https://repo.sourcify.dev/80002/0x29569935f27d966DcA1C308B2b00f6A1BAF487b3) |

Trước giờ demo khoảng 5-10 phút:

1. Mở `API health` để warm backend Render.
2. Mở production app và đợi badge `Backend connected`.
3. Mở Ledger, Compliance, Batch Detail để browser cache sẵn route.
4. Chuẩn bị điện thoại để quét QR ở Batch Detail.
5. Chuẩn bị một ảnh nông sản nếu muốn demo tạo batch/thêm stage live.

Không nên demo thao tác revoke whitelist trên production, vì có thể làm service wallet mất quyền ghi contract trong lúc bảo vệ.

## 2. Script demo 5 phút

### 0:00 - 0:30: Mở đầu

Mở trang: [https://agri.hailamdev.space/](https://agri.hailamdev.space/)

Nói:

> Em xin demo AgriTrace, hệ thống truy xuất nguồn gốc nông sản bằng blockchain. Hệ thống dùng mô hình hybrid: smart contract trên Polygon Amoy lưu vòng đời lô hàng và bằng chứng transaction, còn PostgreSQL lưu hồ sơ nhà sản xuất, quan hệ producer-batch và dữ liệu phục vụ giao diện.

Chỉ vào top bar:

- `Backend connected`
- `Service wallet`
- Dashboard summary

Nói tiếp:

> Badge này cho thấy frontend đang kết nối backend production. Service wallet là ví backend dùng để ký giao dịch testnet, giúp người dùng nghiệp vụ không cần cài ví crypto hay trả gas trực tiếp.

### 0:30 - 1:10: Dashboard live evidence

Ở Dashboard, chỉ vào:

- Tổng lô hàng
- Đang canh tác / đã hoàn thành
- Nhật ký truy xuất mới nhất
- API/DB/Service wallet/Smart contract status ở phần dưới nếu cần cuộn

Nói:

> Dashboard không dùng số liệu tĩnh. Các số lượng batch được đọc từ API tổng hợp dữ liệu smart contract và database. Đây là màn hình vận hành để admin biết hệ thống có đang kết nối backend, database và blockchain hay không.

Điểm cần nhấn:

- Đây không phải landing page.
- Đây là màn hình vận hành thật.
- Số batch và trạng thái lấy từ API/backend.

### 1:10 - 1:50: Ledger - danh sách lô hàng

Mở: [https://agri.hailamdev.space/batches](https://agri.hailamdev.space/batches)

Thao tác:

1. Tìm `Robusta` hoặc `BTC-0004`.
2. Chỉ vào dòng `Robusta Honey Đắk Lắk - Lô HC-2605-02`.
3. Chỉ vào producer `Highland Coffee Co-op`.
4. Mở Batch Detail.

Nói:

> Trang Ledger là sổ cái truy xuất. Mỗi dòng là một batch đọc từ smart contract, sau đó backend gắn thêm metadata như producer, role và transaction record từ PostgreSQL. Nhờ vậy người dùng vừa xem được bằng chứng on-chain, vừa xem được thông tin nghiệp vụ dễ hiểu.

Nếu bị hỏi "producer có lưu trên chain không?":

> Hiện tại quan hệ producer-batch là metadata off-chain trong PostgreSQL. Dữ liệu lifecycle của batch nằm trên-chain. Đây là lựa chọn thiết kế có chủ đích để không đưa hồ sơ producer, contact và dữ liệu có thể cập nhật lên blockchain.

### 1:50 - 2:50: Batch Detail - QR và on-chain evidence

Mở batch chính: [https://agri.hailamdev.space/batches/4](https://agri.hailamdev.space/batches/4)

Thao tác:

1. Chỉ vào mã `BTC-0004`.
2. Chỉ vào QR.
3. Chỉ vào timeline stage.
4. Chỉ vào transaction hash / block number / `View on Polygonscan`.
5. Dùng điện thoại quét QR nếu có thời gian.

Nói:

> Đây là trang chi tiết lô hàng. QR trỏ về URL public `/batches/:id`, nên người tiêu dùng có thể quét để xem nguồn gốc. Timeline là dữ liệu stage đọc từ smart contract. Transaction hash và block number là bằng chứng để đối chiếu trên Polygon Amoy.

Nếu cần chứng minh producer metadata rõ hơn, mở thêm: [https://agri.hailamdev.space/batches/9](https://agri.hailamdev.space/batches/9)

Nói:

> Batch này thể hiện rõ cách hệ thống gộp hai lớp dữ liệu: on-chain là batch, stage, block, transaction; off-chain là producer `Nhà Phân Phối Hải Làm Dev`, địa chỉ và vai trò trong chuỗi.

### 2:50 - 3:40: Compliance - đối chiếu contract và source

Mở: [https://agri.hailamdev.space/compliance](https://agri.hailamdev.space/compliance)

Thao tác:

1. Chỉ API status `Online`.
2. Chỉ network `Polygon Amoy`.
3. Chỉ batch count.
4. Mở link `Amoy Polygonscan`.
5. Mở link `Sourcify verified source`.

Nói:

> Trang Compliance là nơi gom bằng chứng để trình bày khi bảo vệ: API đang chạy, dữ liệu batch đọc được, network là Polygon Amoy, contract address có thể kiểm tra trên Polygonscan và source contract có thể đối chiếu qua Sourcify.

Nếu Polygonscan bị Cloudflare:

> Nếu explorer chặn automation hoặc load chậm, em vẫn có thể kiểm chứng transaction bằng JSON-RPC `eth_getTransactionReceipt`. Trong tài liệu on-chain/off-chain em đã bổ sung một receipt mẫu lấy từ Polygon Amoy RPC.

### 3:40 - 4:40: Optional live write - tạo batch hoặc thêm stage

Chỉ demo phần này nếu mạng ổn và còn thời gian. Nếu hội đồng chỉ có 3-5 phút, có thể bỏ qua live write và dùng transaction đã có sẵn.

Luồng an toàn nhất:

1. Đăng nhập admin.
2. Vào `Tạo lô hàng mới`.
3. Chọn producer đã verified.
4. Nhập tên lô chuyên nghiệp, ví dụ:
   - `Cà phê Arabica Cầu Đất - Lô CD-2606-01`
   - Origin: `Cầu Đất, Đà Lạt, Lâm Đồng`
5. Chọn ảnh từ URL/Cloudinary/Unsplash.
6. Submit và chờ transaction.
7. Khi chuyển sang Batch Detail, chỉ vào tx hash/block.

Nói:

> Thao tác ghi dữ liệu sẽ tạo transaction testnet thật. Vì giao dịch blockchain cần thời gian xác nhận, em đã chuẩn bị sẵn các batch có transaction trước đó để đảm bảo demo không bị phụ thuộc vào tốc độ mạng.

Nếu chỉ thêm stage:

1. Chọn batch đang active, không chọn batch `Completed`.
2. Chọn stage kế tiếp hợp lệ.
3. Nhập mô tả ngắn, chọn ảnh.
4. Submit, chờ tx.

Không chọn stage lùi lại, vì smart contract chặn progression không hợp lệ.

### 4:40 - 5:00: Kết luận

Nói:

> Tóm lại, AgriTrace không cố đưa toàn bộ dữ liệu lên blockchain. Blockchain được dùng đúng phần cần bất biến: batch lifecycle, stage history, timestamp và transaction proof. Database xử lý metadata, producer profile và trải nghiệm quản trị. Cách tiếp cận này giúp hệ thống vừa có bằng chứng kiểm chứng độc lập, vừa đủ thực tế để vận hành như một sản phẩm.

## 3. Script nói ngắn 3 phút

Nếu thời gian bị giới hạn, dùng bản này:

1. Dashboard:
   > Đây là dashboard production. Em dùng backend API để tổng hợp trạng thái batch, database, service wallet và smart contract.

2. Ledger:
   > Đây là sổ cái truy xuất. Dữ liệu batch/stage lấy từ smart contract, còn producer và transaction metadata được gắn từ PostgreSQL.

3. Batch Detail:
   > Đây là QR verification của một batch. Người dùng quét QR để xem timeline. Mỗi stage có timestamp và transaction evidence để đối chiếu trên Polygon Amoy.

4. Compliance:
   > Đây là trang bằng chứng: API online, network Polygon Amoy, contract address, Polygonscan và Sourcify. Trang này phục vụ trực tiếp phần phản biện.

5. Kết luận:
   > Điểm chính của đề tài là mô hình hybrid on-chain/off-chain: blockchain đảm bảo tính bất biến, database đảm bảo vận hành và UX.

## 4. Câu trả lời nhanh khi bị hỏi

### Vì sao dùng database nếu đã có blockchain?

> Blockchain không phù hợp để lưu toàn bộ hồ sơ, ảnh lớn, số điện thoại, email hoặc dữ liệu cần cập nhật. AgriTrace dùng blockchain để lưu lifecycle bất biến của lô hàng, còn database lưu metadata vận hành. Nếu bỏ database, sản phẩm khó dùng; nếu bỏ blockchain, hệ thống mất bằng chứng độc lập.

### Dữ liệu nào thật sự nằm trên blockchain?

> Batch ID, tên lô, nguồn gốc, owner/service wallet, current stage, createdAt, isActive, stage history gồm stage, description, imageUrl, timestamp, updatedBy, cùng các event và transaction proof.

### Producer có nằm trên smart contract không?

> Hiện tại producer profile và quan hệ producer-batch nằm off-chain trong PostgreSQL. Đây là giới hạn đã nêu trong README. Hướng phát triển là lưu thêm `producerProfileHash` hoặc `metadataHash` lên transaction để neo metadata vào blockchain.

### Ảnh minh chứng có nằm trên blockchain không?

> Không lưu byte ảnh trên blockchain vì rất tốn gas. Contract lưu `imageUrl`. Hướng phát triển tiếp theo là lưu thêm hash ảnh hoặc IPFS CID để tăng độ kiểm chứng.

### Nếu Polygonscan không mở được thì kiểm chứng thế nào?

> Có thể dùng JSON-RPC `eth_getTransactionReceipt` với transaction hash. Tài liệu `ONCHAIN_OFFCHAIN.md` đã có ảnh receipt mẫu lấy từ Polygon Amoy RPC.

### Hệ thống đã production thật chưa?

> Đây là product demo/testnet phục vụ đề tài tốt nghiệp. Hệ thống đã deploy thật, có backend, database, smart contract, QR và transaction testnet thật; tuy nhiên chưa phải sản phẩm thương mại mainnet. README đã ghi rõ giới hạn và hướng phát triển.

## 5. Phương án dự phòng

| Tình huống | Cách xử lý |
| --- | --- |
| Backend Render cold start | Mở `API health`, chờ 10-30 giây, reload production app. |
| Vercel/frontend load chậm | Dùng tab đã mở sẵn Dashboard/Ledger/Batch Detail/Compliance. |
| Polygonscan bị Cloudflare | Dùng ảnh receipt trong `docs/ONCHAIN_OFFCHAIN.md` và nói có thể kiểm bằng JSON-RPC. |
| Transaction live lâu xác nhận | Không chờ live write; dùng batch #4 hoặc #9 đã có tx hash/block. |
| QR quét không kịp | Bấm `Copy link`, mở link public `/batches/:id` trên browser. |
| Bị hỏi dữ liệu demo | Nói rõ phần chứng nhận/audit là testnet record, không phải chứng nhận pháp lý thật. |

## 6. Những điều không nên làm khi demo

- Không revoke whitelist service wallet trên production.
- Không tạo batch với tên quá test như "abc", "test", "Muối của Hải" trong lúc bảo vệ.
- Không nói "phi tập trung tuyệt đối"; nên nói "có lớp bằng chứng blockchain độc lập".
- Không khẳng định ảnh nằm trên blockchain; chỉ nói URL hoặc hash/CID trong hướng phát triển.
- Không mở code quá lâu nếu hội đồng đang muốn xem sản phẩm; chỉ mở contract/source khi được hỏi.
