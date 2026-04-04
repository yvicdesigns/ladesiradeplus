export const SoundGeneratorService = {
  // Main generation entry point
  generate: async (audioContext, type) => {
    switch (type) {
      case 'beep':
        return SoundGeneratorService.createTone(audioContext, 440, 0.1, 'sine');
      case 'beep_high':
        return SoundGeneratorService.createTone(audioContext, 880, 0.1, 'sine');
      case 'beep_low':
        return SoundGeneratorService.createTone(audioContext, 220, 0.15, 'sine');
      case 'ding':
        return SoundGeneratorService.createDing(audioContext);
      case 'pop':
        return SoundGeneratorService.createPop(audioContext);
      case 'chime':
        return SoundGeneratorService.createChime(audioContext);
      case 'click': // Legacy fallback
        return SoundGeneratorService.createTone(audioContext, 800, 0.05, 'sine');
      default:
        // Default to a simple beep if type is unknown
        return SoundGeneratorService.createTone(audioContext, 440, 0.1, 'sine');
    }
  },

  createTone: async (ctx, freq, duration, type = 'sine') => {
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Simple envelope to avoid clicking
      const envelope = Math.max(0, 1 - (t / duration)); 
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope;
    }
    return buffer;
  },

  createDing: async (ctx) => {
    const duration = 1.5;
    const freq = 1200;
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Exponential decay for bell-like sound
      const envelope = Math.exp(-4 * t); 
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope;
    }
    return buffer;
  },

  createPop: async (ctx) => {
    const duration = 0.05;
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      // Frequency sweep
      const freq = 200 + (1000 * t / duration); 
      data[i] = Math.sin(2 * Math.PI * freq * t);
    }
    return buffer;
  },

  createChime: async (ctx) => {
    const duration = 1.0;
    const root = 600;
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-3 * t);
      
      // Major triad
      const v1 = Math.sin(2 * Math.PI * root * t);
      const v2 = Math.sin(2 * Math.PI * (root * 1.25) * t); // Major 3rd
      const v3 = Math.sin(2 * Math.PI * (root * 1.5) * t);  // Perfect 5th

      data[i] = ((v1 + v2 + v3) / 3) * envelope;
    }
    return buffer;
  }
};