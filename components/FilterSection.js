// components/FilterSection.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal } from 'react-native';
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

export default function FilterSection({ filters, onFilterChange, onReset, onApply, specialites = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
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

  const handleDaySelect = (dateStr) => {
    onFilterChange('date', dateStr);
    setCalendarVisible(false);
  };

  const handleTimeChange = (value) => {
    onFilterChange(editingTimeField, value);
  };

  const handleClearTime = () => {
    onFilterChange(editingTimeField, '');
    setEditingTimeField(null);
  };

  // Same button shown either above or below "Appliquer" depending on expanded state
  const toggleButton = (
    <TouchableOpacity
      style={styles.expandToggle}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <Text style={styles.expandToggleText}>
        {expanded ? 'Moins de filtres ▲' : 'Plus de filtres ▼'}
      </Text>
    </TouchableOpacity>
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

      {/* More/Less filters toggle - shown above only when collapsed */}
      {!expanded && toggleButton}

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

          {/* Specialty Filter - multi-select, une ou plusieurs spécialités */}
          <Text style={styles.sectionTitle}>Spécialité</Text>
          <View style={styles.chipsGrid}>
            {specialites.map((opt) => {
              const isSelected = (filters.specialite || []).includes(opt.valeur);
              return (
                <TouchableOpacity
                  key={opt.valeur}
                  onPress={() => toggleSpecialite(opt.valeur)}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {opt.libelle}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Time Range Filter - tap to pick with the wheel picker */}
          <Text style={styles.sectionTitle}>Plage horaire</Text>
          <View style={styles.timeFieldRow}>
            <TouchableOpacity
              style={[styles.dateField, styles.timeField]}
              onPress={() => setEditingTimeField('heureDebut')}
              activeOpacity={0.7}
            >
              <Text style={styles.dateFieldEmoji}>🕐</Text>
              <Text style={styles.dateFieldText}>{filters.heureDebut || 'Heure début'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateField, styles.timeField]}
              onPress={() => setEditingTimeField('heureFin')}
              activeOpacity={0.7}
            >
              <Text style={styles.dateFieldEmoji}>🕐</Text>
              <Text style={styles.dateFieldText}>{filters.heureFin || 'Heure fin'}</Text>
            </TouchableOpacity>
          </View>

          {/* Reset button */}
          <TouchableOpacity style={styles.resetButton} onPress={onReset} activeOpacity={0.8}>
            <Text style={styles.resetButtonText}>Réinitialiser tous les filtres</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Apply button - disabled when the chosen visit date is in the past */}
      <TouchableOpacity
        style={[styles.applyButton, isPastDate && styles.applyButtonDisabled]}
        onPress={onApply}
        disabled={isPastDate}
        activeOpacity={0.8}
      >
        <Text style={styles.applyButtonText}>Appliquer les filtres</Text>
      </TouchableOpacity>

      {/* More/Less filters toggle - shown below Apply only when expanded */}
      {expanded && toggleButton}

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

      {/* Time Picker Modal (shared by "Heure début" and "Heure fin") */}
      <Modal
        visible={editingTimeField !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingTimeField(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setEditingTimeField(null)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <TimePicker
              value={editingTimeField ? filters[editingTimeField] : ''}
              onChange={handleTimeChange}
            />
            <View style={styles.timeModalButtonRow}>
              <TouchableOpacity style={styles.clearButton} onPress={handleClearTime} activeOpacity={0.8}>
                <Text style={styles.clearButtonText}>Effacer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCloseButton, styles.timeModalConfirmButton]}
                onPress={() => setEditingTimeField(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCloseButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
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
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  chipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  timeFieldRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeField: {
    flex: 1,
  },
  resetButton: {
    marginTop: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 13,
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
  expandToggle: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 2,
  },
  expandToggleText: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '700',
  },
  applyButton: {
    marginTop: 14,
    backgroundColor: '#3b82f6',
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
  timeModalButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: -8,
    marginBottom: 16,
  },
  timeModalConfirmButton: {
    flex: 1,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 14,
  },
});
