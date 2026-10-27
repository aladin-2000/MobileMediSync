// app/medecin/creneaux.js — Rendez-vous du médecin : calendrier + actions (réalisé/absent/annuler)
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Modal, TextInput, TouchableOpacity } from 'react-native';
import { getRendezVousMedecin, realiserRendezVousMedecin, marquerAbsentDelegue, annulerRendezVousMedecin } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CustomCalendar from '../../components/CustomCalendar';
import AppointmentCard from '../../components/AppointmentCard';
import RefreshButton from '../../components/RefreshButton';
import useConfirmModal from '../../hooks/useConfirmModal';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const formatFriendlyDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${parseInt(day, 10)} ${MONTHS_FR[parseInt(month, 10) - 1]} ${year}`;
};

export default function RendezVousMedecinScreen() {
  const { medecinId } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [motifModal, setMotifModal] = useState({ visible: false, id: null, motif: '' });
  const [detailRdv, setDetailRdv] = useState(null);
  const { confirm, notify, modal } = useConfirmModal();

  // Réutilisable pour les rafraîchissements manuels (après annuler/réalisé/absent) — safe à appeler
  // setState directement ici puisque ça s'exécute toujours depuis un event handler, jamais depuis un effet.
  const fetchAppointments = useCallback(async () => {
    if (!medecinId) return;
    setLoading(true);
    try {
      const data = await getRendezVousMedecin(medecinId);
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [medecinId]);

  useEffect(() => {
    if (!medecinId) return;
    let ignore = false;
    getRendezVousMedecin(medecinId)
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
  }, [medecinId]);

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

  const handleRealise = async (id) => {
    const ok = await confirm({
      title: 'Marquer réalisé',
      message: 'Confirmez-vous que ce rendez-vous a bien eu lieu ?',
      variant: 'success',
      confirmText: 'Oui, réalisé',
      cancelText: 'Non',
    });
    if (ok) runAction(() => realiserRendezVousMedecin(id));
  };

  const handleAbsent = async (id) => {
    const ok = await confirm({
      title: 'Marquer absent',
      message: "Confirmez-vous que le délégué ne s'est pas présenté ?",
      variant: 'warning',
      confirmText: 'Oui',
      cancelText: 'Non',
    });
    if (ok) runAction(() => marquerAbsentDelegue(id));
  };

  const openMotifModal = (id) => setMotifModal({ visible: true, id, motif: '' });
  const closeMotifModal = () => setMotifModal({ visible: false, id: null, motif: '' });

  const confirmAnnulation = async () => {
    if (!motifModal.motif.trim()) {
      notify({ title: 'Motif requis', message: "Merci d'indiquer un motif d'annulation.", variant: 'warning' });
      return;
    }
    const { id, motif } = motifModal;
    closeMotifModal();
    runAction(() => annulerRendezVousMedecin(id, motif.trim()));
  };

  const selectedDayAppointments = selectedDate
    ? appointments.filter((app) => app.date === selectedDate)
    : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <CustomCalendar appointments={appointments} selectedDate={selectedDate} onDaySelect={handleDaySelect} />

      <View style={styles.detailsHeader}>
        <Text style={styles.detailsTitle}>
          {selectedDate ? `Rendez-vous du ${formatFriendlyDate(selectedDate)}` : 'Sélectionnez un jour'}
        </Text>
        <View style={styles.detailsHeaderActions}>
          {selectedDate && selectedDayAppointments.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{selectedDayAppointments.length} RDV</Text>
            </View>
          )}
          <RefreshButton onPress={fetchAppointments} loading={loading} />
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color="#059669" />
          <Text style={styles.loadingText}>Mise à jour des rendez-vous...</Text>
        </View>
      ) : !selectedDate ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>👈</Text>
          <Text style={styles.emptyTitle}>Choisissez une date</Text>
          <Text style={styles.emptySubtitle}>
            Touchez un jour sur le calendrier pour afficher la liste des rendez-vous correspondants.
          </Text>
        </View>
      ) : selectedDayAppointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🍃</Text>
          <Text style={styles.emptyTitle}>Aucun rendez-vous</Text>
          <Text style={styles.emptySubtitle}>Vous n’avez aucun rendez-vous prévu à cette date.</Text>
        </View>
      ) : (
        selectedDayAppointments.map((item) => (
          <AppointmentCard
            key={item.id}
            appointment={item}
            role="MEDECIN"
            onPress={() => setDetailRdv(item)}
            onAnnuler={() => openMotifModal(item.id)}
            onRealise={() => handleRealise(item.id)}
            onAbsent={() => handleAbsent(item.id)}
          />
        ))
      )}

      <Modal visible={motifModal.visible} transparent animationType="fade" onRequestClose={closeMotifModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Annuler le rendez-vous</Text>
            <Text style={styles.modalSubtitle}>Le motif d’annulation est obligatoire.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Motif d'annulation"
              value={motifModal.motif}
              onChangeText={(text) => setMotifModal((m) => ({ ...m, motif: text }))}
              multiline
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={closeMotifModal}>
                <Text style={styles.modalButtonCancelText}>Retour</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonConfirm} onPress={confirmAnnulation}>
                <Text style={styles.modalButtonConfirmText}>Confirmer l’annulation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {modal}

      <Modal visible={!!detailRdv} transparent animationType="fade" onRequestClose={() => setDetailRdv(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Détails du rendez-vous</Text>
            {detailRdv && (
              <View style={styles.detailBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Délégué</Text>
                  <Text style={styles.detailValue}>{detailRdv.delegue?.nom}</Text>
                </View>
                {detailRdv.delegue?.laboName ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Laboratoire</Text>
                    <Text style={[styles.detailValue, styles.detailValueBold]}>{detailRdv.delegue.laboName}</Text>
                  </View>
                ) : null}
                {detailRdv.delegue?.telephone ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Téléphone</Text>
                    <Text style={styles.detailValue}>{detailRdv.delegue.telephone}</Text>
                  </View>
                ) : null}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{formatFriendlyDate(detailRdv.date)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Heure</Text>
                  <Text style={styles.detailValue}>{detailRdv.heure}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Statut</Text>
                  <Text style={styles.detailValue}>{detailRdv.statut}</Text>
                </View>
              </View>
            )}
            <TouchableOpacity style={styles.detailCloseBtn} onPress={() => setDetailRdv(null)}>
              <Text style={styles.detailCloseBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 24,
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
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  countBadgeText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '700',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 14,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: '#f8fafc',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  modalButtonCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalButtonConfirm: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#ef4444',
  },
  modalButtonConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  detailBody: {
    marginTop: 12,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
  },
  detailValueBold: {
    fontWeight: '800',
    color: '#1971c2',
  },
  detailCloseBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  detailCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
});
