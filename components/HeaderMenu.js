// components/HeaderMenu.js
import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import useConfirmModal from '../hooks/useConfirmModal';

const SIDEBAR_WIDTH = Math.min(300, Dimensions.get('window').width * 0.78);
const ANIM_DURATION = 220;

const ROLE_LABELS = {
  DELEGUE: 'Délégué médical',
  MEDECIN: 'Médecin',
  ADMIN: 'Administrateur',
  LABO: 'Laboratoire',
};

// Toutes les pages du rôle sont listées ici — la barre d'onglets, elle, n'en garde que 3
// pour ne pas surcharger le bas de l'écran (voir app/medecin/_layout.js et app/delegue/_layout.js).
const MENU_ITEMS_BY_ROLE = {
  MEDECIN: [
    { icon: '🏠', label: 'Accueil', path: '/medecin/home' },
    { icon: '📅', label: 'Disponibilités', path: '/medecin' },
    { icon: '🗓️', label: 'Rendez-vous', path: '/medecin/creneaux' },
    { icon: '🕓', label: 'Historique', path: '/medecin/historique' },
    { icon: '🔔', label: 'Notifications', path: '/medecin/notifications' },
  ],
  DELEGUE: [
    { icon: '🏠', label: 'Accueil', path: '/delegue/home' },
    { icon: '🔍', label: 'Chercher un médecin', path: '/delegue' },
    { icon: '📅', label: 'Mon calendrier', path: '/delegue/calendar' },
    { icon: '🕓', label: 'Historique', path: '/delegue/historique' },
    { icon: '🔔', label: 'Notifications', path: '/delegue/notifications' },
  ],
};

export default function HeaderMenu({ onLogout }) {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const { confirm, modal } = useConfirmModal();

  const openSidebar = () => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(translateX, { toValue: 0, duration: ANIM_DURATION, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: ANIM_DURATION, useNativeDriver: true }),
    ]).start();
  };

  const closeSidebar = (onDone) => {
    Animated.parallel([
      Animated.timing(translateX, { toValue: -SIDEBAR_WIDTH, duration: ANIM_DURATION, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: ANIM_DURATION, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      onDone?.();
    });
  };

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Déconnexion',
      message: 'Voulez-vous vraiment vous déconnecter ?',
      variant: 'warning',
      confirmText: 'Se déconnecter',
      cancelText: 'Annuler',
    });
    if (ok) closeSidebar(onLogout);
  };
  const handleNavigate = (path) => closeSidebar(() => router.push(path));

  const initiale = user?.email?.[0]?.toUpperCase() ?? '?';
  const menuItems = MENU_ITEMS_BY_ROLE[user?.role] ?? [];

  return (
    <>
      <TouchableOpacity style={styles.menuButton} onPress={openSidebar} activeOpacity={0.7}>
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="none" onRequestClose={() => closeSidebar()}>
        <View style={styles.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => closeSidebar()}>
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
          </TouchableOpacity>

          <Animated.View style={[styles.sidebar, { transform: [{ translateX }] }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initiale}</Text>
              </View>
              <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
              {user?.role ? (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{ROLE_LABELS[user.role] || user.role}</Text>
                </View>
              ) : null}
            </View>

            {/* Menu items */}
            <View style={styles.menuSection}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.path}
                  style={styles.menuItem}
                  onPress={() => handleNavigate(item.path)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemIconWrap}>
                    <Text style={styles.menuItemIcon}>{item.icon}</Text>
                  </View>
                  <Text style={styles.menuItemText}>{item.label}</Text>
                  <Text style={styles.menuItemChevron}>›</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.menuDivider} />

              <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('/profil')} activeOpacity={0.7}>
                <View style={styles.menuItemIconWrap}>
                  <Text style={styles.menuItemIcon}>👤</Text>
                </View>
                <Text style={styles.menuItemText}>Mon profil</Text>
                <Text style={styles.menuItemChevron}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sidebarSpacer} />

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
              <Text style={styles.logoutIcon}>⏻</Text>
              <Text style={styles.logoutButtonText}>Déconnexion</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {modal}
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    marginLeft: 16,
    padding: 6,
  },
  menuIcon: {
    fontSize: 20,
    color: '#0f172a',
  },
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#ffffff',
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    backgroundColor: '#3b82f6',
    paddingTop: Platform.select({ ios: 64, android: 44, default: 32 }),
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomRightRadius: 28,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  email: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  menuSection: {
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  menuItemIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemIcon: {
    fontSize: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  menuItemChevron: {
    fontSize: 20,
    color: '#cbd5e1',
    fontWeight: '300',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 8,
    marginHorizontal: 8,
  },
  sidebarSpacer: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    borderRadius: 14,
    paddingVertical: 14,
  },
  logoutIcon: {
    fontSize: 15,
    color: '#ef4444',
  },
  logoutButtonText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 15,
  },
});
