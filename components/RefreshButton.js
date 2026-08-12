// components/RefreshButton.js — icône de rafraîchissement, équivalent mobile du bouton
// ti-refresh utilisé sur le web (rappelle la fonction de chargement de la page).
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function RefreshButton({ onPress, loading = false, style }) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
      accessibilityLabel="Rafraîchir"
    >
      {loading ? <ActivityIndicator size="small" color="#3b82f6" /> : <Text style={styles.icon}>🔄</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  icon: {
    fontSize: 15,
  },
});
