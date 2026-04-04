/**
 * Standardized logging for the Audio/Voice system to help with debugging and auditing.
 */
export const logAudioEvent = (eventType, source, status, details = {}) => {
  const timestamp = new Date().toISOString();
  let style = 'color: #3b82f6; font-weight: bold'; // Blue for Info

  if (status === 'ERROR') {
    style = 'color: #ef4444; font-weight: bold'; // Red for Error
  } else if (status === 'SUCCESS') {
    style = 'color: #FCD34D; font-weight: bold'; // Green for Success
  } else if (status === 'WARNING') {
    style = 'color: #f59e0b; font-weight: bold'; // Amber for Warning
  }

  // Store log in a global array for the debug panel if needed
  if (typeof window !== 'undefined') {
    window.__AUDIO_LOGS__ = window.__AUDIO_LOGS__ || [];
    window.__AUDIO_LOGS__.unshift({ timestamp, eventType, source, status, details });
    if (window.__AUDIO_LOGS__.length > 50) window.__AUDIO_LOGS__.pop();
  }

  console.log(
    `%c[AudioSystem] ${eventType} | ${source} | ${status}`,
    style,
    details
  );
};

export const getAudioLogs = () => {
    return typeof window !== 'undefined' ? (window.__AUDIO_LOGS__ || []) : [];
};

export const clearAudioLogs = () => {
    if (typeof window !== 'undefined') {
        window.__AUDIO_LOGS__ = [];
    }
};