// services/httpClient.js
// Client HTTP centralisé pour l'API Spring Boot : ajoute automatiquement le header
// Authorization, et vide la session + redirige vers /login sur 401/403 (token absent/expiré/mauvais rôle).
import { router } from 'expo-router';
import { getToken, clearSession } from './storage';

// Backend Spring Boot (port par défaut, aucun server.port custom dans application.properties).
// IP locale du PC (Wi-Fi) pour tester sur un appareil physique via Expo Go.
// Remets 'http://localhost:8080' si tu testes uniquement sur émulateur/simulateur.
export const BASE_URL = 'http://192.168.100.11:8080';

/**
 * @param {string} path - ex: '/auth/login'
 * @param {{method?: string, body?: object, auth?: boolean}} options
 *   auth=false pour les routes publiques (recherche médecins, créneaux, login) : pas de header Authorization.
 * @returns {Promise<any>} le champ "data" de l'ApiResponse
 */
export async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
  }

  if (response.status === 401 || response.status === 403) {
    await clearSession();
    router.replace('/');
    throw new Error('Session expirée, veuillez vous reconnecter.');
  }

  const json = await response.json().catch(() => null);
  if (!response.ok || !json || json.success === false) {
    throw new Error(json?.message || 'Une erreur est survenue.');
  }
  return json.data;
}
