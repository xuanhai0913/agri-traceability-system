/**
 * Nguồn dữ liệu:
 *  • "Sản phẩm vừa quét"  → scanHistoryService (AsyncStorage, local)
 *  • Total batches         → GET /api/batches/total (Blockchain)
 *  • Server status         → GET /api/health
 *
 * "Recent scans" là user-specific history trên thiết bị, KHÔNG phải list
 * tất cả batches từ blockchain.
 */

import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { healthCheck, getTotalBatches } from "../services/api";
import { getRecentScans, formatScanTime } from "../services/scanHistoryService";

// ─── Server Status Dot ───
function ServerStatus() {
  const [status, setStatus] = useState("checking");

  useFocusEffect(
    useCallback(() => {
      setStatus("checking");
      healthCheck()
        .then(() => setStatus("online"))
        .catch(() => setStatus("offline"));
    }, [])
  );

  const configs = {
    checking: { color: "#94a3b8", label: "Đang kết nối...", bg: "#f1f5f9" },
    online: { color: "#10b981", label: "Blockchain đang hoạt động", bg: "#ecfdf5" },
    offline: { color: "#f59e0b", label: "Server đang khởi động (~30s)", bg: "#fefce8" },
  };
  const c = configs[status];

  return (
    <View style={[styles.serverBadge, { backgroundColor: c.bg }]}>
      {status === "checking" ? (
        <ActivityIndicator size={8} color={c.color} />
      ) : (
        <View style={[styles.statusDot, { backgroundColor: c.color }]} />
      )}
      <Text style={[styles.serverBadgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

// ─── Recent Scan Card ───
function RecentCard({ item, onPress }) {
  const isVerified = item.status === "verified";
  return (
    <TouchableOpacity
      style={styles.recentCard}
      onPress={onPress}
      disabled={!isVerified}
      activeOpacity={0.75}
    >
      <View style={[styles.recentIconBox, isVerified ? styles.recentIconOk : styles.recentIconFail]}>
        <Ionicons
          name={isVerified ? "leaf-outline" : "alert-circle-outline"}
          size={20}
          color={isVerified ? "#10b981" : "#ef4444"}
        />
      </View>
      <View style={styles.recentInfo}>
        <Text style={styles.recentName} numberOfLines={1}>{item.batchName}</Text>
        <Text style={styles.recentTime}>{formatScanTime(item.scannedAt)}</Text>
        {isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={10} color="#10b981" />
            <Text style={styles.verifiedText}>Blockchain Verified</Text>
          </View>
        )}
      </View>
      <View style={styles.recentBatchTag}>
        <Text style={styles.recentBatchTagText}>#{item.batchId}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Hardcoded test buttons — Blockchain batch IDs 1-5 ───
const TEST_BATCHES = [
  { id: "1", label: "Batch #1", icon: "leaf-outline", color: "#10b981" },
  { id: "2", label: "Batch #2", icon: "sunny-outline", color: "#f59e0b" },
  { id: "3", label: "Batch #3", icon: "basket-outline", color: "#8b5cf6" },
  { id: "4", label: "Batch #4", icon: "water-outline", color: "#06b6d4" },
  { id: "5", label: "Batch #5", icon: "cube-outline", color: "#3b82f6" },
];

// ─── Main Screen ───
export default function HomeScreen({ navigation }) {
  const [recentScans, setRecentScans] = useState([]);
  const [totalBatches, setTotalBatches] = useState(null);

  // Reload recent scans + total batches mỗi khi focus lại màn hình
  useFocusEffect(
    useCallback(() => {
      getRecentScans(5).then(setRecentScans);
      getTotalBatches()
        .then((res) => setTotalBatches(res.data?.data?.total ?? null))
        .catch(() => setTotalBatches(null));
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingTitle}>AgriTrace 🌾</Text>
            <Text style={styles.greetingSub}>Truy xuất nguồn gốc nông sản trên Blockchain</Text>
          </View>
          {totalBatches !== null && (
            <View style={styles.totalBadge}>
              <Text style={styles.totalNum}>{totalBatches}</Text>
              <Text style={styles.totalLabel}>lô hàng</Text>
            </View>
          )}
        </View>

        <ServerStatus />
        <View style={{ height: 20 }} />

        {/* ── Main QR Scan Card ── */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardContent}>
            <Text style={styles.mainCardTitle}>Xác thực nguồn gốc</Text>
            <Text style={styles.mainCardSub}>
              Quét mã QR trên bao bì để xem hành trình Blockchain đầy đủ.
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

        {/* ── Recent Scans — từ AsyncStorage (scan history thực) ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sản phẩm vừa quét</Text>
          <TouchableOpacity onPress={() => navigation.navigate("ScanningHistory")}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {recentScans.length === 0 ? (
          <View style={styles.emptyRecent}>
            <Ionicons name="qr-code-outline" size={28} color="#cbd5e1" />
            <Text style={styles.emptyRecentText}>Chưa có lần quét nào</Text>
          </View>
        ) : (
          <View style={styles.recentList}>
            {recentScans.map((item) => (
              <RecentCard
                key={item.id}
                item={item}
                onPress={() =>
                  item.status === "verified" &&
                  navigation.navigate("BatchDetail", { batchId: item.batchId })
                }
              />
            ))}
          </View>
        )}

        {/* ── Hardcoded Test — 5 Batch IDs thật trên Polygon Amoy ── */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.testBadge}>
              <Text style={styles.testBadgeText}>TEST</Text>
            </View>
            <Text style={styles.sectionTitle}>Quét QR cứng — Blockchain thật</Text>
          </View>
          <Text style={styles.testSubtext}>
            Có {totalBatches ?? "5"} lô hàng trên Polygon Amoy Testnet
          </Text>
        </View>

        <View style={styles.testGrid}>
          {TEST_BATCHES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.testCard}
              onPress={() => navigation.navigate("BatchDetail", { batchId: item.id })}
              activeOpacity={0.75}
            >
              <View style={[styles.testIconBox, { backgroundColor: item.color + "18" }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.testCardLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={15} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FAB ── */}
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

// ─── Styles ───
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  scrollContent: { padding: 22 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    marginTop: 8,
  },
  greetingTitle: { fontSize: 24, fontWeight: "800", color: "#0f172a", marginBottom: 2 },
  greetingSub: { fontSize: 12, color: "#64748b", maxWidth: 220 },
  totalBadge: {
    backgroundColor: "#064e3b",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
  },
  totalNum: { color: "#fff", fontSize: 20, fontWeight: "800" },
  totalLabel: { color: "#d1fae5", fontSize: 10, fontWeight: "600" },

  // Server badge
  serverBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  serverBadgeText: { fontSize: 12, fontWeight: "600" },

  // Main Card
  mainCard: {
    backgroundColor: "#064e3b",
    borderRadius: 20,
    padding: 22,
    position: "relative",
    overflow: "hidden",
    marginBottom: 28,
  },
  mainCardContent: { zIndex: 2 },
  mainCardTitle: { color: "#fff", fontSize: 19, fontWeight: "800", marginBottom: 8 },
  mainCardSub: {
    color: "#d1fae5",
    fontSize: 13,
    marginBottom: 18,
    maxWidth: "85%",
    lineHeight: 20,
  },
  scanBtnInside: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  scanBtnTextInside: { color: "#064e3b", fontWeight: "700", fontSize: 13 },
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
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  // Section
  sectionHeader: { marginBottom: 12 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  seeAllText: { fontSize: 13, color: "#10b981", fontWeight: "600" },
  testSubtext: { fontSize: 11, color: "#94a3b8" },
  testBadge: {
    backgroundColor: "#fef9c3",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  testBadgeText: { fontSize: 9, fontWeight: "800", color: "#854d0e" },

  // Recent scans
  emptyRecent: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderStyle: "dashed",
    marginBottom: 4,
  },
  emptyRecentText: { fontSize: 13, color: "#94a3b8" },
  recentList: { gap: 8 },

  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  recentIconBox: {
    width: 42,
    height: 42,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  recentIconOk: { backgroundColor: "#ecfdf5" },
  recentIconFail: { backgroundColor: "#fef2f2" },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 13, fontWeight: "700", color: "#1e293b", marginBottom: 2 },
  recentTime: { fontSize: 11, color: "#94a3b8", marginBottom: 4 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    alignSelf: "flex-start",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  verifiedText: { color: "#10b981", fontSize: 9, fontWeight: "600" },
  recentBatchTag: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recentBatchTagText: { fontSize: 10, color: "#64748b", fontWeight: "700" },

  // Test grid
  testGrid: { gap: 8 },
  testCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  testIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  testCardLabel: { flex: 1, fontSize: 14, fontWeight: "700", color: "#1e293b" },

  // FAB
  fabContainer: { position: "absolute", bottom: 20, left: 0, right: 0, alignItems: "center" },
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
    marginBottom: 6,
  },
  fabText: { color: "#064e3b", fontSize: 12, fontWeight: "700" },
});
