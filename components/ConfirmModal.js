// components/ConfirmModal.js
// Popup centralisée (confirmation ou simple alerte) au style de l'app — remplace Alert.alert natif.
import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';

const VARIANTS = {
  info: { icon: 'ℹ️', color: '#16a34a', bg: '#f0fdf4', border: '#dcfce7' },
  question: { icon: '❓', color: '#16a34a', bg: '#f0fdf4', border: '#dcfce7' },
  success: { icon: '✅', color: '#16a34a', bg: '#f0fdf4', border: '#dcfce7' },
  warning: { icon: '⚠️', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  danger: { icon: '🗑️', color: '#ef4444', bg: '#fef2f2', border: '#fee2e2' },
  error: { icon: '⛔', color: '#ef4444', bg: '#fef2f2', border: '#fee2e2' },
};

export default function ConfirmModal({
  visible,
  title,
  message,
  variant = 'info',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  alertOnly = false,
  onConfirm,
  onCancel,
}) {
  const v = VARIANTS[variant] || VARIANTS.info;
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.85);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 8, tension: 90, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <View style={[styles.iconWrap, { backgroundColor: v.bg, borderColor: v.border }]}>
            <Text style={styles.icon}>{v.icon}</Text>
          </View>

          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.actions}>
            {!alertOnly && (
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.8}>
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: v.color }]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmButtonText}>{alertOnly ? confirmText || 'OK' : confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  icon: {
    fontSize: 26,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    fontSize: 13.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
