import { View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthProvider } from "../context/AuthContext";
import { NotificationProvider } from "../context/NotificationContext";
import ContactBanner from "../components/ContactBanner";

function InnerLayout() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingTop: insets.top, backgroundColor: '#059669' }}>
        <ContactBanner />
      </View>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <InnerLayout />
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
