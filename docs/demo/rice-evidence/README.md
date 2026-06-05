# Bộ ảnh demo quy trình lúa

Folder này chứa ảnh evidence đã chuẩn bị sẵn để upload khi demo AgriTrace. Tất cả ảnh được tải từ Wikimedia Commons; thông tin nguồn, license, artist và SHA-256 nằm trong `manifest.json`.

## Cách dùng nhanh

| Stage | File nên upload | Ghi chú demo |
| --- | --- | --- |
| Create Batch | `01-create-batch-rice-seedlings.jpg` | Ảnh mạ giống/lô ban đầu. |
| Seeding | `02-seeding-transplanting-rice.jpg` | Cấy mạ/gieo trồng. |
| Growing | `03-growing-rice-field.jpg` | Ruộng lúa đang sinh trưởng. |
| Fertilizing | `04-fertilizing-rice-care.jpg` | Chăm sóc/bón phân/xử lý ruộng. |
| Harvesting | `05-harvesting-rice.jpg` | Thu hoạch lúa. |
| QualityInspection | `06-quality-inspection-rice-lab.jpg` | Kiểm nghiệm mẫu gạo trong phòng lab. |
| WarehouseReceived | `07-warehouse-receiving-rice-bags.jpg` | Nhập kho/bao gạo vào kho. |
| Packaging | `08-packaging-rice-bag.jpg` | Bao bì/đóng gói gạo. |
| Shipping | `09-shipping-rice-truck.jpg` | Xe tải vận chuyển bao gạo. |
| Completed | `10-completed-rice-grains.jpg` | Hạt gạo thành phẩm, dùng khi cần ảnh hoàn tất. |

## Lưu ý khi phản biện

- Đây là ảnh demo minh họa quy trình, không phải bằng chứng pháp lý thật.
- Khi upload, backend sẽ tính `evidenceHash` từ file và pin IPFS qua Pinata nếu cấu hình đang hoạt động.
- Nếu bị hỏi nguồn ảnh, mở `manifest.json` để chỉ source page và license.
