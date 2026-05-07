/**
 * Hiển thị lịch sử quét QR từ AsyncStorage (local, per-device).
 *
 * Tính năng:
 *  • Load từ AsyncStorage khi mount (+ useFocusEffect để refresh khi navigate về)
 *  • Search real-time theo tên sản phẩm / batchId / origin
 *  • SectionList nhóm theo tháng (tháng mới nhất trước)
 *  • Xóa toàn bộ lịch sử
 *  • Navigate → BatchDetail khi tap record "verified"
 */

import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SectionList,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import {
  searchScanHistory,
  getScanHistorySections,
  formatScanTime,
  clearScanHistory,
} from "../services/scanHistoryService";

// ─── Card item ───
function HistoryCard({ item, onPress }) {
  const isVerified = item.status === "verified";

  return (
    <TouchableOpacity
      style={styles.historyCard}
      onPress={onPress}
      activeOpacity={isVerified ? 0.75 : 1}
      disabled={!isVerified}
    >
      {/* Icon box */}
      <View style={[styles.iconBox, isVerified ? styles.iconBoxOk : styles.iconBoxFail]}>
        <Ionicons
          name={isVerified ? "leaf-outline" : "alert-circle-outline"}
          size={22}
          color={isVerified ? "#10b981" : "#ef4444"}
        />
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.batchName}
        </Text>
        {!!item.origin && (
          <View style={styles.originRow}>
            <Ionicons name="location-outline" size={11} color="#94a3b8" />
            <Text style={styles.originText} numberOfLines={1}>{item.origin}</Text>
          </View>
        )}
        <Text style={styles.scanTime}>{formatScanTime(item.scannedAt)}</Text>

        {isVerified ? (
          <View style={[styles.statusBadge, styles.badgeVerified]}>
            <Ionicons name="checkmark-circle" size={11} color="#10b981" />
            <Text style={styles.verifiedText}>Blockchain Verified</Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, styles.badgeFailed]}>
            <Ionicons name="alert-circle" size={11} color="#ef4444" />
            <Text style={styles.failedText}>Không xác thực được</Text>
          </View>
        )}
      </View>

      {/* Batch ID tag + chevron */}
      <View style={styles.rightMeta}>
        <View style={styles.batchIdTag}>
          <Text style={styles.batchIdTagText}>#{item.batchId}</Text>
        </View>
        {isVerified && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color="#cbd5e1"
            style={{ marginTop: 8 }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty state ───
function EmptyState({ hasQuery }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconBox}>
        <Ionicons
          name={hasQuery ? "search-outline" : "time-outline"}
          size={40}
          color="#94a3b8"
        />
      </View>
      <Text style={styles.emptyTitle}>
        {hasQuery ? "Không tìm thấy kết quả" : "Chưa có lịch sử quét"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {hasQuery
          ? "Thử từ khóa khác hoặc xóa bộ lọc"
          : "Quét mã QR trên bao bì để bắt đầu"}
      </Text>
    </View>
  );
}

// ─── Main Screen ────
export default function ScanningHistoryScreen({ navigation }) {
  const [sections, setSections] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // useFocusEffect: tải lại mỗi khi màn hình được focus (bao gồm lần đầu mount và sau khi navigate từ BatchDetail về)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        setLoading(true);
        const data = searchQuery
          ? await searchScanHistory(searchQuery)
          : await getScanHistorySections();
        if (active) {
          setSections(data);
          setLoading(false);
        }
      };
      load();
      return () => { active = false; };
    }, [searchQuery])
  );

  const handleClearHistory = () => {
    Alert.alert(
      "Xóa toàn bộ lịch sử",
      "Bạn có chắc muốn xóa toàn bộ lịch sử quét mã? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            await clearScanHistory();
            setSections([]);
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <HistoryCard
      item={item}
      onPress={() =>
        item.status === "verified" &&
        navigation.navigate("BatchDetail", { batchId: item.batchId })
      }
    />
  );

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử quét mã</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={handleClearHistory}
          disabled={sections.length === 0}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color={sections.length === 0 ? "#cbd5e1" : "#ef4444"}
          />
        </TouchableOpacity>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên sản phẩm, mã lô, xuất xứ..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#10b981" />
          <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListEmptyComponent={<EmptyState hasQuery={searchQuery.length > 0} />}
          contentContainerStyle={[
            styles.listContent,
            sections.length === 0 && { flex: 1 },
          ]}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1e293b" },

  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    paddingHorizontal: 14,
    borderRadius: 12,
    height: 46,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#1e293b" },

  // Loading
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { color: "#64748b", fontSize: 14 },

  // List
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // Section Header
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  sectionLine: { flex: 1, height: 1, backgroundColor: "#e2e8f0" },

  // History Card
  historyCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#f8fafc",
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconBoxOk: { backgroundColor: "#ecfdf5" },
  iconBoxFail: { backgroundColor: "#fef2f2" },

  cardContent: { flex: 1 },
  productName: { fontSize: 14, fontWeight: "700", color: "#1e293b", marginBottom: 2 },
  originRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 3 },
  originText: { fontSize: 11, color: "#94a3b8", flex: 1 },
  scanTime: { fontSize: 11, color: "#94a3b8", marginBottom: 6 },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  badgeVerified: { backgroundColor: "#ecfdf5" },
  badgeFailed: { backgroundColor: "#fef2f2" },
  verifiedText: { color: "#10b981", fontSize: 10, fontWeight: "600" },
  failedText: { color: "#ef4444", fontSize: 10, fontWeight: "600" },

  rightMeta: { alignItems: "center", marginLeft: 8 },
  batchIdTag: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  batchIdTagText: { fontSize: 10, color: "#64748b", fontWeight: "700" },

  // Empty state
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#475569" },
  emptySubtitle: { fontSize: 13, color: "#94a3b8", textAlign: "center" },
});
