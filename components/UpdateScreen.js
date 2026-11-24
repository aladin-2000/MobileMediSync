import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as Updates from 'expo-updates';

export default function UpdateScreen({ onFinished }) {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    if (__DEV__) {
      onFinished();
      return;
    }

    (async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          setStatus('downloading');
          await Updates.fetchUpdateAsync();
          setStatus('restarting');
          await Updates.reloadAsync();
        } else {
          onFinished();
        }
      } catch {
        onFinished();
      }
    })();
  }, [onFinished]);

  if (status === 'checking') {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>🔍</Text>
        <Text style={styles.title}>Vérification des mises à jour...</Text>
        <ActivityIndicator size="small" color="#059669" style={styles.spinner} />
      </View>
    );
  }

  if (status === 'downloading') {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>⬇️</Text>
        <Text style={styles.title}>Mise à jour en cours...</Text>
        <Text style={styles.subtitle}>L'application va redémarrer automatiquement</Text>
        <ActivityIndicator size="small" color="#059669" style={styles.spinner} />
      </View>
    );
  }

  if (status === 'restarting') {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>🔄</Text>
        <Text style={styles.title}>Redémarrage...</Text>
        <ActivityIndicator size="small" color="#059669" style={styles.spinner} />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  icon: {
    fontSize: 48,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginTop: 8,
  },
  spinner: {
    marginTop: 24,
  },
});
