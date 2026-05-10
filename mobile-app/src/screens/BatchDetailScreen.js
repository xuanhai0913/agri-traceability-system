/**
 * Tối ưu render:
 *  • Nhận `prefetchedBatch` từ ScannerScreen qua route.params
 *    → Hiện ngay header (tên, xuất xứ, stage) KHÔNG cần đợi API
 *  • Chỉ fetch getStageHistory (timeline) sau khi mount
 *    → Skeleton chỉ xuất hiện ở phần timeline, không che header
 *  • Nếu vào trực tiếp từ HomeScreen (không có prefetchedBatch)
 *    → Fetch song song cả 2 API như cũ
 *  • Nút Retry gọi invalidateBatchCache để xóa cache cũ
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  getBatch,
  getStageHistory,
  getStageInfo,
  formatTimestamp,
  getTxExplorerUrl,
  invalidateBatchCache,
} from "../services/api";

// ─── STAGE ICON ───
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

// ─── SKELETON (chỉ dùng cho timeline) ───
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
      style={[{ width, height, borderRadius, backgroundColor: "#e2e8f0", opacity }, style]}
    />
  );
}

// Skeleton chỉ cho phần timeline (header đã hiện rồi)
function TimelineSkeleton() {
  return (
    <View style={{ gap: 0 }}>
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

// Skeleton toàn màn hình (dùng khi không có prefetchedBatch)
function FullSkeleton() {
  return (
    <View style={{ gap: 0 }}>
      <View style={{ marginBottom: 20 }}>
        <Skeleton width={180} height={28} borderRadius={6} />
        <Skeleton width={100} height={20} borderRadius={6} style={{ marginTop: 8 }} />
        <Skeleton width={140} height={16} borderRadius={6} style={{ marginTop: 6 }} />
      </View>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 28 }}>
        <Skeleton width={120} height={30} borderRadius={20} />
        <Skeleton width={140} height={30} borderRadius={20} />
      </View>
      <TimelineSkeleton />
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

// ─── TIMELINE ITEM ───
function TimelineItem({ item, isLast }) {
  const info = getStageInfo(item.stage);
  return (
    <View style={styles.timelineItem}>
      <View style={styles.leftCol}>
        <StageIcon stageInfo={info} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      <View style={[styles.rightCol, isLast && styles.rightColLast]}>
        <Text style={styles.stageTitle}>{info.label}</Text>
        <Text style={styles.timeText}>{formatTimestamp(item.timestamp)}</Text>
        {!!item.description && (
          <Text style={styles.descText}>{item.description}</Text>
        )}
        {!!item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.stageImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.metaBox}>
          {!!item.updatedBy && (
            <View style={styles.metaRow}>
              <Ionicons name="wallet-outline" size={13} color="#64748b" />
              <Text style={styles.metaText} numberOfLines={1}>
                {`${item.updatedBy.slice(0, 8)}...${item.updatedBy.slice(-6)}`}
              </Text>
            </View>
          )}
          {!!item.transaction?.blockNumber && (
            <View style={styles.metaRow}>
              <Ionicons name="cube-outline" size={13} color="#64748b" />
              <Text style={styles.metaText}>
                Block #{item.transaction.blockNumber.toLocaleString()}
              </Text>
            </View>
          )}
          <BlockchainBadge txHash={item.transaction?.transactionHash} />
        </View>
      </View>
    </View>
  );
}

// ─── BATCH HEADER (hiện ngay khi có data) ───
function BatchHeader({ batch }) {
  const currentStageInfo = batch?.currentStage ? getStageInfo(batch.currentStage) : null;
  return (
    <View style={styles.batchHeader}>
      <Text style={styles.batchName}>{batch?.name || `Lô hàng #${batch?.id}`}</Text>
      {!!batch?.origin && (
        <View style={styles.originRow}>
          <Ionicons name="location-outline" size={14} color="#64748b" />
          <Text style={styles.originText}>{batch.origin}</Text>
        </View>
      )}
      <View style={styles.badgeRow}>
        <View style={styles.badgeId}>
          <Text style={styles.badgeIdText}>#{batch?.id}</Text>
        </View>
        {currentStageInfo && (
          <View style={[styles.badgeStage, { backgroundColor: currentStageInfo.color + "18" }]}>
            <View style={[styles.stageDot, { backgroundColor: currentStageInfo.color }]} />
            <Text style={[styles.badgeStageText, { color: currentStageInfo.color }]}>
              {currentStageInfo.label}
            </Text>
          </View>
        )}
        {batch?.currentStageIndex !== undefined &&
          batch?.totalStages !== undefined &&
          batch.currentStageIndex + 1 >= batch.totalStages && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={13} color="#10b981" />
              <Text style={styles.completedText}>Hoàn thành</Text>
            </View>
          )}
      </View>
      {!!batch?.owner && (
        <View style={styles.ownerStrip}>
          <Ionicons name="wallet-outline" size={13} color="#166534" />
          <Text style={styles.ownerText} numberOfLines={1}>
            {batch.owner}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── MAIN SCREEN ───
export default function BatchDetailScreen({ route, navigation }) {
  const { batchId, prefetchedBatch } = route.params || {};

  // batch: hiện ngay nếu có prefetchedBatch
  const [batch, setBatch] = useState(prefetchedBatch || null);
  const [stages, setStages] = useState([]);

  // Trạng thái loading tách biệt
  const [batchLoading, setBatchLoading] = useState(!prefetchedBatch);
  const [stagesLoading, setStagesLoading] = useState(true);

  // Lỗi: nếu batch fail → hiện full error; nếu chỉ stages fail → vẫn hiện header
  const [batchError, setBatchError] = useState(null);
  const [stagesError, setStagesError] = useState(null);

  const fetchAll = useCallback(
    async (forceRefresh = false) => {
      if (!batchId) {
        setBatchError("Không có mã lô hàng để tra cứu.");
        setBatchLoading(false);
        setStagesLoading(false);
        return;
      }

      if (forceRefresh) {
        invalidateBatchCache(batchId);
        setBatch(null);
        setStages([]);
        setBatchLoading(true);
        setStagesLoading(true);
        setBatchError(null);
        setStagesError(null);
      }

      // Nếu đã có prefetchedBatch (và không forceRefresh), chỉ fetch history
      if (!forceRefresh && prefetchedBatch) {
        try {
          const historyRes = await getStageHistory(batchId);
          setStages(historyRes.data?.data?.stages ?? []);
        } catch (err) {
          setStagesError(err.friendlyMessage || "Không thể tải hành trình lô hàng.");
        } finally {
          setStagesLoading(false);
        }
        return;
      }

      // Fetch batch + history song song
      const batchPromise = getBatch(batchId)
        .then((res) => {
          setBatch(res.data?.data);
          setBatchLoading(false);
        })
        .catch((err) => {
          setBatchError(err.friendlyMessage || "Không thể tải thông tin lô hàng.");
          setBatchLoading(false);
        });

      const historyPromise = getStageHistory(batchId)
        .then((res) => {
          setStages(res.data?.data?.stages ?? []);
          setStagesLoading(false);
        })
        .catch((err) => {
          setStagesError(err.friendlyMessage || "Không thể tải hành trình lô hàng.");
          setStagesLoading(false);
        });

      await Promise.all([batchPromise, historyPromise]);
    },
    [batchId, prefetchedBatch]
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Lỗi nghiêm trọng: không có batch data ──
  if (batchError && !batch) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.customHeader}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.customHeaderTitle}>Chi tiết lô hàng</Text>
          <View style={{ width: 40 }} />
        </View>
        <ErrorState message={batchError} onRetry={() => fetchAll(true)} />
      </SafeAreaView>
    );
  }

  // ── Đang tải batch (chưa có prefetched data) ──
  if (batchLoading && !batch) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.customHeader}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.customHeaderTitle}>Đang tải...</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.loadingInfo}>
            <ActivityIndicator size="small" color="#10b981" />
            <Text style={styles.loadingText}>Đang đọc dữ liệu Blockchain...</Text>
          </View>
          <FullSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Render chính: header luôn hiện, timeline có thể đang tải ──
  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.customHeaderTitle} numberOfLines={1}>
          {batch?.name || `Lô hàng #${batchId}`}
        </Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => fetchAll(true)}>
          <Ionicons name="refresh-outline" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── BATCH HEADER — hiện ngay ── */}
        <BatchHeader batch={batch} />

        <View style={styles.divider} />

        {/* ── TIMELINE HEADER ── */}
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineTitle}>
            {stagesLoading ? "Hành trình lô hàng" : `Hành trình ${stages.length} giai đoạn`}
          </Text>
          <View style={styles.verifiedChip}>
            <Ionicons name="cube-outline" size={11} color="#7c3aed" />
            <Text style={styles.verifiedChipText}>Polygon Amoy</Text>
          </View>
        </View>

        {/* ── TIMELINE: skeleton khi đang tải, lỗi nhẹ, hoặc list ── */}
        {stagesLoading ? (
          <View>
            <View style={styles.loadingInfo}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={styles.loadingText}>Đang tải hành trình...</Text>
            </View>
            <TimelineSkeleton />
          </View>
        ) : stagesError ? (
          <View style={styles.stagesErrorBox}>
            <Ionicons name="warning-outline" size={20} color="#f59e0b" />
            <Text style={styles.stagesErrorText}>{stagesError}</Text>
            <TouchableOpacity onPress={() => fetchAll(true)}>
              <Text style={styles.stagesRetryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : stages.length === 0 ? (
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
        {!stagesLoading && !stagesError && (
          <View style={styles.footer}>
            <Ionicons name="information-circle-outline" size={14} color="#94a3b8" />
            <Text style={styles.footerText}>
              Dữ liệu được lưu bất biến trên Blockchain. Không thể giả mạo hoặc chỉnh sửa.
            </Text>
          </View>
        )}

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
  customHeaderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
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
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // ── Loading banner ──
  loadingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  loadingText: { fontSize: 13, color: "#064e3b", fontWeight: "500" },

  // ── Error (full) ──
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    marginTop: 40,
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

  // ── Stages error (inline, non-blocking) ──
  stagesErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fefce8",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  stagesErrorText: { flex: 1, fontSize: 13, color: "#92400e" },
  stagesRetryText: { fontSize: 13, color: "#10b981", fontWeight: "700" },

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

  // ── Stage Card ──
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

  // ── Empty Stage ──
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
