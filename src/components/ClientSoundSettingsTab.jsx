import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useSound } from '@/hooks/useSound';
import { useVoice } from '@/hooks/useVoice';
import { Volume2, VolumeX, Mic, Play, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const ClientSoundSettingsTab = () => {
  const { 
    soundEnabled, toggleSound, soundVolume, setSoundVolume, playSound 
  } = useSound();

  const {
    speak, stop, isSpeaking, isSupported,
    volume: voiceVolume, setVolume: setVoiceVolume,
    rate: voiceRate, setRate: setVoiceRate,
    pitch: voicePitch, setPitch: setVoicePitch,
    enabled: voiceEnabled, setEnabled: setVoiceEnabled
  } = useVoice('client');

  const testSound = (type) => {
    playSound(type, soundVolume);
  };

  const testVoice = () => {
    speak("Votre commande a été reçue");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" /> Préférences Audio
          </CardTitle>
          <CardDescription>Gérez les effets sonores et la synthèse vocale.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Sound Effects */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-bold flex items-center gap-2">
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                Effets Sonores
              </Label>
              <Switch checked={soundEnabled} onCheckedChange={toggleSound} />
            </div>
            
            {soundEnabled && (
              <div className="space-y-4 pl-6 border-l-2 border-gray-100">
                <div className="space-y-2">
                  <Label>Volume des effets ({Math.round(soundVolume * 100)}%)</Label>
                  <Slider 
                    value={[soundVolume]} 
                    max={1} step={0.1} 
                    onValueChange={([val]) => setSoundVolume(val)} 
                  />
                </div>
                <div className="flex gap-2">
                   <Button variant="outline" size="xs" onClick={() => testSound('click')}>Click</Button>
                   <Button variant="outline" size="xs" onClick={() => testSound('notification')}>Notif</Button>
                   <Button variant="outline" size="xs" onClick={() => testSound('success')}>Succès</Button>
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-gray-100" />

          {/* Voice Synthesis */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-bold flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Voice Order Tracking
              </Label>
              <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
            </div>

            {!isSupported && (
                 <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Non supporté par ce navigateur.</AlertDescription>
                 </Alert>
            )}

            {voiceEnabled && isSupported && (
              <div className="space-y-4 pl-6 border-l-2 border-gray-100">
                <div className="space-y-2">
                  <Label>Volume vocal ({Math.round(voiceVolume * 100)}%)</Label>
                  <Slider 
                    value={[voiceVolume]} 
                    max={1} step={0.1} 
                    onValueChange={([val]) => setVoiceVolume(val)} 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Vitesse ({voiceRate}x)</Label>
                        <Slider 
                            value={[voiceRate]} 
                            min={0.5} max={2} step={0.1} 
                            onValueChange={([val]) => setVoiceRate(val)} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Hauteur ({voicePitch})</Label>
                        <Slider 
                            value={[voicePitch]} 
                            min={0.5} max={2} step={0.1} 
                            onValueChange={([val]) => setVoicePitch(val)} 
                        />
                    </div>
                </div>

                <Button variant="outline" size="sm" onClick={testVoice} disabled={isSpeaking}>
                    <Play className="w-3 h-3 mr-2" /> Tester la voix
                </Button>
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
};