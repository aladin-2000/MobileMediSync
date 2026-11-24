// context/NotificationContext.js
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import { createAudioPlayer } from 'expo-audio';
import { getNombreNotificationsNonLues } from '../services/api';
import { useAuth } from './AuthContext';

const POLL_INTERVAL_MS = 15000;

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const previousCountRef = useRef(0);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  const playNotificationSound = useCallback(async () => {
    try {
      if (!playerRef.current) {
        playerRef.current = createAudioPlayer(require('../assets/sounds/notification.wav'));
      } else {
        await playerRef.current.seekTo(0);
      }
      playerRef.current.play();
    } catch (error) {
      console.warn('Lecture du son de notification impossible', error);
    }
  }, []);

  useEffect(() => {
    return () => {
      playerRef.current?.remove();
      playerRef.current = null;
    };
  }, []);

  const fetchCount = useCallback(async () => {
    try {
      const count = await getNombreNotificationsNonLues();
      if (count > previousCountRef.current) {
        playNotificationSound();
      }
      previousCountRef.current = count;
      setUnreadCount(count);
    } catch {
      // silently ignore — interceptor handles 401
    }
  }, [playNotificationSound]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    fetchCount();
    intervalRef.current = setInterval(fetchCount, POLL_INTERVAL_MS);
  }, [fetchCount]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start/stop polling based on auth state
  useEffect(() => {
    if (user) {
      startPolling();
    } else {
      stopPolling();
      setUnreadCount(0);
    }
    return stopPolling;
  }, [user, startPolling, stopPolling]);

  // Pause polling when app goes to background, resume on foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active' && user) {
        startPolling();
      } else if (nextState.match(/inactive|background/)) {
        stopPolling();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [user, startPolling, stopPolling]);

  const refresh = useCallback(() => {
    fetchCount();
  }, [fetchCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>.');
  return ctx;
}
