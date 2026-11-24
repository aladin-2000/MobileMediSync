// utils/passwordPolicy.js
// Politique de mot de passe (identique au backend StrongPasswordValidator et au web) :
// au moins 10 caractères (pas de maximum), une majuscule, une minuscule, un chiffre
// et un caractère spécial.
export const PASSWORD_MIN = 10;

// Tests caractère par caractère (sans \p{…}) pour rester compatibles avec tous les moteurs JS mobiles.
const estChiffre = (c) => c >= '0' && c <= '9';
const estMajuscule = (c) => c !== c.toLowerCase() && c === c.toUpperCase();
const estMinuscule = (c) => c !== c.toUpperCase() && c === c.toLowerCase();
const estLettre = (c) => c.toLowerCase() !== c.toUpperCase();

export function passwordRules(password) {
  const chars = Array.from(password ?? '');
  return [
    { cle: 'longueur', libelle: `${PASSWORD_MIN} caractères minimum`, manque: `au moins ${PASSWORD_MIN} caractères`, ok: chars.length >= PASSWORD_MIN },
    { cle: 'majuscule', libelle: 'Une majuscule (A-Z)', manque: 'une majuscule', ok: chars.some(estMajuscule) },
    { cle: 'minuscule', libelle: 'Une minuscule (a-z)', manque: 'une minuscule', ok: chars.some(estMinuscule) },
    { cle: 'chiffre', libelle: 'Un chiffre (0-9)', manque: 'un chiffre', ok: chars.some(estChiffre) },
    { cle: 'special', libelle: 'Un caractère spécial (! @ # $ % & * …)', manque: 'un caractère spécial', ok: chars.some((c) => !estLettre(c) && !estChiffre(c)) },
  ];
}

export function isStrongPassword(password) {
  return passwordRules(password).every((r) => r.ok);
}

/** Message décrivant ce qui manque, ou '' si le mot de passe est conforme. */
export function passwordError(password) {
  const manques = passwordRules(password).filter((r) => !r.ok).map((r) => r.manque);
  if (manques.length === 0) return '';
  const liste = manques.length === 1
    ? manques[0]
    : `${manques.slice(0, -1).join(', ')} et ${manques[manques.length - 1]}`;
  return `Le mot de passe doit contenir ${liste}.`;
}
