import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getBatch,
  getStageHistory,
  getStageInfo,
  formatTimestamp,
  getTxExplorerUrl,
} from "../services/api";

// ─── STAGE ICON COMPONENT ───
function StageIcon({ stageInfo, size = 36 }) {
  return (
    <View
      style={[
        styles.stageIconCircle,
        { backgroundColor: stageInfo.color, width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Ionicons name={stageInfo.icon} size={size * 0.55} color="#fff" />
    </View>
  );
}

// ─── LOADING SKELETON ────
function Skeleton({ width, height, borderRadius = 8, style }) {
  const opacity = React.useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: "#e2e8f0", opacity },
        style,
      ]}
    />
  );
}

function LoadingSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      {/* Header skeleton */}
      <View style={styles.skeletonHeader}>
        <Skeleton width={180} height={28} borderRadius={6} />
        <Skeleton width={100} height={20} borderRadius={6} style={{ marginTop: 8 }} />
        <Skeleton width={140} height={16} borderRadius={6} style={{ marginTop: 6 }} />
      </View>

      {/* Badge row skeleton */}
      <View style={styles.skeletonBadgeRow}>
        <Skeleton width={120} height={30} borderRadius={20} />
        <Skeleton width={140} height={30} borderRadius={20} />
      </View>

      {/* Timeline items skeleton */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.timelineItem}>
          <View style={styles.leftCol}>
            <Skeleton width={36} height={36} borderRadius={18} />
            {i < 3 && <Skeleton width={2} height={100} borderRadius={1} style={{ marginTop: 4 }} />}
          </View>
          <View style={[styles.rightCol, { paddingBottom: 32 }]}>
            <Skeleton width={160} height={20} borderRadius={6} />
            <Skeleton width={110} height={14} borderRadius={6} style={{ marginTop: 8 }} />
            <Skeleton width="100%" height={130} borderRadius={12} style={{ marginTop: 12 }} />
            <Skeleton width="100%" height={50} borderRadius={8} style={{ marginTop: 10 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── ERROR STATE ───
function ErrorState({ message, onRetry }) {
  return (
    <View style={styles.errorContainer}>
      <View style={styles.errorIconBox}>
        <Ionicons name="cloud-offline-outline" size={48} color="#ef4444" />
      </View>
      <Text style={styles.errorTitle}>Không thể tải dữ liệu</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Ionicons name="refresh-outline" size={18} color="#fff" />
        <Text style={styles.retryText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── BLOCKCHAIN TX BADGE ───
function BlockchainBadge({ txHash }) {
  if (!txHash) return null;
  const explorerUrl = getTxExplorerUrl(txHash);
  const shortHash = `${txHash.slice(0, 6)}...${txHash.slice(-4)}`;

  return (
    <TouchableOpacity
      style={styles.txBadge}
      onPress={() => explorerUrl && Linking.openURL(explorerUrl)}
      activeOpacity={0.7}
    >
      <View style={styles.txBadgeLeft}>
        <Ionicons name="link-outline" size={13} color="#7c3aed" />
        <Text style={styles.txLabel}>On-chain</Text>
      </View>
      <Text style={styles.txHash}>{shortHash}</Text>
    </TouchableOpacity>
  );
}

// ─── TIMELINE STAGE ITEM ────
function TimelineItem({ item, isLast }) {
  const info = getStageInfo(item.stage);

  return (
    <View style={styles.timelineItem}>
      {/* Left: Icon + vertical line */}
      <View style={styles.leftCol}>
        <StageIcon stageInfo={info} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      {/* Right: Content card */}
      <View style={[styles.rightCol, isLast && styles.rightColLast]}>
        {/* Stage title + time */}
        <Text style={styles.stageTitle}>{info.label}</Text>
        <Text style={styles.timeText}>{formatTimestamp(item.timestamp)}</Text>

        {/* Description */}
        {!!item.description && (
          <Text style={styles.descText}>{item.description}</Text>
        )}

        {/* Cloudinary image — React Native native HTTP, KHÔNG bị CORS */}
        {!!item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.stageImage}
            resizeMode="cover"
          />
        )}

        {/* Metadata box: wallet address + blockchain tx */}
        <View style={styles.metaBox}>
          {/* Người cập nhật (wallet address) */}
          {!!item.updatedBy && (
            <View style={styles.metaRow}>
              <Ionicons name="wallet-outline" size={13} color="#64748b" />
              <Text style={styles.metaText} numberOfLines={1}>
                {`${item.updatedBy.slice(0, 8)}...${item.updatedBy.slice(-6)}`}
              </Text>
            </View>
          )}

          {/* Block number */}
          {!!item.transaction?.blockNumber && (
            <View style={styles.metaRow}>
              <Ionicons name="cube-outline" size={13} color="#64748b" />
              <Text style={styles.metaText}>
                Block #{item.transaction.blockNumber.toLocaleString()}
              </Text>
            </View>
          )}

          {/* Blockchain verified badge */}
          <BlockchainBadge txHash={item.transaction?.transactionHash} />
        </View>
      </View>
    </View>
  );
}

// ─── MAIN SCREEN ────
export default function BatchDetailScreen({ route, navigation }) {
  const { batchId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [batch, setBatch] = useState(null);   // GET /api/batches/:id
  const [stages, setStages] = useState([]);   // GET /api/batches/:id/history → .stages[]

  // ── Fetch cả 2 API song song bằng Promise.all ──
  const fetchData = useCallback(async () => {
    if (!batchId) {
      setError("Không có mã lô hàng để tra cứu.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [batchRes, historyRes] = await Promise.all([
        getBatch(batchId),
        getStageHistory(batchId),
      ]);

      // Endpoint 1: thông tin batch
      const batchData = batchRes.data?.data;
      setBatch(batchData);

      // Endpoint 2: mảng stages cho timeline
      // stages[] đã theo thứ tự từ Seeding → Completed (chronological)
      const stagesData = historyRes.data?.data?.stages ?? [];
      setStages(stagesData);
    } catch (err) {
      setError(err.friendlyMessage || "Đã xảy ra lỗi không xác định.");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── RENDER: Loading ──
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Custom back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.loadingInfo}>
            <ActivityIndicator size="small" color="#10b981" />
            <Text style={styles.loadingText}>Đang đọc dữ liệu Blockchain...</Text>
          </View>
          <LoadingSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── RENDER: Error ──
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <ErrorState message={error} onRetry={fetchData} />
      </SafeAreaView>
    );
  }

  // ── RENDER: Data ──
  const currentStageInfo = batch?.currentStage ? getStageInfo(batch.currentStage) : null;
  const isCompleted = batch?.currentStage === "Completed";

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.customHeaderTitle}>Hành trình lô hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── BATCH INFO HEADER ── */}
        <View style={styles.batchHeader}>
          {/* Batch name */}
          <Text style={styles.batchName}>{batch?.name || "—"}</Text>

          {/* Origin */}
          {!!batch?.origin && (
            <View style={styles.originRow}>
              <Ionicons name="location-outline" size={15} color="#64748b" />
              <Text style={styles.originText}>{batch.origin}</Text>
            </View>
          )}

          {/* Badge row: Batch ID + Current Stage + isActive */}
          <View style={styles.badgeRow}>
            <View style={styles.badgeId}>
              <Text style={styles.badgeIdText}>#{batchId}</Text>
            </View>

            {currentStageInfo && (
              <View style={[styles.badgeStage, { backgroundColor: currentStageInfo.color + "20" }]}>
                <View style={[styles.stageDot, { backgroundColor: currentStageInfo.color }]} />
                <Text style={[styles.badgeStageText, { color: currentStageInfo.color }]}>
                  {currentStageInfo.label}
                </Text>
              </View>
            )}

            {isCompleted && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                <Text style={styles.completedText}>Hoàn thành</Text>
              </View>
            )}
          </View>

          {/* Blockchain info strip */}
          {batch?.owner && (
            <View style={styles.ownerStrip}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#10b981" />
              <Text style={styles.ownerText} numberOfLines={1}>
                {`Xác thực bởi: ${batch.owner.slice(0, 8)}...${batch.owner.slice(-6)}`}
              </Text>
            </View>
          )}
        </View>

        {/* ── DIVIDER ── */}
        <View style={styles.divider} />

        {/* ── TIMELINE HEADER ── */}
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineTitle}>Hành trình {stages.length} giai đoạn</Text>
          <View style={styles.verifiedChip}>
            <Ionicons name="cube-outline" size={11} color="#7c3aed" />
            <Text style={styles.verifiedChipText}>Polygon Amoy</Text>
          </View>
        </View>

        {/* ── TIMELINE LIST ─── */}
        {stages.length === 0 ? (
          <View style={styles.emptyStage}>
            <Ionicons name="hourglass-outline" size={32} color="#cbd5e1" />
            <Text style={styles.emptyText}>Chưa có giai đoạn nào được ghi nhận</Text>
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            {stages.map((item, index) => (
              <TimelineItem
                key={`${item.stageIndex}-${index}`}
                item={item}
                isLast={index === stages.length - 1}
              />
            ))}
          </View>
        )}

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <Ionicons name="information-circle-outline" size={14} color="#94a3b8" />
          <Text style={styles.footerText}>
            Dữ liệu được lưu bất biến trên Blockchain. Không thể giả mạo hoặc chỉnh sửa.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { padding: 20 },

  // ── Custom Header ──
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#f8fafc",
  },
  customHeaderTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b" },

  // ── Back Button ──
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // ── Loading ──
  loadingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 24,
  },
  loadingText: { fontSize: 13, color: "#064e3b", fontWeight: "500" },

  // ── Skeleton ──
  skeletonContainer: { gap: 0 },
  skeletonHeader: { marginBottom: 20 },
  skeletonBadgeRow: { flexDirection: "row", gap: 10, marginBottom: 28 },

  // ── Error ──
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    marginTop: 60,
  },
  errorIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  errorTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 8 },
  errorMessage: { fontSize: 14, color: "#64748b", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // ── Batch Header ──
  batchHeader: { marginBottom: 20 },
  batchName: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 8, lineHeight: 30 },
  originRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 },
  originText: { fontSize: 13, color: "#64748b" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  badgeId: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeIdText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  badgeStage: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  stageDot: { width: 7, height: 7, borderRadius: 4 },
  badgeStageText: { fontSize: 12, fontWeight: "700" },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  completedText: { color: "#10b981", fontSize: 11, fontWeight: "700" },
  ownerStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  ownerText: { flex: 1, fontSize: 12, color: "#166534", fontFamily: "monospace" },

  // ── Divider ──
  divider: { height: 1, backgroundColor: "#e2e8f0", marginBottom: 20 },

  // ── Timeline Header ──
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  timelineTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  verifiedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ede9fe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  verifiedChipText: { fontSize: 10, fontWeight: "700", color: "#7c3aed" },

  // ── Timeline ──
  timelineContainer: { marginTop: 0 },
  timelineItem: { flexDirection: "row" },
  leftCol: { alignItems: "center", width: 40, marginRight: 14 },
  stageIconCircle: { justifyContent: "center", alignItems: "center", zIndex: 2 },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#e2e8f0",
    marginTop: -2,
    marginBottom: -2,
    zIndex: 1,
  },
  rightCol: { flex: 1, paddingBottom: 28 },
  rightColLast: { paddingBottom: 0 },

  // ── Stage Card Content ──
  stageTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b", marginBottom: 3, marginTop: 4 },
  timeText: { fontSize: 12, color: "#94a3b8", marginBottom: 8, fontWeight: "500" },
  descText: { fontSize: 13, color: "#475569", lineHeight: 20, marginBottom: 12 },
  stageImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
    marginBottom: 10,
  },

  // ── Meta Box ──
  metaBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 10,
    borderRadius: 10,
    gap: 6,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12, color: "#475569", flex: 1, fontFamily: "monospace" },

  // ── Blockchain TX Badge ──
  txBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ede9fe",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 2,
  },
  txBadgeLeft: { flexDirection: "row", alignItems: "center", gap: 4 },
  txLabel: { fontSize: 11, fontWeight: "700", color: "#7c3aed" },
  txHash: { fontSize: 11, color: "#7c3aed", fontFamily: "monospace" },

  // ── Empty State ──
  emptyStage: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 14, color: "#94a3b8", textAlign: "center" },

  // ── Footer ──
  footer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 24,
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 10,
  },
  footerText: { flex: 1, fontSize: 11, color: "#94a3b8", lineHeight: 16 },
});
