import { useState, useCallback } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthProvider } from "../context/AuthContext";
import { NotificationProvider } from "../context/NotificationContext";
import ContactBanner from "../components/ContactBanner";
import UpdateScreen from "../components/UpdateScreen";

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
  const [isReady, setIsReady] = useState(false);
  const onUpdateFinished = useCallback(() => setIsReady(true), []);

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <UpdateScreen onFinished={onUpdateFinished} />
      </SafeAreaProvider>
    );
  }

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
