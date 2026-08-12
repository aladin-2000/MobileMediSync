// app/delegue/index.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import { rechercherMedecins, getCreneauxMedecin, reserverRendezVous, getSpecialites } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DoctorCard from '../../components/DoctorCard';
import FilterSection from '../../components/FilterSection';
import RefreshButton from '../../components/RefreshButton';
import useConfirmModal from '../../hooks/useConfirmModal';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// Format a YYYY-MM-DD string as "22 Juillet 2026"
const formatFriendlyDate = (dateStr) => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${day} ${MONTHS_FR[monthIdx]} ${year}`;
};

const getTodayString = () => new Date().toISOString().split('T')[0];

// The visit date is mandatory: clicking a doctor needs to know which day's
// slots to show, so the filter always carries a concrete date (defaults to today).
const EMPTY_FILTERS = {
  nom: '',
  specialite: [],
  date: getTodayString(),
  heureDebut: '',
  heureFin: ''
};

export default function DoctorSearchScreen() {
  const { delegueId } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [specialites, setSpecialites] = useState([]);
  const { confirm, notify, modal } = useConfirmModal();

  const fetchDoctors = useCallback(async (filterValues) => {
    setLoading(true);
    try {
      const results = await rechercherMedecins(filterValues);
      setDoctors(results);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      notify({ title: 'Erreur', message: error.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load the initial, unfiltered list once. Filters are only applied when
  // the user presses "Appliquer les filtres" (see handleApply below).
  // Run in a microtask to avoid calling setState synchronously within the effect body.
  useEffect(() => {
    Promise.resolve().then(() => fetchDoctors(EMPTY_FILTERS));
  }, [fetchDoctors]);

  useEffect(() => {
    getSpecialites().then(setSpecialites).catch(() => {});
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApply = () => {
    fetchDoctors(filters);
  };

  const handleResetFilters = () => {
    setFilters(EMPTY_FILTERS);
    fetchDoctors(EMPTY_FILTERS);
  };

  // Show the doctor's available slots for the currently chosen visit date
  const loadSlots = (doctor) => {
    setSlotsLoading(true);
    getCreneauxMedecin(doctor.id, filters.date, filters.date)
      .then((creneaux) => setSlots(
        creneaux
          .filter((c) => c.statut === 'DISPONIBLE')
          .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut))
      ))
      .catch((error) => {
        console.error('Error fetching doctor slots:', error);
        setSlots([]);
      })
      .finally(() => setSlotsLoading(false));
  };

  const handleDoctorPress = (doctor) => {
    setSelectedDoctor(doctor);
    loadSlots(doctor);
  };

  const handleCloseSlots = () => {
    setSelectedDoctor(null);
    setSlots([]);
  };

  const handleBookSlot = async (creneau) => {
    const ok = await confirm({
      title: 'Réserver ce créneau ?',
      message: `${selectedDoctor?.nom} — ${formatFriendlyDate(filters.date)} à ${creneau.heureDebut}`,
      variant: 'question',
      confirmText: 'Réserver',
      cancelText: 'Annuler',
    });
    if (!ok) return;

    setBooking(true);
    try {
      await reserverRendezVous({ creneauId: creneau.id, delegueId, medecinId: selectedDoctor.id });
      handleCloseSlots();
      notify({
        title: 'Rendez-vous réservé',
        message: `Créneau du ${filters.date} à ${creneau.heureDebut} confirmé.`,
        variant: 'success',
      });
    } catch (error) {
      notify({ title: 'Réservation impossible', message: error.message, variant: 'error' });
      loadSlots(selectedDoctor);
    } finally {
      setBooking(false);
    }
  };

  // Count active filters (ignoring empty strings and empty arrays)
  const activeFiltersCount = Object.values(filters).filter(
    val => (Array.isArray(val) ? val.length > 0 : val !== '')
  ).length;

  const isPastDate = filters.date < getTodayString();

  return (
    <View style={styles.container}>
      {/* Results Header */}
      <View style={styles.filtersToggleHeader}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.resultsCount}>
            {doctors.length} médecin{doctors.length > 1 ? 's' : ''} trouvé{doctors.length > 1 ? 's' : ''}
          </Text>
          {activeFiltersCount > 0 && (
            <View style={styles.activeFiltersIndicator}>
              <Text style={styles.activeFiltersIndicatorText}>{activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>
        <RefreshButton onPress={() => fetchDoctors(filters)} loading={loading} />
      </View>

      {/* Doctors List - the filter section scrolls together with the results
          as the FlatList's header, so expanding it never clips the list */}
      <FlatList
        style={styles.list}
        data={isPastDate || loading ? [] : doctors}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DoctorCard doctor={item} onPress={() => handleDoctorPress(item)} />}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <FilterSection
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            onApply={handleApply}
            specialites={specialites}
          />
        }
        ListEmptyComponent={
          isPastDate ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text style={styles.emptyTitle}>Cette date est déjà passée</Text>
              <Text style={styles.emptySubtitle}>Choisissez une autre date pour pouvoir réserver un rendez-vous.</Text>
            </View>
          ) : loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Chargement des médecins...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🔎</Text>
              <Text style={styles.emptyTitle}>Aucun médecin trouvé</Text>
              <Text style={styles.emptySubtitle}>Essayez de modifier ou réinitialiser vos filtres de recherche.</Text>
            </View>
          )
        }
      />

      {/* Doctor Slots Modal */}
      <Modal
        visible={selectedDoctor !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCloseSlots}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={handleCloseSlots}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.slotsCard}>
            <Text style={styles.slotsDoctorName}>{selectedDoctor?.nom}</Text>
            <Text style={styles.slotsDate}>{formatFriendlyDate(filters.date)}</Text>

            {slotsLoading ? (
              <ActivityIndicator size="small" color="#3b82f6" style={styles.slotsLoading} />
            ) : slots.length > 0 ? (
              <View style={styles.slotsGrid}>
                {slots.map((slot) => (
                  <TouchableOpacity
                    key={slot.id}
                    style={styles.slotChip}
                    onPress={() => handleBookSlot(slot)}
                    disabled={booking}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.slotChipText}>{slot.heureDebut}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.slotsEmptyText}>Aucun créneau disponible ce jour-là.</Text>
            )}
            {booking && <ActivityIndicator size="small" color="#3b82f6" style={styles.slotsLoading} />}

            <TouchableOpacity style={styles.modalCloseButton} onPress={handleCloseSlots} activeOpacity={0.8}>
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {modal}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  filtersToggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeFiltersIndicator: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  activeFiltersIndicatorText: {
    fontSize: 11,
    color: '#1d4ed8',
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 24,
    paddingTop: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    width: '85%',
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  slotsDoctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  slotsDate: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  slotsLoading: {
    marginVertical: 20,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  slotChip: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  slotChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  slotsEmptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginVertical: 12,
  },
  modalCloseButton: {
    marginTop: 18,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
