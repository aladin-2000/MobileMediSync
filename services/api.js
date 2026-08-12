// services/api.js
import { apiRequest } from './httpClient';

// ---- Inscription & vérification email — appels publics (auth:false) ----

/** GET /medecins/specialites — liste des spécialités (valeur + libellé), pour le formulaire d'inscription médecin. */
export async function getSpecialites() {
  return apiRequest('/medecins/specialites', { auth: false });
}

/** GET /api/laboratoires — liste des laboratoires, pour le sélecteur d'inscription délégué. */
export async function getLaboratoires() {
  return apiRequest('/api/laboratoires', { auth: false });
}

/** POST /medecins/inscription — auto-inscription médecin (email non vérifié, profil en attente de validation admin). */
export async function inscrireMedecin(payload) {
  return apiRequest('/medecins/inscription', { method: 'POST', body: payload, auth: false });
}

/** POST /api/delegues/inscription — auto-inscription délégué (email non vérifié). */
export async function inscrireDelegue(payload) {
  return apiRequest('/api/delegues/inscription', { method: 'POST', body: payload, auth: false });
}

/** GET /auth/verifier-email?token=... — valide le lien reçu par email. */
export async function verifierEmail(token) {
  return apiRequest(`/auth/verifier-email?token=${encodeURIComponent(token)}`, { auth: false });
}

/** POST /auth/renvoyer-verification — renvoie un nouveau lien de vérification. */
export async function renvoyerVerification(email) {
  return apiRequest('/auth/renvoyer-verification', { method: 'POST', body: { email }, auth: false });
}

// ---- Notifications — appels réels vers le backend Spring Boot ----

/** GET /api/notifications — notifications de l'utilisateur connecté, plus récentes en premier. */
export async function getMesNotifications() {
  return apiRequest('/api/notifications');
}

/** GET /api/notifications/non-lues/nombre — nombre de notifications non lues. */
export async function getNombreNotificationsNonLues() {
  return apiRequest('/api/notifications/non-lues/nombre');
}

/** PATCH /api/notifications/{id}/lue — marque une notification comme lue. */
export async function marquerNotificationLue(id) {
  return apiRequest(`/api/notifications/${id}/lue`, { method: 'PATCH' });
}

/** PATCH /api/notifications/lues — marque toutes les notifications comme lues. */
export async function marquerToutesNotificationsLues() {
  return apiRequest('/api/notifications/lues', { method: 'PATCH' });
}

const NOTIF_TYPE_ICONS = {
  REALISATION: '✅',
  ANNULATION: '❌',
  ABSENCE: '🚫',
  CONFLIT: '⚠️',
  RESERVATION: '📅',
  PROPOSITION: '🔁',
  RAPPEL: '🔔',
};

export function iconeNotification(type) {
  return NOTIF_TYPE_ICONS[type] || '🔔';
}

// ---- Partie délégué : appels réels vers le backend Spring Boot (voir services/httpClient.js) ----

/** GET /api/delegues/by-user/{userId} — le profil délégué (donc son "delegueId") pour un compte connecté. */
export async function getDelegueByUserId(userId) {
  return apiRequest(`/api/delegues/by-user/${userId}`);
}

/** GET /medecins/by-user/{userId} — le profil médecin (donc son "medecinId") pour un compte connecté. */
export async function getMedecinByUserId(userId) {
  return apiRequest(`/medecins/by-user/${userId}`);
}

/** PUT /medecins/mon-profil — met à jour le profil du médecin connecté. */
export async function updateMonProfilMedecin(payload) {
  return apiRequest('/medecins/mon-profil', { method: 'PUT', body: payload });
}

/** PUT /api/delegues/mon-profil — met à jour le profil du délégué connecté. */
export async function updateMonProfilDelegue(payload) {
  return apiRequest('/api/delegues/mon-profil', { method: 'PUT', body: payload });
}

/**
 * GET /medecins/recherche — recherche publique de médecins disponibles.
 * `specialite` est un tableau de valeurs d'enum (ex: ['CARDIOLOGIE', 'DERMATOLOGIE']) —
 * le backend accepte une ou plusieurs spécialités via le paramètre `specialites`.
 */
export async function rechercherMedecins({ nom, specialite, date, heureDebut, heureFin } = {}) {
  const params = new URLSearchParams();
  if (nom) params.append('nom', nom);
  if (specialite && specialite.length > 0) params.append('specialites', specialite.join(','));
  params.append('date', date);
  if (heureDebut) params.append('heureDebut', `${heureDebut}:00`);
  if (heureFin) params.append('heureFin', `${heureFin}:00`);

  return apiRequest(`/medecins/recherche?${params.toString()}`, { auth: false });
}

/** GET /medecins/creneaux/periode — tous les créneaux d'un médecin sur une période (ne garder que DISPONIBLE côté écran). */
export async function getCreneauxMedecin(medecinId, dateDebut, dateFin) {
  return apiRequest(
    `/medecins/creneaux/periode?medecinId=${medecinId}&dateDebut=${dateDebut}&dateFin=${dateFin}`,
    { auth: false }
  );
}

/** POST /api/rendezvous — réserver un créneau (rôle DELEGUE requis). */
export async function reserverRendezVous({ creneauId, delegueId, medecinId }) {
  return apiRequest('/api/rendezvous', { method: 'POST', body: { creneauId, delegueId, medecinId } });
}

/** PATCH /api/rendezvous/{id}/annuler-delegue — annule un RDV côté délégué (libère le créneau). */
export async function annulerRendezVousDelegue(id) {
  return apiRequest(`/api/rendezvous/${id}/annuler-delegue`, { method: 'PATCH' });
}

/** PATCH /api/rendezvous/{id}/annuler-medecin — annule un RDV côté médecin (motif obligatoire). */
export async function annulerRendezVousMedecin(id, motifAnnulation) {
  return apiRequest(`/api/rendezvous/${id}/annuler-medecin`, { method: 'PATCH', body: { motifAnnulation } });
}

/** PATCH /api/rendezvous/{id}/realise-delegue — confirmation du délégué (passe à REALISE si le médecin a aussi confirmé). */
export async function realiserRendezVousDelegue(id) {
  return apiRequest(`/api/rendezvous/${id}/realise-delegue`, { method: 'PATCH' });
}

/** PATCH /api/rendezvous/{id}/realise-medecin — confirmation du médecin (passe à REALISE si le délégué a aussi confirmé). */
export async function realiserRendezVousMedecin(id) {
  return apiRequest(`/api/rendezvous/${id}/realise-medecin`, { method: 'PATCH' });
}

/** PATCH /api/rendezvous/{id}/absent-medecin — le délégué constate que le médecin ne s'est pas présenté. */
export async function marquerAbsentMedecin(id) {
  return apiRequest(`/api/rendezvous/${id}/absent-medecin`, { method: 'PATCH' });
}

/** PATCH /api/rendezvous/{id}/absent-delegue — le médecin constate que le délégué ne s'est pas présenté. */
export async function marquerAbsentDelegue(id) {
  return apiRequest(`/api/rendezvous/${id}/absent-delegue`, { method: 'PATCH' });
}

export const STATUT_RDV_LABELS = {
  RESERVE: 'Confirmé',
  REALISE: 'Effectué',
  ANNULE: 'Annulé',
  ABSENT_MEDECIN: 'Médecin absent',
  ABSENT_DELEGUE: 'Délégué absent',
  CONFLIT: 'En conflit',
};

/** GET /api/delegues/{id} — profil délégué par id (pour enrichir un RDV côté médecin). Nécessite d'être connecté. */
export async function getDelegueById(id) {
  return apiRequest(`/api/delegues/${id}`);
}

// Le backend ne renvoie que des IDs sur un RendezVousResponse (pas le nom du médecin/délégué ni
// l'heure du créneau) : on complète chaque RDV avec un appel créneau + médecin (côté délégué) ou
// créneau + délégué (côté médecin), en réutilisant AppointmentCard.js tel quel côté affichage.
async function enrichirRendezVous(rendezVousList, role) {
  return Promise.all(
    rendezVousList.map(async (rdv) => {
      const [creneau, personne] = await Promise.all([
        apiRequest(`/medecins/creneaux/${rdv.creneauId}`, { auth: false }),
        role === 'MEDECIN'
          ? getDelegueById(rdv.delegueId)
          : apiRequest(`/medecins/${rdv.medecinId}`, { auth: false }),
      ]);
      return {
        id: rdv.id,
        date: creneau.date,
        heure: creneau.heureDebut.slice(0, 5),
        statut: STATUT_RDV_LABELS[rdv.statut] || rdv.statut,
        statutBrut: rdv.statut,
        realiseParDelegue: rdv.realiseParDelegue,
        realiseParMedecin: rdv.realiseParMedecin,
        ...(role === 'MEDECIN'
          ? { delegue: { nom: `${personne.prenom} ${personne.nom}`, telephone: personne.telephone } }
          : { medecin: { nom: `Dr. ${personne.prenom} ${personne.nom}`, specialite: personne.specialite, adresse: personne.adresseCabinet } }),
      };
    })
  );
}

/** GET /api/rendezvous/delegue/{delegueId} — tous les RDV du délégué, sans filtre. */
export async function getRendezVousDelegue(delegueId) {
  const list = await apiRequest(`/api/rendezvous/delegue/${delegueId}`);
  return enrichirRendezVous(list, 'DELEGUE');
}

/** GET /api/rendezvous/medecin/{medecinId} — tous les RDV du médecin, sans filtre. */
export async function getRendezVousMedecin(medecinId) {
  const list = await apiRequest(`/api/rendezvous/medecin/${medecinId}`);
  return enrichirRendezVous(list, 'MEDECIN');
}

// ---- Créneaux (disponibilités du médecin) — appels réels vers le backend Spring Boot ----

const WEEKDAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

// Shift a YYYY-MM-DD string by a number of days
const addDaysToDateString = (dateStr, days) => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

/** POST /medecins/creneaux/ajouter-une-plage-de-creneaux — planifier des créneaux libres (rôle MEDECIN). */
export async function ajouterPlage(medecinId, { dateDebut, dateFin, heureDebut, heureFin }) {
  return apiRequest(`/medecins/creneaux/ajouter-une-plage-de-creneaux?medecinId=${medecinId}`, {
    method: 'POST',
    body: { dateDebut, dateFin, heureDebut: `${heureDebut}:00`, heureFin: `${heureFin}:00` },
  });
}

/** DELETE /medecins/creneaux/supprimer-une-plage-de-creneaux — retirer des créneaux libres (jamais les réservés) (rôle MEDECIN). */
export async function supprimerPlage(medecinId, { dateDebut, dateFin, heureDebut, heureFin }) {
  return apiRequest(`/medecins/creneaux/supprimer-une-plage-de-creneaux?medecinId=${medecinId}`, {
    method: 'DELETE',
    body: { dateDebut, dateFin, heureDebut: `${heureDebut}:00`, heureFin: `${heureFin}:00` },
  });
}

/** Supprimer tous les créneaux libres d'une seule journée (aide autour de supprimerPlage). */
export async function supprimerJour(medecinId, date) {
  return apiRequest(`/medecins/creneaux/supprimer-une-plage-de-creneaux?medecinId=${medecinId}`, {
    method: 'DELETE',
    body: { dateDebut: date, dateFin: date, heureDebut: '00:00:00', heureFin: '23:59:59' },
  });
}

/**
 * Statistiques du mois pour le médecin (calculées côté client à partir de GET /medecins/creneaux/periode) :
 * total/réservés/libres/taux de remplissage, ainsi que le taux de remplissage moyen par jour de la semaine (Lundi à Samedi).
 */
export async function getStatsMoisMedecin(medecinId, year, month) {
  const dateDebut = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const dernierJour = new Date(year, month + 1, 0).getDate();
  const dateFin = `${year}-${String(month + 1).padStart(2, '0')}-${String(dernierJour).padStart(2, '0')}`;

  const creneaux = (await getCreneauxMedecin(medecinId, dateDebut, dateFin)).filter((c) => c.statut !== 'ANNULE');
  const total = creneaux.length;
  const reserves = creneaux.filter((c) => c.statut === 'RESERVE').length;
  const libres = total - reserves;
  const taux = total ? Math.round((reserves / total) * 100) : 0;

  const parJour = { Lun: [0, 0], Mar: [0, 0], Mer: [0, 0], Jeu: [0, 0], Ven: [0, 0], Sam: [0, 0] };
  creneaux.forEach((c) => {
    const label = WEEKDAY_LABELS[new Date(c.date).getDay()];
    if (!parJour[label]) return;
    parJour[label][0] += 1;
    if (c.statut === 'RESERVE') parJour[label][1] += 1;
  });
  const statsJours = Object.entries(parJour).map(([label, [t, r]]) => ({
    label,
    taux: t ? Math.round((r / t) * 100) : 0,
  }));

  return { total, reserves, libres, taux, statsJours };
}

/**
 * Créneaux de la semaine (Lundi à Samedi) démarrant à `mondayDate` (YYYY-MM-DD), pour l'écran
 * "Rendez-vous" du médecin (calculés côté client à partir de GET /medecins/creneaux/periode).
 */
export async function getSemaineMedecin(medecinId, mondayDate) {
  const dateFin = addDaysToDateString(mondayDate, 5);
  const creneaux = (await getCreneauxMedecin(medecinId, mondayDate, dateFin)).filter((c) => c.statut !== 'ANNULE');
  const labels = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  const days = [];
  for (let i = 0; i < 6; i++) {
    const date = addDaysToDateString(mondayDate, i);
    const daySlots = creneaux
      .filter((c) => c.date === date)
      .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut))
      .map((c) => ({
        heure: c.heureDebut.slice(0, 5).replace(':', 'h'),
        statut: c.statut === 'RESERVE' ? 'reserve' : 'libre',
      }));
    days.push({ label: labels[i], date, creneaux: daySlots });
  }
  return days;
}
