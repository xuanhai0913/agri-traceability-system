import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, SafeAreaView } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// Mock data cho giai đoạn tĩnh (Dành cho API)
const RECENT_SCANS = [
  { id: 1, name: "Arabica Cầu Đất Special", time: "Hôm nay, 09:42 AM", verified: true, image: "https://via.placeholder.com/60" },
  { id: 2, name: "Robusta Fine Lâm Đồng", time: "Hôm qua, 14:30 PM", verified: true, image: "https://via.placeholder.com/60" }
];

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Greeting */}
        <View style={styles.header}>
          <Text style={styles.greetingTitle}>Chào buổi sáng 👋</Text>
          <Text style={styles.greetingSub}>Bạn có sẵn sàng truy xuất nguồn gốc hôm nay?</Text>
        </View>

        {/* Main Action Card */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardContent}>
            <Text style={styles.mainCardTitle}>Xác thực nguồn gốc</Text>
            <Text style={styles.mainCardSub}>Quét mã QR trên bao bì để xem toàn bộ hành trình.</Text>
            <TouchableOpacity 
              style={styles.scanBtnInside}
              onPress={() => navigation.navigate("Scanner")}
            >
              <MaterialCommunityIcons name="qrcode-scan" size={20} color="#064e3b" />
              <Text style={styles.scanBtnTextInside}>Quét mã QR ngay</Text>
            </TouchableOpacity>
          </View>
          {/* Decorative Circle */}
          <View style={styles.circleDecor} />
        </View>

        {/* Recent Scans Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sản phẩm vừa quét</Text>
          <TouchableOpacity onPress={() => navigation.navigate("ScanningHistory")}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentList}>
          {RECENT_SCANS.map((item) => (
            <TouchableOpacity key={item.id} style={styles.recentCard} onPress={() => navigation.navigate("BatchDetail", { batchId: item.id })}>
              <Image source={{ uri: item.image }} style={styles.recentImg} />
              <View style={styles.recentInfo}>
                <Text style={styles.recentName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.recentTime}>{item.time}</Text>
                {item.verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                    <Text style={styles.verifiedText}>Blockchain Verified</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Story Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Khám phá câu chuyện</Text>
        </View>
        <TouchableOpacity style={styles.storyCard}>
          <View style={styles.storyOverlay}>
            <View style={styles.tagLabel}>
              <Text style={styles.tagText}>SINGLE ORIGIN SERIES</Text>
            </View>
            <Text style={styles.storyTitle}>Hành trình Cà phê Cầu Đất</Text>
            <Text style={styles.storySub}>4 bước quy trình nông nghiệp • Honey Process</Text>
          </View>
        </TouchableOpacity>

        {/* Spacing for bottom FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Scan Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fabButton} onPress={() => navigation.navigate("Scanner")}>
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
  header: { marginBottom: 24, marginTop: 10 },
  greetingTitle: { fontSize: 24, fontWeight: "700", color: "#1e293b", marginBottom: 4 },
  greetingSub: { fontSize: 14, color: "#64748b" },
  
  mainCard: { backgroundColor: "#064e3b", borderRadius: 20, padding: 24, position: "relative", overflow: "hidden", marginBottom: 32 },
  mainCardContent: { zIndex: 2 },
  mainCardTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 8 },
  mainCardSub: { color: "#d1fae5", fontSize: 14, marginBottom: 20, maxWidth: "80%", lineHeight: 20 },
  scanBtnInside: { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, gap: 8 },
  scanBtnTextInside: { color: "#064e3b", fontWeight: "700", fontSize: 14 },
  circleDecor: { position: "absolute", bottom: -30, right: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.1)", zIndex: 1 },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  seeAllText: { fontSize: 14, color: "#10b981", fontWeight: "600" },
  
  recentList: { marginHorizontal: -24, paddingHorizontal: 24, marginBottom: 32 },
  recentCard: { flexDirection: "row", backgroundColor: "#fff", padding: 12, borderRadius: 16, width: 260, marginRight: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  recentImg: { width: 60, height: 60, borderRadius: 12, backgroundColor: "#f1f5f9", marginRight: 12 },
  recentInfo: { flex: 1, justifyContent: "center" },
  recentName: { fontSize: 14, fontWeight: "700", color: "#1e293b", marginBottom: 4 },
  recentTime: { fontSize: 12, color: "#94a3b8", marginBottom: 6 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#ecfdf5", alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 4 },
  verifiedText: { color: "#10b981", fontSize: 10, fontWeight: "600" },

  storyCard: { height: 160, backgroundColor: "#1e293b", borderRadius: 20, overflow: "hidden", justifyContent: "flex-end" },
  storyOverlay: { padding: 20, backgroundColor: "rgba(0,0,0,0.4)" },
  tagLabel: { backgroundColor: "#f59e0b", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 8 },
  tagText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  storyTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  storySub: { color: "#cbd5e1", fontSize: 12 },

  fabContainer: { position: "absolute", bottom: 20, left: 0, right: 0, alignItems: "center" },
  fabButton: { backgroundColor: "#064e3b", width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", shadowColor: "#064e3b", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, marginBottom: 8 },
  fabText: { color: "#064e3b", fontSize: 12, fontWeight: "600" }
});