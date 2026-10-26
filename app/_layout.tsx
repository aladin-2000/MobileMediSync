import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../context/AuthContext";
import { NotificationProvider } from "../context/NotificationContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
