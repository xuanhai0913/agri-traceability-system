/**
 * BatchDetailScreen.js — Chi tiết lô hàng
 *  • useFocusEffect → luôn refetch khi navigate lại màn hình
 *  • RefreshControl → kéo xuống để làm mới
 *  • Nút Share → share link web + thông tin lô hàng qua Share API native
 *  • Nút "Xem trên Web" → mở trang web chi tiết lô hàng
 *  • BatchHeader hiển thị đầy đủ mọi trường API
 *  • Stage progress bar (X/Y giai đoạn)
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  RefreshControl,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import {
  getBatch,
  getStageHistory,
  getStageInfo,
  formatTimestamp,
  getTxExplorerUrl,
  getBatchWebUrl,
  invalidateBatchCache,
} from "../services/api";

// ─── SKELETON ───
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

// ─── VERIFIED BADGE ───
function VerifiedBadge({ txHash }) {
  if (!txHash) return null;
  const explorerUrl = getTxExplorerUrl(txHash);
  return (
    <TouchableOpacity
      style={styles.verifiedBadgeBtn}
      onPress={() => explorerUrl && Linking.openURL(explorerUrl)}
      activeOpacity={0.7}
    >
      <Ionicons name="shield-checkmark-outline" size={13} color="#059669" />
      <Text style={styles.verifiedBadgeText}>Đã xác thực</Text>
      {explorerUrl && <Ionicons name="open-outline" size={11} color="#059669" />}
    </TouchableOpacity>
  );
}

// ─── CERTIFICATION BADGE ───
function CertBadge({ label }) {
  return (
    <View style={styles.certBadge}>
      <Ionicons name="ribbon-outline" size={11} color="#059669" />
      <Text style={styles.certText}>{label}</Text>
    </View>
  );
}

// ─── INFO ROW ───
function InfoRow({ icon, label, value, onPress }) {
  if (!value) return null;
  return (
    <TouchableOpacity
      style={styles.infoRow}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Ionicons name={icon} size={14} color="#64748b" style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
      {onPress && <Ionicons name="open-outline" size={13} color="#94a3b8" />}
    </TouchableOpacity>
  );
}

// ─── EXTENDED BATCH HEADER ───
function BatchHeader({ batch }) {
  const currentStageInfo = batch?.currentStage ? getStageInfo(batch.currentStage) : null;

  const hasFarmerInfo =
    batch?.farmerName || batch?.farmerContact || batch?.farmerAddress;

  const hasCerts = Array.isArray(batch?.certifications) && batch.certifications.length > 0;

  return (
    <View style={styles.batchHeader}>
      {/* ── Tên + xuất xứ ── */}
      <Text style={styles.batchName}>{batch?.name || `Lô hàng #${batch?.id}`}</Text>

      {!!batch?.origin && (
        <View style={styles.originRow}>
          <Ionicons name="location-outline" size={14} color="#64748b" />
          <Text style={styles.originText}>{batch.origin}</Text>
        </View>
      )}

      {/* ── Badges: chỉ giữ ID + stage hiện tại + productType ── */}
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
        {!!batch?.productType && (
          <View style={styles.productTypeBadge}>
            <Text style={styles.productTypeText}>{batch.productType}</Text>
          </View>
        )}
      </View>

      {/* ── Mô tả lô hàng ── */}
      {!!batch?.description && (
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionLabel}>Mô tả sản phẩm</Text>
          <Text style={styles.descriptionText}>{batch.description}</Text>
        </View>
      )}

      {/* ── Số lượng ── */}
      {!!batch?.quantity && (
        <View style={styles.quantityRow}>
          <Ionicons name="scale-outline" size={14} color="#64748b" />
          <Text style={styles.quantityText}>
            Số lượng:{" "}
            <Text style={styles.quantityValue}>
              {batch.quantity}{batch.unit ? ` ${batch.unit}` : ""}
            </Text>
          </Text>
        </View>
      )}

      {/* ── Certifications ── */}
      {hasCerts && (
        <View style={styles.certSection}>
          <Text style={styles.certSectionTitle}>Chứng nhận</Text>
          <View style={styles.certRow}>
            {batch.certifications.map((c, i) => (
              <CertBadge key={i} label={c} />
            ))}
          </View>
        </View>
      )}

      {/* ── Nhà sản xuất / Nông dân ── */}
      {hasFarmerInfo && (
        <View style={styles.farmerCard}>
          <View style={styles.farmerCardHeader}>
            <Ionicons name="person-circle-outline" size={16} color="#166534" />
            <Text style={styles.farmerCardTitle}>Nhà sản xuất</Text>
          </View>
          {!!batch.farmerName && (
            <InfoRow icon="person-outline" label="Tên" value={batch.farmerName} />
          )}
          {!!batch.farmerContact && (
            <InfoRow
              icon="call-outline"
              label="Liên hệ"
              value={batch.farmerContact}
              onPress={() => Linking.openURL(`tel:${batch.farmerContact}`)}
            />
          )}
          {!!batch.farmerAddress && (
            <InfoRow icon="home-outline" label="Địa chỉ" value={batch.farmerAddress} />
          )}
        </View>
      )}

      {/* ── Ngày tạo ── */}
      {!!batch?.createdAt && (
        <Text style={styles.createdAtText}>
          Đăng ký: {formatTimestamp(batch.createdAt)}
        </Text>
      )}
    </View>
  );
}

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

function shortValue(value) {
  if (!value) return "";
  return value.length > 24 ? `${value.slice(0, 12)}...${value.slice(-8)}` : value;
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
        {(!!item.evidenceHash || !!item.ipfsCid) && (
          <View style={styles.evidenceBox}>
            <View style={styles.metaRow}>
              <Ionicons name="finger-print-outline" size={13} color="#047857" />
              <Text style={styles.evidenceText}>
                Hash: {shortValue(item.evidenceHash)}
              </Text>
            </View>
            {!!item.ipfsCid && (
              <View style={styles.metaRow}>
                <Ionicons name="cube-outline" size={13} color="#047857" />
                <Text style={styles.evidenceText}>
                  CID: {shortValue(item.ipfsCid)}
                </Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.metaBox}>
          {!!item.location && (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={13} color="#64748b" />
              <Text style={styles.metaText}>{item.location}</Text>
            </View>
          )}
          {}
          <VerifiedBadge txHash={item.transaction?.transactionHash} />
        </View>
      </View>
    </View>
  );
}

// ─── MAIN SCREEN ───
export default function BatchDetailScreen({ route, navigation }) {
  const { batchId, prefetchedBatch } = route.params || {};

  const [batch, setBatch]           = useState(prefetchedBatch || null);
  const [stages, setStages]         = useState([]);
  const [batchLoading, setBatchLoading]   = useState(!prefetchedBatch);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [batchError, setBatchError]       = useState(null);
  const [stagesError, setStagesError]     = useState(null);
  const [refreshing, setRefreshing]       = useState(false);

  const fetchingRef = useRef(false);

  const fetchAll = useCallback(
    async (forceRefresh = false) => {
      if (!batchId) {
        setBatchError("Không có mã lô hàng để tra cứu.");
        setBatchLoading(false);
        setStagesLoading(false);
        return;
      }

      if (fetchingRef.current && !forceRefresh) return;
      fetchingRef.current = true;

      if (forceRefresh) {
        invalidateBatchCache(batchId);
        setBatch(null);
        setStages([]);
        setBatchLoading(true);
        setStagesLoading(true);
        setBatchError(null);
        setStagesError(null);
      }

      try {
        if (!forceRefresh && prefetchedBatch && batch) {
          const historyRes = await getStageHistory(batchId, false);
          setStages(historyRes.data?.data?.stages ?? []);
          setStagesLoading(false);
          fetchingRef.current = false;
          return;
        }

        const [batchRes, historyRes] = await Promise.allSettled([
          getBatch(batchId, forceRefresh),
          getStageHistory(batchId, forceRefresh),
        ]);

        if (batchRes.status === "fulfilled") {
          setBatch(batchRes.value.data?.data);
          setBatchError(null);
        } else {
          setBatchError(
            batchRes.reason?.friendlyMessage || "Không thể tải thông tin lô hàng."
          );
        }
        setBatchLoading(false);

        if (historyRes.status === "fulfilled") {
          setStages(historyRes.value.data?.data?.stages ?? []);
          setStagesError(null);
        } else {
          setStagesError(
            historyRes.reason?.friendlyMessage || "Không thể tải hành trình lô hàng."
          );
        }
        setStagesLoading(false);
      } catch {
        setBatchLoading(false);
        setStagesLoading(false);
      } finally {
        fetchingRef.current = false;
      }
    },
    [batchId, prefetchedBatch, batch]
  );

  useEffect(() => {
    fetchAll(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (batch || stages.length > 0) {
        fetchAll(true);
      }
    }, []) // intentionally empty deps
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll(true);
    setRefreshing(false);
  }, [fetchAll]);

  const handleShare = async () => {
    const webUrl = getBatchWebUrl(batchId);
    const batchName = batch?.name || `Lô hàng #${batchId}`;
    const origin = batch?.origin ? ` • ${batch.origin}` : "";
    try {
      await Share.share({
        title: `AgriTrace — ${batchName}`,
        message: `${batchName}${origin}\n\nXem hành trình sản phẩm tại:\n${webUrl}`,
        url: webUrl,
      });
    } catch {
      // user cancelled share
    }
  };

  // ── Lỗi nghiêm trọng ──
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

  // ── Loading lần đầu ──
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
          {}
          <View style={styles.loadingInfo}>
            <ActivityIndicator size="small" color="#10b981" />
            <Text style={styles.loadingText}>Đang tải thông tin lô hàng...</Text>
          </View>
          <FullSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Render chính ──
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.customHeader}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.customHeaderTitle} numberOfLines={1}>
          {batch?.name || `Lô hàng #${batchId}`}
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#064e3b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => fetchAll(true)}>
            <Ionicons name="refresh-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={["#10b981"]}
            title="Đang cập nhật..."
            titleColor="#64748b"
          />
        }
      >
        {/* ── BATCH HEADER ── */}
        <BatchHeader batch={batch} />

        <View style={styles.divider} />

        {/* ── TIMELINE HEADER ── */}
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineTitle}>Hành trình lô hàng</Text>
          {}
          <View style={styles.verifiedChip}>
            <Ionicons name="shield-checkmark-outline" size={11} color="#059669" />
            <Text style={styles.verifiedChipText}>Đã xác thực</Text>
          </View>
        </View>

        {/* ── TIMELINE ── */}
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
            {}
            <Text style={styles.footerText}>
              Dữ liệu hành trình được xác thực và lưu trữ an toàn, không thể giả mạo hay chỉnh sửa. Kéo xuống để cập nhật thông tin mới nhất.
            </Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ───
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { padding: 20 },

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
  errorMessage: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
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

  // Batch Header
  batchHeader: { marginBottom: 16 },
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
  productTypeBadge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  productTypeText: { color: "#3b82f6", fontSize: 11, fontWeight: "700" },

  descriptionCard: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  descriptionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  descriptionText: { fontSize: 13, color: "#475569", lineHeight: 20 },

  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  quantityText: { fontSize: 13, color: "#64748b" },
  quantityValue: { fontWeight: "700", color: "#1e293b" },

  certSection: { marginBottom: 12 },
  certSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  certRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  certBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  certText: { fontSize: 11, color: "#059669", fontWeight: "700" },

  farmerCard: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  farmerCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  farmerCardTitle: { fontSize: 13, fontWeight: "700", color: "#166534" },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 2,
  },
  infoLabel: { fontSize: 10, color: "#94a3b8", fontWeight: "600", marginBottom: 1 },
  infoValue: { fontSize: 13, color: "#1e293b", fontWeight: "500" },

  createdAtText: { fontSize: 11, color: "#94a3b8", marginBottom: 4 },

  divider: { height: 1, backgroundColor: "#e2e8f0", marginBottom: 20 },

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
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  verifiedChipText: { fontSize: 10, fontWeight: "700", color: "#059669" },

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

  evidenceBox: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    padding: 10,
    borderRadius: 10,
    gap: 6,
    marginBottom: 10,
  },
  evidenceText: { fontSize: 11, color: "#047857", flex: 1, fontWeight: "600" },

  metaBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 10,
    borderRadius: 10,
    gap: 6,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12, color: "#475569", flex: 1 },

  verifiedBadgeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  verifiedBadgeText: { fontSize: 11, fontWeight: "700", color: "#059669" },

  emptyStage: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 14, color: "#94a3b8", textAlign: "center" },

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
