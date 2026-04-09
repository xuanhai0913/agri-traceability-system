import { useState } from "react";
import { StyleSheet, Text, View, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

/**
 * ScannerScreen
 * Opens camera, scans QR code, extracts batchId
 * Sequence diagram steps 1-4: Camera -> QR decode -> batchId
 */
export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Can quyen truy cap Camera de quet ma QR
        </Text>
        <Text style={styles.link} onPress={requestPermission}>
          Cap quyen Camera
        </Text>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);

    // Expect QR data to be a batchId (number) or URL containing batchId
    const batchId = extractBatchId(data);

    if (batchId) {
      // Navigate to product detail (step 5 in sequence diagram)
      navigation.replace("BatchDetail", { batchId });
    } else {
      Alert.alert("Loi", "Ma QR khong hop le", [
        { text: "Thu lai", onPress: () => setScanned(false) },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarCodeScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.scanFrame} />
        <Text style={styles.hint}>Dua camera vao tem QR tren bao bi</Text>
      </View>
    </View>
  );
}

/**
 * Extract batchId from QR data
 * Supports: plain number, or URL like "https://domain.com/batch/123"
 */
function extractBatchId(data) {
  // Plain number
  const num = parseInt(data, 10);
  if (!isNaN(num) && num > 0) return num;

  // URL pattern: /batch/:id or /batches/:id
  const match = data.match(/\/batch(?:es)?\/(\d+)/);
  if (match) return parseInt(match[1], 10);

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "#10b981",
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  hint: {
    color: "#fff",
    fontSize: 14,
    marginTop: 24,
  },
  message: {
    color: "#f8fafc",
    fontSize: 16,
    textAlign: "center",
    padding: 24,
  },
  link: {
    color: "#10b981",
    fontSize: 16,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
