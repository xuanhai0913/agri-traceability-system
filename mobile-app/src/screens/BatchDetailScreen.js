import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { getBatch, getStageHistory } from "../services/api";

// Maps stage index to Vietnamese label
const STAGE_LABELS = {
  0: "Gieo trong",
  1: "Phat trien",
  2: "Bon phan",
  3: "Thu hoach",
  4: "Dong goi",
  5: "Van chuyen",
  6: "Hoan thanh",
};

/**
 * BatchDetailScreen
 * Shows product info + timeline of growth stages
 * Sequence diagram steps 5-14:
 * - Loading state (step 5)
 * - GET /api/batches/{batchId} (step 6)
 * - Parallel image loading from Cloudinary (step 10)
 * - Render timeline (step 13)
 */
export default function BatchDetailScreen({ route }) {
  const { batchId } = route.params;
  const [batch, setBatch] = useState(null);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBatchData();
  }, [batchId]);

  async function loadBatchData() {
    try {
      setLoading(true);
      // Parallel fetch: batch info + stage history (matching "par" block in sequence diagram)
      const [batchRes, historyRes] = await Promise.all([
        getBatch(batchId),
        getStageHistory(batchId),
      ]);

      setBatch(batchRes.data.data);
      setStages(historyRes.data.data.stages);
    } catch (err) {
      setError(err.response?.data?.message || "Khong the tai du lieu");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Dang tai du lieu...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Batch info header */}
      <View style={styles.header}>
        <Text style={styles.batchName}>{batch?.name}</Text>
        <Text style={styles.origin}>{batch?.origin}</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.badge,
              batch?.isActive ? styles.badgeActive : styles.badgeCompleted,
            ]}
          >
            <Text style={styles.badgeText}>
              {batch?.isActive ? "Dang xu ly" : "Hoan thanh"}
            </Text>
          </View>
          <Text style={styles.stageLabel}>
            {STAGE_LABELS[batch?.currentStageIndex] || batch?.currentStage}
          </Text>
        </View>
      </View>

      {/* Timeline */}
      <Text style={styles.sectionTitle}>Hanh trinh san pham</Text>
      {stages.map((stage, index) => (
        <View key={index} style={styles.timelineItem}>
          <View style={styles.timelineDot} />
          {index < stages.length - 1 && <View style={styles.timelineLine} />}

          <View style={styles.timelineContent}>
            <Text style={styles.stageName}>
              {STAGE_LABELS[stage.stageIndex] || stage.stage}
            </Text>
            {stage.description ? (
              <Text style={styles.stageDesc}>{stage.description}</Text>
            ) : null}
            <Text style={styles.stageTime}>
              {new Date(stage.timestamp * 1000).toLocaleString("vi-VN")}
            </Text>
            {stage.imageUrl ? (
              <Image
                source={{ uri: stage.imageUrl }}
                style={styles.stageImage}
                resizeMode="cover"
              />
            ) : null}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  centered: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#94a3b8",
    marginTop: 12,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    padding: 24,
    textAlign: "center",
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  batchName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 4,
  },
  origin: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeActive: {
    backgroundColor: "rgba(16,185,129,0.15)",
  },
  badgeCompleted: {
    backgroundColor: "rgba(251,191,36,0.15)",
  },
  badgeText: {
    color: "#10b981",
    fontSize: 12,
    fontWeight: "600",
  },
  stageLabel: {
    color: "#94a3b8",
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f8fafc",
    padding: 24,
    paddingBottom: 12,
  },
  timelineItem: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 2,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10b981",
    marginTop: 4,
    marginRight: 16,
    zIndex: 1,
  },
  timelineLine: {
    position: "absolute",
    left: 29,
    top: 16,
    bottom: -2,
    width: 2,
    backgroundColor: "#1e293b",
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    marginBottom: 12,
  },
  stageName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f8fafc",
    marginBottom: 4,
  },
  stageDesc: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 4,
  },
  stageTime: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 8,
  },
  stageImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginTop: 8,
  },
});
