import { APP_CONFIG } from '../constants/appConfig';

/**
 * Centralized formatting functions.
 */

/**
 * Formats a number to currency string.
 * @param {number} amount 
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return `0 ${APP_CONFIG.CURRENCY_SYMBOL}`;
  return `${Number(amount).toLocaleString('fr-FR')} ${APP_CONFIG.CURRENCY_SYMBOL}`;
};

/**
 * Formats a date string to a localized date.
 * @param {string|Date} dateString 
 * @returns {string}
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Formats a date string to a localized time.
 * @param {string|Date} dateString 
 * @returns {string}
 */
export const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};