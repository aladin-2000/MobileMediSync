// app/inscription-medecin.js — Auto-inscription médecin
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, ScrollView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { getSpecialites, inscrireMedecin } from '../services/api';
import useConfirmModal from '../hooks/useConfirmModal';

export default function InscriptionMedecinScreen() {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [adresseCabinet, setAdresseCabinet] = useState('');
  const [telephone, setTelephone] = useState('');

  const [specialites, setSpecialites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { confirm, notify, modal } = useConfirmModal();

  useEffect(() => {
    getSpecialites().then(setSpecialites).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!nom || !prenom || !email || !password || !specialite || !adresseCabinet) {
      notify({ title: 'Champs manquants', message: 'Merci de remplir tous les champs obligatoires.', variant: 'warning' });
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
      message: 'Confirmez-vous la création de votre compte médecin ?',
      variant: 'question',
      confirmText: 'Créer mon compte',
      cancelText: 'Annuler',
    });
    if (!ok) return;

    setLoading(true);
    try {
      await inscrireMedecin({
        email, password, nom, prenom, specialite, adresseCabinet,
        telephone: telephone || undefined,
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
            Cliquez dessus pour activer votre compte, puis attendez la validation
            de votre profil par un administrateur avant de vous connecter.
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
          <Text style={styles.title}>Créer un compte médecin</Text>
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
            <Text style={styles.label}>Spécialité</Text>
            <View style={styles.chipsWrap}>
              {specialites.map((opt) => (
                <TouchableOpacity
                  key={opt.valeur}
                  style={[styles.chip, specialite === opt.valeur && styles.chipActive]}
                  onPress={() => setSpecialite(opt.valeur)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, specialite === opt.valeur && styles.chipTextActive]}>
                    {opt.libelle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Adresse du cabinet</Text>
            <TextInput style={styles.input} value={adresseCabinet} onChangeText={setAdresseCabinet} placeholder="Adresse du cabinet" />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Téléphone (optionnel)</Text>
            <TextInput style={styles.input} value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" placeholder="+216 .." />
          </View>

          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>
              ℹ️ Votre profil devra être validé par un administrateur avant d’apparaître dans les recherches des délégués.
            </Text>
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
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  chipTextActive: { color: '#2563eb' },
  infoBanner: {
    backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#dbeafe', borderRadius: 12,
    padding: 12, marginBottom: 18,
  },
  infoBannerText: { fontSize: 12, color: '#1d4ed8', lineHeight: 17 },
  button: {
    backgroundColor: '#3b82f6', borderRadius: 14, paddingVertical: 15, alignItems: 'center',
    shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 4,
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
