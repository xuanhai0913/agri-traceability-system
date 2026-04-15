import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import HomeScreen from "./src/screens/HomeScreen";
import ScannerScreen from "./src/screens/ScannerScreen";
import BatchDetailScreen from "./src/screens/BatchDetailScreen";
import ScanningHistoryScreen from "./src/screens/ScanningHistoryScreen"; // Thêm mới

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      {/* Đổi status bar sang phông chữ tối vì nền app màu trắng */}
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: "#ffffff" },
          headerTintColor: "#1e293b",
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: "#f8fafc" },
          headerShadowVisible: false, // Bỏ viền dưới của header cho mượt
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Scanner"
          component={ScannerScreen}
          options={{ title: "Quét mã QR", headerTransparent: true, headerTintColor: "#fff" }}
        />
        <Stack.Screen
          name="ScanningHistory"
          component={ScanningHistoryScreen}
          options={{ title: "Lịch sử quét" }}
        />
        <Stack.Screen
          name="BatchDetail"
          component={BatchDetailScreen}
          options={{ headerShown: false }} // Ẩn header mặc định để làm header custom có ảnh
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}