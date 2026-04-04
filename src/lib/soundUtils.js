// Utility for playing sounds from non-React contexts
// This mimics the logic in useSound but as a standalone function

export const playNotificationSound = (volume = 0.5, type = 'notification') => {
  return new Promise((resolve) => {
    const audioPath = `/sounds/${type}-sound.mp3`;
    const audio = new Audio(audioPath);
    audio.volume = Math.max(0, Math.min(1, volume));

    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          audio.onended = resolve;
        })
        .catch((error) => {
          // Fallback to synth
          playSynthSound(type, volume);
          // Approximate duration for resolve
          setTimeout(resolve, 500);
        });
    } else {
        resolve();
    }
  });
};

// Internal synthetic fallback for the utility
const playSynthSound = (type, volume) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;
    
    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      gainNode.gain.setValueAtTime(volume * 0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } 
    else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554, now + 0.1);
      gainNode.gain.setValueAtTime(volume * 0.5, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
    else {
      // Default/Notification
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.linearRampToValueAtTime(659.25, now + 0.1);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume * 0.5, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) {
    console.error("Audio context error", e);
  }
};