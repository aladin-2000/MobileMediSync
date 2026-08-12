// app/medecin/index.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ScrollView } from 'react-native';
import { getCreneauxMedecin, ajouterPlage, supprimerJour } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CustomCalendar from '../../components/CustomCalendar';
import TimePicker from '../../components/TimePicker';

const getTodayString = () => new Date().toISOString().split('T')[0];

const TEMPLATES = {
  matin: { label: 'Matin', heureDebut: '09:00', heureFin: '12:00' },
  aprem: { label: 'Après-midi', heureDebut: '14:00', heureFin: '17:30' },
};

export default function DisponibilitesScreen() {
  const { medecinId } = useAuth();
  const [creneaux, setCreneaux] = useState([]);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(getTodayString());

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTimeField, setEditingTimeField] = useState(null); // 'heureDebut' | 'heureFin' | null
  const [heureDebut, setHeureDebut] = useState(TEMPLATES.matin.heureDebut);
  const [heureFin, setHeureFin] = useState(TEMPLATES.matin.heureFin);
  const [template, setTemplate] = useState(null);

  const fetchCreneaux = useCallback(async (year, month) => {
    if (!medecinId) return;
    const dateDebut = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const dernierJour = new Date(year, month + 1, 0).getDate();
    const dateFin = `${year}-${String(month + 1).padStart(2, '0')}-${String(dernierJour).padStart(2, '0')}`;
    try {
      const data = await getCreneauxMedecin(medecinId, dateDebut, dateFin);
      setCreneaux(data.filter((c) => c.statut !== 'ANNULE'));
    } catch (error) {
      Alert.alert('Erreur', error.message);
    }
  }, [medecinId]);

  const handleMonthChange = useCallback((year, month) => {
    setViewYear(year);
    setViewMonth(month);
    fetchCreneaux(year, month);
  }, [fetchCreneaux]);

  const daySlots = creneaux.filter((c) => c.date === selectedDate);
  const libres = daySlots.filter((c) => c.statut === 'DISPONIBLE');
  const reserves = daySlots.filter((c) => c.statut === 'RESERVE');

  const monthTotal = creneaux.length;
  const monthReserves = creneaux.filter((c) => c.statut === 'RESERVE').length;
  const monthTaux = monthTotal ? Math.round((monthReserves / monthTotal) * 100) : 0;

  const openAddModal = () => {
    setTemplate(null);
    setHeureDebut(TEMPLATES.matin.heureDebut);
    setHeureFin(TEMPLATES.matin.heureFin);
    setModalVisible(true);
  };

  const applyTemplate = (key) => {
    setTemplate(key);
    setHeureDebut(TEMPLATES[key].heureDebut);
    setHeureFin(TEMPLATES[key].heureFin);
  };

  const confirmAddSlots = async () => {
    try {
      await ajouterPlage(medecinId, {
        dateDebut: selectedDate,
        dateFin: selectedDate,
        heureDebut,
        heureFin,
      });
      setModalVisible(false);
      fetchCreneaux(viewYear, viewMonth);
      Alert.alert('Créneaux créés', `Disponibilités ajoutées pour le ${selectedDate}, de ${heureDebut} à ${heureFin}.`);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    }
  };

  const confirmDeleteFreeSlots = () => {
    if (libres.length === 0) return;
    Alert.alert(
      'Libérer cette journée',
      'Voulez-vous retirer tous les créneaux libres de cette journée ? Les rendez-vous déjà réservés resteront intacts.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await supprimerJour(medecinId, selectedDate);
              fetchCreneaux(viewYear, viewMonth);
            } catch (error) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Stats du mois */}
      <View style={styles.statsRow}>
        <StatCard label="Créneaux ce mois" value={monthTotal} />
        <StatCard label="Réservés" value={monthReserves} />
        <StatCard label="Taux remplissage" value={`${monthTaux}%`} />
      </View>

      <CustomCalendar
        appointments={creneaux}
        selectedDate={selectedDate}
        onMonthChange={handleMonthChange}
        onDaySelect={setSelectedDate}
      />

      {/* Day panel */}
      <View style={styles.dayPanel}>
        <Text style={styles.dayPanelTitle}>{selectedDate}</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={openAddModal} activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>+ Planifier des créneaux</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerButton} onPress={confirmDeleteFreeSlots} activeOpacity={0.8}>
          <Text style={styles.dangerButtonText}>Supprimer les libres de ce jour</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Les créneaux réservés ne sont jamais supprimés</Text>

        {daySlots.length === 0 ? (
          <Text style={styles.emptyText}>Aucun créneau pour cette date.</Text>
        ) : (
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNum}>{libres.length}</Text>
              <Text style={styles.summaryLabel}>Libre{libres.length > 1 ? 's' : ''}</Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryCardReserve]}>
              <Text style={[styles.summaryNum, styles.summaryNumReserve]}>{reserves.length}</Text>
              <Text style={styles.summaryLabel}>Réservé{reserves.length > 1 ? 's' : ''}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Modal: Planifier des créneaux */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.modalCard}>
            <Text style={styles.modalTitle}>Planifier des créneaux</Text>
            <Text style={styles.modalSubtitle}>{selectedDate}</Text>

            <View style={styles.templateRow}>
              {Object.entries(TEMPLATES).map(([key, tpl]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.templateChip, template === key && styles.templateChipSelected]}
                  onPress={() => applyTemplate(key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.templateChipText, template === key && styles.templateChipTextSelected]}>
                    {tpl.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.timeFieldRow}>
              <TouchableOpacity style={styles.timeField} onPress={() => setEditingTimeField('heureDebut')} activeOpacity={0.7}>
                <Text style={styles.timeFieldLabel}>Début</Text>
                <Text style={styles.timeFieldValue}>{heureDebut}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.timeField} onPress={() => setEditingTimeField('heureFin')} activeOpacity={0.7}>
                <Text style={styles.timeFieldLabel}>Fin</Text>
                <Text style={styles.timeFieldValue}>{heureFin}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setModalVisible(false)} activeOpacity={0.8}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={confirmAddSlots} activeOpacity={0.8}>
                <Text style={styles.modalConfirmText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Time Picker (shared by "Début" et "Fin") */}
      <TimePicker
        visible={editingTimeField !== null}
        value={editingTimeField === 'heureDebut' ? heureDebut : heureFin}
        onChange={(value) => (editingTimeField === 'heureDebut' ? setHeureDebut(value) : setHeureFin(value))}
        onClose={() => setEditingTimeField(null)}
      />
    </ScrollView>
  );
}

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
  dayPanel: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  dayPanelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  dangerButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 13,
  },
  hint: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  summaryCardReserve: {
    backgroundColor: '#f0fdf4',
    borderColor: '#dcfce7',
  },
  summaryNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3b82f6',
  },
  summaryNumReserve: {
    color: '#15803d',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    width: '90%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 14,
  },
  templateRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
    marginBottom: 14,
  },
  templateChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  templateChipSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  templateChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  templateChipTextSelected: {
    color: '#ffffff',
  },
  timeFieldRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  timeField: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  timeFieldLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timeFieldValue: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '700',
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  modalCancelText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 14,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
  },
  modalConfirmText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
