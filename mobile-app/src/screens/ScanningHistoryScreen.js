import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, SectionList, TextInput, SafeAreaView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Mock data chia theo Section (Tháng)
const HISTORY_DATA = [
  {
    title: "Tháng 4, 2026",
    data: [
      { id: 1, name: "Arabica Cầu Đất Special", time: "Hôm nay, 09:42 AM", status: "verified", image: "https://via.placeholder.com/60" },
      { id: 2, name: "Robusta Fine Lâm Đồng", time: "Hôm qua, 14:30 PM", status: "verified", image: "https://via.placeholder.com/60" },
      { id: 3, name: "Cà phê Rang Xay (Không rõ)", time: "05/04/2026, 10:15 AM", status: "failed", image: "https://via.placeholder.com/60" },
    ]
  },
  {
    title: "Tháng 3, 2026",
    data: [
      { id: 4, name: "Trà Ô Long Mộc Châu", time: "28/03/2026, 16:45 PM", status: "verified", image: "https://via.placeholder.com/60" },
    ]
  }
];

export default function ScanningHistoryScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.historyCard} onPress={() => item.status === "verified" && navigation.navigate("BatchDetail", { batchId: item.id })}>
      <Image source={{ uri: item.image }} style={styles.productImg} />
      
      <View style={styles.cardContent}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.scanTime}>{item.time}</Text>
        
        {item.status === "verified" ? (
          <View style={[styles.statusBadge, styles.badgeVerified]}>
            <Ionicons name="checkmark-circle" size={12} color="#10b981" />
            <Text style={styles.verifiedText}>Blockchain Verified</Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, styles.badgeFailed]}>
            <Ionicons name="alert-circle" size={12} color="#ef4444" />
            <Text style={styles.failedText}>Không thể xác thực</Text>
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={20} color="#cbd5e1" style={styles.chevron} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử quét mã</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={24} color="#1e293b" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm sản phẩm, mã lô..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* List */}
      <SectionList
        sections={HISTORY_DATA}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionTitle}>{title}</Text>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  filterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },

  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 24, paddingHorizontal: 16, borderRadius: 12, height: 48, marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: "#f1f5f9" },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#1e293b" },

  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#64748b", marginBottom: 16, marginTop: 8 },
  
  historyCard: { flexDirection: "row", backgroundColor: "#fff", padding: 12, borderRadius: 16, marginBottom: 12, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1, borderWidth: 1, borderColor: "#f8fafc" },
  productImg: { width: 60, height: 60, borderRadius: 12, backgroundColor: "#f1f5f9", marginRight: 16 },
  cardContent: { flex: 1 },
  productName: { fontSize: 15, fontWeight: "700", color: "#1e293b", marginBottom: 4 },
  scanTime: { fontSize: 12, color: "#94a3b8", marginBottom: 8 },
  
  statusBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 4 },
  badgeVerified: { backgroundColor: "#ecfdf5" },
  badgeFailed: { backgroundColor: "#fef2f2" },
  verifiedText: { color: "#10b981", fontSize: 10, fontWeight: "600" },
  failedText: { color: "#ef4444", fontSize: 10, fontWeight: "600" },
  
  chevron: { marginLeft: 16 }
});