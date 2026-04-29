export const DEFAULT_ADMIN_SETTINGS_ID = '7eedf081-0268-4867-af38-61fa5932420a';
export const RESTAURANT_ID = DEFAULT_ADMIN_SETTINGS_ID;

/**
 * Returns the valid default admin settings ID to use as a fallback.
 */
export const getAdminSettingsId = () => {
  return DEFAULT_ADMIN_SETTINGS_ID;
};

/**
 * Validates if a given string is a properly formatted UUID.
 * @param {string} id - The ID to validate.
 * @returns {boolean} True if valid UUID, false otherwise.
 */
export const isValidAdminSettingsId = (id) => {
  if (!id || typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};