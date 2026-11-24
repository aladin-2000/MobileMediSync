// app/notes.js
// « Notes à l'équipe MediSync » : le médecin ou le délégué envoie un avis / une idée
// et retrouve l'historique de ses notes.
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { envoyerNoteEquipe, getMesNotesEquipe } from '../services/api';
import useConfirmModal from '../hooks/useConfirmModal';

const NOTE_MIN = 1;
const NOTE_MAX = 2000;

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} à ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NotesEquipeScreen() {
  const insets = useSafeAreaInsets();
  const { notify, modal } = useConfirmModal();

  const [contenu, setContenu] = useState('');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const charger = useCallback(async () => {
    try {
      setError('');
      const data = await getMesNotesEquipe();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Impossible de charger vos notes.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      await charger();
      setLoading(false);
    })();
  }, [charger]);

  const onRefresh = async () => {
    setRefreshing(true);
    await charger();
    setRefreshing(false);
  };

  const longueur = contenu.trim().length;
  const peutEnvoyer = !sending && longueur >= NOTE_MIN && contenu.length <= NOTE_MAX;

  const handleEnvoyer = async () => {
    if (!peutEnvoyer) {
      notify({
        title: 'Note vide',
        message: 'Écrivez votre note avant de l’envoyer.',
        variant: 'warning',
      });
      return;
    }
    setSending(true);
    try {
      const note = await envoyerNoteEquipe(contenu.trim());
      setNotes((prev) => [note, ...prev]);
      setContenu('');
      notify({
        title: 'Merci !',
        message: 'Votre note a été envoyée à l’équipe MediSync.',
        variant: 'success',
      });
    } catch (err) {
      notify({ title: 'Erreur', message: err.message || 'Impossible d’envoyer la note.', variant: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: 'Notes à l’équipe' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
      >
        <Text style={styles.intro}>
          Un avis, une idée, une suggestion pour améliorer MediSync ? Écrivez-nous, toute l’équipe lit vos notes.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Votre note</Text>
          <TextInput
            style={styles.textarea}
            value={contenu}
            onChangeText={setContenu}
            multiline
            maxLength={NOTE_MAX}
            textAlignVertical="top"
            placeholder="Partagez votre avis ou vos idées avec l’équipe MediSync…"
            placeholderTextColor="#94a3b8"
          />
          <View style={styles.composeFooter}>
            <Text style={[styles.counter, contenu.length > NOTE_MAX * 0.9 && styles.counterWarn]}>
              {contenu.length} / {NOTE_MAX}
            </Text>
            <TouchableOpacity
              style={[styles.sendButton, !peutEnvoyer && styles.sendButtonDisabled]}
              onPress={handleEnvoyer}
              disabled={sending}
              activeOpacity={0.85}
            >
              {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendButtonText}>Envoyer</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Mes notes</Text>
          <View style={styles.countBadge}><Text style={styles.countBadgeText}>{notes.length}</Text></View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#059669" style={styles.loading} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : notes.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>Vous n’avez encore envoyé aucune note.</Text>
          </View>
        ) : (
          notes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              <View style={styles.noteHead}>
                <Text style={styles.noteDate}>{formatDate(note.createdAt)}</Text>
                <View style={[styles.badge, note.traitee && styles.badgeDone]}>
                  <Text style={[styles.badgeText, note.traitee && styles.badgeTextDone]}>
                    {note.traitee ? '✓ Prise en compte' : 'Envoyée'}
                  </Text>
                </View>
              </View>
              <Text style={styles.noteText}>{note.contenu}</Text>
            </View>
          ))
        )}

        {modal}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  intro: { fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: 16 },
  card: {
    backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', padding: 16,
  },
  label: {
    fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  textarea: {
    minHeight: 120, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#0f172a', lineHeight: 21,
  },
  composeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  counter: { fontSize: 12, color: '#94a3b8' },
  counterWarn: { color: '#ea580c' },
  sendButton: {
    backgroundColor: '#059669', borderRadius: 12, paddingVertical: 11, paddingHorizontal: 22, minWidth: 110,
    alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 28, marginBottom: 12 },
  historyTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  countBadge: { backgroundColor: '#d1fae5', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: '#047857' },
  loading: { marginTop: 24 },
  error: { color: '#dc2626', fontSize: 14, textAlign: 'center', marginTop: 16 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8' },
  noteCard: {
    backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#f1f5f9',
    padding: 14, marginBottom: 10,
  },
  noteHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 },
  noteDate: { fontSize: 12, color: '#94a3b8' },
  badge: { backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  badgeDone: { backgroundColor: '#d1fae5' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  badgeTextDone: { color: '#047857' },
  noteText: { fontSize: 14, color: '#334155', lineHeight: 21 },
});
