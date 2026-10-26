// app/verifier-email.js — Vérification d'email (ouvrable via deep link inscription://verifier-email?token=...)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { verifierEmail, renvoyerVerification } from '../services/api';

export default function VerifierEmailScreen() {
  const { token } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState('loading'); // loading | success | error | missing
  const [errorMessage, setErrorMessage] = useState('');

  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    Promise.resolve()
      .then(() => {
        if (!token) {
          setState('missing');
          return;
        }
        return verifierEmail(token)
          .then(() => setState('success'))
          .catch((error) => {
            setState('error');
            setErrorMessage(error.message);
          });
      });
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail) {
      setResendError('Veuillez saisir votre email.');
      return;
    }
    setResending(true);
    setResendError('');
    try {
      await renvoyerVerification(resendEmail);
      setResendDone(true);
    } catch (error) {
      setResendError(error.message);
    } finally {
      setResending(false);
    }
  };

  if (state === 'loading') {
    return (
      <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.title}>Vérification en cours...</Text>
        </View>
      </View>
    );
  }

  if (state === 'success') {
    return (
      <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
        <View style={styles.center}>
          <View style={[styles.icon, styles.iconSuccess]}><Text style={styles.iconEmoji}>✅</Text></View>
          <Text style={styles.title}>Email vérifié !</Text>
          <Text style={styles.text}>Votre adresse email a été vérifiée avec succès. Vous pouvez maintenant vous connecter.</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/')} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 'missing' or 'error'
  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <View style={styles.center}>
        <View style={[styles.icon, styles.iconDanger]}><Text style={styles.iconEmoji}>⚠️</Text></View>
        <Text style={styles.title}>{state === 'missing' ? 'Lien invalide' : 'Échec de la vérification'}</Text>
        <Text style={styles.text}>
          {state === 'missing'
            ? "Ce lien de vérification est incomplet. Saisissez votre email pour recevoir un nouveau lien."
            : errorMessage}
        </Text>

        {!resendDone ? (
          <View style={styles.resendForm}>
            <TextInput
              style={styles.input}
              value={resendEmail}
              onChangeText={setResendEmail}
              placeholder="Votre email"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {resendError ? <Text style={styles.errorText}>{resendError}</Text> : null}
            <TouchableOpacity style={styles.button} onPress={handleResend} disabled={resending} activeOpacity={0.85}>
              {resending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Renvoyer l’email de vérification</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>Un nouvel email de vérification a été envoyé à {resendEmail}.</Text>
          </View>
        )}

        <TouchableOpacity onPress={() => router.replace('/')} style={styles.backLink}>
          <Text style={styles.backLinkText}>Retour à la connexion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  icon: {
    width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  iconSuccess: { backgroundColor: '#ecfdf5' },
  iconDanger: { backgroundColor: '#fef2f2' },
  iconEmoji: { fontSize: 32 },
  title: { fontSize: 19, fontWeight: '800', color: '#0f172a', marginTop: 8, marginBottom: 10, textAlign: 'center' },
  text: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 21, marginBottom: 20 },
  button: {
    backgroundColor: '#059669', borderRadius: 14, paddingVertical: 15, alignItems: 'center', width: '100%',
    shadowColor: '#059669', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 4,
  },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  resendForm: { width: '100%' },
  input: {
    backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#0f172a', marginBottom: 12, width: '100%',
  },
  errorText: { color: '#ef4444', fontSize: 12, marginBottom: 10 },
  infoBanner: {
    backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 12, padding: 12, width: '100%',
  },
  infoBannerText: { fontSize: 13, color: '#047857', textAlign: 'center' },
  backLink: { marginTop: 18 },
  backLinkText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
});
