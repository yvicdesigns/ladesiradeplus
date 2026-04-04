/**
 * Deprecated: Voice alerts have been disabled to prevent errors.
 * Kept for backwards compatibility to prevent import errors, but does nothing.
 */
export const useNewOrderVoiceAlert = () => {
  return {
    alertsEnabled: false,
    setAlertsEnabled: () => {}
  };
};