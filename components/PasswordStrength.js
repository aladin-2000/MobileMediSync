// components/PasswordStrength.js
// Indicateur sous un champ « nouveau mot de passe » : barre de force + liste des critères,
// mis à jour à chaque frappe. Masqué tant que le champ est vide.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { passwordRules } from '../utils/passwordPolicy';

const NIVEAUX = {
  faible: { libelle: 'Faible', couleur: '#ef4444' },
  moyen: { libelle: 'Moyen', couleur: '#f97316' },
  fort: { libelle: 'Robuste', couleur: '#059669' },
};

export default function PasswordStrength({ password, style }) {
  if (!password) return null;

  const regles = passwordRules(password);
  const nbOk = regles.filter((r) => r.ok).length;
  const niveau = nbOk === regles.length ? 'fort' : nbOk >= 3 ? 'moyen' : 'faible';
  const { libelle, couleur } = NIVEAUX[niveau];

  return (
    <View style={[styles.container, style]} accessibilityLiveRegion="polite">
      <View style={styles.barRow}>
        <View style={styles.bar}>
          {regles.map((r, i) => (
            <View key={r.cle} style={[styles.seg, i < nbOk && { backgroundColor: couleur }]} />
          ))}
        </View>
        <Text style={[styles.level, { color: couleur }]}>{libelle}</Text>
      </View>

      {regles.map((r) => (
        <View key={r.cle} style={styles.rule}>
          <Text style={[styles.icon, r.ok ? styles.iconOk : styles.iconKo]}>{r.ok ? '✓' : '○'}</Text>
          <Text style={[styles.ruleText, r.ok && styles.ruleTextOk]}>{r.libelle}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  bar: { flex: 1, flexDirection: 'row', gap: 4 },
  seg: { flex: 1, height: 5, borderRadius: 3, backgroundColor: '#e2e8f0' },
  level: { fontSize: 12, fontWeight: '800', marginLeft: 10, minWidth: 56, textAlign: 'right' },
  rule: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  icon: { width: 18, fontSize: 13, fontWeight: '800' },
  iconOk: { color: '#059669' },
  iconKo: { color: '#cbd5e1' },
  ruleText: { fontSize: 13, color: '#94a3b8' },
  ruleTextOk: { color: '#047857' },
});
