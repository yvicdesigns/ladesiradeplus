// Utility for playing sounds from non-React contexts
// This mimics the logic in useSound but as a standalone function

/**
 * Plays an urgent restaurant alert bell (two sequences of 3 ascending notes).
 * If a custom audio URL is provided and enabled, plays that instead.
 */
export const playNewOrderSound = async (volume = 0.9, customAudioUrl = null, customEnabled = false) => {
  // Try custom MP3 first if configured
  if (customEnabled && customAudioUrl) {
    try {
      const audio = new Audio(customAudioUrl);
      audio.volume = Math.max(0, Math.min(1, volume));
      await audio.play();
      return;
    } catch {
      // Fall through to synth
    }
  }

  // Synth fallback — urgent restaurant alert bell, plays TWICE
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch { return; }
    }

    // Each "ring" = 3 ascending notes with bell timbre (sine + triangle harmonic)
    const playRing = (startOffset) => {
      const notes = [
        { freq: 880,  start: startOffset + 0,     duration: 0.20 }, // La5
        { freq: 1108, start: startOffset + 0.20,  duration: 0.20 }, // Ré6
        { freq: 1318, start: startOffset + 0.40,  duration: 0.55 }, // Mi6 (tenu)
      ];

      notes.forEach(({ freq, start, duration }) => {
        // Fundamental — sine wave, full volume
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain1.gain.setValueAtTime(0, ctx.currentTime + start);
        gain1.gain.linearRampToValueAtTime(volume, ctx.currentTime + start + 0.005); // attaque percussive
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc1.start(ctx.currentTime + start);
        osc1.stop(ctx.currentTime + start + duration + 0.01);

        // Harmonique — triangle à 2× la fréquence (timbre de cloche)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 2, ctx.currentTime + start);
        gain2.gain.setValueAtTime(0, ctx.currentTime + start);
        gain2.gain.linearRampToValueAtTime(volume * 0.35, ctx.currentTime + start + 0.005);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration * 0.75);
        osc2.start(ctx.currentTime + start);
        osc2.stop(ctx.currentTime + start + duration + 0.01);
      });
    };

    // Première sonnerie immédiate
    playRing(0);
    // Deuxième sonnerie 1.2s après (gap perceptible, impossible à manquer)
    playRing(1.2);

  } catch (e) {
    console.warn('[Sound] New order alert failed:', e);
  }
};

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