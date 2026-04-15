import React from "react";
import { StyleSheet, Text, View, ScrollView, Image, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// MOCK DATA CÓ CHỨA LINK CLOUDINARY THỰC TẾ ĐỂ TEST
const DUMMY_TIMELINE = [
  {
    id: 1,
    stageName: "Đóng gói & Phân phối",
    time: "14/10/2023 • 09:42 AM",
    icon: "cube-outline",
    handler: { name: "Nguyễn Xuân Hải" },
    // Link Cloudinary test (Sử dụng chuẩn HTTPS)
    images: ["https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg"],
    metadata: [ { label: "Nhiệt độ kho", value: "22°C" } ],
  },
  {
    id: 2,
    stageName: "Thu hoạch & Sơ chế",
    time: "28/09/2023 • Nông trại Đà Lạt",
    icon: "leaf-outline",
    handler: { name: "Trần Gia Huy" },
    images: [],
    metadata: [ { label: "Phương pháp", value: "Sơ chế khô (Natural)" } ],
  },
  {
    id: 3,
    stageName: "Bón phân & Chăm sóc",
    time: "15/06/2023 • Nông trại Đà Lạt",
    icon: "water-outline",
    handler: { name: "Trần Gia Huy" },
    images: ["https://res.cloudinary.com/demo/image/upload/v1612459992/sample_fruit.jpg"],
    metadata: [ { label: "Loại phân", value: "Hữu cơ sinh học" } ],
  }
];

export default function BatchDetailScreen({ route }) {
  const { batchId } = route.params || { batchId: "N/A" };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header thông tin Lô Hàng */}
        <View style={styles.headerBlock}>
          <Text style={styles.headerTitle}>Chi tiết lô hàng</Text>
          <Text style={styles.batchIdText}>#{batchId}</Text>
        </View>

        {/* Khối TIMELINE tự code - Chuẩn UI UX */}
        <View style={styles.timelineContainer}>
          {DUMMY_TIMELINE.map((item, index) => {
            const isLast = index === DUMMY_TIMELINE.length - 1;
            
            return (
              <View key={item.id} style={styles.timelineItem}>
                
                {/* Cột trái: Nút icon & Đường kẻ */}
                <View style={styles.leftCol}>
                  <View style={styles.timelineIcon}>
                    <Ionicons name={item.icon} size={20} color="#fff" />
                  </View>
                  {/* Không vẽ đường thẳng nếu là item cuối cùng */}
                  {!isLast && <View style={styles.timelineLine} />}
                </View>

                {/* Cột phải: Nội dung chi tiết */}
                <View style={[styles.rightCol, isLast && styles.rightColLast]}>
                  <Text style={styles.stageTitle}>{item.stageName}</Text>
                  <Text style={styles.timeText}>{item.time}</Text>
                  
                  {/* Người phụ trách */}
                  <View style={styles.handlerRow}>
                    <Ionicons name="person-circle-outline" size={16} color="#64748b" />
                    <Text style={styles.handlerText}>{item.handler.name}</Text>
                  </View>

                  {/* Hiển thị hình ảnh từ Cloudinary */}
                  {item.images && item.images.length > 0 && (
                    <View style={styles.imageGrid}>
                      {item.images.map((imgUrl, imgIdx) => (
                        <Image 
                          key={imgIdx} 
                          source={{ uri: imgUrl }} 
                          style={styles.stageImage}
                          resizeMode="cover" // Tránh vỡ ảnh
                        />
                      ))}
                    </View>
                  )}

                  {/* Hiển thị Metadata bổ sung */}
                  {item.metadata && (
                    <View style={styles.metaBox}>
                      {item.metadata.map((meta, mIdx) => (
                        <Text key={mIdx} style={styles.metaText}>
                          <Text style={styles.metaLabel}>{meta.label}: </Text>
                          {meta.value}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>

              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { padding: 20 },
  
  headerBlock: { marginBottom: 30, paddingBottom: 20, borderBottomWidth: 1, borderColor: "#e2e8f0" },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#0f172a" },
  batchIdText: { fontSize: 16, color: "#10b981", fontWeight: "600", marginTop: 4 },

  timelineContainer: { marginTop: 10 },
  timelineItem: { flexDirection: "row" },
  
  // Left Column (Icon & Line)
  leftCol: { alignItems: "center", width: 40, marginRight: 12 },
  timelineIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#10b981", justifyContent: "center", alignItems: "center", zIndex: 2 },
  timelineLine: { width: 2, flex: 1, backgroundColor: "#cbd5e1", marginTop: -4, marginBottom: -4, zIndex: 1 },
  
  // Right Column (Content Card)
  rightCol: { flex: 1, paddingBottom: 32 },
  rightColLast: { paddingBottom: 0 }, // Căn bỏ khoảng trống dưới cùng nếu là bước cuối
  stageTitle: { fontSize: 18, fontWeight: "600", color: "#1e293b", marginBottom: 4 },
  timeText: { fontSize: 13, color: "#64748b", marginBottom: 8 },
  handlerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  handlerText: { fontSize: 14, color: "#475569", marginLeft: 6 },
  
  // Image Rendering (Cloudinary)
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  stageImage: { width: "100%", height: 160, borderRadius: 12, backgroundColor: "#e2e8f0" }, // Dùng tỷ lệ hình chữ nhật cho đẹp
  
  // Metadata Box
  metaBox: { backgroundColor: "#f1f5f9", padding: 12, borderRadius: 8 },
  metaText: { fontSize: 13, color: "#334155", marginBottom: 2 },
  metaLabel: { fontWeight: "600", color: "#64748b" },
});