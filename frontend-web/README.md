# AgriTrace Frontend Web

Frontend web của AgriTrace là operations portal và public QR verification UI cho hệ thống truy xuất nguồn gốc nông sản bằng blockchain.

## Vai Trò

| Khu vực | Mục đích |
| --- | --- |
| Public | Dashboard, Ledger, Batch Detail, QR verification, Producers, Compliance. |
| Admin | Quản lý users, producers, warehouses, batches và compliance. |
| Producer | Xem producer profile, tạo batch, cập nhật stage sản xuất. |
| Quality Inspector | Xem queue kiểm định, nhập PASS/FAIL và evidence. |
| Warehouse Staff | Nhập kho, xem receipt history, quản lý inventory movement. |
| Distributor | Cập nhật Packaging, Shipping và Completed. |

## Tech Stack

- React + Vite.
- Tailwind CSS.
- Axios API client.
- qrcode.react.
- Role-based routing và protected actions.

## Environment

```bash
VITE_API_URL=http://localhost:3000/api
```

Production Vercel cần trỏ `VITE_API_URL` tới Render backend `/api`. Không đưa `PINATA_JWT`, private key, database URL hoặc admin password vào frontend env.

## Development

```bash
npm install
npm run frontend:dev
```

Frontend local mặc định chạy ở `http://localhost:5173`.

## Production Notes

- Evidence upload đi qua backend, frontend không gọi Pinata trực tiếp.
- IPFS image URL/hash/CID được đọc từ API response.
- Các action ghi dữ liệu phải có JWT và backend RBAC; frontend chỉ ẩn menu/action để UX rõ hơn.
- Public QR page phải hoạt động tốt trên mobile vì consumer quét QR bằng điện thoại.
