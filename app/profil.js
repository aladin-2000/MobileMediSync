// app/profil.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import {
  getDelegueByUserId, getMedecinByUserId,
  updateMonProfilMedecin, updateMonProfilDelegue,
  getSpecialites,
} from '../services/api';

const ROLE_LABELS = {
  DELEGUE: 'Délégué médical',
  MEDECIN: 'Médecin',
  ADMIN: 'Administrateur',
  LABO: 'Laboratoire',
};

export default function ProfilScreen() {
  const { user } = useAuth();
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nom: '', prenom: '', telephone: '', specialite: '', adresseCabinet: '' });
  const [specialites, setSpecialites] = useState([]);

  const canEdit = user?.role === 'DELEGUE' || user?.role === 'MEDECIN';

  useEffect(() => {
    if (!user) return;
    const fetcher = user.role === 'DELEGUE' ? getDelegueByUserId : user.role === 'MEDECIN' ? getMedecinByUserId : null;
    let ignore = false;
    Promise.resolve()
      .then(() => (fetcher ? fetcher(user.id) : null))
      .then((data) => {
        if (!ignore && data) setProfil(data);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [user]);

  useEffect(() => {
    if (user?.role === 'MEDECIN') {
      getSpecialites().then(setSpecialites).catch(() => {});
    }
  }, [user]);

  const openEdit = () => {
    setForm({
      nom: profil?.nom ?? '',
      prenom: profil?.prenom ?? '',
      telephone: profil?.telephone ?? '',
      specialite: profil?.specialite ?? '',
      adresseCabinet: profil?.adresseCabinet ?? '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!form.nom.trim() || !form.prenom.trim()) {
      Alert.alert('Champs manquants', 'Nom et prénom sont obligatoires.');
      return;
    }
    if (user.role === 'MEDECIN' && (!form.specialite || !form.adresseCabinet.trim())) {
      Alert.alert('Champs manquants', 'Spécialité et adresse du cabinet sont obligatoires.');
      return;
    }

    setSaving(true);
    try {
      const updated = user.role === 'MEDECIN'
        ? await updateMonProfilMedecin({
            nom: form.nom.trim(),
            prenom: form.prenom.trim(),
            specialite: form.specialite,
            adresseCabinet: form.adresseCabinet.trim(),
            telephone: form.telephone.trim() || undefined,
          })
        : await updateMonProfilDelegue({
            nom: form.nom.trim(),
            prenom: form.prenom.trim(),
            telephone: form.telephone.trim() || undefined,
          });
      setProfil(updated);
      setEditing(false);
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setSaving(false);
    }
  };

  const initiales = profil
    ? `${profil.prenom?.[0] ?? ''}${profil.nom?.[0] ?? ''}`.toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? '?');

  if (editing) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.editContent}>
        <Stack.Screen options={{ title: 'Modifier mon profil' }} />

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nom</Text>
          <TextInput style={styles.input} value={form.nom} onChangeText={(v) => setForm((f) => ({ ...f, nom: v }))} />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Prénom</Text>
          <TextInput style={styles.input} value={form.prenom} onChangeText={(v) => setForm((f) => ({ ...f, prenom: v }))} />
        </View>

        {user.role === 'MEDECIN' && (
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Spécialité</Text>
              <View style={styles.chipsWrap}>
                {specialites.map((opt) => (
                  <TouchableOpacity
                    key={opt.valeur}
                    style={[styles.chip, form.specialite === opt.valeur && styles.chipActive]}
                    onPress={() => setForm((f) => ({ ...f, specialite: opt.valeur }))}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, form.specialite === opt.valeur && styles.chipTextActive]}>
                      {opt.libelle}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Adresse du cabinet</Text>
              <TextInput
                style={styles.input} value={form.adresseCabinet}
                onChangeText={(v) => setForm((f) => ({ ...f, adresseCabinet: v }))}
              />
            </View>
          </>
        )}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={styles.input} value={form.telephone} keyboardType="phone-pad"
            onChangeText={(v) => setForm((f) => ({ ...f, telephone: v }))}
          />
        </View>

        <View style={styles.editActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)} activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Enregistrer</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Mon profil' }} />

      <View style={styles.avatarWrapper}>
        {profil?.photoUrl ? (
          <Image source={{ uri: profil.photoUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{initiales}</Text>
          </View>
        )}
      </View>

      <Text style={styles.name}>{profil ? `${profil.prenom} ${profil.nom}` : user?.email}</Text>

      {user?.role ? (
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{ROLE_LABELS[user.role] || user.role}</Text>
        </View>
      ) : null}

      {user?.role === 'MEDECIN' && profil && profil.valide === false ? (
        <View style={styles.pendingBanner}>
          <Text style={styles.pendingBannerText}>
            ⏳ Votre profil est en attente de validation par un administrateur.
          </Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={styles.loading} />
      ) : (
        <View style={styles.card}>
          <InfoRow label="Email" value={user?.email} />
          {user?.role === 'DELEGUE' && profil?.telephone ? (
            <InfoRow label="Téléphone" value={profil.telephone} />
          ) : null}
          {user?.role === 'DELEGUE' && typeof profil?.scoreFiabilite === 'number' ? (
            <InfoRow label="Score de fiabilité" value={`${profil.scoreFiabilite}%`} />
          ) : null}
          {user?.role === 'MEDECIN' && profil?.specialite ? (
            <InfoRow label="Spécialité" value={profil.specialite} />
          ) : null}
          {user?.role === 'MEDECIN' && profil?.adresseCabinet ? (
            <InfoRow label="Cabinet" value={profil.adresseCabinet} last={!profil?.telephone} />
          ) : null}
          {user?.role === 'MEDECIN' && profil?.telephone ? (
            <InfoRow label="Téléphone" value={profil.telephone} last />
          ) : null}
        </View>
      )}

      {canEdit && !loading && (
        <TouchableOpacity style={styles.editButton} onPress={openEdit} activeOpacity={0.85}>
          <Text style={styles.editButtonText}>✏️ Modifier mon profil</Text>
        </TouchableOpacity>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </ScrollView>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  editContent: {
    padding: 24,
    paddingTop: 32,
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  name: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  pendingBanner: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    width: '100%',
  },
  pendingBannerText: {
    fontSize: 12.5,
    color: '#92400e',
    textAlign: 'center',
    lineHeight: 18,
  },
  loading: {
    marginTop: 32,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginTop: 28,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '700',
    maxWidth: '60%',
    textAlign: 'right',
  },
  errorText: {
    marginTop: 16,
    fontSize: 13,
    color: '#ef4444',
    textAlign: 'center',
  },
  editButton: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#3b82f6',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3b82f6',
  },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#0f172a',
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  chipTextActive: { color: '#2563eb' },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelButton: {
    flex: 1, backgroundColor: '#f1f5f9', borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  cancelButtonText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  saveButton: {
    flex: 1, backgroundColor: '#3b82f6', borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  saveButtonText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
});
