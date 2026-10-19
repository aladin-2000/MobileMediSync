// app/medecin/index.js
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getCreneauxMedecin, ajouterPlage, supprimerJour, supprimerCreneau } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CustomCalendar from '../../components/CustomCalendar';
import TimePicker from '../../components/TimePicker';
import RefreshButton from '../../components/RefreshButton';
import useConfirmModal from '../../hooks/useConfirmModal';

const getTodayString = () => new Date().toISOString().split('T')[0];

const TEMPLATES = {
  matin: { label: 'Matin', heureDebut: '09:00', heureFin: '12:00' },
  aprem: { label: 'Après-midi', heureDebut: '14:00', heureFin: '17:30' },
  journee: { label: 'Journée entière', heureDebut: '09:00', heureFin: '17:30' },
};

const formatDateFR = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

const isWeekendDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  return day === 0 || day === 6;
};

export default function DisponibilitesScreen() {
  const { medecinId } = useAuth();
  const [creneaux, setCreneaux] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(getTodayString());

  const [modalVisible, setModalVisible] = useState(false);
  const [expandedList, setExpandedList] = useState(null);
  const [editingTimeField, setEditingTimeField] = useState(null);
  const [heureDebut, setHeureDebut] = useState(TEMPLATES.matin.heureDebut);
  const [heureFin, setHeureFin] = useState(TEMPLATES.matin.heureFin);
  const [dateDebut, setDateDebut] = useState(getTodayString());
  const [dateFin, setDateFin] = useState(getTodayString());
  const [showDatePicker, setShowDatePicker] = useState(null);
  const [template, setTemplate] = useState(null);
  const { confirm, notify, modal } = useConfirmModal();

  const fetchCreneaux = useCallback(async (year, month) => {
    if (!medecinId) return;
    const dateDebut = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const dernierJour = new Date(year, month + 1, 0).getDate();
    const dateFin = `${year}-${String(month + 1).padStart(2, '0')}-${String(dernierJour).padStart(2, '0')}`;
    try {
      const data = await getCreneauxMedecin(medecinId, dateDebut, dateFin);
      setCreneaux(data.filter((c) => c.statut !== 'ANNULE'));
    } catch (error) {
      notify({ title: 'Erreur', message: error.message, variant: 'error' });
    }
  }, [medecinId]);

  const handleMonthChange = useCallback((year, month) => {
    setViewYear(year);
    setViewMonth(month);
    fetchCreneaux(year, month);
  }, [fetchCreneaux]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCreneaux(viewYear, viewMonth);
    setRefreshing(false);
  };

  const daySlots = creneaux.filter((c) => c.date === selectedDate);
  const sortByTime = (a, b) => a.heureDebut.localeCompare(b.heureDebut);
  const libres = daySlots.filter((c) => c.statut === 'DISPONIBLE').sort(sortByTime);
  const reserves = daySlots.filter((c) => c.statut === 'RESERVE').sort(sortByTime);

  const monthTotal = creneaux.length;
  const monthReserves = creneaux.filter((c) => c.statut === 'RESERVE').length;
  const monthTaux = monthTotal ? Math.round((monthReserves / monthTotal) * 100) : 0;

  const openAddModal = () => {
    setTemplate(null);
    setHeureDebut(TEMPLATES.matin.heureDebut);
    setHeureFin(TEMPLATES.matin.heureFin);
    setDateDebut(selectedDate);
    setDateFin(selectedDate);
    setModalVisible(true);
  };

  const applyTemplate = (key) => {
    setTemplate(key);
    setHeureDebut(TEMPLATES[key].heureDebut);
    setHeureFin(TEMPLATES[key].heureFin);
  };

  const estimateSlots = useMemo(() => {
    const [hD, mD] = heureDebut.split(':').map(Number);
    const [hF, mF] = heureFin.split(':').map(Number);
    const minutesPerDay = (hF * 60 + mF) - (hD * 60 + mD);
    if (minutesPerDay <= 0) return 0;
    const slotsPerDay = Math.floor(minutesPerDay / 15);
    let days = 0;
    const start = new Date(dateDebut + 'T00:00:00');
    const end = new Date(dateFin + 'T00:00:00');
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) days++;
    }
    return slotsPerDay * days;
  }, [heureDebut, heureFin, dateDebut, dateFin]);

  const confirmAddSlots = async () => {
    if (isWeekendDate(dateDebut) && dateDebut === dateFin) {
      notify({ title: 'Week-end', message: 'Impossible de planifier des créneaux le samedi ou dimanche.', variant: 'warning' });
      return;
    }
    try {
      await ajouterPlage(medecinId, {
        dateDebut,
        dateFin,
        heureDebut,
        heureFin,
      });
      setModalVisible(false);
      fetchCreneaux(viewYear, viewMonth);
      const msg = dateDebut === dateFin
        ? `Disponibilités ajoutées pour le ${formatDateFR(dateDebut)}, de ${heureDebut} à ${heureFin}.`
        : `Disponibilités ajoutées du ${formatDateFR(dateDebut)} au ${formatDateFR(dateFin)}, de ${heureDebut} à ${heureFin}.`;
      notify({ title: 'Créneaux créés', message: msg, variant: 'success' });
    } catch (error) {
      notify({ title: 'Erreur', message: error.message, variant: 'error' });
    }
  };

  const handleDeleteSlot = async (slot) => {
    const ok = await confirm({
      title: 'Supprimer ce créneau',
      message: `Supprimer le créneau de ${slot.heureDebut.slice(0,5)} à ${slot.heureFin.slice(0,5)} ?`,
      variant: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
    });
    if (!ok) return;
    try {
      await supprimerCreneau(medecinId, slot.id);
      fetchCreneaux(viewYear, viewMonth);
    } catch (error) {
      notify({ title: 'Erreur', message: error.message, variant: 'error' });
    }
  };

  const confirmDeleteFreeSlots = async () => {
    if (libres.length === 0) return;
    const ok = await confirm({
      title: 'Libérer cette journée',
      message: 'Voulez-vous retirer tous les créneaux libres de cette journée ? Les rendez-vous déjà réservés resteront intacts.',
      variant: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
    });
    if (!ok) return;
    try {
      await supprimerJour(medecinId, selectedDate);
      fetchCreneaux(viewYear, viewMonth);
    } catch (error) {
      notify({ title: 'Erreur', message: error.message, variant: 'error' });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Disponibilités</Text>
        <RefreshButton onPress={handleRefresh} loading={refreshing} />
      </View>

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
        onDaySelect={(d) => { setSelectedDate(d); setExpandedList(null); }}
        disableWeekends
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
          <>
            <View style={styles.summaryRow}>
              <TouchableOpacity
                style={[styles.summaryCard, expandedList === 'libres' && styles.summaryCardActive]}
                onPress={() => setExpandedList(expandedList === 'libres' ? null : 'libres')}
                activeOpacity={0.7}
              >
                <Text style={styles.summaryNum}>{libres.length}</Text>
                <Text style={styles.summaryLabel}>Libre{libres.length > 1 ? 's' : ''}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.summaryCard, styles.summaryCardReserve, expandedList === 'reserves' && styles.summaryCardActiveReserve]}
                onPress={() => setExpandedList(expandedList === 'reserves' ? null : 'reserves')}
                activeOpacity={0.7}
              >
                <Text style={[styles.summaryNum, styles.summaryNumReserve]}>{reserves.length}</Text>
                <Text style={styles.summaryLabel}>Réservé{reserves.length > 1 ? 's' : ''}</Text>
              </TouchableOpacity>
            </View>

            {expandedList === 'libres' && libres.map((slot) => (
              <View key={slot.id} style={styles.slotRow}>
                <View style={styles.slotInfo}>
                  <Text style={styles.slotTime}>{slot.heureDebut.slice(0,5)} – {slot.heureFin.slice(0,5)}</Text>
                </View>
                <TouchableOpacity style={styles.slotDeleteBtn} onPress={() => handleDeleteSlot(slot)} activeOpacity={0.7}>
                  <Text style={styles.slotDeleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {expandedList === 'reserves' && reserves.map((slot) => (
              <View key={slot.id} style={styles.slotRow}>
                <View style={styles.slotInfo}>
                  <Text style={styles.slotTime}>{slot.heureDebut.slice(0,5)} – {slot.heureFin.slice(0,5)}</Text>
                  <View style={[styles.slotBadge, styles.slotBadgeReserve]}>
                    <Text style={[styles.slotBadgeText, styles.slotBadgeTextReserve]}>Réservé</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </View>

      {/* Modal: Planifier des créneaux */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.modalCard}>
            <Text style={styles.modalTitle}>Planifier des créneaux</Text>
            <Text style={styles.modalSubtitle}>Choisissez la période et les horaires</Text>

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

            <Text style={styles.fieldSectionLabel}>Période</Text>
            <View style={styles.timeFieldRow}>
              <TouchableOpacity style={styles.timeField} onPress={() => setShowDatePicker('debut')} activeOpacity={0.7}>
                <Text style={styles.timeFieldLabel}>Du</Text>
                <Text style={styles.timeFieldValue}>{formatDateFR(dateDebut)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.timeField} onPress={() => setShowDatePicker('fin')} activeOpacity={0.7}>
                <Text style={styles.timeFieldLabel}>Au</Text>
                <Text style={styles.timeFieldValue}>{formatDateFR(dateFin)}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldSectionLabel}>Horaires</Text>
            <View style={styles.timeFieldRow}>
              <TouchableOpacity style={styles.timeField} onPress={() => setEditingTimeField('heureDebut')} activeOpacity={0.7}>
                <Text style={styles.timeFieldLabel}>De</Text>
                <Text style={styles.timeFieldValue}>{heureDebut}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.timeField} onPress={() => setEditingTimeField('heureFin')} activeOpacity={0.7}>
                <Text style={styles.timeFieldLabel}>À</Text>
                <Text style={styles.timeFieldValue}>{heureFin}</Text>
              </TouchableOpacity>
            </View>

            {estimateSlots > 0 && (
              <View style={styles.previewBanner}>
                <Text style={styles.previewText}>Cette plage générera {estimateSlots} créneau{estimateSlots > 1 ? 'x' : ''} de 15 min</Text>
              </View>
            )}

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

      {showDatePicker && (
        <DateTimePicker
          value={new Date((showDatePicker === 'debut' ? dateDebut : dateFin) + 'T00:00:00')}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={(event, selected) => {
            if (Platform.OS === 'android') setShowDatePicker(null);
            if (event.type !== 'dismissed' && selected) {
              const iso = selected.toISOString().split('T')[0];
              if (showDatePicker === 'debut') {
                setDateDebut(iso);
                if (iso > dateFin) setDateFin(iso);
              } else {
                setDateFin(iso < dateDebut ? dateDebut : iso);
              }
            }
            if (Platform.OS === 'ios') setShowDatePicker(null);
          }}
        />
      )}

      <TimePicker
        visible={editingTimeField !== null}
        value={editingTimeField === 'heureDebut' ? heureDebut : heureFin}
        onChange={(value) => (editingTimeField === 'heureDebut' ? setHeureDebut(value) : setHeureFin(value))}
        onClose={() => setEditingTimeField(null)}
      />

      {modal}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
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
    backgroundColor: '#059669',
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
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  summaryCardActive: {
    borderColor: '#059669',
    borderWidth: 2,
  },
  summaryCardReserve: {
    backgroundColor: '#ecfdf5',
    borderColor: '#d1fae5',
  },
  summaryCardActiveReserve: {
    borderColor: '#d97706',
    borderWidth: 2,
  },
  summaryNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  summaryNumReserve: {
    color: '#047857',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  slotRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    marginTop: 6, borderWidth: 1, borderColor: '#f1f5f9',
  },
  slotInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  slotTime: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  slotBadge: {
    backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  slotBadgeReserve: { backgroundColor: '#fef3c7' },
  slotBadgeText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  slotBadgeTextReserve: { color: '#d97706' },
  slotDeleteBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#fef2f2',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fee2e2',
  },
  slotDeleteText: { fontSize: 13, color: '#ef4444', fontWeight: '700' },
  previewBanner: {
    backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#d1fae5', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20,
  },
  previewText: { fontSize: 13, color: '#047857', fontWeight: '600', textAlign: 'center' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
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
    marginTop: 4,
    marginBottom: 18,
  },
  fieldSectionLabel: {
    fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  templateRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
    marginBottom: 20,
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
    backgroundColor: '#059669',
    borderColor: '#059669',
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
    gap: 12,
    marginBottom: 20,
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
    backgroundColor: '#059669',
  },
  modalConfirmText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
