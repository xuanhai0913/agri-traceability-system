# 🏗 Kiến Trúc Hệ Thống & Cơ Chế Bảo Mật (Architecture & Security Models)

Tài liệu này giải thích chi tiết về tư duy thiết kế kiến trúc Blockchain đang được áp dụng trong AgriTrace, giúp các thành viên trong team và người đánh giá hiểu rõ **tại sao chúng ta lại chọn mô hình này** và **cơ chế Whitelist hoạt động ra sao để bảo vệ hệ thống**.

---

## 1. Phân Biệt Hai Mô Hình Tương Tác Blockchain

Khi tích hợp Blockchain vào hệ thống thực tế (Web3), chúng ta đứng trước hai lựa chọn về mặt kiến trúc giao dịch:

### ❌ Mô hình 1: Ví Cá Nhân (Traditional Connect Wallet)
- **Cách hoạt động:** Người dùng (Nông trại) truy cập Web, nhấn nút "Connect Metamask". Mỗi khi thêm dữ liệu lô hàng, họ phải tự ký (sign) giao dịch bằng ví của mình và tự thanh toán phí Gas (bằng POL/MATIC).
- **Điểm yếu rào cản:** Mô hình này **hoàn toàn phi thực tiễn** trong lĩnh vực nông nghiệp hiện nay. Nông dân hoặc quản lý kho bãi không phải là chuyên gia Crypto. Việc yêu cầu họ phải cài ví, giữ Private Key an toàn và nạp token để trả phí sẽ giết chết tính khả thi của dự án.

### ✅ Mô hình 2: Trạm Trung Chuyển (Backend Relayer / Gasless Model)
- **Cách hoạt động:** Người dùng tương tác với Web App hệt như một ứng dụng truyền thống (Web2). Khi họ thao tác Lưu lô hàng, Backend API sẽ tiếp nhận dữ liệu. Tại đây, **Backend nắm giữ một Ví Cổng Thông Tin (System Wallet)** và dùng ví này để ký giao dịch, trả phí Gas thay cho toàn bộ người dùng rồi đưa dữ liệu lên Smart Contract.
- **Ưu điểm vượt trội:** 
  - Mang lại trải nghiệm người dùng (UX) mượt mà không độ trễ. 
  - Phù hợp tuyệt đối với mô hình kinh doanh B2B/Enterprise: Công ty trả phí cơ sở hạ tầng (Gas fee), Nông dân chỉ cần tập trung vào việc tạo dữ liệu.
  - **Dự án AgriTrace của chúng ta áp dụng hoàn toàn theo Kiến trúc Relay tối ưu này!**

---

## 2. Vậy Vai Trò Của Bảo Mật "Cấp Phép Nông Trại" (Whitelist Role-Based) Là Gì?

Bởi vì Blockchain được điều khiển tự động thông qua Backend (Relayer), một câu hỏi lớn về bảo mật sẽ được đặt ra: *"Nếu Backend làm mọi thứ, vậy tính năng cấp quyền Whitelist Nông trại nằm ngay trên Smart Contract có ý nghĩa thực tiễn gì?"*

Cơ chế phân quyền này hoạt động như **Lớp Khiên Bảo Mật Cuối Cùng (The Ultimate Defense Layer)** với 2 công năng trọng yếu:

### 🛡 Tình Thuống 1: Ngăn Chặn Hack Cấp Độ Máy Chủ (Server Compromise)
Giả sử hệ thống Backend của chúng ta bị tấn công, hoặc một nhân viên IT làm rò rỉ File `.env` chứa `PRIVATE_KEY` của ví Relayer. Hacker cầm được Private Key này, thay vì phải đánh sập Web, chúng dùng mã code tấn công trực diện (Direct RPC Call) gửi hàng triệu lệnh rác rưởi vào Smart Contract để phá hoại tính toàn vẹn Dữ liệu Nông Sản của chúng ta.

**Giải pháp với Role-Based Whitelist:** 
Lúc này, Admin Hệ Thống (người giữ ví Deploy gốc lạnh) chỉ cần thao tác 1 lệnh `Revoke` để tước quyền (Xóa khỏi Whitelist) đối với chiếc Ví Backend bị lộ:
- Hệ quả: Hacker cầm khóa xịn nhưng **Smart Contract sẽ trực tiếp từ chối giao dịch** (Lỗi `NotWhitelistedProducer`), ngăn chặn toàn bộ hành vi phá hoại. Data chuỗi cung ứng được đảm bảo vô nhiễm.

### 🏢 Tình Thuống 2: Hệ Sinh Thái Mở Rộng Kép (B2B Expansion)
Thiết kế này biến Hệ thống truy xuất của chúng ta thành một mô hình **Sẵn sàng cho Doanh nghiệp (Enterprise-Ready)**.
Trong tương lai, nếu có một Đại Nông Trại đối tác (Partner) có năng lực công nghệ riêng và không muốn thông qua App Web/Backend của chúng ta. Họ muốn code của họ cắm thẳng vào Smart Contract.
Hệ thống hoàn toàn cho phép! Admin chỉ cần đưa địa chỉ ví Metamask của Công ty Đối Tác đó vào `Whitelist`. Từ đó, cả Backend của AgriTrace và Hệ thống ERP của Đối Tác đều có thể cùng viết dữ liệu vào 1 Smart Contract bảo mật.

---

## 💡 Tổng Kết (Thông Điệp Phản Biện)

Hãy nhớ rõ thông điệp cốt lõi này trình bày trong các buổi báo cáo/defense:

> *"Hệ thống của chúng em hướng tới UX Tốt nhất cho Nông Dân qua **Cơ chế Relayer Server** che giấu hoàn toàn sự phức tạp của Crypto. Đồng thời, tính năng **Role-based Whitelist On-chain** đóng vai trò là Lớp bảo mật Cấp độ Thấp nhất (Smart Contract Level). Kể cả khi hệ thống Web2 bị đánh sập hay Private Key Backend bị đánh cắp, Smart Contract vẫn chặn đứng các giao dịch trái phép, đảm bảo tính toàn vẹn và phi tập trung tuyệt đối của Chuỗi cung ứng."*
