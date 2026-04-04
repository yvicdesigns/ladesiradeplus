/**
 * Centralized validation functions.
 */

/**
 * Validates an email format.
 * @param {string} email 
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validates a phone number (basic numeric check).
 * @param {string} phone 
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  const re = /^[0-9+\s-]{8,15}$/;
  return re.test(String(phone));
};

/**
 * Checks if a string is empty or only whitespace.
 * @param {string} str 
 * @returns {boolean}
 */
export const isEmpty = (str) => {
  return !str || str.trim().length === 0;
};