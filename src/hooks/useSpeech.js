import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export const useSpeech = () => {
  const [speechEnabled, setSpeechEnabled] = useLocalStorage('speechEnabled', true);
  const [speechVolume, setSpeechVolume] = useLocalStorage('speechVolume', 1.0);
  const [speechVoiceURI, setSpeechVoiceURI] = useLocalStorage('speechVoiceURI', '');
  const [speechSpeed, setSpeechSpeed] = useLocalStorage('speechSpeed', 1.0);
  const [speechPitch, setSpeechPitch] = useLocalStorage('speechPitch', 1.0);
  const [voices, setVoices] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  useEffect(() => {
    console.log("useSpeech hook initialized");
    try {
      if (!synth) {
        console.error("useSpeech: Web Speech API not supported in this browser");
        setIsSupported(false);
        return;
      }
      setIsSupported(true);

      const updateVoices = () => {
        try {
          const availableVoices = synth.getVoices() || [];
          console.log(`useSpeech: ${availableVoices.length} voices loaded`);
          
          // Filter primarily for French voices
          const frVoices = availableVoices.filter(v => v.lang.includes('fr'));
          // Combine French voices first, then others
          const sortedVoices = [...frVoices, ...availableVoices.filter(v => !v.lang.includes('fr'))];
          setVoices(sortedVoices);
        } catch (err) {
          console.warn("useSpeech: Failed to get voices", err);
          setVoices([]);
        }
      };

      updateVoices();
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = updateVoices;
      }
    } catch (err) {
      console.error("useSpeech: Initialization error", err);
      setIsSupported(false);
    }
  }, [synth]);

  const speakText = useCallback((text, options = {}) => {
    if (!isSupported || !synth) {
        console.warn("useSpeech: Speech not supported");
        return;
    }
    if (!speechEnabled) {
        console.log("useSpeech: Speech disabled in settings");
        return;
    }
    if (!text) {
        console.warn("useSpeech: No text provided to speak");
        return;
    }
    
    console.log(`useSpeech: Speaking text: "${text}"`);
    
    try {
        // Cancel any current speech
        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Default to French
        utterance.lang = 'fr-FR';

        // Find selected voice or default to first available French voice
        const voiceToUse = voices.find(v => v.voiceURI === (options.voiceURI || speechVoiceURI)) || 
                        voices.find(v => v.lang.includes('fr')) || 
                        voices[0];
        
        if (voiceToUse) {
            utterance.voice = voiceToUse;
            console.log(`useSpeech: Using voice: ${voiceToUse.name} (${voiceToUse.lang})`);
        } else {
            console.warn("useSpeech: No suitable voice found");
        }
        
        utterance.volume = options.volume !== undefined ? options.volume : speechVolume;
        utterance.rate = options.speed !== undefined ? options.speed : speechSpeed;
        utterance.pitch = options.pitch !== undefined ? options.pitch : speechPitch;

        utterance.onstart = () => {
            console.log("useSpeech: Speech started");
            setIsSpeaking(true);
        };
        utterance.onend = () => {
            console.log("useSpeech: Speech ended");
            setIsSpeaking(false);
        };
        utterance.onerror = (e) => {
            console.warn("useSpeech: Speech error event", e);
            setIsSpeaking(false);
        };

        synth.speak(utterance);
    } catch (e) {
        console.error("useSpeech: Exception during speech synthesis", e);
        setIsSpeaking(false);
    }
  }, [speechEnabled, speechVolume, speechVoiceURI, speechSpeed, speechPitch, voices, synth, isSupported]);

  const stopSpeech = useCallback(() => {
    try {
      if (synth && isSupported) {
        console.log("useSpeech: Stopping speech");
        synth.cancel();
        setIsSpeaking(false);
      }
    } catch (err) {
      console.warn("useSpeech: Failed to stop speech", err);
    }
  }, [synth, isSupported]);

  const pauseSpeech = useCallback(() => {
    try {
      if (synth && isSupported) {
        synth.pause();
        setIsSpeaking(false);
      }
    } catch (err) {
      console.warn("useSpeech: Failed to pause speech", err);
    }
  }, [synth, isSupported]);

  const resumeSpeech = useCallback(() => {
    try {
      if (synth && isSupported) {
        synth.resume();
        setIsSpeaking(true);
      }
    } catch (err) {
      console.warn("useSpeech: Failed to resume speech", err);
    }
  }, [synth, isSupported]);

  const getAvailableVoices = () => voices;

  return {
    speakText,
    stopSpeech,
    pauseSpeech,
    resumeSpeech,
    getAvailableVoices,
    isSpeaking,
    isSupported,
    speechEnabled,
    setSpeechEnabled,
    speechVolume,
    setSpeechVolume,
    speechVoiceURI,
    setSpeechVoiceURI,
    speechSpeed,
    setSpeechSpeed,
    speechPitch,
    setSpeechPitch
  };
};