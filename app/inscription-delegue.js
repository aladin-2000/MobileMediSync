// app/inscription-delegue.js — Auto-inscription délégué
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, ScrollView, Platform, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { getLaboratoires, inscrireDelegue } from '../services/api';
import useConfirmModal from '../hooks/useConfirmModal';

export default function InscriptionDelegueScreen() {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [laboratoireId, setLaboratoireId] = useState('');
  const [laboName, setLaboName] = useState('');
  const [laboInconnu, setLaboInconnu] = useState(false);
  const [telephone, setTelephone] = useState('');

  const [laboratoires, setLaboratoires] = useState([]);
  const [laboPickerVisible, setLaboPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { confirm, notify, modal } = useConfirmModal();

  useEffect(() => {
    getLaboratoires()
      .then((list) => setLaboratoires([...list].sort((a, b) => a.nom.localeCompare(b.nom))))
      .catch(() => {});
  }, []);

  const laboLibelle = (id) => laboratoires.find((l) => l.id === id)?.nom ?? id;

  const handleSubmit = async () => {
    if (!nom || !prenom || !email || !password || !telephone) {
      notify({ title: 'Champs manquants', message: 'Merci de remplir tous les champs obligatoires.', variant: 'warning' });
      return;
    }
    if (laboInconnu ? !laboName : !laboratoireId) {
      notify({ title: 'Laboratoire manquant', message: 'Merci de choisir votre laboratoire ou d’en saisir le nom.', variant: 'warning' });
      return;
    }
    if (password.length < 6) {
      notify({ title: 'Mot de passe trop court', message: 'Le mot de passe doit contenir au moins 6 caractères.', variant: 'warning' });
      return;
    }
    if (password !== confirmPassword) {
      notify({ title: 'Mots de passe différents', message: 'Les mots de passe ne correspondent pas.', variant: 'warning' });
      return;
    }

    const ok = await confirm({
      title: 'Créer mon compte',
      message: 'Confirmez-vous la création de votre compte délégué ?',
      variant: 'question',
      confirmText: 'Créer mon compte',
      cancelText: 'Annuler',
    });
    if (!ok) return;

    setLoading(true);
    try {
      await inscrireDelegue({
        email, password, nom, prenom,
        laboratoireId: laboInconnu ? undefined : laboratoireId,
        laboName: laboInconnu ? laboName : undefined,
        telephone,
      });
      setDone(true);
    } catch (error) {
      notify({ title: 'Erreur', message: error.message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={styles.screen}>
        <View style={styles.successWrapper}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>📧</Text>
          </View>
          <Text style={styles.successTitle}>Vérifiez votre boîte email</Text>
          <Text style={styles.successText}>
            Un lien de vérification a été envoyé à {'\n'}
            <Text style={styles.successEmail}>{email}</Text>.{'\n\n'}
            Cliquez dessus pour activer votre compte et vous connecter.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/')} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Créer un compte délégué</Text>
          <Text style={styles.subtitle}>Renseignez vos informations pour rejoindre MediSync</Text>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.half]}>
              <Text style={styles.label}>Nom</Text>
              <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder="Nom" />
            </View>
            <View style={[styles.fieldGroup, styles.half]}>
              <Text style={styles.label}>Prénom</Text>
              <TextInput style={styles.input} value={prenom} onChangeText={setPrenom} placeholder="Prénom" />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input} value={email} onChangeText={setEmail}
              autoCapitalize="none" autoCorrect={false} keyboardType="email-address"
              placeholder="vous@exemple.com"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.half]}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input} value={password} onChangeText={setPassword}
                secureTextEntry placeholder="6 caractères min."
              />
            </View>
            <View style={[styles.fieldGroup, styles.half]}>
              <Text style={styles.label}>Confirmer</Text>
              <TextInput
                style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword}
                secureTextEntry placeholder="Confirmer"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Laboratoire</Text>
            {!laboInconnu ? (
              <TouchableOpacity
                style={styles.selectField}
                onPress={() => setLaboPickerVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={laboratoireId ? styles.selectFieldValue : styles.selectFieldPlaceholder}>
                  {laboratoireId ? laboLibelle(laboratoireId) : 'Choisir un laboratoire'}
                </Text>
                <Text style={styles.selectFieldChevron}>▾</Text>
              </TouchableOpacity>
            ) : (
              <TextInput
                style={styles.input} value={laboName} onChangeText={setLaboName}
                placeholder="Nom de votre laboratoire"
              />
            )}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setLaboInconnu(!laboInconnu)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, laboInconnu && styles.checkboxChecked]}>
                {laboInconnu && <Text style={styles.checkboxMark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Mon laboratoire n'est pas encore inscrit sur MediSync</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Téléphone</Text>
            <TextInput style={styles.input} value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" placeholder="+216 .." />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Créer mon compte</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/')} style={styles.backLink}>
            <Text style={styles.backLinkText}>Déjà un compte ? Se connecter</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={laboPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLaboPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setLaboPickerVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Choisir un laboratoire</Text>
            <ScrollView style={styles.pickerList}>
              {laboratoires.map((labo) => (
                <TouchableOpacity
                  key={labo.id}
                  style={styles.pickerRow}
                  onPress={() => {
                    setLaboratoireId(labo.id);
                    setLaboPickerVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pickerRowText, laboratoireId === labo.id && styles.pickerRowTextActive]}>
                    {labo.nom}
                  </Text>
                  {laboratoireId === labo.id && <Text style={styles.pickerRowCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {modal}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  flex: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 4, marginBottom: 24 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
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
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  checkbox: {
    width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: '#cbd5e1',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff',
  },
  checkboxChecked: { backgroundColor: '#059669', borderColor: '#059669' },
  checkboxMark: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  checkboxLabel: { fontSize: 12.5, color: '#64748b', fontWeight: '500', flex: 1 },
  button: {
    backgroundColor: '#059669', borderRadius: 14, paddingVertical: 15, alignItems: 'center',
    shadowColor: '#059669', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  backLink: { marginTop: 16, alignItems: 'center' },
  backLinkText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  successWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#ecfdf5',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  successEmoji: { fontSize: 36 },
  successTitle: { fontSize: 19, fontWeight: '800', color: '#0f172a', marginBottom: 10, textAlign: 'center' },
  successText: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  successEmail: { fontWeight: '700', color: '#0f172a' },
});
