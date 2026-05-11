/**
 * ScannerScreen.js — Màn hình quét QR
 *  • extractBatchId() hỗ trợ đầy đủ các định dạng URL web:
 *      - https://agri.hailamdev.space/batch/3
 *      - https://agri.hailamdev.space/batches/3
 *      - https://agritrace-api.onrender.com/api/batches/3
 *      - JSON: { "batchId": 3 }  /  { "id": 3 }
 *      - Plain text: "3"
 *  • Auto-reset sau 15 giây nếu scan thất bại để không bị kẹt màn hình
 *  • Flashlight toggle có label ON/OFF rõ ràng
 *  • Hiện batchId đang xác thực trong banner để người dùng biết đang kiểm tra lô nào
 *  • Tách biệt lỗi "QR không hợp lệ" vs "Lô hàng không tìm thấy trên blockchain"
 */

import { useState, useRef, useEffect } from "react";
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

// ── Thời gian chờ tối đa sau khi scan trước khi auto-reset (ms) ──
const SCAN_TIMEOUT_MS = 15_000;

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned]         = useState(false);
  const [flashMode, setFlashMode]     = useState(false);
  const [verifying, setVerifying]     = useState(false);
  const [verifyingId, setVerifyingId] = useState(null); // batchId đang xác thực

  const scanLockRef     = useRef(false);
  const autoResetTimerRef = useRef(null);

  // Dọn timer khi unmount
  useEffect(() => {
    return () => {
      if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
    };
  }, []);

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

  // ── Đặt lại về trạng thái sẵn sàng quét ──
  const resetScan = () => {
    if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
    scanLockRef.current = false;
    setScanned(false);
    setVerifying(false);
    setVerifyingId(null);
  };

  // ── QR scan handler ──
  const handleBarCodeScanned = async ({ data }) => {
    // scanLockRef đảm bảo chỉ xử lý một QR tại một thời điểm
    if (scanLockRef.current) return;
    scanLockRef.current = true;
    setScanned(true);

    console.log(`[QR] Raw data: ${data}`);
    const batchId = extractBatchId(data);

    // ── Case 1: QR không chứa batch ID hợp lệ ──
    if (!batchId) {
      await addScanRecord({
        batchId: data.slice(0, 20),
        batchName: "Mã QR không hợp lệ",
        status: "failed",
      });
      Alert.alert(
        "Mã QR không hợp lệ",
        "Mã QR này không phải của AgriTrace. Vui lòng quét mã trên bao bì nông sản.",
        [{ text: "Quét lại", onPress: resetScan }]
      );
      return;
    }

    // ── Case 2: Xác thực với blockchain ──
    setVerifying(true);
    setVerifyingId(batchId);

    // Auto-reset nếu quá lâu không có phản hồi
    autoResetTimerRef.current = setTimeout(() => {
      if (scanLockRef.current) {
        setVerifying(false);
        Alert.alert(
          "Hết thời gian",
          "Server mất quá nhiều thời gian để phản hồi. Vui lòng kiểm tra kết nối mạng và thử lại.",
          [{ text: "Quét lại", onPress: resetScan }]
        );
      }
    }, SCAN_TIMEOUT_MS);

    try {
      // force = false: dùng cache nếu có (ScannerScreen vừa scan → ít khi cache hit)
      const response = await getBatch(batchId, false);
      const batchData = response.data?.data;

      if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);

      await addScanRecord({
        batchId,
        batchName: batchData?.name || `Lô hàng #${batchId}`,
        origin:    batchData?.origin || "",
        status:    "verified",
      });

      // Truyền batchData đã fetch sang BatchDetailScreen để hiện ngay header
      // không cần gọi getBatch lại lần nữa (tránh duplicate request)
      navigation.replace("BatchDetail", {
        batchId,
        prefetchedBatch: batchData,
      });
    } catch (err) {
      if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
      setVerifying(false);

      await addScanRecord({
        batchId,
        batchName: `Lô hàng #${batchId}`,
        status:    "failed",
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

  // ── Gallery QR picker ──
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) {
      Alert.alert(
        "Tính năng đang phát triển",
        "Đọc QR từ ảnh thư viện sẽ được hỗ trợ trong bản cập nhật tiếp theo.",
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
        {/* ── Verifying banner ── */}
        {verifying && (
          <View style={styles.verifyingBanner}>
            <ActivityIndicator size="small" color="#10b981" />
            <View style={{ flex: 1 }}>
              <Text style={styles.verifyingText}>Đang xác thực với Blockchain...</Text>
              {verifyingId && (
                <Text style={styles.verifyingSubText}>Lô hàng #{verifyingId}</Text>
              )}
            </View>
          </View>
        )}

        {/* ── Scan frame ── */}
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
              ? `Đang kiểm tra lô #${verifyingId} trên Blockchain...`
              : scanned
              ? "Đã quét — đang xử lý..."
              : "Đưa camera vào tem QR trên bao bì"}
          </Text>
        </View>

        {/* ── Bottom toolbar ── */}
        <View style={styles.bottomToolbar}>
          {/* Thư viện ảnh */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={pickImage}
            disabled={verifying}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="image-outline" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Thư viện</Text>
          </TouchableOpacity>

          {/* Flash toggle */}
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
            <Text style={[styles.actionText, flashMode && { color: "#10b981" }]}>
              {flashMode ? "Đèn BẬT" : "Đèn"}
            </Text>
          </TouchableOpacity>

          {/* Lịch sử */}
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

// ─── extractBatchId ───
// Xử lý tất cả các định dạng QR mà web AgriTrace có thể tạo ra:
//
//  1. JSON:  {"batchId": 3}  hoặc  {"id": 3}
//  2. URL web:   https://agri.hailamdev.space/batch/3
//               https://agri.hailamdev.space/batches/3
//  3. URL API:   https://agritrace-api.onrender.com/api/batches/3
//  4. URL chung: /batch/3  hoặc  /batches/3  (relative)
//  5. Plain:     "3"  (số nguyên dương)
//
// Trả về String(batchId) hoặc null nếu không nhận ra

function extractBatchId(data) {
  if (!data || typeof data !== "string") return null;
  const trimmed = data.trim();
  if (!trimmed) return null;

  // 1. JSON
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      const id = parsed.batchId ?? parsed.id ?? parsed.batch_id;
      if (id !== undefined && id !== null) return String(id);
    } catch {
      // không phải JSON hợp lệ → thử các bước tiếp
    }
  }

  // 2 + 3 + 4. URL patterns — /batch/X hoặc /batches/X
  // Regex bắt cả domain lẫn relative path, và cả "batch" lẫn "batches"
  const urlMatch = trimmed.match(/\/batches?\/([a-zA-Z0-9_-]+)/);
  if (urlMatch?.[1]) return urlMatch[1];

  // 5. Plain number string
  if (/^\d+$/.test(trimmed)) return trimmed;

  // 6. Nếu không khớp pattern nào nhưng chuỗi ngắn (< 50 ký tự) và
  //    không phải URL lạ → dùng toàn bộ chuỗi làm batchId
  //    (bảo đảm backward compat với QR plain text cũ)
  if (trimmed.length < 50 && !trimmed.includes("://")) return trimmed;

  return null;
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
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.80)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 60,
    marginHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.4)",
  },
  verifyingText: { color: "#10b981", fontSize: 13, fontWeight: "600" },
  verifyingSubText: { color: "#94a3b8", fontSize: 11, marginTop: 2 },

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
  topLeft:    { top: 0,    left: 0,   borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 16 },
  topRight:   { top: 0,    right: 0,  borderBottomWidth: 0, borderLeftWidth: 0,  borderTopRightRadius: 16 },
  bottomLeft: { bottom: 0, left: 0,   borderTopWidth: 0,    borderRightWidth: 0, borderBottomLeftRadius: 16 },
  bottomRight:{ bottom: 0, right: 0,  borderTopWidth: 0,    borderLeftWidth: 0,  borderBottomRightRadius: 16 },

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
