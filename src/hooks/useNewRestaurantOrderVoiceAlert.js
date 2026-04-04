/**
 * Deprecated: Voice alerts have been disabled to prevent errors.
 * Kept for backwards compatibility to prevent import errors, but does nothing.
 */
export const useNewRestaurantOrderVoiceAlert = () => {
  return {
    alertsEnabled: false,
    setAlertsEnabled: () => {}
  };
};