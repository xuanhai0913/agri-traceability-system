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

---

### Câu 6: Tại sao lại chọn Polygon (Amoy) thay vì Ethereum Mainnet hay Binance Smart Chain (BSC)?
**🤨 Giám khảo hỏi:** *"Anh/chị nói Blockchain của anh chị mở rộng tốt, vậy tại sao lại chọn Polygon Testnet/Mainnet mà không dùng mạng lưới số 1 là Ethereum hay BSC?"*

**💡 Trả lời:** 
*"Dạ, việc chọn mạng Polygon thay vì Ethereum Mainnet là một quyết định kiến trúc mang tính chiến lược về **Hiệu quả chi phí (Cost-Efficiency)**. Ethereum bảo mật nhất nhưng phí Gas rất cao (có thể lên tới $2 - $10 cho một lần ghi dữ liệu). Polygon là một mạng lưới Layer-2 (Lớp thứ 2) chạy song song với Ethereum, giúp gộp các giao dịch lại với tốc độ cực nhanh và phí Gas cực rẻ (chưa tới 1 cent). Nhờ vậy, hệ thống truy xuất nông sản có thể nhân rộng thực tế hàng triệu lô hàng mà không bị lỗ chi phí hạ tầng. So với BSC (thiên hướng giải trí/Defi), Polygon được các doanh nghiệp thực chuẩn quốc tế tin tưởng hơn trong việc xây dựng DApp."*

---

### Câu 7: Khi quét mã QR trên điện thoại, dữ liệu đó đã bị thao túng chưa?
**🤨 Giám khảo hỏi:** *"Mã QR quét trên điện thoại chỉ là trỏ về trang Web của em, vậy em hoàn toàn có thể 'đánh tráo' hiển thị Web để lừa người dùng, thế thì phi tập trung chỗ nào?"*

**💡 Trả lời:** 
*"Dạ em xin xác nhận đây là thắc mắc hoàn toàn chính xác. Ở phiên bản Prototype hiện tại, mã QR trỏ về một giao diện Web (Gateway) để thuận tiện cho điện thoại không cài ví Metamask. Nhưng, mọi dữ liệu hiển thị trên Web đó đều được **Đọc trực tiếp (Fetch)** từ địa chỉ Smart Contract công khai trên block explorer (PolygonScan). 
Trong môi trường thực tế, bất kỳ chuyên gia hay công ty kiểm toán nào cũng có thể kiểm tra trực tiếp mã ID Lô hàng trên mạng PolygonScan mà không cần thông qua giao diện Web của hệ thống em. Giao diện Web chỉ là 'Bộ đọc hiển thị', còn dữ liệu sinh mạng của lô hàng nằm vĩnh viễn trên máy chủ phân tán toàn cầu."*

---

## 📚 Phần Hỗ Trợ: Các Khái Niệm Cơ Bản Phải Nhớ (Back-to-Basics)

Nếu Thầy/Cô hỏi các khái niệm nền tảng để xem sinh viên có dùng AI làm giùm hay không, hãy bám vào các từ khóa này để trả lời:

1. **Smart Contract (Hợp đồng thông minh):** 
   - Không phải là tờ giấy hay file PDF. Nó là một **Đoạn mã code (Code script)** được cài thẳng vào không gian mạng lưới Blockchain. Nó tự động chạy nếu thỏa điều kiện (Ví dụ: Đúng hàm, đúng quyền) và không ai (kể cả admin) có thể tắt hay sửa mã code đó một khi đã Deploy.
   - Trọng tâm AgriTrace: *"Em dùng Smart Contract bằng ngôn ngữ Solidity để lập trình các quy định thêm lô hàng."*

2. **Immutable Ledger (Sổ cái bất biến):**
   - Giống như cuốn sổ kế toán của dòng họ, nhưng mỗi người trong dòng họ (Node) đều giữ 1 bản sao. Ai ghi sai thì các cuốn sổ khác không cho phép.
   - Trọng tâm AgriTrace: *"Dữ liệu nông sản ghi vào là vĩnh viễn, không hỗ trợ hàm Update/Delete."*

3. **EVM (Ethereum Virtual Machine):**
   - Máy ảo Ethereum. Các mạng lưới nổi tiếng như Polygon, BSC, Avalanche đều là "EVM-Compatible" (tương thích EVM).
   - Trọng tâm AgriTrace: *"Do code bằng Solidity tương thích EVM, mốt doanh nghiệp muốn đổi từ Polygon sang Ethereum thì chỉ mất 15 phút đổi cấu hình mạng mà không phải viết lại code."*

4. **Gas Fee (Phí Gas):**
   - Tiền cước phí phải trả cho mạng lưới (Miner/Validator) để họ tốn điện chạy máy chủ xác nhận giao dịch của mình. Lưu 1 ký tự text cũng tốn tiền.
   - Trọng tâm AgriTrace: *"Em áp dụng mô hình Gasless Relayer, Backend tự cầm Ví Admin xì tiền túi ra trả tiền Gas để người nông dân không bị ngộp khi dùng Web."*

5. **Off-chain vs On-chain (Trong và Ngoài chuỗi):**
   - On-chain: Chữ viết, con số ID (nằm trong lõi Blockchain, bất biến cục bộ).
   - Off-chain: Server của chúng ta, Cảnh quan UI, Hình ảnh dung lượng lớn (Nằm trên máy chủ bình thường hoặc nền tảng lưu trữ ngoại vi như Cloudinary/IPFS).

*(💡 Lời khuyên: Đừng cố giải thích dài dòng về cấu trúc Mã băm (Hash/Cryptography) của Blockchain nếu thầy cô không gặng hỏi. Hãy tập trung đánh mạnh vào Giá trị Kinh doanh và Triết lý Ứng dụng B2B của nền tảng vào Nông nghiệp).*
