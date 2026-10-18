// components/FilterSection.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import CustomCalendar from './CustomCalendar';
import TimePicker from './TimePicker';

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

export default function FilterSection({ filters, onFilterChange, onReset, onApply, specialites = [], regions = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [specialiteDropdownVisible, setSpecialiteDropdownVisible] = useState(false);
  const [regionDropdownVisible, setRegionDropdownVisible] = useState(false);
  const [editingTimeField, setEditingTimeField] = useState(null); // 'heureDebut' | 'heureFin' | null

  const isPastDate = filters.date < getTodayString();

  // Specialty is a multi-select: toggle the value in/out of the array
  const toggleSpecialite = (spec) => {
    const current = filters.specialite || [];
    const next = current.includes(spec)
      ? current.filter((s) => s !== spec)
      : [...current, spec];
    onFilterChange('specialite', next);
  };

  const specialitesLabel = (() => {
    const selected = filters.specialite || [];
    if (selected.length === 0) return 'Toutes les spécialités';
    if (selected.length === 1) return specialites.find((s) => s.valeur === selected[0])?.libelle ?? selected[0];
    return `${selected.length} spécialités sélectionnées`;
  })();

  const handleDaySelect = (dateStr) => {
    onFilterChange('date', dateStr);
    setCalendarVisible(false);
  };

  // Region is a single-select: pick one value and close, unlike specialty's checkbox list
  const selectRegion = (valeur) => {
    onFilterChange('regionId', valeur);
    setRegionDropdownVisible(false);
  };

  const regionLabel = (() => {
    if (!filters.regionId) return 'Toutes les régions';
    return regions.find((r) => r.valeur === filters.regionId)?.libelle ?? filters.regionId;
  })();

  const handleTimeChange = (value) => {
    onFilterChange(editingTimeField, value);
  };

  // "Plus/Moins de filtres" toggle, with a subtle "Réinitialiser" link next to it once expanded
  // (no more a full-width red button competing visually with "Lancer la recherche").
  const toggleRow = (
    <View style={styles.toggleRow}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <Text style={styles.expandToggleText}>
          {expanded ? 'Moins de filtres ▲' : 'Plus de filtres ▼'}
        </Text>
      </TouchableOpacity>
      {expanded && (
        <TouchableOpacity onPress={onReset} activeOpacity={0.7}>
          <Text style={styles.resetLinkText}>Réinitialiser</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Date Filter - always visible */}
      <Text style={styles.sectionTitle}>Date de visite</Text>
      <TouchableOpacity
        style={styles.dateField}
        onPress={() => setCalendarVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.dateFieldEmoji}>📅</Text>
        <Text style={styles.dateFieldText}>
          {filters.date ? formatFriendlyDate(filters.date) : 'Sélectionner une date'}
        </Text>
      </TouchableOpacity>

      {isPastDate && (
        <Text style={styles.pastDateWarning}>⚠️ Cette date est déjà passée.</Text>
      )}

      {toggleRow}

      {expanded && (
        <>
          {/* Search Input */}
          <Text style={styles.sectionTitle}>Rechercher par nom</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Entrez le nom du médecin..."
            placeholderTextColor="#94a3b8"
            value={filters.nom || ''}
            onChangeText={(text) => onFilterChange('nom', text)}
          />

          {/* Specialty Filter - liste déroulante à cases à cocher, une ou plusieurs spécialités */}
          <Text style={styles.sectionTitle}>Spécialité</Text>
          <TouchableOpacity
            style={styles.dateField}
            onPress={() => setSpecialiteDropdownVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dateFieldEmoji}>🩺</Text>
            <Text style={styles.dateFieldText}>{specialitesLabel}</Text>
          </TouchableOpacity>

          {/* Region Filter - single-select dropdown */}
          <Text style={styles.sectionTitle}>Région</Text>
          <TouchableOpacity
            style={styles.dateField}
            onPress={() => setRegionDropdownVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dateFieldEmoji}>📍</Text>
            <Text style={styles.dateFieldText}>{regionLabel}</Text>
          </TouchableOpacity>

          {/* Time Range Filter - tap to pick with the OS's native time picker */}
          <Text style={styles.sectionTitle}>Plage horaire</Text>
          <View style={styles.timeFieldRow}>
            <TouchableOpacity
              style={[styles.dateField, styles.timeField]}
              onPress={() => setEditingTimeField('heureDebut')}
              activeOpacity={0.7}
            >
              <Text style={styles.dateFieldEmoji}>🕐</Text>
              <Text style={styles.dateFieldText}>{filters.heureDebut || 'Heure début'}</Text>
              {filters.heureDebut ? (
                <TouchableOpacity onPress={() => onFilterChange('heureDebut', '')} hitSlop={8}>
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateField, styles.timeField]}
              onPress={() => setEditingTimeField('heureFin')}
              activeOpacity={0.7}
            >
              <Text style={styles.dateFieldEmoji}>🕐</Text>
              <Text style={styles.dateFieldText}>{filters.heureFin || 'Heure fin'}</Text>
              {filters.heureFin ? (
                <TouchableOpacity onPress={() => onFilterChange('heureFin', '')} hitSlop={8}>
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          </View>

        </>
      )}

      {/* Apply button - disabled when the chosen visit date is in the past */}
      <TouchableOpacity
        style={[styles.applyButton, isPastDate && styles.applyButtonDisabled]}
        onPress={onApply}
        disabled={isPastDate}
        activeOpacity={0.8}
      >
        <Text style={styles.applyButtonText}>Lancer la recherche</Text>
      </TouchableOpacity>

      {/* Date Picker Modal */}
      <Modal
        visible={calendarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCalendarVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <CustomCalendar
              selectedDate={filters.date || getTodayString()}
              onDaySelect={handleDaySelect}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setCalendarVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Time Picker (shared by "Heure début" and "Heure fin") */}
      <TimePicker
        visible={editingTimeField !== null}
        value={editingTimeField ? filters[editingTimeField] : ''}
        onChange={handleTimeChange}
        onClose={() => setEditingTimeField(null)}
      />

      {/* Specialty Dropdown Modal - liste à cases à cocher, comme le web */}
      <Modal
        visible={specialiteDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSpecialiteDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSpecialiteDropdownVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.specialiteCard}>
            <Text style={styles.specialiteCardTitle}>Spécialités</Text>
            <ScrollView style={styles.specialiteList}>
              {specialites.map((opt) => {
                const isSelected = (filters.specialite || []).includes(opt.valeur);
                return (
                  <TouchableOpacity
                    key={opt.valeur}
                    style={styles.specialiteOption}
                    onPress={() => toggleSpecialite(opt.valeur)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                      {isSelected && <Text style={styles.checkboxMark}>✓</Text>}
                    </View>
                    <Text style={styles.specialiteOptionText}>{opt.libelle}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.specialiteCloseButton}
              onPress={() => setSpecialiteDropdownVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Region Dropdown Modal - liste à choix unique, comme le web */}
      <Modal
        visible={regionDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRegionDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setRegionDropdownVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.specialiteCard}>
            <Text style={styles.specialiteCardTitle}>Région</Text>
            <ScrollView style={styles.specialiteList}>
              <TouchableOpacity
                style={styles.specialiteOption}
                onPress={() => selectRegion('')}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, !filters.regionId && styles.checkboxChecked]}>
                  {!filters.regionId && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={styles.specialiteOptionText}>Toutes les régions</Text>
              </TouchableOpacity>
              {regions.map((opt) => {
                const isSelected = filters.regionId === opt.valeur;
                return (
                  <TouchableOpacity
                    key={opt.valeur}
                    style={styles.specialiteOption}
                    onPress={() => selectRegion(opt.valeur)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                      {isSelected && <Text style={styles.checkboxMark}>✓</Text>}
                    </View>
                    <Text style={styles.specialiteOptionText}>{opt.libelle}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.specialiteCloseButton}
              onPress={() => setRegionDropdownVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 6,
  },
  searchInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 8,
  },
  clearIcon: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '800',
    marginLeft: 'auto',
  },
  timeFieldRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeField: {
    flex: 1,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dateFieldEmoji: {
    fontSize: 16,
  },
  dateFieldText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  pastDateWarning: {
    fontSize: 12,
    color: '#b45309',
    fontWeight: '600',
    marginTop: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 2,
  },
  expandToggleText: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '700',
  },
  resetLinkText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  applyButton: {
    marginTop: 14,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  applyButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    marginHorizontal: 16,
    marginTop: -8,
    marginBottom: 16,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  specialiteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
    width: '85%',
    maxHeight: '70%',
  },
  specialiteCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  specialiteList: {
    maxHeight: 320,
  },
  specialiteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  checkboxMark: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '800',
  },
  specialiteOptionText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  specialiteCloseButton: {
    marginTop: 12,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});
