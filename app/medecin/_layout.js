// app/medecin/_layout.js
import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeaderMenu from '../../components/HeaderMenu';
import { useAuth } from '../../context/AuthContext';

export default function MedecinLayout() {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingTop: 6,
          height: 56 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '700',
          color: '#0f172a',
        },
        headerLeft: () => <HeaderMenu onLogout={logout} />,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 18 }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Disponibilités',
          tabBarLabel: 'Disponibilités',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 18 }}>📅</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="creneaux"
        options={{
          title: 'Rendez-vous',
          tabBarLabel: 'Rendez-vous',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 18 }}>🗓️</Text>
          ),
        }}
      />
      {/* Accessibles depuis le menu latéral (HeaderMenu), pas depuis la barre d'onglets
          (max 3-4 onglets pour ne pas surcharger le bas de l'écran). */}
      <Tabs.Screen name="historique" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
