import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle2, Mic, Play, RefreshCw, VolumeX, Activity, Bug } from 'lucide-react';
import { useVoiceDiagnostics } from '@/hooks/useVoiceDiagnostics';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function AdminAudioDiagnosticPanel() {
  const { status, logs, refreshDiagnostics, testTTS, testFallback, clearLogs } = useVoiceDiagnostics();
  const [isTesting, setIsTesting] = useState(false);

  const handleTestAudio = async () => {
    setIsTesting(true);
    await testTTS("Ceci est un test complet du système audio.");
    refreshDiagnostics();
    setIsTesting(false);
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="bg-muted/50 pb-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Diagnostic Audio & Voix
            </CardTitle>
            <CardDescription>
              Vérifiez la compatibilité du navigateur et dépannez les problèmes de notifications vocales.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refreshDiagnostics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* System Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border rounded-xl bg-card">
            <p className="text-sm text-muted-foreground font-medium mb-1">Web Speech API</p>
            <div className="flex items-center gap-2">
              {status.isSupported ? <CheckCircle2 className="h-5 w-5 text-amber-500" /> : <VolumeX className="h-5 w-5 text-red-500" />}
              <span className="font-bold">{status.isSupported ? 'Supporté' : 'Non Supporté'}</span>
            </div>
          </div>
          
          <div className="p-4 border rounded-xl bg-card">
            <p className="text-sm text-muted-foreground font-medium mb-1">Voix Disponibles</p>
            <div className="flex items-center gap-2">
              {status.voicesLoaded ? <Mic className="h-5 w-5 text-amber-500" /> : <AlertCircle className="h-5 w-5 text-yellow-500" />}
              <span className="font-bold">{status.voiceCount} voix chargées</span>
            </div>
          </div>
          
          <div className="p-4 border rounded-xl bg-card">
            <p className="text-sm text-muted-foreground font-medium mb-1">État du moteur TTS</p>
            <div className="flex items-center gap-2">
              <Badge variant={status.isSpeaking ? 'default' : 'secondary'} className={status.isSpeaking ? 'bg-blue-500' : ''}>
                {status.isSpeaking ? 'En cours de lecture...' : 'En attente (Idle)'}
              </Badge>
            </div>
          </div>

          <div className="p-4 border rounded-xl bg-card">
            <p className="text-sm text-muted-foreground font-medium mb-1">Fallback (Web Audio)</p>
            <div className="flex items-center gap-2">
              {status.audioContextSupported ? <CheckCircle2 className="h-5 w-5 text-amber-500" /> : <VolumeX className="h-5 w-5 text-red-500" />}
              <span className="font-bold">{status.audioContextSupported ? 'Disponible' : 'Indisponible'}</span>
            </div>
          </div>
        </div>

        {!status.isSupported && (
          <Alert variant="destructive">
            <VolumeX className="h-4 w-4" />
            <AlertTitle>Non supporté</AlertTitle>
            <AlertDescription>
              Votre navigateur actuel ne supporte pas l'API de synthèse vocale. Veuillez utiliser Chrome, Safari ou Edge. Les notifications se limiteront au système de secours (bips).
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleTestAudio} disabled={isTesting || !status.isSupported}>
            <Play className="h-4 w-4 mr-2" />
            Tester la Synthèse Vocale
          </Button>
          <Button variant="secondary" onClick={testFallback}>
            <Play className="h-4 w-4 mr-2" />
            Tester le Beep de Secours
          </Button>
          <Button variant="outline" onClick={clearLogs}>
            Effacer les logs
          </Button>
        </div>

        {/* Logs Console */}
        <div className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden">
          <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex justify-between items-center">
             <span className="text-xs font-mono text-gray-400 font-bold flex items-center gap-2">
                <Bug className="h-4 w-4" />
                CONSOLE DE DIAGNOSTIC ({logs.length} entrées)
             </span>
          </div>
          <ScrollArea className="h-64 p-4">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-sm font-mono italic">Aucun log enregistré.</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log, i) => (
                  <div key={i} className="text-xs font-mono border-b border-gray-800/50 pb-2">
                    <div className="flex gap-2 mb-1">
                      <span className="text-gray-500">{log.timestamp.split('T')[1].split('Z')[0]}</span>
                      <span className={
                        log.level === 'ERROR' ? 'text-red-400 font-bold' :
                        log.level === 'SUCCESS' ? 'text-green-400' :
                        log.level === 'WARN' ? 'text-yellow-400' : 'text-blue-400'
                      }>[{log.level}]</span>
                      <span className="text-gray-200 font-semibold">{log.action}</span>
                    </div>
                    {log.details && (
                      <div className="pl-16 text-gray-400 break-all whitespace-pre-wrap">
                        {log.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}