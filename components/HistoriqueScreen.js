// components/HistoriqueScreen.js — Historique hebdomadaire, partagé médecin/délégué.
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getRendezVousMedecin, getRendezVousDelegue } from '../services/api';
import { MONTHS_FR, toISODate, lundiDeLaSemaine, dimancheDeLaSemaine } from '../services/dateUtils';
import { useAuth } from '../context/AuthContext';
import AppointmentCard from './AppointmentCard';

function weekLabel(current) {
  const lundi = lundiDeLaSemaine(current);
  const dimanche = dimancheDeLaSemaine(current);
  if (lundi.getMonth() === dimanche.getMonth()) {
    return `${lundi.getDate()} - ${dimanche.getDate()} ${MONTHS_FR[dimanche.getMonth()]} ${dimanche.getFullYear()}`;
  }
  return `${lundi.getDate()} ${MONTHS_FR[lundi.getMonth()]} - ${dimanche.getDate()} ${MONTHS_FR[dimanche.getMonth()]} ${dimanche.getFullYear()}`;
}

export default function HistoriqueScreen({ role = 'DELEGUE' }) {
  const { medecinId, delegueId } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rendezvous, setRendezvous] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const id = role === 'MEDECIN' ? medecinId : delegueId;
    if (!id) return;
    setLoading(true);
    try {
      const list = role === 'MEDECIN' ? await getRendezVousMedecin(id) : await getRendezVousDelegue(id);
      setRendezvous(list);
    } catch (error) {
      console.error('Error fetching historique:', error);
    } finally {
      setLoading(false);
    }
  }, [role, medecinId, delegueId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const lundi = toISODate(lundiDeLaSemaine(currentDate));
  const dimanche = toISODate(dimancheDeLaSemaine(currentDate));
  const semaine = rendezvous.filter((r) => r.date >= lundi && r.date <= dimanche);

  const realisees = semaine.filter((r) => r.statutBrut === 'REALISE').sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
  const absences = semaine.filter((r) => r.statutBrut === 'ABSENT_MEDECIN' || r.statutBrut === 'ABSENT_DELEGUE').sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
  const annulations = semaine.filter((r) => r.statutBrut === 'ANNULE').sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
  const total = semaine.length;
  const tauxAnnulation = total ? Math.round((annulations.length / total) * 100) : 0;

  const changeWeek = (offset) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + offset * 7);
    setCurrentDate(d);
  };

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navButton} onPress={() => changeWeek(-1)} activeOpacity={0.7}>
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.weekLabel}>{weekLabel(currentDate)}</Text>
        <TouchableOpacity style={styles.navButton} onPress={() => changeWeek(1)} activeOpacity={0.7}>
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.todayButton} onPress={() => setCurrentDate(new Date())} activeOpacity={0.7}>
        <Text style={styles.todayButtonText}>Cette semaine</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color="#3b82f6" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{realisees.length}</Text>
              <Text style={styles.statLabel}>Réalisées</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{absences.length}</Text>
              <Text style={styles.statLabel}>Absences</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{annulations.length}</Text>
              <Text style={styles.statLabel}>Annulations</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{tauxAnnulation}%</Text>
              <Text style={styles.statLabel}>Taux annulation</Text>
            </View>
          </View>

          <Section title="Visites réalisées" data={realisees} role={role} empty="Aucune visite réalisée cette semaine" />
          <Section title="Absences" data={absences} role={role} empty="Aucune absence cette semaine" />
          <Section title="Annulations" data={annulations} role={role} empty="Aucune annulation cette semaine" />
        </ScrollView>
      )}
    </View>
  );
}

function Section({ title, data, role, empty }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title} ({data.length})</Text>
      {data.length === 0 ? (
        <Text style={styles.sectionEmpty}>{empty}</Text>
      ) : (
        data.map((item) => <AppointmentCard key={item.id} appointment={item} role={role} />)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 14,
  },
  navButton: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#ffffff',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0',
  },
  navButtonText: { fontSize: 18, color: '#334155', lineHeight: 20 },
  weekLabel: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  todayButton: { alignSelf: 'center', marginTop: 8 },
  todayButtonText: { fontSize: 12, fontWeight: '700', color: '#3b82f6' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingVertical: 16, paddingBottom: 32 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  statCard: {
    flexBasis: '47%', backgroundColor: '#ffffff', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  statNum: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  section: { marginTop: 18 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#475569', textTransform: 'uppercase',
    letterSpacing: 0.4, marginHorizontal: 16, marginBottom: 8,
  },
  sectionEmpty: { fontSize: 12, color: '#94a3b8', marginHorizontal: 16 },
});
