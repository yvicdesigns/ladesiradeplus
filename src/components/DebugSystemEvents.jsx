import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { debugLogger, LOG_EVENTS } from '@/lib/debugLogger';
import { Bell, Database, Globe, Shield, RefreshCw } from 'lucide-react';

export function DebugSystemEvents() {
  const triggerTestEvent = (type) => {
    switch(type) {
      case 'network':
        debugLogger.info(LOG_EVENTS.NETWORK, 'Test de connectivité réseau initié');
        setTimeout(() => debugLogger.success(LOG_EVENTS.NETWORK, 'Réseau opérationnel', { latency: '24ms' }), 500);
        break;
      case 'db':
        debugLogger.info(LOG_EVENTS.DATABASE, 'Requête de test base de données');
        setTimeout(() => debugLogger.warn(LOG_EVENTS.DATABASE, 'Latence légèrement élevée détectée', { queryTime: '150ms' }), 800);
        break;
      case 'auth':
        debugLogger.error(LOG_EVENTS.AUTH, 'Simulation échec authentification', { reason: 'Token invalide', code: 'AUTH_001' });
        break;
      case 'system':
        debugLogger.success(LOG_EVENTS.SYSTEM, 'Service de notification redémarré avec succès');
        break;
      default:
        debugLogger.info(LOG_EVENTS.SYSTEM, 'Événement de test générique');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Simulation d'Événements</CardTitle>
        <CardDescription>Générer des événements de test pour vérifier le système de logs</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="justify-start gap-2" onClick={() => triggerTestEvent('network')}>
            <Globe className="h-4 w-4 text-blue-500" />
            Test Réseau
          </Button>
          <Button variant="outline" className="justify-start gap-2" onClick={() => triggerTestEvent('db')}>
            <Database className="h-4 w-4 text-amber-500" />
            Test Base de Données
          </Button>
          <Button variant="outline" className="justify-start gap-2" onClick={() => triggerTestEvent('auth')}>
            <Shield className="h-4 w-4 text-red-500" />
            Simuler Erreur Auth
          </Button>
          <Button variant="outline" className="justify-start gap-2" onClick={() => triggerTestEvent('system')}>
            <Bell className="h-4 w-4 text-amber-500" />
            Test Notification
          </Button>
          <Button variant="secondary" className="col-span-2 mt-2 gap-2" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
            Recharger l'Application
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}