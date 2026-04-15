import { useState } from "react";
import { StyleSheet, Text, View, Alert, TouchableOpacity, SafeAreaView } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashMode, setFlashMode] = useState(false); // Trạng thái Flashlight

  if (!permission) return <View style={styles.container} />;
  
  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Cần quyền truy cập Camera để quét mã QR</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionText}>Cấp quyền Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 1. Logic xử lý khi quét được QR từ Camera
  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    setScanned(true);

    console.log(`[QR SCANNER] Dữ liệu thô từ QR: ${data}`);
    const batchId = extractBatchId(data);

    if (batchId) {
      navigation.replace("BatchDetail", { batchId });
    } else {
      Alert.alert("Lỗi", "Mã QR không hợp lệ", [
        { text: "Thử lại", onPress: () => setScanned(false) },
      ]);
    }
  };

  // 2. Logic xử lý chọn ảnh từ Thư viện (Gallery)
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      // Lưu ý: Expo Camera hiện tại không hỗ trợ hàm scan trực tiếp từ ảnh cục bộ trong API mới nhất.
      // Bạn có thể đẩy URL ảnh này lên backend để backend đọc QR, 
      // hoặc dùng thêm thư viện 'expo-barcode-scanner' để đọc ảnh tĩnh (nếu cần).
      Alert.alert("Thông báo", "Tính năng đọc QR từ ảnh tĩnh đang được phát triển tích hợp backend.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarCodeScanned}
        enableTorch={flashMode} // Bật/tắt Flashlight
      />
      
      {/* UI Lớp phủ chuẩn Figma */}
      <View style={styles.overlay}>
        {/* Khung quét ở giữa */}
        <View style={styles.centerBox}>
          <View style={styles.scanFrame}>
            {/* Tạo 4 góc vuông bo viền (Mock) */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            {/* Đường line quét ngang */}
            <View style={styles.scanLine} />
          </View>
          <Text style={styles.hint}>Đưa camera vào tem QR trên bao bì</Text>
        </View>

        {/* Thanh công cụ bên dưới (Gallery - Flash - History) */}
        <View style={styles.bottomToolbar}>
          {/* Nút Thư viện ảnh */}
          <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
            <View style={styles.iconCircle}>
              <Ionicons name="image-outline" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Thư viện</Text>
          </TouchableOpacity>

          {/* Nút Flashlight */}
          <TouchableOpacity style={styles.actionBtn} onPress={() => setFlashMode(!flashMode)}>
            <View style={[styles.iconCircle, flashMode && styles.iconCircleActive]}>
              <Ionicons name={flashMode ? "flash" : "flash-outline"} size={28} color={flashMode ? "#10b981" : "#fff"} />
            </View>
          </TouchableOpacity>

          {/* Nút Lịch sử */}
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate("ScanningHistory")}>
            <View style={styles.iconCircle}>
              <Ionicons name="time-outline" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Lịch sử</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// 3. Logic bóc tách ID thông minh (Giữ nguyên)
function extractBatchId(data) {
  try {
    if (data.startsWith('{')) {
      const parsed = JSON.parse(data);
      if (parsed.batchId) return parsed.batchId;
    }
    const urlMatch = data.match(/\/batch(?:es)?\/([a-zA-Z0-9_-]+)/);
    if (urlMatch) return urlMatch[1];
    if (data && data.trim() !== "") return data.trim();
    return null;
  } catch (error) {
    return null;
  }
}

// STYLE CHUẨN FIGMA
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a" },
  message: { color: "#fff", fontSize: 16, marginBottom: 16 },
  permissionBtn: { backgroundColor: "#10b981", padding: 12, borderRadius: 8 },
  permissionText: { color: "#fff", fontWeight: "bold" },
  
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "space-between" },
  
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  scanFrame: { width: 250, height: 250, position: "relative" },
  corner: { position: "absolute", width: 40, height: 40, borderColor: "#10b981", borderWidth: 4 },
  topLeft: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 16 },
  topRight: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 16 },
  bottomLeft: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 16 },
  bottomRight: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 16 },
  scanLine: { width: "100%", height: 2, backgroundColor: "#10b981", position: "absolute", top: "50%", elevation: 5 },
  hint: { color: "#fff", fontSize: 14, marginTop: 40, fontWeight: "500", letterSpacing: 0.5 },
  
  bottomToolbar: { flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end", paddingBottom: 50, paddingHorizontal: 20 },
  actionBtn: { alignItems: "center", gap: 8 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  iconCircleActive: { backgroundColor: "rgba(16, 185, 129, 0.2)", borderWidth: 1, borderColor: "#10b981" },
  actionText: { color: "#fff", fontSize: 12, fontWeight: "500" },
});