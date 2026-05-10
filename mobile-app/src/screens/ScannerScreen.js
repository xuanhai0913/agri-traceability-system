/**
 * Luồng tối ưu:
 *  1. CameraView quét QR → extractBatchId()
 *  2. Gọi GET /api/batches/:id (kết quả được cache trong api.js)
 *  3. Lưu vào scanHistoryService (AsyncStorage)
 *  4. navigate("BatchDetail", { batchId, prefetchedBatch: batchData })
 *     → BatchDetailScreen nhận sẵn batch info, chỉ cần tải history
 *
 * Nếu API trả về 404 → status = "failed", vẫn lưu vào history.
 */

import { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { getBatch } from "../services/api";
import { addScanRecord } from "../services/scanHistoryService";

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashMode, setFlashMode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const scanLockRef = useRef(false);

  // ── Permission gates ──
  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <View style={styles.permissionIcon}>
          <Ionicons name="camera-outline" size={48} color="#10b981" />
        </View>
        <Text style={styles.permissionTitle}>Cần quyền Camera</Text>
        <Text style={styles.permissionMsg}>
          AgriTrace cần Camera để quét mã QR trên bao bì sản phẩm
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Cấp quyền Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── QR scan handler ──
  const handleBarCodeScanned = async ({ data }) => {
    if (scanLockRef.current) return;
    scanLockRef.current = true;
    setScanned(true);

    console.log(`[QR] Raw data: ${data}`);
    const batchId = extractBatchId(data);

    if (!batchId) {
      await addScanRecord({
        batchId: data.slice(0, 20),
        batchName: "Mã QR không hợp lệ",
        status: "failed",
      });
      Alert.alert("Mã QR không hợp lệ", "Không thể đọc được ID lô hàng từ mã QR này.", [
        { text: "Quét lại", onPress: resetScan },
      ]);
      return;
    }

    setVerifying(true);
    try {
      const response = await getBatch(batchId);
      const batchData = response.data?.data;

      await addScanRecord({
        batchId,
        batchName: batchData?.name || `Lô hàng #${batchId}`,
        origin: batchData?.origin || "",
        status: "verified",
      });

      // ✅ Truyền batchData đã fetch sang BatchDetailScreen
      // → BatchDetail không cần gọi getBatch lại, chỉ fetch history
      navigation.replace("BatchDetail", {
        batchId,
        prefetchedBatch: batchData,
      });
    } catch (err) {
      setVerifying(false);

      await addScanRecord({
        batchId,
        batchName: `Lô hàng #${batchId}`,
        status: "failed",
      });

      const msg = err.friendlyMessage || "Không thể kết nối server.";
      Alert.alert("Không xác thực được", msg, [
        { text: "Quét lại", onPress: resetScan },
        {
          text: "Xem thử",
          onPress: () => navigation.replace("BatchDetail", { batchId }),
        },
      ]);
    }
  };

  const resetScan = () => {
    scanLockRef.current = false;
    setScanned(false);
    setVerifying(false);
  };

  // ── Gallery picker ──
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) {
      Alert.alert(
        "Thông báo",
        "Tính năng đọc QR từ ảnh tĩnh đang phát triển — sẽ gửi ảnh lên backend để decode.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={!scanned ? handleBarCodeScanned : undefined}
        enableTorch={flashMode}
      />

      <View style={styles.overlay}>
        {verifying && (
          <View style={styles.verifyingBanner}>
            <ActivityIndicator size="small" color="#10b981" />
            <Text style={styles.verifyingText}>Đang xác thực với Blockchain...</Text>
          </View>
        )}

        <View style={styles.centerBox}>
          <View style={[styles.scanFrame, scanned && styles.scanFrameScanned]}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            {!scanned && <View style={styles.scanLine} />}
            {scanned && !verifying && (
              <View style={styles.scannedOverlay}>
                <Ionicons name="checkmark-circle" size={48} color="#10b981" />
              </View>
            )}
          </View>
          <Text style={styles.hint}>
            {verifying
              ? "Đang kiểm tra lô hàng trên Blockchain..."
              : scanned
              ? "Đã quét — đang xử lý..."
              : "Đưa camera vào tem QR trên bao bì"}
          </Text>
        </View>

        <View style={styles.bottomToolbar}>
          <TouchableOpacity style={styles.actionBtn} onPress={pickImage} disabled={verifying}>
            <View style={styles.iconCircle}>
              <Ionicons name="image-outline" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Thư viện</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setFlashMode(!flashMode)}
            disabled={verifying}
          >
            <View style={[styles.iconCircle, flashMode && styles.iconCircleActive]}>
              <Ionicons
                name={flashMode ? "flash" : "flash-outline"}
                size={28}
                color={flashMode ? "#10b981" : "#fff"}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("ScanningHistory")}
            disabled={verifying}
          >
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

// ── extractBatchId — xử lý 3 định dạng QR ──
// Format 1: JSON   → {"batchId": 3}
// Format 2: URL    → https://agri.hailamdev.space/batch/3 hoặc /batches/3
// Format 3: Plain  → "3"
function extractBatchId(data) {
  if (!data) return null;
  try {
    if (data.trim().startsWith("{")) {
      const parsed = JSON.parse(data);
      if (parsed.batchId) return String(parsed.batchId);
    }
    const urlMatch = data.match(/\/batch(?:es)?\/([a-zA-Z0-9_-]+)/);
    if (urlMatch) return urlMatch[1];
    const trimmed = data.trim();
    if (trimmed !== "") return trimmed;
    return null;
  } catch {
    return data.trim() || null;
  }
}

const CORNER_COLOR = "#10b981";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a",
    padding: 32,
  },
  permissionIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(16,185,129,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  permissionTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 10 },
  permissionMsg: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  permissionBtn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "space-between" },
  verifyingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 60,
    marginHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.4)",
  },
  verifyingText: { color: "#10b981", fontSize: 13, fontWeight: "600" },
  centerBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  scanFrame: {
    width: 250,
    height: 250,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrameScanned: { opacity: 0.85 },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: CORNER_COLOR,
    borderWidth: 4,
  },
  topLeft:    { top: 0, left: 0,   borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 16 },
  topRight:   { top: 0, right: 0,  borderBottomWidth: 0, borderLeftWidth: 0,  borderTopRightRadius: 16 },
  bottomLeft: { bottom: 0, left: 0,  borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 16 },
  bottomRight:{ bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0,  borderBottomRightRadius: 16 },
  scanLine: {
    width: "100%",
    height: 2,
    backgroundColor: CORNER_COLOR,
    position: "absolute",
    top: "50%",
    elevation: 5,
  },
  scannedOverlay: { position: "absolute" },
  hint: {
    color: "#fff",
    fontSize: 13,
    marginTop: 36,
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  bottomToolbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingBottom: 52,
    paddingHorizontal: 20,
  },
  actionBtn: { alignItems: "center", gap: 8 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircleActive: {
    backgroundColor: "rgba(16,185,129,0.2)",
    borderWidth: 1,
    borderColor: "#10b981",
  },
  actionText: { color: "#fff", fontSize: 12, fontWeight: "500" },
});
