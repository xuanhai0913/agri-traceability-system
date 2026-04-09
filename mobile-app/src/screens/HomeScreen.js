import { StyleSheet, Text, View, TouchableOpacity } from "react-native";

/**
 * HomeScreen
 * Entry point — user taps "Scan QR" to open camera
 * Use case: "Mo trinh quet" (Open scanner)
 */
export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AgriTrace</Text>
      <Text style={styles.subtitle}>Truy xuat nguon goc nong san</Text>

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate("Scanner")}
      >
        <Text style={styles.scanButtonText}>Quet ma QR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
    marginBottom: 48,
  },
  scanButton: {
    backgroundColor: "#059669",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
