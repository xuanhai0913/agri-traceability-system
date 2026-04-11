# 🎯 Bộ Câu Hỏi Phản Biện Đồ Án (Defense Q&A)

Dưới đây là danh sách các câu hỏi "Tử huyệt" mà hội đồng giám khảo ngành CNTT thường xuyên sử dụng để thử thách sinh viên làm đề tài Blockchain. Kèm theo là những câu trả lời "Ghi điểm tuyệt đối" dựa trên chính kiến trúc của dự án.

---

### Câu 1: Vấn đề "Rác Đầu Vào" (Garbage In, Garbage Out / Oracle Problem)
**🤨 Giám khảo hỏi:** *"Blockchain đảm bảo dữ liệu không bị sửa đổi. Nhưng làm sao em đảm bảo được cái lô Gạo ST25 nông dân nhập vào hệ thống lúc ban đầu là Gạo thật, chứ không phải Gạo giả tráo vô?"*

**💡 Trả lời:** 
*"Dạ, đây chính là **Bài toán Oracle (Oracle Problem)** kinh điển trong Blockchain. Blockchain không phải là phép thuật để kiểm định sự thật ở thế giới vật lý, nó chỉ là một Sổ cái Đảm bảo Dữ liệu Bất biến. 
Tuy nhiên, hệ thống của em giải quyết vấn đề rác đầu vào thông qua 2 yếu tố:
1. **Tính định danh:** Nhờ hệ thống Role-based (Whitelist) mà em đã cấu hình, chỉ những Nông trại đã được Thẩm định (Chính quyền/Chứng nhận VietGAP) mới được cấp quyền ghi dữ liệu. Khi họ nhập sai, dữ liệu bất biến sẽ là bằng chứng vĩnh viễn chống lại họ trước pháp luật.
2. **Hướng phát triển tương lai:** Ở mức độ đồ án phần mềm em tập trung vào chuỗi dữ liệu. Ở mức độ doanh nghiệp, hệ thống này sẽ được tích hợp với thiết bị cảm biến (IoT) tại nông trại để tự động đẩy thông tin quang học thay vì con người tự nhập."*

---

### Câu 2: Tại sao phải dùng Blockchain mà không dùng Database (MySQL/SQL Server)?
**🤨 Giám khảo hỏi:** *"Anh/chị làm rườm rà quá, chỉ là ghi cái chữ 'Đã Thu Hoạch' xuống DB là xong, tại sao phải dùng Blockchain cho tốn chi phí và phức tạp?"*

**💡 Trả lời:** 
*"Dạ, đúng là về tốc độ và chi phí, SQL Server/MySQL luôn chiến thắng. Tuy nhiên, Database truyền thống đòi hỏi ở người tiêu dùng một thứ: **'Niềm tin mù quáng' (Blind Trust)** vào người quản trị hệ thống. Người quản trị hoàn toàn có thể vào Database đổi ngày sản xuất từ tháng 4 thành tháng 5 để bán hàng hết hạn mà không ai biết.*
*Với Blockchain, hệ thống của em mang lại **'Sự minh bạch vô tín nhiệm' (Trustless Transparency)**. Nhờ hợp đồng thông minh Smart Contract, một khi lô hàng xuất đi, nó không thể bị can thiệp bởi bất cứ ai kể cả người làm ra phần mềm. Đây là yếu tố sống còn để nông sản Việt Nam đạt chuẩn xuất khẩu vào các thị trường khó tính như Châu Âu (EVFTA)."*

---

### Câu 3: Tính Tiện Dụng và Vấn đề Trả Phí (UX & Gas Fee)
**🤨 Giám khảo hỏi:** *"Ghi lên Blockchain mỗi lần tốn tiền phí (Gas fee). Bắt nông dân nạp tiền ảo vô để làm ruộng à?"*

**💡 Trả lời:** 
*"Dạ không. Nhận thức được rào cản thao tác Web3 với nông dân, dự án của em đã chủ động thiết kế theo **Mô hình Trạm Trung Chuyển (Gasless Relayer)**. Nông dân chỉ cần dùng phần mềm như một Web2 bình thường. Backend của hệ thống sẽ tự động dùng Ví Tổng để chi trả khoản phí cực nhỏ (dưới 100 đồng/giao dịch) trên nền tảng Layer-2 Polygon. Nhờ vậy mô hình này cực kỳ triển vọng để ứng dụng thực tiễn ngay lập tức vào các Hợp tác xã."*

---

### Câu 4: Làm sao lưu hình ảnh dung lượng lớn lên Blockchain?
**🤨 Giám khảo hỏi:** *"Mấy cái ảnh cây trồng của em chụp độ phân giải lớn thế kia chứa trong Blockchain thì sập mạng lưới à?"*

**💡 Trả lời:** 
*"Hệ thống của em KHÔNG LƯU MÃ BYTE ẢNH lên Blockchain. Khắc phục nhược điểm chi phí cao, em đã sử dụng **Kiến trúc Lưu Trữ Kết Lai (Hybrid Storage)**. 
- Ảnh nặng được chuyển lên nền tảng Cloudinary (Web2). 
- Chỉ độc nhất **Đường Link (URL)** của ảnh đó được lưu vào cấu trúc (Struct) trong Smart Contract (Web3). Khi lưu xong, đường link này vô tình bị khóa cứng, tạo thành bằng chứng điện tử nối thẳng tới tấm ảnh gốc mà không làm đội chi phí của hệ thống."*

---

### Câu 5: Lỗ Hổng Dán Mã QR Giả
**🤨 Giám khảo hỏi:** *"Cô/Thầy lấy cái QR Code của quả dưa hấu sạch, cô in ra 100 bản rồi dán lên 100 quả dưa hấu bẩn mua ở chợ thì người dùng quét cũng ra hàng sạch. Hệ thống của em giải quyết sao?"*

**💡 Trả lời:** 
*"Dạ, sao chép mã QR là một lỗ hổng thuộc về Thế giới Vật Lý. Đồ án của chúng em giải quyết bài toán cốt lõi là **'Vết Tích Lô Hàng' (Traceability Ledger)** phần mềm. Để chống việc dán nhãn giả, ở quy mô triển khai thực tế, doanh nghiệp sẽ kết hợp mã QR này vào Tem Vỡ, hoặc mã hóa thẳng vào Chip RFID/NFC hủy khi bóc. Blockchain làm rất tốt việc lưu dữ liệu chứ không chống được việc nhân bản tấm tem giấy."*

*(💡 Lưu ý: Khi trả lời câu 1 và câu 5, triết lý là phải **mạnh dạn thừa nhận giới hạn thực tế** và lấp đầy bằng kiến thức công nghệ kết hợp, hội đồng rất thích sinh viên không "ảo tưởng sức mạnh" về Blockchain).*
