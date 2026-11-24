// components/OptionPickerModal.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';

/** Minuscule + sans accents : « hopital » trouve « Hôpital ». */
const normaliser = (texte) =>
  (texte ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const MAX_RESULTATS = 50;

/**
 * Sélecteur simple dans une modale (même rendu que les pickers spécialité / région).
 * - `options` : [{ valeur, libelle, sousLibelle? }] (sousLibelle affiché à droite, ex. la région).
 * - `emptyLabel` (optionnel) ajoute une première ligne qui renvoie '' — pour un champ facultatif.
 * - `searchable` (optionnel) affiche un champ de recherche qui filtre la liste au fil de la saisie
 *   (insensible aux accents / à la casse, plusieurs mots dans n'importe quel ordre, sur
 *   libellé + sous-libellé).
 */
export default function OptionPickerModal({
  visible, title, options, selected, onSelect, onClose, emptyLabel,
  searchable = false, searchPlaceholder = 'Rechercher…',
}) {
  const [query, setQuery] = useState('');

  // Recherche remise à zéro à chaque ouverture
  useEffect(() => {
    if (visible) setQuery('');
  }, [visible]);

  const filtrees = useMemo(() => {
    const mots = normaliser(query).split(/\s+/).filter(Boolean);
    const liste = mots.length === 0
      ? options
      : options.filter((opt) => {
          const cible = normaliser(`${opt.libelle} ${opt.sousLibelle ?? ''}`);
          return mots.every((m) => cible.includes(m));
        });
    return searchable ? liste.slice(0, MAX_RESULTATS) : liste;
  }, [options, query, searchable]);

  // La ligne « vide » n'apparaît que si aucune recherche n'est en cours
  const rows = emptyLabel && !query.trim() ? [{ valeur: '', libelle: emptyLabel }, ...filtrees] : filtrees;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>{title}</Text>

            {searchable && (
              <View style={styles.searchWrapper}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder={searchPlaceholder}
                  placeholderTextColor="#a0a7b0"
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
                {query ? (
                  <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
                    <Text style={styles.searchClear}>✕</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            <ScrollView style={styles.pickerList} keyboardShouldPersistTaps="handled">
              {rows.map((opt) => {
                const active = selected === opt.valeur;
                return (
                  <TouchableOpacity
                    key={opt.valeur || '__vide__'}
                    style={styles.pickerRow}
                    onPress={() => {
                      onSelect(opt.valeur);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.pickerRowTextWrap}>
                      <Text style={[styles.pickerRowText, active && styles.pickerRowTextActive]}>{opt.libelle}</Text>
                      {opt.sousLibelle ? <Text style={styles.pickerRowSub}>{opt.sousLibelle}</Text> : null}
                    </View>
                    {active && <Text style={styles.pickerRowCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
              {rows.length === 0 && (
                <Text style={styles.emptyText}>Aucun résultat</Text>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center',
  },
  pickerCard: {
    backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 16, marginHorizontal: 24,
    width: '85%', maxHeight: '70%',
  },
  pickerTitle: {
    fontSize: 15, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 8, paddingHorizontal: 16,
  },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8,
    paddingHorizontal: 10, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, backgroundColor: '#f8fafc',
  },
  searchIcon: { fontSize: 13, marginRight: 6 },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 14, color: '#0f172a' },
  searchClear: { fontSize: 14, color: '#94a3b8', fontWeight: '700', paddingLeft: 6 },
  pickerList: { paddingHorizontal: 8 },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  pickerRowTextWrap: { flex: 1, paddingRight: 8 },
  pickerRowText: { fontSize: 14, color: '#334155', fontWeight: '600' },
  pickerRowTextActive: { color: '#047857', fontWeight: '800' },
  pickerRowSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  pickerRowCheck: { fontSize: 14, color: '#047857', fontWeight: '800' },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', paddingVertical: 16, fontSize: 13 },
});
