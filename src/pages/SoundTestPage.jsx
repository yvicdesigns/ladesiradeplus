import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useSound } from '@/hooks/useSound';
import { useSpeech } from '@/hooks/useSpeech';
import { ArrowLeft, Play, Volume2, Mic, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import SoundCacheService from '@/lib/SoundCacheService';

const SoundTestPage = () => {
  const { playSound, testBeep, soundEnabled, soundVolume, setSoundVolume } = useSound();
  const { speakText, isSupported: isSpeechSupported } = useSpeech();
  const [logs, setLogs] = useState([]);
  const [isAudioContextReady, setIsAudioContextReady] = useState(false);
  const logContainerRef = useRef(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    setLogs(prev => [...prev, { time: timestamp, msg: message, type }]);
  };

  // Check Web Audio Status
  useEffect(() => {
    if (SoundCacheService.audioContext) {
      setIsAudioContextReady(SoundCacheService.audioContext.state === 'running');
      addLog(`AudioContext Status: ${SoundCacheService.audioContext.state}`);
      
      const interval = setInterval(() => {
        if (SoundCacheService.audioContext) {
            const newState = SoundCacheService.audioContext.state === 'running';
            if (newState !== isAudioContextReady) {
                setIsAudioContextReady(newState);
                addLog(`AudioContext State changed to: ${SoundCacheService.audioContext.state}`);
            }
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      addLog("SoundCacheService.audioContext is null", 'error');
    }
  }, [isAudioContextReady]);

  // Scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const runSimpleBeep = async () => {
    addLog("Starting simple beep test...", 'info');
    try {
      const result = await testBeep();
      if (result) addLog("Simple beep test completed successfully", 'success');
      else addLog("Simple beep test returned false", 'error');
    } catch (e) {
      addLog(`Simple beep test failed: ${e.message}`, 'error');
    }
  };

  const runCachedSound = (type) => {
    addLog(`Requesting cached sound: ${type}`, 'info');
    try {
      playSound(type);
      addLog(`Sound '${type}' playback requested`, 'success');
    } catch (e) {
      addLog(`Sound '${type}' failed: ${e.message}`, 'error');
    }
  };

  const runSpeechTest = () => {
    if (!isSpeechSupported) {
      addLog("Web Speech API not supported", 'error');
      return;
    }
    const text = "Système audio opérationnel";
    addLog(`Requesting speech: "${text}"`, 'info');
    speakText(text);
  };

  const attemptResume = async () => {
     addLog("Attempting to resume AudioContext...", 'warn');
     if (SoundCacheService.audioContext) {
         try {
             await SoundCacheService.audioContext.resume();
             addLog(`Resume call finished. New state: ${SoundCacheService.audioContext.state}`, 'success');
         } catch(e) {
             addLog(`Resume failed: ${e.message}`, 'error');
         }
     } else {
         addLog("No AudioContext to resume", 'error');
         // Try re-init
         SoundCacheService.initializeSounds();
     }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link to="/admin/settings">
            <ArrowLeft className="w-5 h-5 mr-2" /> Retour
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Diagnostic Audio</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" /> État du Système
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-2 bg-white rounded border">
                <span>Web Audio API</span>
                {window.AudioContext || window.webkitAudioContext ? 
                  <CheckCircle2 className="text-amber-500 w-5 h-5" /> : 
                  <AlertTriangle className="text-red-500 w-5 h-5" />
                }
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded border">
                <span>Audio Context Running</span>
                <div className="flex items-center gap-2">
                    {isAudioContextReady ? 
                    <span className="text-amber-600 font-bold text-xs bg-amber-100 px-2 py-1 rounded">RUNNING</span> : 
                    <span className="text-red-600 font-bold text-xs bg-red-100 px-2 py-1 rounded">SUSPENDED/NULL</span>
                    }
                    {!isAudioContextReady && (
                        <Button size="xs" variant="outline" onClick={attemptResume}>Réparer</Button>
                    )}
                </div>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded border">
                <span>Web Speech API</span>
                {isSpeechSupported ? 
                  <CheckCircle2 className="text-amber-500 w-5 h-5" /> : 
                  <AlertTriangle className="text-red-500 w-5 h-5" />
                }
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded border">
                <span>Sons activés (LocalStorage)</span>
                <span>{soundEnabled ? "Oui" : "Non"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tests Actifs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                 <label className="text-sm font-medium">Volume ({Math.round(soundVolume * 100)}%)</label>
                 <Slider value={[soundVolume]} max={1} step={0.1} onValueChange={([v]) => setSoundVolume(v)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={runSimpleBeep} className="w-full">
                   <Play className="w-4 h-4 mr-2" /> Bip Simple (Oscillator)
                </Button>
                <Button onClick={runSpeechTest} variant="outline" className="w-full">
                   <Mic className="w-4 h-4 mr-2" /> Synthèse Vocale
                </Button>
                <Button onClick={() => runCachedSound('success')} variant="secondary" className="w-full">
                   <Volume2 className="w-4 h-4 mr-2" /> Succès (Cache)
                </Button>
                <Button onClick={() => runCachedSound('notification')} variant="secondary" className="w-full">
                   <Volume2 className="w-4 h-4 mr-2" /> Notification (Cache)
                </Button>
                <Button onClick={() => runCachedSound('error')} variant="destructive" className="w-full">
                   <Volume2 className="w-4 h-4 mr-2" /> Erreur (Cache)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs */}
        <Card className="h-full max-h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle>Journal d'événements (Live Logs)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <div 
              ref={logContainerRef}
              className="bg-black text-green-400 font-mono text-xs p-4 rounded h-[400px] overflow-y-auto space-y-1"
            >
              {logs.length === 0 && <span className="text-gray-500 italic">En attente d'actions...</span>}
              {logs.map((log, i) => (
                <div key={i} className={`
                    ${log.type === 'error' ? 'text-red-400' : ''}
                    ${log.type === 'warn' ? 'text-yellow-400' : ''}
                    ${log.type === 'success' ? 'text-blue-400' : ''}
                `}>
                  <span className="text-gray-500">[{log.time}]</span> {log.msg}
                </div>
              ))}
            </div>
            <div className="mt-2 text-right">
                <Button size="sm" variant="ghost" onClick={() => setLogs([])}>Effacer</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SoundTestPage;