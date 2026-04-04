/**
 * Fonctions de validation de données
 */

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const validatePhone = (phone) => {
  // Accepte un format de base international ou local (min 8 chiffres)
  const re = /^\+?[\d\s-]{8,}$/;
  return re.test(String(phone));
};

export const validatePassword = (password) => {
  // Minimum 6 caractères
  return password && password.length >= 6;
};

export const validateRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};