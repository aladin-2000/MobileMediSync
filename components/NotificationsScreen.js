// components/NotificationsScreen.js — Écran Notifications, partagé médecin/délégué (logique identique).
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getMesNotifications, marquerNotificationLue, marquerToutesNotificationsLues, iconeNotification } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import RefreshButton from './RefreshButton';

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  const diffJ = Math.floor(diffH / 24);
  if (diffJ < 7) return `il y a ${diffJ} j`;
  return date.toLocaleDateString('fr-FR');
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { refresh: refreshBadge } = useNotifications();

  const load = useCallback(async () => {
    try {
      const data = await getMesNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handlePress = async (notif) => {
    if (notif.isRead) return;
    setNotifications((list) => list.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
    try {
      await marquerNotificationLue(notif.id);
      refreshBadge();
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((list) => list.map((n) => ({ ...n, isRead: true })));
    try {
      await marquerToutesNotificationsLues();
      refreshBadge();
    } catch (error) {
      console.error('Error marking all notifications read:', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color="#059669" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {unreadCount > 0 ? (
          <>
            <Text style={styles.headerText}>{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</Text>
            <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
              <Text style={styles.markAllText}>Tout marquer comme lu</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.headerText}>Notifications</Text>
        )}
        <RefreshButton onPress={onRefresh} loading={refreshing} style={styles.refreshButton} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.isRead && styles.cardUnread]}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.cardIcon}>{iconeNotification(item.type)}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.cardText}>{item.contenu}</Text>
              <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
            </View>
            {!item.isRead && <View style={styles.dot} />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptySubtitle}>Vous serez notifié ici des événements liés à vos rendez-vous.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    paddingHorizontal: 18, paddingVertical: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  headerText: { fontSize: 13, fontWeight: '700', color: '#334155', flex: 1 },
  markAllText: { fontSize: 12, fontWeight: '700', color: '#059669' },
  refreshButton: { marginLeft: 4 },
  listContainer: { paddingVertical: 8, paddingBottom: 24 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#ffffff', marginHorizontal: 16, marginVertical: 4, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  cardUnread: { backgroundColor: '#f5f9ff', borderColor: '#d1fae5' },
  cardIcon: { fontSize: 18, marginTop: 1 },
  cardBody: { flex: 1 },
  cardText: { fontSize: 13.5, color: '#0f172a', lineHeight: 19 },
  cardDate: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#059669', marginTop: 6 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 48 },
  emptyEmoji: { fontSize: 32, marginBottom: 10 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 18, maxWidth: 260 },
});
