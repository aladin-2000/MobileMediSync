// components/NotesEquipeFab.js
// Bulle flottante (bas droite) « Notes à l'équipe MediSync » pour le médecin et le délégué :
// ouvre un panneau pour écrire une note, avec les 3 dernières notes et un lien vers la page complète.
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, Pressable, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { envoyerNoteEquipe, getMesNotesEquipe } from '../services/api';

const NOTE_MAX = 2000;

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * @param {number} bottomOffset distance depuis le bas de l'écran (au-dessus de la barre d'onglets)
 */
export default function NotesEquipeFab({ bottomOffset = 80 }) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [contenu, setContenu] = useState('');
  const [dernieres, setDernieres] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }

  const ouvrir = async () => {
    setVisible(true);
    setMessage(null);
    setLoading(true);
    try {
      const data = await getMesNotesEquipe();
      const liste = Array.isArray(data) ? data : [];
      setTotal(liste.length);
      setDernieres(liste.slice(0, 3));
    } catch {
      // l'aperçu est facultatif : on laisse le formulaire utilisable
    } finally {
      setLoading(false);
    }
  };

  const fermer = () => setVisible(false);

  const peutEnvoyer = !sending && contenu.trim().length > 0;

  const envoyer = async () => {
    if (!peutEnvoyer) {
      setMessage({ type: 'error', text: 'Écrivez votre note avant de l’envoyer.' });
      return;
    }
    setSending(true);
    setMessage(null);
    try {
      const note = await envoyerNoteEquipe(contenu.trim());
      setContenu('');
      setDernieres((prev) => [note, ...prev].slice(0, 3));
      setTotal((t) => t + 1);
      setMessage({ type: 'success', text: 'Merci ! Votre note a été envoyée.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Impossible d’envoyer la note.' });
    } finally {
      setSending(false);
    }
  };

  const voirTout = () => {
    setVisible(false);
    router.push('/notes');
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.fab, { bottom: bottomOffset }]}
        onPress={ouvrir}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Écrire une note à l’équipe MediSync"
      >
        <Text style={styles.fabIcon}>💬</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={fermer}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.backdrop} onPress={fermer} />
          <View style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.flex}>
                <Text style={styles.title}>💬 Note à l’équipe</Text>
                <Text style={styles.subtitle}>Un avis, une idée ? On vous lit.</Text>
              </View>
              <TouchableOpacity onPress={fermer} hitSlop={10} accessibilityLabel="Fermer">
                <Text style={styles.close}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" style={styles.body}>
              <TextInput
                style={styles.textarea}
                value={contenu}
                onChangeText={setContenu}
                multiline
                maxLength={NOTE_MAX}
                textAlignVertical="top"
                placeholder="Votre avis ou vos idées pour MediSync…"
                placeholderTextColor="#94a3b8"
              />
              <View style={styles.composeFooter}>
                <Text style={styles.counter}>{contenu.length} / {NOTE_MAX}</Text>
                <TouchableOpacity
                  style={[styles.sendButton, !peutEnvoyer && styles.sendButtonDisabled]}
                  onPress={envoyer}
                  disabled={sending}
                  activeOpacity={0.85}
                >
                  {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendButtonText}>Envoyer</Text>}
                </TouchableOpacity>
              </View>

              {message ? (
                <View style={[styles.banner, message.type === 'success' ? styles.bannerSuccess : styles.bannerError]}>
                  <Text style={[styles.bannerText, message.type === 'success' ? styles.bannerTextSuccess : styles.bannerTextError]}>
                    {message.text}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.recentTitle}>MES DERNIÈRES NOTES</Text>
              {loading ? (
                <ActivityIndicator color="#059669" style={styles.loading} />
              ) : dernieres.length === 0 ? (
                <Text style={styles.muted}>Aucune note envoyée pour le moment.</Text>
              ) : (
                dernieres.map((n) => (
                  <View key={n.id} style={styles.recentItem}>
                    <View style={styles.recentMeta}>
                      <Text style={styles.recentDate}>{formatDate(n.createdAt)}</Text>
                      <View style={[styles.badge, n.traitee && styles.badgeDone]}>
                        <Text style={[styles.badgeText, n.traitee && styles.badgeTextDone]}>
                          {n.traitee ? 'Prise en compte' : 'Envoyée'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.recentText} numberOfLines={2}>{n.contenu}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={styles.footerLink} onPress={voirTout} activeOpacity={0.7}>
              <Text style={styles.footerLinkText}>Voir toutes mes notes{total ? ` (${total})` : ''} ›</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fab: {
    position: 'absolute',
    right: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    zIndex: 50,
  },
  fabIcon: { fontSize: 24 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  sheet: {
    marginTop: 'auto',
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', marginBottom: 8,
  },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  title: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  close: { fontSize: 18, color: '#94a3b8', paddingLeft: 12 },
  body: { paddingHorizontal: 20, paddingTop: 14 },
  textarea: {
    minHeight: 110, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0f172a', lineHeight: 21,
  },
  composeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  counter: { fontSize: 12, color: '#94a3b8' },
  sendButton: {
    backgroundColor: '#059669', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, minWidth: 100,
    alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  banner: { marginTop: 12, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 },
  bannerSuccess: { backgroundColor: '#ecfdf5' },
  bannerError: { backgroundColor: '#fef2f2' },
  bannerText: { fontSize: 13, fontWeight: '600' },
  bannerTextSuccess: { color: '#047857' },
  bannerTextError: { color: '#dc2626' },
  recentTitle: {
    fontSize: 11, fontWeight: '800', color: '#475569', letterSpacing: 0.5, marginTop: 20, marginBottom: 6,
  },
  loading: { marginVertical: 12 },
  muted: { fontSize: 13, color: '#94a3b8', marginBottom: 12 },
  recentItem: { paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  recentMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  recentDate: { fontSize: 12, color: '#94a3b8' },
  badge: { backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeDone: { backgroundColor: '#d1fae5' },
  badgeText: { fontSize: 10.5, fontWeight: '700', color: '#64748b' },
  badgeTextDone: { color: '#047857' },
  recentText: { fontSize: 14, color: '#334155', lineHeight: 20 },
  footerLink: {
    borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  footerLinkText: { fontSize: 14, fontWeight: '700', color: '#059669' },
});
