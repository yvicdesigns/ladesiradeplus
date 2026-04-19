import { useState, useEffect, useCallback } from 'react';
import { VoiceService } from '@/lib/VoiceService';

const isNativePlatform = () => {
  try { return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.(); }
  catch { return false; }
};

export function useVoiceDiagnostics() {
  const [status, setStatus] = useState(() => {
    if (isNativePlatform()) return { isSupported: true, voiceCount: 1, voicesLoaded: true };
    return VoiceService.getVoiceServiceStatus();
  });
  const [logs, setLogs] = useState(VoiceService.getDiagnosticLogs());

  const refreshDiagnostics = useCallback(() => {
    if (isNativePlatform()) {
      setStatus({ isSupported: true, voiceCount: 1, voicesLoaded: true });
    } else {
      setStatus(VoiceService.getVoiceServiceStatus());
    }
    setLogs(VoiceService.getDiagnosticLogs());
  }, []);

  useEffect(() => {
    // Initial fetch
    refreshDiagnostics();

    // Setup listener for voices changed
    const handleVoicesChanged = () => {
      refreshDiagnostics();
    };

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    }

    // Interval to catch state changes (speaking, pending)
    const interval = setInterval(refreshDiagnostics, 1000);

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      }
      clearInterval(interval);
    };
  }, [refreshDiagnostics]);

  const testTTS = async (text = "Test de synthèse vocale.") => {
    return await VoiceService.speak(text, { volume: 1 });
  };

  const testFallback = () => {
    return VoiceService.playFallbackBeep();
  };

  const clearLogs = () => {
    VoiceService.clearLogs();
    refreshDiagnostics();
  };

  return {
    status,
    logs,
    refreshDiagnostics,
    testTTS,
    testFallback,
    clearLogs
  };
}