// context/AuthContext.js
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { router } from 'expo-router';
import * as authService from '../services/authService';
import { getDelegueByUserId, getMedecinByUserId } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [delegueId, setDelegueId] = useState(null);
  const [medecinId, setMedecinId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Revalide le token au démarrage de l'app (s'il y en a un en storage)
  useEffect(() => {
    let ignore = false;
    (async () => {
      const token = await authService.getToken();
      if (!token) {
        if (!ignore) setIsLoading(false);
        return;
      }
      const freshUser = await authService.getMe().catch(() => null);
      if (ignore) return;
      if (freshUser) {
        setUser(freshUser);
        if (freshUser.role === 'DELEGUE') {
          setDelegueId(await authService.getDelegueId());
        } else if (freshUser.role === 'MEDECIN') {
          setMedecinId(await authService.getMedecinId());
        }
      }
      setIsLoading(false);
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: loggedUser } = await authService.login(email, password);
    setUser(loggedUser);
    if (loggedUser.role === 'DELEGUE') {
      const delegue = await getDelegueByUserId(loggedUser.id);
      await authService.saveDelegueId(delegue.id);
      setDelegueId(delegue.id);
    } else if (loggedUser.role === 'MEDECIN') {
      const medecin = await getMedecinByUserId(loggedUser.id);
      await authService.saveMedecinId(medecin.id);
      setMedecinId(medecin.id);
    }
    return loggedUser;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setDelegueId(null);
    setMedecinId(null);
    router.replace('/');
  }, []);

  const markPasswordChanged = useCallback(() => {
    setUser((current) => (current ? { ...current, mustChangePassword: false } : current));
  }, []);

  return (
    <AuthContext.Provider value={{ user, delegueId, medecinId, isLoading, login, logout, markPasswordChanged }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé à l’intérieur de <AuthProvider>.');
  return ctx;
}
