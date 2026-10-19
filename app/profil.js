// app/profil.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import {
  getDelegueByUserId, getMedecinByUserId,
  updateMonProfilMedecin, updateMonProfilDelegue,
  getSpecialites, getRegions,
} from '../services/api';
import useConfirmModal from '../hooks/useConfirmModal';

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
  const [form, setForm] = useState({ nom: '', prenom: '', telephone: '', specialite: '', adresseCabinet: '', regionId: '' });
  const [specialites, setSpecialites] = useState([]);
  const [regions, setRegions] = useState([]);
  const [specialitePickerVisible, setSpecialitePickerVisible] = useState(false);
  const [regionPickerVisible, setRegionPickerVisible] = useState(false);
  const { confirm, notify, modal } = useConfirmModal();

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
      getRegions().then(setRegions).catch(() => {});
    }
  }, [user]);

  const specialiteLibelle = (valeur) => specialites.find((s) => s.valeur === valeur)?.libelle ?? valeur;
  const regionLibelle = (valeur) => regions.find((r) => r.valeur === valeur)?.libelle ?? valeur;

  const openEdit = () => {
    setForm({
      nom: profil?.nom ?? '',
      prenom: profil?.prenom ?? '',
      telephone: profil?.telephone ?? '',
      specialite: profil?.specialite ?? '',
      adresseCabinet: profil?.adresseCabinet ?? '',
      regionId: profil?.regionId ?? '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!form.nom.trim() || !form.prenom.trim()) {
      notify({ title: 'Champs manquants', message: 'Nom et prénom sont obligatoires.', variant: 'warning' });
      return;
    }
    if (user.role === 'MEDECIN' && (!form.specialite || !form.adresseCabinet.trim())) {
      notify({ title: 'Champs manquants', message: 'Spécialité et adresse du cabinet sont obligatoires.', variant: 'warning' });
      return;
    }

    const ok = await confirm({
      title: 'Enregistrer les modifications',
      message: 'Confirmez-vous la mise à jour de votre profil ?',
      variant: 'question',
      confirmText: 'Enregistrer',
      cancelText: 'Annuler',
    });
    if (!ok) return;

    setSaving(true);
    try {
      const updated = user.role === 'MEDECIN'
        ? await updateMonProfilMedecin({
            nom: form.nom.trim(),
            prenom: form.prenom.trim(),
            specialite: form.specialite,
            adresseCabinet: form.adresseCabinet.trim(),
            regionId: form.regionId || undefined,
            telephone: form.telephone.trim() || undefined,
          })
        : await updateMonProfilDelegue({
            nom: form.nom.trim(),
            prenom: form.prenom.trim(),
            telephone: form.telephone.trim() || undefined,
          });
      setProfil(updated);
      setEditing(false);
      notify({ title: 'Profil mis à jour', message: 'Vos informations ont bien été enregistrées.', variant: 'success' });
    } catch (err) {
      notify({ title: 'Erreur', message: err.message, variant: 'error' });
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

        <View style={styles.editFields}>
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
                <TouchableOpacity
                  style={styles.selectField}
                  onPress={() => setSpecialitePickerVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={form.specialite ? styles.selectFieldValue : styles.selectFieldPlaceholder}>
                    {form.specialite ? specialiteLibelle(form.specialite) : 'Choisir une spécialité'}
                  </Text>
                  <Text style={styles.selectFieldChevron}>▾</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Adresse du cabinet</Text>
                <TextInput
                  style={styles.input} value={form.adresseCabinet}
                  onChangeText={(v) => setForm((f) => ({ ...f, adresseCabinet: v }))}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Région</Text>
                <TouchableOpacity
                  style={styles.selectField}
                  onPress={() => setRegionPickerVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={form.regionId ? styles.selectFieldValue : styles.selectFieldPlaceholder}>
                    {form.regionId ? regionLibelle(form.regionId) : 'Choisir une région'}
                  </Text>
                  <Text style={styles.selectFieldChevron}>▾</Text>
                </TouchableOpacity>
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
        </View>

        <View style={styles.editActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)} activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Enregistrer</Text>}
          </TouchableOpacity>
        </View>

        <Modal
          visible={specialitePickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSpecialitePickerVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setSpecialitePickerVisible(false)}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>Choisir une spécialité</Text>
              <ScrollView style={styles.pickerList}>
                {specialites.map((opt) => (
                  <TouchableOpacity
                    key={opt.valeur}
                    style={styles.pickerRow}
                    onPress={() => {
                      setForm((f) => ({ ...f, specialite: opt.valeur }));
                      setSpecialitePickerVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerRowText, form.specialite === opt.valeur && styles.pickerRowTextActive]}>
                      {opt.libelle}
                    </Text>
                    {form.specialite === opt.valeur && <Text style={styles.pickerRowCheck}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={regionPickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setRegionPickerVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setRegionPickerVisible(false)}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>Choisir une région</Text>
              <ScrollView style={styles.pickerList}>
                {regions.map((opt) => (
                  <TouchableOpacity
                    key={opt.valeur}
                    style={styles.pickerRow}
                    onPress={() => {
                      setForm((f) => ({ ...f, regionId: opt.valeur }));
                      setRegionPickerVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pickerRowText, form.regionId === opt.valeur && styles.pickerRowTextActive]}>
                      {opt.libelle}
                    </Text>
                    {form.regionId === opt.valeur && <Text style={styles.pickerRowCheck}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {modal}
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
        <ActivityIndicator size="large" color="#059669" style={styles.loading} />
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
            <InfoRow label="Spécialité" value={specialiteLibelle(profil.specialite)} />
          ) : null}
          {user?.role === 'MEDECIN' && profil?.adresseCabinet ? (
            <InfoRow label="Cabinet" value={profil.adresseCabinet} />
          ) : null}
          {user?.role === 'MEDECIN' && profil?.regionNom ? (
            <InfoRow label="Région" value={profil.regionNom} last={!profil?.telephone} />
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

      {modal}
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
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 32,
    paddingBottom: 32,
  },
  editFields: {
    flex: 1,
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
    backgroundColor: '#059669',
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
    backgroundColor: '#ecfdf5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
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
    borderColor: '#059669',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#0f172a',
  },
  selectField: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  selectFieldValue: { fontSize: 15, color: '#0f172a', fontWeight: '600' },
  selectFieldPlaceholder: { fontSize: 15, color: '#94a3b8' },
  selectFieldChevron: { fontSize: 14, color: '#94a3b8' },
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
  pickerList: { paddingHorizontal: 8 },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  pickerRowText: { fontSize: 14, color: '#334155', fontWeight: '600' },
  pickerRowTextActive: { color: '#047857', fontWeight: '800' },
  pickerRowCheck: { fontSize: 14, color: '#047857', fontWeight: '800' },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 32, paddingTop: 16 },
  cancelButton: {
    flex: 1, backgroundColor: '#f1f5f9', borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  cancelButtonText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  saveButton: {
    flex: 1, backgroundColor: '#059669', borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  saveButtonText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
});
