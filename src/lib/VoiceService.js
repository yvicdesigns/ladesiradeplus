/**
 * VoiceService - A safe wrapper for Web Speech API with comprehensive error handling,
 * detailed diagnostic logging, and fallback mechanisms.
 */

// Internal memory for diagnostic logs
const diagnosticLogs = [];
const MAX_LOGS = 50;

// Cache for browser support to prevent infinite checking loops
let cachedBrowserSupport = null;

// Chrome bug workaround: speechSynthesis pauses itself after ~15s of inactivity.
// Calling resume() periodically keeps the engine alive and prevents stuck state.
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (window.speechSynthesis && !window.speechSynthesis.speaking) {
      window.speechSynthesis.resume();
    }
  }, 5000);
}

const addLog = (level, action, details = null) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    action,
    details: details ? (typeof details === 'object' ? JSON.stringify(details) : details.toString()) : ''
  };
  diagnosticLogs.unshift(logEntry);
  if (diagnosticLogs.length > MAX_LOGS) diagnosticLogs.pop();
  
  const consoleMsg = `[VoiceService ${logEntry.timestamp}] [${level}] ${action}`;
  if (level === 'ERROR') console.error(consoleMsg, details);
  else if (level === 'WARN') console.warn(consoleMsg, details);
  else console.log(consoleMsg, details);
};

export const VoiceService = {
  getDiagnosticLogs: () => [...diagnosticLogs],
  
  clearLogs: () => {
    diagnosticLogs.length = 0;
    addLog('INFO', 'Logs cleared');
  },

  /**
   * Checks for browser support of various audio/voice features
   * Uses a cached result to prevent infinite loops during polling/diagnostics
   * @returns {Object} Feature support flags
   */
  checkBrowserSupport: () => {
    if (cachedBrowserSupport) {
      return cachedBrowserSupport;
    }

    addLog('INFO', 'Checking browser support (initial evaluation)');
    try {
      const isSpeechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
      const isSpeechRecognitionSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
      const isAudioContextSupported = typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);
      
      cachedBrowserSupport = {
        speechSynthesisSupported: isSpeechSynthesisSupported,
        speechRecognitionSupported: isSpeechRecognitionSupported,
        audioContextSupported: isAudioContextSupported,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
      };
      
      addLog('INFO', 'Browser support result cached', cachedBrowserSupport);
      return cachedBrowserSupport;
    } catch (error) {
      addLog('ERROR', 'Error checking browser support', error);
      cachedBrowserSupport = {
        speechSynthesisSupported: false,
        speechRecognitionSupported: false,
        audioContextSupported: false,
        userAgent: 'Error'
      };
      return cachedBrowserSupport;
    }
  },

  getVoiceServiceStatus: () => {
    // This will now use the cached support result, preventing infinite console logs
    // when polled by useVoiceDiagnostics.
    const support = VoiceService.checkBrowserSupport();
    let voices = [];
    let isPending = false;
    let isSpeaking = false;
    let isPaused = false;

    if (support.speechSynthesisSupported && window.speechSynthesis) {
      voices = window.speechSynthesis.getVoices();
      isPending = window.speechSynthesis.pending;
      isSpeaking = window.speechSynthesis.speaking;
      isPaused = window.speechSynthesis.paused;
    }

    return {
      isSupported: support.speechSynthesisSupported,
      voicesLoaded: voices.length > 0,
      voiceCount: voices.length,
      isPending,
      isSpeaking,
      isPaused,
      audioContextSupported: support.audioContextSupported
    };
  },

  isAvailable: () => {
    try {
      const support = VoiceService.checkBrowserSupport();
      return support.speechSynthesisSupported && window.speechSynthesis !== undefined && window.speechSynthesis !== null;
    } catch (error) {
      addLog('ERROR', 'Error checking availability', error);
      return false;
    }
  },

  isSupported: () => VoiceService.isAvailable(),

  loadVoicesAsync: () => {
    addLog('INFO', 'Starting async voice load');
    return new Promise((resolve) => {
      try {
        if (!VoiceService.isSupported()) {
          addLog('WARN', 'Speech synthesis not supported, returning empty voices');
          return resolve([]);
        }
        
        let voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          addLog('INFO', `Voices already loaded asynchronously: ${voices.length}`);
          return resolve(voices);
        }

        const handleVoicesChanged = () => {
          voices = window.speechSynthesis.getVoices();
          addLog('INFO', `onvoiceschanged fired. Loaded ${voices.length} voices`);
          window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
          resolve(voices);
        };

        window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

        setTimeout(() => {
          window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
          const fallbackVoices = window.speechSynthesis.getVoices() || [];
          addLog('WARN', `Voice loading timeout reached. Fallback voices count: ${fallbackVoices.length}`);
          resolve(fallbackVoices);
        }, 3000); // Increased timeout for loading voices

      } catch (e) {
        addLog('ERROR', 'Error in loadVoicesAsync', e);
        resolve([]);
      }
    });
  },

  getVoiceList: () => {
    try {
      if (!VoiceService.isSupported()) return [];
      return window.speechSynthesis.getVoices() || [];
    } catch (error) {
      addLog('ERROR', 'Failed to get voice list synchronously', error);
      return [];
    }
  },

  getFrenchVoice: (voices = null) => {
    try {
      const vList = voices || VoiceService.getVoiceList();
      // Prefer Chrome's built-in Google voices (more reliable than macOS system voices)
      const googleFr = vList.find(v => v.name.toLowerCase().includes('google') && v.lang.startsWith('fr'));
      if (googleFr) {
        addLog('INFO', 'Found Google French voice', googleFr.name);
        return googleFr;
      }
      const frVoice = vList.find(v => v.lang.startsWith('fr')) ||
                      vList.find(v => v.name.toLowerCase().includes('french')) ||
                      null;
      if (frVoice) addLog('INFO', 'Found French voice', frVoice.name);
      else addLog('WARN', 'No French voice found');
      return frVoice;
    } catch (error) {
      addLog('ERROR', 'Failed to find French voice', error);
      return null;
    }
  },

  playFallbackBeep: () => {
    addLog('INFO', 'Attempting to play fallback beep using Web Audio API');
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        addLog('WARN', 'Web Audio API not supported for fallback');
        return false;
      }
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4 note
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime); // Low volume
      gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 1);
      
      addLog('SUCCESS', 'Fallback beep played successfully');
      return true;
    } catch (error) {
      addLog('ERROR', 'Fallback beep failed', error);
      return false;
    }
  },

  speak: async (text, options = {}) => {
    addLog('INFO', 'Speak called', { text, options });
    
    if (!VoiceService.isSupported()) {
      addLog('WARN', 'Speak failed - browser not supported. Triggering fallback.');
      VoiceService.playFallbackBeep();
      return false;
    }

    return new Promise(async (resolve) => {
      try {
        if (!text) {
          addLog('WARN', 'No text provided to speak');
          return resolve(false);
        }

        const loadedVoices = await VoiceService.loadVoicesAsync();
        if (loadedVoices.length === 0) {
           addLog('WARN', 'No voices loaded. Triggering fallback beep.');
           VoiceService.playFallbackBeep();
           return resolve(false);
        }

        addLog('INFO', 'Creating SpeechSynthesisUtterance');
        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.pitch = options.pitch !== undefined ? options.pitch : 1;
        utterance.rate = options.rate !== undefined ? options.rate : 1;
        utterance.volume = options.volume !== undefined ? options.volume : 1;
        
        if (options.voice) {
          utterance.voice = options.voice;
        } else {
          const frVoice = VoiceService.getFrenchVoice(loadedVoices);
          if (frVoice) utterance.voice = frVoice;
          else utterance.voice = loadedVoices[0]; // Strict fallback to first voice
        }
        
        utterance.lang = options.lang || 'fr-FR';

        addLog('INFO', 'Utterance properties set', {
          pitch: utterance.pitch,
          rate: utterance.rate,
          volume: utterance.volume,
          voice: utterance.voice ? utterance.voice.name : 'default',
          lang: utterance.lang
        });

        let hasResolved = false;
        let timeoutId = null;

        const safeResolve = (success) => {
          if (!hasResolved) {
            hasResolved = true;
            if (timeoutId) clearTimeout(timeoutId);
            addLog('INFO', `Speech promise resolving with: ${success}`);
            resolve(success);
          }
        };

        utterance.onstart = (e) => {
          addLog('SUCCESS', 'Speech started');
          if (options.onStart) options.onStart(e);
        };

        utterance.onend = (e) => {
          addLog('SUCCESS', 'Speech ended normally');
          if (options.onEnd) options.onEnd(e);
          safeResolve(true);
        };
        
        utterance.onerror = (event) => {
          if (event.error === 'canceled' || event.error === 'interrupted') {
             addLog('WARN', 'Speech was canceled or interrupted');
             safeResolve(false);
             return;
          }

          addLog('ERROR', 'Utterance onerror fired', event.error || event);
          if (options.onError) options.onError(event);
          
          // Fallback if blocked
          if (event.error === 'not-allowed') {
             VoiceService.playFallbackBeep();
          }
          safeResolve(false);
        };

        // Safety timeout (defaults to 15s if not specified, prevents infinite hanging on slower mobile devices)
        const timeoutMs = options.timeout || 15000;
        timeoutId = setTimeout(() => {
          addLog('ERROR', `Speech synthesis timed out after ${timeoutMs}ms. Stopping.`);
          VoiceService.stop();
          VoiceService.playFallbackBeep(); // Added fallback beep to ensure the user gets at least some feedback
          if (options.onError) options.onError(new Error(`La synthèse vocale a expiré après ${timeoutMs/1000}s. Le son de secours a été activé.`));
          safeResolve(false);
        }, timeoutMs);

        // Chrome bug: speechSynthesis can get paused after page navigation.
        // Must call resume() before speak(), otherwise utterances are immediately cancelled.
        if (window.speechSynthesis.paused) {
          addLog('INFO', 'speechSynthesis was paused — calling resume()');
          window.speechSynthesis.resume();
        }
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }

        addLog('INFO', 'Invoking window.speechSynthesis.speak()');
        window.speechSynthesis.speak(utterance);
        // Chrome bug: utterance can be queued but never start playing.
        // Calling resume() after speak() kicks the engine out of stuck state.
        window.speechSynthesis.resume();

      } catch (error) {
        addLog('ERROR', 'Unexpected error during speak attempt', error);
        VoiceService.playFallbackBeep();
        resolve(false);
      }
    });
  },

  stop: () => {
    try {
      if (VoiceService.isSupported() && window.speechSynthesis.speaking) {
        addLog('INFO', 'Stopping speech manually');
        window.speechSynthesis.cancel();
      }
    } catch (error) {
      addLog('ERROR', 'Failed to stop speech', error);
    }
  },

  cancel: () => VoiceService.stop()
};

export default VoiceService;