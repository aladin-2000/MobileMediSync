// services/httpClient.js
// Client HTTP centralisé pour l'API Spring Boot : ajoute automatiquement le header
// Authorization, et vide la session + redirige vers /login sur 401/403 (token absent/expiré/mauvais rôle).
import { router } from 'expo-router';
import { getToken, clearSession } from './storage';

const DEV_URL = 'http://192.168.100.5:8080';
const PROD_URL = 'https://medisync-1tu5.onrender.com';
export const BASE_URL = __DEV__ ? DEV_URL : PROD_URL;

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
