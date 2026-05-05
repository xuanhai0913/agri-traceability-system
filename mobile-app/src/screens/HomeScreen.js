import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { healthCheck } from "../services/api";

// ─── SERVER STATUS INDICATOR ──────────────────────────────────────────────────
// Ping /api/health khi mở app
function ServerStatus() {
  const [status, setStatus] = useState("checking"); // "checking" | "online" | "offline"

  useEffect(() => {
    healthCheck()
      .then(() => setStatus("online"))
      .catch(() => setStatus("offline"));
  }, []);

  if (status === "checking") {
    return (
      <View style={styles.serverBadge}>
        <ActivityIndicator size="small" color="#94a3b8" />
        <Text style={styles.serverBadgeText}>Đang kết nối server...</Text>
      </View>
    );
  }

  if (status === "offline") {
    return (
      <View style={[styles.serverBadge, styles.serverBadgeOffline]}>
        <View style={[styles.statusDot, { backgroundColor: "#ef4444" }]} />
        <Text style={[styles.serverBadgeText, { color: "#ef4444" }]}>
          Server đang khởi động (~30s)
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.serverBadge, styles.serverBadgeOnline]}>
      <View style={[styles.statusDot, { backgroundColor: "#10b981" }]} />
      <Text style={[styles.serverBadgeText, { color: "#10b981" }]}>Blockchain đang hoạt động</Text>
    </View>
  );
}

// Dùng để test app khi chưa có QR vật lý thật
// batchId = 1 là lô hàng đầu tiên được tạo trên Polygon Amoy testnet
const TEST_BATCHES = [
  {
    id: "1",
    label: "Lô hàng #1",
    desc: "Lô đầu tiên trên Blockchain",
    icon: "leaf-outline",
    color: "#10b981",
  },
  {
    id: "2",
    label: "Lô hàng #2",
    desc: "Lô thứ hai — Đa giai đoạn",
    icon: "cube-outline",
    color: "#8b5cf6",
  },
  {
    id: "3",
    label: "Lô hàng #3",
    desc: "Lô mới nhất đã đóng gói",
    icon: "basket-outline",
    color: "#f59e0b",
  },
];

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.greetingTitle}>AgriTrace 🌾</Text>
          <Text style={styles.greetingSub}>Truy xuất nguồn gốc nông sản trên Blockchain</Text>
          <ServerStatus />
        </View>

        {/* ── MAIN QR SCAN CARD ────────────────────────────────────────── */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardContent}>
            <Text style={styles.mainCardTitle}>Xác thực nguồn gốc</Text>
            <Text style={styles.mainCardSub}>
              Quét mã QR trên bao bì để xem toàn bộ hành trình blockchain.
            </Text>
            <TouchableOpacity
              style={styles.scanBtnInside}
              onPress={() => navigation.navigate("Scanner")}
            >
              <MaterialCommunityIcons name="qrcode-scan" size={20} color="#064e3b" />
              <Text style={styles.scanBtnTextInside}>Quét mã QR ngay</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.circleDecor} />
          <View style={[styles.circleDecor, styles.circleDecor2]} />
        </View>

        {/* ── TEST QR SECTION ──────────────────────────────────────────── */}
        {/*
         * Bấm vào một nút bên dưới → navigate thẳng đến BatchDetail
         * với batchId được hardcode → gọi API thật → hiển thị data thật
         */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.testBadge}>
              <Text style={styles.testBadgeText}>TEST</Text>
            </View>
            <Text style={styles.sectionTitle}>Quét QR cứng — Dữ liệu Blockchain thật</Text>
          </View>
          <Text style={styles.sectionSub}>
            Bấm để mô phỏng quét QR và xem dữ liệu thật từ Polygon Amoy
          </Text>
        </View>

        <View style={styles.testGrid}>
          {TEST_BATCHES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.testCard}
              onPress={() =>
                navigation.navigate("BatchDetail", { batchId: item.id })
              }
              activeOpacity={0.75}
            >
              <View style={[styles.testIconBox, { backgroundColor: item.color + "15" }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.testCardInfo}>
                <Text style={styles.testCardLabel}>{item.label}</Text>
                <Text style={styles.testCardDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>

        {}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cách hoạt động</Text>
        </View>

        <View style={styles.stepsContainer}>
          {[
            { step: "1", icon: "qr-code-outline", text: "Quét QR trên bao bì sản phẩm" },
            { step: "2", icon: "wifi-outline", text: "App kết nối Backend → Blockchain" },
            { step: "3", icon: "leaf-outline", text: "Hiển thị toàn bộ hành trình nông sản" },
          ].map((s) => (
            <View key={s.step} style={styles.stepItem}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{s.step}</Text>
              </View>
              <Ionicons name={s.icon} size={20} color="#10b981" style={styles.stepIcon} />
              <Text style={styles.stepText}>{s.text}</Text>
            </View>
          ))}
        </View>

        {/* ── LỊCH SỬ LINK ── */}
        <TouchableOpacity
          style={styles.historyLink}
          onPress={() => navigation.navigate("ScanningHistory")}
        >
          <Ionicons name="time-outline" size={18} color="#10b981" />
          <Text style={styles.historyLinkText}>Xem lịch sử quét mã</Text>
          <Ionicons name="chevron-forward" size={16} color="#10b981" />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FLOATING SCAN BUTTON ── */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => navigation.navigate("Scanner")}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.fabText}>Quét QR</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  scrollContent: { padding: 24 },

  // ── Header ──
  header: { marginBottom: 24, marginTop: 8 },
  greetingTitle: { fontSize: 26, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  greetingSub: { fontSize: 13, color: "#64748b", marginBottom: 12 },

  // ── Server Status ──
  serverBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  serverBadgeOnline: { backgroundColor: "#ecfdf5" },
  serverBadgeOffline: { backgroundColor: "#fef2f2" },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  serverBadgeText: { fontSize: 12, fontWeight: "600", color: "#64748b" },

  // ── Main Card ──
  mainCard: {
    backgroundColor: "#064e3b",
    borderRadius: 20,
    padding: 24,
    position: "relative",
    overflow: "hidden",
    marginBottom: 32,
  },
  mainCardContent: { zIndex: 2 },
  mainCardTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 8 },
  mainCardSub: {
    color: "#d1fae5",
    fontSize: 13,
    marginBottom: 20,
    maxWidth: "85%",
    lineHeight: 20,
  },
  scanBtnInside: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    gap: 8,
  },
  scanBtnTextInside: { color: "#064e3b", fontWeight: "700", fontSize: 14 },
  circleDecor: {
    position: "absolute",
    bottom: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.07)",
    zIndex: 1,
  },
  circleDecor2: {
    bottom: -60,
    right: 60,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  // ── Section Header ──
  sectionHeader: { marginBottom: 14 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  sectionSub: { fontSize: 12, color: "#94a3b8" },
  testBadge: {
    backgroundColor: "#fef9c3",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  testBadgeText: { fontSize: 9, fontWeight: "800", color: "#854d0e" },

  // ── Test Grid ──
  testGrid: { gap: 10, marginBottom: 32 },
  testCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  testIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  testCardInfo: { flex: 1 },
  testCardLabel: { fontSize: 14, fontWeight: "700", color: "#1e293b", marginBottom: 2 },
  testCardDesc: { fontSize: 12, color: "#94a3b8" },

  // ── Steps ──
  stepsContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  stepItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#064e3b",
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  stepIcon: { marginRight: -2 },
  stepText: { flex: 1, fontSize: 13, color: "#475569", fontWeight: "500" },

  // ── History Link ──
  historyLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
  },
  historyLinkText: { fontSize: 14, color: "#10b981", fontWeight: "700" },

  // ── FAB ──
  fabContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  fabButton: {
    backgroundColor: "#064e3b",
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#064e3b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 8,
  },
  fabText: { color: "#064e3b", fontSize: 12, fontWeight: "700" },
});
