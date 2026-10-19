// components/FilterSection.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import CustomCalendar from './CustomCalendar';
import TimePicker from './TimePicker';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

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
  const [calendarTarget, setCalendarTarget] = useState(null); // 'dateDebut' | 'dateFin' | null
  const [specialiteDropdownVisible, setSpecialiteDropdownVisible] = useState(false);
  const [regionDropdownVisible, setRegionDropdownVisible] = useState(false);
  const [editingTimeField, setEditingTimeField] = useState(null);

  const isPastDate = filters.dateDebut < getTodayString();

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
    return `${selected.length} spécialités`;
  })();

  const handleDaySelect = (dateStr) => {
    onFilterChange(calendarTarget, dateStr);
    if (calendarTarget === 'dateDebut' && dateStr > filters.dateFin) {
      onFilterChange('dateFin', dateStr);
    }
    setCalendarTarget(null);
  };

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

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.mainTitle}>Trouver un médecin</Text>
        <TouchableOpacity onPress={onReset} activeOpacity={0.7}>
          <Text style={styles.resetLinkText}>Réinitialiser</Text>
        </TouchableOpacity>
      </View>

      {/* Nom */}
      <Text style={styles.sectionTitle}>Nom</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Nom du médecin"
        placeholderTextColor="#94a3b8"
        value={filters.nom || ''}
        onChangeText={(text) => onFilterChange('nom', text)}
      />

      {/* Spécialité & Région on same row */}
      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.sectionTitle}>Spécialité</Text>
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setSpecialiteDropdownVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.selectFieldText} numberOfLines={1}>{specialitesLabel}</Text>
            <Text style={styles.chevron}>▾</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.half}>
          <Text style={styles.sectionTitle}>Région</Text>
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setRegionDropdownVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.selectFieldText} numberOfLines={1}>{regionLabel}</Text>
            <Text style={styles.chevron}>▾</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date range Du / Au */}
      <Text style={styles.sectionTitle}>Période de disponibilité</Text>
      <View style={styles.row}>
        <View style={styles.half}>
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setCalendarTarget('dateDebut')}
            activeOpacity={0.7}
          >
            <Text style={styles.fieldLabel}>Du</Text>
            <Text style={styles.selectFieldText} numberOfLines={1}>
              {filters.dateDebut ? formatFriendlyDate(filters.dateDebut) : 'Date début'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.half}>
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setCalendarTarget('dateFin')}
            activeOpacity={0.7}
          >
            <Text style={styles.fieldLabel}>Au</Text>
            <Text style={styles.selectFieldText} numberOfLines={1}>
              {filters.dateFin ? formatFriendlyDate(filters.dateFin) : 'Date fin'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isPastDate && (
        <Text style={styles.pastDateWarning}>Cette date de début est déjà passée.</Text>
      )}

      {/* Time range */}
      <Text style={styles.sectionTitle}>Plage horaire</Text>
      <View style={styles.row}>
        <View style={styles.half}>
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setEditingTimeField('heureDebut')}
            activeOpacity={0.7}
          >
            <Text style={styles.fieldLabel}>De</Text>
            <Text style={styles.selectFieldText}>{filters.heureDebut || 'Début'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.half}>
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setEditingTimeField('heureFin')}
            activeOpacity={0.7}
          >
            <Text style={styles.fieldLabel}>À</Text>
            <Text style={styles.selectFieldText}>{filters.heureFin || 'Fin'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search button */}
      <TouchableOpacity
        style={[styles.applyButton, isPastDate && styles.applyButtonDisabled]}
        onPress={onApply}
        disabled={isPastDate}
        activeOpacity={0.8}
      >
        <Text style={styles.applyButtonText}>Rechercher</Text>
      </TouchableOpacity>

      {/* Calendar Modal */}
      <Modal
        visible={calendarTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarTarget(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCalendarTarget(null)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <CustomCalendar
              selectedDate={calendarTarget ? (filters[calendarTarget] || getTodayString()) : getTodayString()}
              onDaySelect={handleDaySelect}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setCalendarTarget(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Time Picker */}
      <TimePicker
        visible={editingTimeField !== null}
        value={editingTimeField ? filters[editingTimeField] : ''}
        onChange={handleTimeChange}
        onClose={() => setEditingTimeField(null)}
      />

      {/* Specialty Dropdown Modal */}
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
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.pickerCard}>
            <Text style={styles.pickerCardTitle}>Spécialités</Text>
            <ScrollView style={styles.pickerList}>
              {specialites.map((opt) => {
                const isSelected = (filters.specialite || []).includes(opt.valeur);
                return (
                  <TouchableOpacity
                    key={opt.valeur}
                    style={styles.pickerOption}
                    onPress={() => toggleSpecialite(opt.valeur)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                      {isSelected && <Text style={styles.checkboxMark}>✓</Text>}
                    </View>
                    <Text style={styles.pickerOptionText}>{opt.libelle}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.pickerCloseButton}
              onPress={() => setSpecialiteDropdownVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseButtonText}>Fermer</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Region Dropdown Modal */}
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
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.pickerCard}>
            <Text style={styles.pickerCardTitle}>Région</Text>
            <ScrollView style={styles.pickerList}>
              <TouchableOpacity
                style={styles.pickerOption}
                onPress={() => selectRegion('')}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, !filters.regionId && styles.checkboxChecked]}>
                  {!filters.regionId && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={styles.pickerOptionText}>Toutes les régions</Text>
              </TouchableOpacity>
              {regions.map((opt) => {
                const isSelected = filters.regionId === opt.valeur;
                return (
                  <TouchableOpacity
                    key={opt.valeur}
                    style={styles.pickerOption}
                    onPress={() => selectRegion(opt.valeur)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                      {isSelected && <Text style={styles.checkboxMark}>✓</Text>}
                    </View>
                    <Text style={styles.pickerOptionText}>{opt.libelle}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.pickerCloseButton}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mainTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  resetLinkText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  half: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
  },
  selectFieldText: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  chevron: {
    fontSize: 12,
    color: '#94a3b8',
  },
  clearIcon: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '800',
  },
  pastDateWarning: {
    fontSize: 12,
    color: '#b45309',
    fontWeight: '600',
    marginTop: 6,
  },
  applyButton: {
    marginTop: 14,
    backgroundColor: '#059669',
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
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  pickerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
    width: '85%',
    maxHeight: '70%',
  },
  pickerCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  pickerList: {
    maxHeight: 320,
  },
  pickerOption: {
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
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkboxMark: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '800',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  pickerCloseButton: {
    marginTop: 12,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});
