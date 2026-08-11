// services/storage.js
// Petite couche autour d'AsyncStorage pour garder le token/user/delegueId
// entre les fermetures de l'app (équivalent mobile du localStorage web).
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@medisync:token';
const USER_KEY = '@medisync:user';
const DELEGUE_ID_KEY = '@medisync:delegueId';
const MEDECIN_ID_KEY = '@medisync:medecinId';

export const getToken = () => AsyncStorage.getItem(TOKEN_KEY);

export const getUser = async () => {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const getDelegueId = () => AsyncStorage.getItem(DELEGUE_ID_KEY);

export const getMedecinId = () => AsyncStorage.getItem(MEDECIN_ID_KEY);

export const saveSession = ({ token, user }) =>
  AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);

export const saveUser = (user) => AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

export const saveDelegueId = (delegueId) => AsyncStorage.setItem(DELEGUE_ID_KEY, delegueId);

export const saveMedecinId = (medecinId) => AsyncStorage.setItem(MEDECIN_ID_KEY, medecinId);

export const clearSession = () => AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, DELEGUE_ID_KEY, MEDECIN_ID_KEY]);
