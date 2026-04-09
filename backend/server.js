require("dotenv").config();
const app = require("./src/app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🌾 AgriTrace Backend Server`);
  console.log(`📡 Running on: http://localhost:${PORT}`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 API Docs:`);
  console.log(`   POST   /api/batches          - Tạo lô hàng mới`);
  console.log(`   GET    /api/batches/:id       - Xem lô hàng`);
  console.log(`   POST   /api/batches/:id/stages - Thêm giai đoạn`);
  console.log(`   GET    /api/batches/:id/history - Xem timeline`);
  console.log(`   GET    /api/batches/total      - Tổng số lô hàng`);
  console.log(`   POST   /api/upload             - Upload ảnh\n`);
});
