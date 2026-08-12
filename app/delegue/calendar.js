// app/delegue/calendar.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { getRendezVousDelegue, annulerRendezVousDelegue, realiserRendezVousDelegue, marquerAbsentMedecin } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CustomCalendar from '../../components/CustomCalendar';
import AppointmentCard from '../../components/AppointmentCard';
import RefreshButton from '../../components/RefreshButton';
import useConfirmModal from '../../hooks/useConfirmModal';

export default function AppointmentsCalendarScreen() {
  const { delegueId } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]); // Format: YYYY-MM-DD
  const { confirm, notify, modal } = useConfirmModal();

  // Reusable fetch for manual refreshes (after annuler/réalisé/absent) — safe to call setState
  // directly here since it always runs from an event handler, never from inside an effect body.
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRendezVousDelegue(delegueId);
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [delegueId]);

  useEffect(() => {
    let ignore = false;
    getRendezVousDelegue(delegueId)
      .then((data) => {
        if (!ignore) setAppointments(data);
      })
      .catch((error) => console.error('Error fetching appointments:', error))
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [delegueId]);

  // Triggered when a day cell is tapped
  const handleDaySelect = React.useCallback((dateString) => {
    setSelectedDate(dateString);
  }, []);

  const runAction = async (action) => {
    try {
      await action();
      fetchAppointments();
    } catch (error) {
      notify({ title: 'Erreur', message: error.message, variant: 'error' });
    }
  };

  const handleAnnuler = async (id) => {
    const ok = await confirm({
      title: 'Annuler le rendez-vous',
      message: 'Confirmez-vous l’annulation de ce rendez-vous ?',
      variant: 'danger',
      confirmText: 'Oui, annuler',
      cancelText: 'Non',
    });
    if (ok) runAction(() => annulerRendezVousDelegue(id));
  };

  const handleRealise = async (id) => {
    const ok = await confirm({
      title: 'Marquer réalisé',
      message: 'Confirmez-vous que cette visite a bien eu lieu ?',
      variant: 'success',
      confirmText: 'Oui, réalisé',
      cancelText: 'Non',
    });
    if (ok) runAction(() => realiserRendezVousDelegue(id));
  };

  const handleAbsent = async (id) => {
    const ok = await confirm({
      title: 'Marquer absent',
      message: 'Confirmez-vous que le médecin ne s\'est pas présenté ?',
      variant: 'warning',
      confirmText: 'Oui',
      cancelText: 'Non',
    });
    if (ok) runAction(() => marquerAbsentMedecin(id));
  };

  // Compute appointments for the selected date on the fly (no useEffect required)
  const selectedDayAppointments = selectedDate
    ? appointments.filter(app => app.date === selectedDate)
    : [];

  // Format date string for displaying as header, e.g. "2026-07-22" -> "22 Juillet 2026"
  const formatFriendlyDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const monthsFr = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    return `${day} ${monthsFr[monthIdx]} ${year}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Calendar Component */}
      <CustomCalendar
        appointments={appointments}
        selectedDate={selectedDate}
        onDaySelect={handleDaySelect}
      />

      {/* Selected Day Header */}
      <View style={styles.detailsHeader}>
        <Text style={styles.detailsTitle}>
          {selectedDate ? `Rendez-vous du ${formatFriendlyDate(selectedDate)}` : 'Sélectionnez un jour'}
        </Text>
        <View style={styles.detailsHeaderActions}>
          {selectedDate && selectedDayAppointments.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {selectedDayAppointments.length} RDV
              </Text>
            </View>
          )}
          <RefreshButton onPress={fetchAppointments} loading={loading} />
        </View>
      </View>

      {/* Selected Day Appointments List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.loadingText}>Mise à jour des rendez-vous...</Text>
        </View>
      ) : !selectedDate ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>👈</Text>
          <Text style={styles.emptyTitle}>Choisissez une date</Text>
          <Text style={styles.emptySubtitle}>
            Touchez un jour sur le calendrier pour afficher la liste des visites correspondantes.
          </Text>
        </View>
      ) : selectedDayAppointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🍃</Text>
          <Text style={styles.emptyTitle}>Aucune visite prévue</Text>
          <Text style={styles.emptySubtitle}>
            {"Vous n'avez pas de rendez-vous avec un médecin à cette date."}
          </Text>
        </View>
      ) : (
        selectedDayAppointments.map((item) => (
          <AppointmentCard
            key={item.id}
            appointment={item}
            role="DELEGUE"
            onAnnuler={() => handleAnnuler(item.id)}
            onRealise={() => handleRealise(item.id)}
            onAbsent={() => handleAbsent(item.id)}
          />
        ))
      )}

      {modal}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
  },
  detailsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  detailsHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  countBadgeText: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 10,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 240,
  },
});
