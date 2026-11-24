// Numéros de téléphone : 8 chiffres (format tunisien, sans indicatif), masque « XX XXX XXX ».
export const PHONE_LENGTH = 8;

/** Garde les chiffres, retire un éventuel +216 / 00216 et tronque à 8 chiffres. */
export function normalizePhone(value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length > PHONE_LENGTH) {
    if (digits.startsWith('00216')) digits = digits.slice(5);
    else if (digits.startsWith('216')) digits = digits.slice(3);
  }
  return digits.slice(0, PHONE_LENGTH);
}

/** Affichage avec le masque « XX XXX XXX ». */
export function formatPhone(value) {
  const d = normalizePhone(value);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 8)].filter(Boolean).join(' ');
}

/** Vide (facultatif) ou exactement 8 chiffres. */
export function isValidPhone(value) {
  const v = String(value ?? '').trim();
  return v === '' || /^\d{8}$/.test(v);
}

/** Props à étaler sur un TextInput : <TextInput {...phoneInputProps(tel, setTel)} /> */
export function phoneInputProps(value, onChange) {
  return {
    value: formatPhone(value),
    onChangeText: (text) => onChange(normalizePhone(text)),
    keyboardType: 'number-pad',
    maxLength: 10, // 8 chiffres + 2 espaces du masque
    placeholder: 'XX XXX XXX',
    placeholderTextColor: '#a0a7b0',
  };
}

export const PHONE_ERROR_MESSAGE = `Le numéro de téléphone doit contenir exactement ${PHONE_LENGTH} chiffres.`;
