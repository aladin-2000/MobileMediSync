// components/HomeScreen.js — Accueil, partagé médecin/délégué.
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  getRendezVousMedecin, getRendezVousDelegue,
  getMedecinByUserId, getDelegueByUserId,
  getMesNotifications, iconeNotification,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MONTHS_FR, DAYS_FR, toISODate, lundiDeLaSemaine, dimancheDeLaSemaine } from '../services/dateUtils';
import RefreshButton from './RefreshButton';

export default function HomeScreen({ role = 'DELEGUE' }) {
  const { user, medecinId, delegueId } = useAuth();
  const [nom, setNom] = useState(user?.email ?? '');
  const [rendezvous, setRendezvous] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const todayISO = toISODate(today);
  const todayLabel = `${DAYS_FR[today.getDay()]} ${today.getDate()} ${MONTHS_FR[today.getMonth()]} ${today.getFullYear()}`;

  const load = useCallback(async () => {
    const id = role === 'MEDECIN' ? medecinId : delegueId;
    if (!id || !user) return;
    setLoading(true);
    try {
      const [profil, rdvList, notifs] = await Promise.all([
        role === 'MEDECIN' ? getMedecinByUserId(user.id) : getDelegueByUserId(user.id),
        role === 'MEDECIN' ? getRendezVousMedecin(id) : getRendezVousDelegue(id),
        getMesNotifications().catch(() => []),
      ]);
      setNom(role === 'MEDECIN' ? `Dr. ${profil.prenom} ${profil.nom}` : `${profil.prenom} ${profil.nom}`);
      setRendezvous(rdvList);
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading home:', error);
    } finally {
      setLoading(false);
    }
  }, [role, medecinId, delegueId, user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const lundi = toISODate(lundiDeLaSemaine(today));
  const dimanche = toISODate(dimancheDeLaSemaine(today));

  const rdvAujourdhui = rendezvous
    .filter((r) => r.date === todayISO && r.statutBrut !== 'ANNULE')
    .sort((a, b) => a.heure.localeCompare(b.heure));
  const rdvSemaine = rendezvous.filter((r) => r.date >= lundi && r.date <= dimanche && r.statutBrut !== 'ANNULE');
  const realisesSemaine = rdvSemaine.filter((r) => r.statutBrut === 'REALISE');
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading && rendezvous.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroEyebrow}>{todayLabel}</Text>
          <RefreshButton onPress={load} loading={loading} />
        </View>
        <Text style={styles.heroTitle}>Bonjour, {nom}</Text>
        <Text style={styles.heroSubtitle}>Voici un aperçu de votre activité aujourd’hui.</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{rdvAujourdhui.length}</Text>
          <Text style={styles.statLabel}>Aujourd’hui</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{rdvSemaine.length}</Text>
          <Text style={styles.statLabel}>Cette semaine</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{realisesSemaine.length}</Text>
          <Text style={styles.statLabel}>Réalisés</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push(role === 'MEDECIN' ? '/medecin/creneaux' : '/delegue/calendar')}
          activeOpacity={0.8}
        >
          <Text style={styles.quickActionIcon}>{role === 'MEDECIN' ? '🗓️' : '📅'}</Text>
          <Text style={styles.quickActionText}>{role === 'MEDECIN' ? 'Mes rendez-vous' : 'Mon calendrier'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push(role === 'MEDECIN' ? '/medecin' : '/delegue')}
          activeOpacity={0.8}
        >
          <Text style={styles.quickActionIcon}>{role === 'MEDECIN' ? '📅' : '🔍'}</Text>
          <Text style={styles.quickActionText}>{role === 'MEDECIN' ? 'Disponibilités' : 'Chercher un médecin'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Planning du jour</Text>
        {rdvAujourdhui.length === 0 ? (
          <Text style={styles.sectionEmpty}>Aucun rendez-vous prévu aujourd’hui.</Text>
        ) : (
          rdvAujourdhui.map((rdv) => {
            const person = role === 'MEDECIN' ? rdv.delegue : rdv.medecin;
            return (
              <View key={rdv.id} style={styles.agendaRow}>
                <Text style={styles.agendaTime}>{rdv.heure}</Text>
                <Text style={styles.agendaName} numberOfLines={1}>{person?.nom}</Text>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Notifications récentes</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>
          )}
        </View>
        {notifications.length === 0 ? (
          <Text style={styles.sectionEmpty}>Aucune notification pour le moment.</Text>
        ) : (
          <>
            {notifications.slice(0, 4).map((notif) => (
              <View key={notif.id} style={[styles.notifRow, !notif.isRead && styles.notifRowUnread]}>
                <Text style={styles.notifIcon}>{iconeNotification(notif.type)}</Text>
                <Text style={styles.notifText} numberOfLines={2}>{notif.contenu}</Text>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => router.push(role === 'MEDECIN' ? '/medecin/notifications' : '/delegue/notifications')}
              style={styles.linkButton}
            >
              <Text style={styles.linkButtonText}>Voir toutes les notifications</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  hero: {
    backgroundColor: '#ecfdf5', borderRadius: 16, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: '#d1fae5',
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  heroEyebrow: { fontSize: 11, fontWeight: '700', color: '#059669', textTransform: 'capitalize' },
  heroTitle: { fontSize: 19, fontWeight: '800', color: '#0f172a' },
  heroSubtitle: { fontSize: 12, color: '#64748b', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#f1f5f9', alignItems: 'center',
  },
  statNum: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 2, textAlign: 'center' },
  quickActions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickAction: {
    flex: 1, backgroundColor: '#059669', borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  quickActionIcon: { fontSize: 20, marginBottom: 4 },
  quickActionText: { fontSize: 12, fontWeight: '700', color: '#ffffff', textAlign: 'center' },
  section: { marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10,
  },
  sectionEmpty: { fontSize: 12, color: '#94a3b8' },
  badge: { backgroundColor: '#ef4444', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  agendaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ffffff', borderRadius: 10,
    padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9',
  },
  agendaTime: { fontSize: 13, fontWeight: '800', color: '#059669', width: 46 },
  agendaName: { fontSize: 13, fontWeight: '600', color: '#0f172a', flex: 1 },
  notifRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#ffffff', borderRadius: 10,
    padding: 10, marginBottom: 6, borderWidth: 1, borderColor: '#f1f5f9',
  },
  notifRowUnread: { backgroundColor: '#f5f9ff', borderColor: '#d1fae5' },
  notifIcon: { fontSize: 14 },
  notifText: { fontSize: 12.5, color: '#334155', flex: 1 },
  linkButton: { alignItems: 'center', marginTop: 6, paddingVertical: 8 },
  linkButtonText: { fontSize: 12, fontWeight: '700', color: '#059669' },
});
