/**
 * Fonctions utilitaires génériques
 */

/**
 * Met en pause l'exécution (utile pour tester des états de chargement)
 * @param {number} ms Temps en millisecondes
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Génère un identifiant unique aléatoire simple (non cryptographique)
 */
export const generateId = () => {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

/**
 * Tronque une chaîne de caractères à une longueur donnée
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Regroupe un tableau d'objets par une clé spécifique
 */
export const groupBy = (array, key) => {
  return array.reduce((result, currentValue) => {
    (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
    return result;
  }, {});
};