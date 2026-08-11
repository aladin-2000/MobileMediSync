// services/authService.js
import { apiRequest } from './httpClient';
import { getUser, saveSession, saveUser, clearSession } from './storage';

export { getToken, getUser, getDelegueId, saveDelegueId, getMedecinId, saveMedecinId } from './storage';

/** POST /auth/login — pas de token à envoyer, on vient de se connecter. */
export async function login(email, password) {
  const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password }, auth: false });
  await saveSession(data); // { token, user }
  return data;
}

/** PUT /auth/changer-mot-de-passe — obligatoire tant que user.mustChangePassword === true. */
export async function changerMotDePasse(currentPassword, newPassword) {
  await apiRequest('/auth/changer-mot-de-passe', {
    method: 'PUT',
    body: { currentPassword, newPassword },
  });
  const user = await getUser();
  if (user) {
    await saveUser({ ...user, mustChangePassword: false });
  }
}

/** GET /auth/me — revalide le token au démarrage de l'app. */
export async function getMe() {
  const data = await apiRequest('/auth/me');
  await saveUser(data);
  return data;
}

/** Logout = vider le storage, aucun appel réseau. */
export async function logout() {
  await clearSession();
}
