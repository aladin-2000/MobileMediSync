// components/AppointmentCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * Carte d'un rendez-vous, réutilisée côté délégué (affiche le médecin) et côté médecin
 * (affiche le délégué). `role` détermine quelle personne afficher et quelles actions proposer.
 */
export default function AppointmentCard({ appointment, role = 'DELEGUE', onAnnuler, onRealise, onAbsent }) {
  const { heure, statut, statutBrut, realiseParDelegue, realiseParMedecin, medecin, delegue } = appointment;
  const person = role === 'MEDECIN' ? delegue : medecin;

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Confirmé':
        return { bg: '#dcfce7', text: '#15803d' };
      case 'Effectué':
        return { bg: '#f1f5f9', text: '#475569' };
      case 'Annulé':
        return { bg: '#fee2e2', text: '#b91c1c' };
      case 'Médecin absent':
      case 'Délégué absent':
        return { bg: '#fef3c7', text: '#b45309' };
      case 'En conflit':
        return { bg: '#fee2e2', text: '#b91c1c' };
      default:
        return { bg: '#e2e8f0', text: '#1e293b' };
    }
  };

  const statusColor = getStatusStyles(statut);
  const isModifiable = statutBrut === 'RESERVE';
  const dejaConfirmeParMoi = role === 'MEDECIN' ? realiseParMedecin : realiseParDelegue;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.timeSection}>
          <Text style={styles.time}>{heure}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>{statut}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.docName}>{person?.nom}</Text>
          {person?.specialite ? <Text style={styles.docSpecialty}>{person.specialite}</Text> : null}
          {person?.adresse ? <Text style={styles.docAddress}>{person.adresse}</Text> : null}
          {person?.telephone ? <Text style={styles.docAddress}>{person.telephone}</Text> : null}
          {isModifiable && dejaConfirmeParMoi && (
            <Text style={styles.pendingHint}>En attente de confirmation de l’autre partie</Text>
          )}
        </View>
      </View>

      {isModifiable && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonRealise, dejaConfirmeParMoi && styles.actionButtonDisabled]}
            onPress={onRealise}
            disabled={dejaConfirmeParMoi}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionButtonText, styles.actionButtonRealiseText]}>
              {dejaConfirmeParMoi ? '✓ Réalisé' : 'Réalisé'}
            </Text>
          </TouchableOpacity>
          {!dejaConfirmeParMoi && (
            <>
              <TouchableOpacity style={[styles.actionButton, styles.actionButtonAbsent]} onPress={onAbsent} activeOpacity={0.7}>
                <Text style={[styles.actionButtonText, styles.actionButtonAbsentText]}>Absent</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.actionButtonDanger]} onPress={onAnnuler} activeOpacity={0.7}>
                <Text style={[styles.actionButtonText, styles.actionButtonDangerText]}>Annuler</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeSection: {
    width: 90,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    paddingRight: 12,
    marginRight: 12,
  },
  time: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoSection: {
    flex: 1,
  },
  docName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  docSpecialty: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
    marginTop: 2,
    marginBottom: 6,
  },
  docAddress: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  pendingHint: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 6,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  actionButtonRealise: {
    backgroundColor: '#dcfce7',
  },
  actionButtonRealiseText: {
    color: '#15803d',
  },
  actionButtonAbsent: {
    backgroundColor: '#fef3c7',
  },
  actionButtonAbsentText: {
    color: '#b45309',
  },
  actionButtonDanger: {
    backgroundColor: '#fef2f2',
  },
  actionButtonDangerText: {
    color: '#ef4444',
  },
});
